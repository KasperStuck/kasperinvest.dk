/**
 * AI post jobs in the Convex runtime, not in Node: Convex-runtime actions may run for 30
 * minutes, Node actions for 10, and one post makes up to 6C + 12 provider calls (C = fact-check
 * chunks). Only the transcript fetch needs Node; it runs in youtube.fetchTranscriptForJob.
 *
 * Scheduled names: generateVideoPost, generateChannelDescription. CLI (`npx convex run
 * aiPosts:<name> '<json>'`): rerunVideo, rerunChannelDescription, regenerateInvalidPosts.
 */
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { internalAction } from "./_generated/server";
import { SHORTS_THRESHOLD } from "./helpers";
import { type ValidationIssue, type VideoAnalysis, validateAnalysis } from "./lib/contentRules";
import { type FetchLike, LlmHttpError, resolveLlmConfig } from "./lib/llm";
import {
	type auditStoredPost,
	isEligibleForAi,
	JOB_DEADLINE_MS,
	JOB_STAGGER_MS,
	MAX_REPAIR_TARGETS,
	pickVideoForSlug,
	storedAnalysisOf,
} from "./lib/pipeline";
import {
	type GenerationContext,
	generateChannelDescription as generateChannelDescriptionText,
	generateVideoPost as generateVideoPostParts,
	type PostAttempts,
} from "./lib/videoPost";

/** One transcript segment as stored on a video. */
export type TranscriptEntry = { text: string; offset: number; duration: number };

/** Everything a job touches, injectable so the jobs run in tests without Convex or network. */
export type JobDeps = Pick<ActionCtx, "runQuery" | "runMutation"> & {
	env: Record<string, string | undefined>;
	now: () => number;
	fetchImpl?: FetchLike;
	sleep?: (ms: number) => Promise<void>;
	/** Must give up after `timeoutMs`; the job passes the time left before its deadline. */
	fetchTranscriptSegments: (videoId: string, timeoutMs: number) => Promise<TranscriptEntry[]>;
	log?: (line: string) => void;
};

function jobDeps(ctx: ActionCtx): JobDeps {
	return {
		runQuery: ctx.runQuery.bind(ctx),
		runMutation: ctx.runMutation.bind(ctx),
		env: process.env,
		now: Date.now,
		fetchTranscriptSegments: (videoId, timeoutMs) =>
			ctx.runAction(internal.youtube.fetchTranscriptForJob, { videoId, timeoutMs }),
	};
}

/** An exhausted generation run; the message carries the part and issue codes only. */
export class AiGenerationError extends Error {
	name = "AiGenerationError";
}

function issueCodes(issues: ValidationIssue[]): string[] {
	return [...new Set(issues.map((issue) => issue.code))];
}

export type VideoJobOptions = {
	/** Regenerate even when the post is complete (manual rerun). */
	force?: boolean;
	/** Generate and validate only; no Convex writes. Provider calls are still made and billed. */
	dryRun?: boolean;
	/** "article" keeps the stored analysis and regenerates only the article. */
	parts?: "all" | "article";
	deadlineAt?: number;
};

export type VideoJobResult =
	| { status: "not_found" | "skipped" }
	| { status: "insufficient_source"; reason: string }
	| {
			status: "dry_run";
			attempts: PostAttempts;
			analysis?: VideoAnalysis;
			article: string;
	  }
	| { status: "published" | "stale"; attempts: PostAttempts }
	| { status: "invalid"; issues: string[] };

/** The transcript fetch shares the job deadline; a failed fetch leaves the source insufficient. */
async function fetchTranscriptBefore(
	deps: JobDeps,
	videoId: string,
	deadlineAt: number,
): Promise<TranscriptEntry[] | undefined> {
	try {
		return await deps.fetchTranscriptSegments(videoId, Math.max(0, deadlineAt - deps.now()));
	} catch (e) {
		console.error(`Transcript fetch failed for ${videoId}:`, e);
		return undefined;
	}
}

// Only 413 (request too large) is specific to this video. 400 is also returned when an
// organization or workspace spend limit is reached, so it may affect every video:
// https://platform.claude.com/docs/en/api/errors
const REQUEST_SPECIFIC_STATUSES = new Set([413]);

/**
 * One video post: transcript → analysis → article → one publish mutation. Nothing is written
 * unless both parts pass; an exhausted run records the failure codes and throws. The deadline
 * starts when the job starts.
 */
export async function runVideoPostJob(
	deps: JobDeps,
	videoId: string,
	options: VideoJobOptions = {},
): Promise<VideoJobResult> {
	const log = deps.log ?? console.log;
	const deadlineAt = options.deadlineAt ?? deps.now() + JOB_DEADLINE_MS;
	const video = await deps.runQuery(internal.videos.getByVideoId, { videoId });
	if (!video) return { status: "not_found" };
	if (!options.force && video.processedAt !== undefined && video.article) {
		return { status: "skipped" };
	}

	// Shorts never get a post, so their transcript is not fetched.
	let transcript = video.transcript;
	let sourceVersion = video.sourceVersion;
	if ((video.durationSeconds ?? 0) > SHORTS_THRESHOLD && !transcript?.length) {
		transcript = await fetchTranscriptBefore(deps, videoId, deadlineAt);
		if (transcript?.length && !options.dryRun && deps.now() <= deadlineAt) {
			const written = await deps.runMutation(internal.videos.updateTranscript, {
				videoId,
				transcript,
			});
			if (written) sourceVersion = written.sourceVersion;
		}
	}
	const eligibility = isEligibleForAi({ durationSeconds: video.durationSeconds, transcript });
	if (!eligibility.eligible) {
		log(`video ${videoId}: insufficient_source reason=${eligibility.reason}`);
		return { status: "insufficient_source", reason: eligibility.reason };
	}

	const config = resolveLlmConfig(deps.env);
	const source = { title: video.title, description: video.description, transcript };
	const storedAnalysis = options.parts === "article" ? storedAnalysisOf(video) : undefined;
	if (options.parts === "article") {
		if (!storedAnalysis) {
			throw new Error(`Video ${videoId} has no stored analysis; rerun with parts "all"`);
		}
		// publishPost re-validates the stored analysis, so a failing one would waste the paid run.
		const stored = validateAnalysis(storedAnalysis, source).filter((i) => i.severity === "error");
		if (stored.length) {
			throw new Error(
				`Video ${videoId} has an invalid stored analysis (issues=${issueCodes(stored).join(",")}); rerun with parts "all"`,
			);
		}
	}
	const channel = await deps.runQuery(internal.channels.getByChannelId, {
		channelId: video.channelId,
	});
	const ctx: GenerationContext = {
		config,
		deadlineAt,
		now: deps.now,
		llm: { fetchImpl: deps.fetchImpl, sleep: deps.sleep },
		log,
		label: `video ${videoId}`,
	};

	let result: Awaited<ReturnType<typeof generateVideoPostParts>>;
	try {
		result = await generateVideoPostParts(source, channel?.name ?? "YouTube", ctx, {
			storedAnalysis,
		});
	} catch (error) {
		// Only a request-specific rejection counts against this video. Auth, permission, model
		// and other provider errors affect every video, so they must not gate this one.
		if (error instanceof LlmHttpError && REQUEST_SPECIFIC_STATUSES.has(error.status)) {
			if (!options.dryRun) {
				await deps.runMutation(internal.videos.recordAiFailure, {
					videoId,
					issues: ["provider_rejected_request"],
				});
			}
		} else if (error instanceof LlmHttpError) {
			console.error(`video ${videoId}: provider error, fix the AI configuration: ${error.message}`);
		}
		throw error;
	}

	const fail = async (part: string, codes: string[]): Promise<never> => {
		if (!options.dryRun) {
			await deps.runMutation(internal.videos.recordAiFailure, { videoId, issues: codes });
		}
		throw new AiGenerationError(`AI post failed for ${videoId}: ${part} issues=${codes.join(",")}`);
	};
	if (!result.ok) return fail(result.part, issueCodes(result.lastIssues));

	if (options.dryRun) {
		return {
			status: "dry_run",
			attempts: result.attempts,
			analysis: result.analysis,
			article: result.article,
		};
	}

	if (deps.now() > deadlineAt) return fail("publish", ["deadline"]);
	const published = await deps.runMutation(internal.videos.publishPost, {
		videoId,
		expectedProcessedAt: video.processedAt,
		expectedSourceVersion: sourceVersion,
		...(result.analysis ? { analysis: result.analysis } : {}),
		article: result.article,
		deadlineAt,
	});
	log(`video ${videoId}: publish ${published.status}`);
	if (published.status === "published" || published.status === "stale") {
		return { status: published.status, attempts: result.attempts };
	}
	if (published.status === "deadline") return fail("publish", ["deadline"]);
	if (published.status === "invalid") return published;
	return { status: "not_found" };
}

export type ChannelJobResult =
	| { status: "not_found" }
	| { status: "dry_run"; attempts: number; aiDescription: string }
	| { status: "published" | "stale"; attempts: number }
	| { status: "invalid"; issues: string[] };

/** One channel description: generate → validate → judge → guarded publish. Throws when exhausted. */
export async function runChannelDescriptionJob(
	deps: JobDeps,
	channelId: string,
	options: { dryRun?: boolean; deadlineAt?: number } = {},
): Promise<ChannelJobResult> {
	const log = deps.log ?? console.log;
	const deadlineAt = options.deadlineAt ?? deps.now() + JOB_DEADLINE_MS;
	const channel = await deps.runQuery(internal.channels.getByChannelId, { channelId });
	if (!channel) return { status: "not_found" };
	const config = resolveLlmConfig(deps.env);
	const recentVideos = await deps.runQuery(internal.videos.listRecentByChannel, {
		channelId,
		limit: 10,
	});

	const result = await generateChannelDescriptionText(
		{ name: channel.name, description: channel.description },
		recentVideos,
		{
			config,
			deadlineAt,
			now: deps.now,
			llm: { fetchImpl: deps.fetchImpl, sleep: deps.sleep },
			log,
			label: `channel ${channelId}`,
		},
	);
	if (!result.ok) {
		throw new AiGenerationError(
			`AI channel description failed for ${channelId}: issues=${issueCodes(result.lastIssues).join(",")}`,
		);
	}
	if (options.dryRun) {
		return { status: "dry_run", attempts: result.attempts, aiDescription: result.value };
	}

	const deadlineError = new AiGenerationError(
		`AI channel description not published for ${channelId}: issues=deadline`,
	);
	if (deps.now() > deadlineAt) throw deadlineError;
	const published = await deps.runMutation(internal.channels.publishAiDescription, {
		channelId,
		aiDescription: result.value,
		expectedAiDescription: channel.aiDescription,
		deadlineAt,
	});
	log(`channel ${channelId}: publish ${published.status}`);
	if (published.status === "published" || published.status === "stale") {
		return { status: published.status, attempts: result.attempts };
	}
	if (published.status === "deadline") throw deadlineError;
	return published;
}

// --- Scheduled jobs ---

/** Full job for one video: transcript → analysis → article → publish, in order. */
export const generateVideoPost = internalAction({
	args: { videoId: v.string() },
	handler: (ctx, { videoId }): Promise<VideoJobResult> => runVideoPostJob(jobDeps(ctx), videoId),
});

export const generateChannelDescription = internalAction({
	args: { channelId: v.string() },
	handler: (ctx, { channelId }): Promise<ChannelJobResult> =>
		runChannelDescriptionJob(jobDeps(ctx), channelId),
});

// --- CLI commands (internal; run with `npx convex run aiPosts:<name> '<json>'`) ---

type VideoTarget = { videoId: string } | { slug: string; channelId?: string };

export async function resolveVideoTarget(
	deps: Pick<ActionCtx, "runQuery">,
	target: VideoTarget,
): Promise<string> {
	if ("videoId" in target) return target.videoId;
	const matches = await deps.runQuery(internal.videos.findBySlug, {
		slug: target.slug,
		...(target.channelId ? { channelId: target.channelId } : {}),
	});
	return pickVideoForSlug(matches, target);
}

export const rerunVideoArgs = {
	target: v.union(
		v.object({ videoId: v.string() }),
		v.object({ slug: v.string(), channelId: v.optional(v.string()) }),
	),
	parts: v.optional(v.union(v.literal("all"), v.literal("article"))),
	dryRun: v.optional(v.boolean()),
};

/**
 * Regenerates one video post now, ignoring the failure gate. With dryRun the result is returned
 * and no post is written, but the provider calls are still made and billed.
 */
export const rerunVideo = internalAction({
	args: rerunVideoArgs,
	handler: async (ctx, { target, parts, dryRun }): Promise<VideoJobResult> => {
		const videoId = await resolveVideoTarget(ctx, target);
		return runVideoPostJob(jobDeps(ctx), videoId, { force: true, parts, dryRun });
	},
});

export const rerunChannelDescriptionArgs = {
	channelId: v.string(),
	dryRun: v.optional(v.boolean()),
};

/** Regenerates one channel description now; dryRun returns it without writing (still billed). */
export const rerunChannelDescription = internalAction({
	args: rerunChannelDescriptionArgs,
	handler: (ctx, { channelId, dryRun }): Promise<ChannelJobResult> =>
		runChannelDescriptionJob(jobDeps(ctx), channelId, { dryRun }),
});

export type RepairReceipt =
	| { videoId: string; status: "scheduled"; delayMs: number; issues: string[] }
	| { videoId: string; status: "valid" | "not_found" };

type RepairDeps = Pick<ActionCtx, "runQuery" | "scheduler"> & { log?: (line: string) => void };

/** Re-validates each target and schedules a forced rerun only for failing or missing posts. */
export async function queueRepairs(deps: RepairDeps, targets: string[]): Promise<RepairReceipt[]> {
	if (targets.length > MAX_REPAIR_TARGETS) {
		throw new Error(`regenerateInvalidPosts takes at most ${MAX_REPAIR_TARGETS} targets`);
	}
	const log = deps.log ?? console.log;
	const receipts: RepairReceipt[] = [];
	let scheduled = 0;
	for (const videoId of targets) {
		const audit: ReturnType<typeof auditStoredPost> | null = await deps.runQuery(
			internal.videos.auditOne,
			{ videoId },
		);
		if (!audit) {
			receipts.push({ videoId, status: "not_found" });
			continue;
		}
		const issues = audit.missing ? ["missing"] : audit.findings.flatMap((f) => f.issues);
		if (issues.length === 0) {
			receipts.push({ videoId, status: "valid" });
			continue;
		}
		const delayMs = scheduled++ * JOB_STAGGER_MS;
		await deps.scheduler.runAfter(delayMs, internal.aiPosts.rerunVideo, { target: { videoId } });
		receipts.push({ videoId, status: "scheduled", delayMs, issues });
	}
	log(`regenerateInvalidPosts: scheduled ${scheduled} of ${targets.length}`);
	return receipts;
}

export const regenerateInvalidPostsArgs = { targets: v.array(v.string()) };

export const regenerateInvalidPosts = internalAction({
	args: regenerateInvalidPostsArgs,
	handler: (ctx, { targets }): Promise<RepairReceipt[]> => queueRepairs(ctx, targets),
});
