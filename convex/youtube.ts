"use node";

import type { PaginationResult } from "convex/server";
import { v } from "convex/values";
import slugify from "slugify";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalAction } from "./_generated/server";
import {
	bestThumbnail,
	extractHashtags,
	forEachSafe,
	parseDuration,
	SHORTS_THRESHOLD,
	type Thumbnails,
} from "./helpers";
import type { ValidationIssue, VideoAnalysis } from "./lib/contentRules";
import { type FetchLike, LlmHttpError, resolveLlmConfig } from "./lib/llm";
import {
	type AuditPage,
	type auditStoredPost,
	clampPageSize,
	isEligibleForAi,
	JOB_DEADLINE_MS,
	JOB_STAGGER_MS,
	MAX_REPAIR_TARGETS,
	pickVideoForSlug,
	type SweepRow,
	selectSweepCandidates,
	storedAnalysisOf,
} from "./lib/pipeline";
import {
	type GenerationContext,
	generateChannelDescription as generateChannelDescriptionText,
	generateVideoPost,
	type PostAttempts,
} from "./lib/videoPost";

// --- Config ---

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing ${name} env var`);
	return value;
}

// --- YouTube API types ---

type YouTubeChannelItem = {
	id: string;
	snippet: {
		title: string;
		description?: string;
		customUrl?: string;
		country?: string;
		thumbnails?: Thumbnails;
	};
	contentDetails: { relatedPlaylists: { uploads: string } };
	statistics: { subscriberCount?: string; videoCount?: string };
};

type YouTubeVideoItem = {
	id: string;
	snippet: {
		title: string;
		description?: string;
		publishedAt: string;
		thumbnails: Thumbnails;
		tags?: string[];
		resourceId?: { videoId: string };
	};
	contentDetails?: { duration?: string };
	statistics?: { viewCount?: string; likeCount?: string };
};

type YouTubePlaylistItem = {
	snippet: { resourceId: { videoId: string } };
};

type YouTubeListResponse<T> = { items: T[] };

async function ytFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${YOUTUBE_API}/${path}&key=${requireEnv("YOUTUBE_API_KEY")}`);
	if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);
	return res.json();
}

// --- Channel actions (internal; run with `npx convex run`) ---

async function fetchAndUpsertChannel(ctx: ActionCtx, channelId: string) {
	const data = await ytFetch<YouTubeListResponse<YouTubeChannelItem>>(
		`channels?part=snippet,contentDetails,statistics&id=${channelId}`,
	);
	if (!data.items?.length) throw new Error(`Channel ${channelId} not found`);

	const ch = data.items[0];
	const thumbnailUrl = ch.snippet.thumbnails?.medium?.url;

	let thumbnailStorageId: Id<"_storage"> | undefined;
	if (thumbnailUrl) {
		try {
			const res = await fetch(thumbnailUrl);
			if (res.ok) {
				thumbnailStorageId = await ctx.storage.store(await res.blob());
			}
		} catch (e) {
			console.warn(`Failed to store thumbnail for channel ${channelId}:`, e);
		}
	}

	await ctx.runMutation(internal.channels.upsert, {
		channelId,
		name: ch.snippet.title,
		description: ch.snippet.description ?? undefined,
		customUrl: ch.snippet.customUrl ?? undefined,
		country: ch.snippet.country ?? undefined,
		uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
		thumbnailUrl,
		thumbnailStorageId,
		bannerUrl: undefined,
		subscriberCount: Number(ch.statistics.subscriberCount) || 0,
		videoCount: Number(ch.statistics.videoCount) || 0,
	});

	return ch.snippet.title;
}

export const addChannel = internalAction({
	args: { channelId: v.string() },
	handler: async (ctx, { channelId }) => {
		const name = await fetchAndUpsertChannel(ctx, channelId);
		return { name };
	},
});

export const addChannelByHandle = internalAction({
	args: { handle: v.string() },
	handler: async (ctx, { handle }) => {
		const lookup = await ytFetch<YouTubeListResponse<YouTubeChannelItem>>(
			`channels?part=id&forHandle=${encodeURIComponent(handle)}`,
		);
		if (!lookup.items?.length) throw new Error(`Handle ${handle} not found`);

		const channelId = lookup.items[0].id;
		const name = await fetchAndUpsertChannel(ctx, channelId);
		return { name, channelId };
	},
});

// --- Video sync ---

/**
 * Inserts the channel's new videos; each insert schedules its own job. Pass one `stagger` to
 * every channel of a run so their jobs start 30 s apart across all channels.
 */
export async function syncVideosForChannel(
	ctx: Pick<ActionCtx, "runQuery" | "runMutation">,
	channelId: string,
	maxResults = 10,
	stagger = { queued: 0 },
) {
	const channel = await ctx.runQuery(internal.channels.getByChannelId, { channelId });
	if (!channel) throw new Error(`Channel ${channelId} not in database`);

	const playlist = await ytFetch<YouTubeListResponse<YouTubePlaylistItem>>(
		`playlistItems?part=snippet&playlistId=${channel.uploadsPlaylistId}&maxResults=${maxResults}`,
	);
	if (!playlist.items?.length) {
		console.warn(`syncChannelVideos: No videos found for channel ${channelId}`);
		return { synced: 0 };
	}

	const ids = playlist.items.map((i) => i.snippet.resourceId.videoId);
	const details = await ytFetch<YouTubeListResponse<YouTubeVideoItem>>(
		`videos?part=snippet,contentDetails,statistics&id=${ids.join(",")}`,
	);

	let synced = 0;
	for (const vid of details.items ?? []) {
		const exists = await ctx.runQuery(internal.videos.getByVideoId, { videoId: vid.id });
		if (exists) continue;

		const durationSeconds = parseDuration(vid.contentDetails?.duration ?? "");
		const description = vid.snippet.description ?? "";

		await ctx.runMutation(internal.videos.insert, {
			videoId: vid.id,
			slug: slugify(vid.snippet.title, { lower: true, strict: true }),
			channelId,
			title: vid.snippet.title,
			description,
			publishedAt: vid.snippet.publishedAt,
			thumbnailUrl: bestThumbnail(vid.snippet.thumbnails),
			duration: vid.contentDetails?.duration,
			durationSeconds,
			viewCount: Number(vid.statistics?.viewCount) || 0,
			likeCount: Number(vid.statistics?.likeCount) || 0,
			tags: vid.snippet.tags ?? [],
			hashtags: extractHashtags(description),
			delayMs: stagger.queued++ * JOB_STAGGER_MS,
		});
		synced++;
	}

	await ctx.runMutation(internal.channels.updateLastSynced, {
		channelId,
		lastSyncedAt: Date.now(),
	});

	console.log(
		`syncChannelVideos: ${synced} new video(s) synced for channel ${channelId} (${details.items?.length ?? 0} checked)`,
	);
	return { synced };
}

export const syncChannelVideos = internalAction({
	args: { channelId: v.string(), maxResults: v.optional(v.number()) },
	handler: (ctx, { channelId, maxResults }) => syncVideosForChannel(ctx, channelId, maxResults),
});

// --- Transcript ---

type TranscriptEntry = { text: string; offset: number; duration: number };

async function fetchTranscriptSegments(
	videoId: string,
	signal: AbortSignal,
): Promise<TranscriptEntry[]> {
	const { fetchTranscript } = await import("@egoist/youtube-transcript-plus");
	// The library sends every request (watch page, player, captions) through this fetch.
	const result = await fetchTranscript(videoId, {
		fetch: (input, init) => fetch(input, { ...init, signal }),
	});
	return result.segments.map((entry) => ({
		text: entry.text,
		offset: Math.round(entry.offset),
		duration: Math.round(entry.duration),
	}));
}

/**
 * Transcript only, no LLM call. The sweep no longer schedules it (processNewVideo fetches the
 * transcript itself); it stays so already-scheduled runs remain valid. Failures are logged.
 */
export const fetchTranscript = internalAction({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.runQuery(internal.videos.getByVideoId, { videoId });
		if (!video || video.transcript?.length) return;

		try {
			const transcript = await fetchTranscriptSegments(
				videoId,
				AbortSignal.timeout(JOB_DEADLINE_MS),
			);
			if (transcript.length === 0) return;
			await ctx.runMutation(internal.videos.updateTranscript, { videoId, transcript });
		} catch (e) {
			console.error(`Transcript fetch failed for ${videoId}:`, e);
		}
	},
});

// --- AI jobs ---

/** Everything a job touches, injectable so the jobs run in tests without Convex or network. */
export type JobDeps = Pick<ActionCtx, "runQuery" | "runMutation"> & {
	env: Record<string, string | undefined>;
	now: () => number;
	fetchImpl?: FetchLike;
	sleep?: (ms: number) => Promise<void>;
	fetchTranscriptSegments: (videoId: string, signal: AbortSignal) => Promise<TranscriptEntry[]>;
	log?: (line: string) => void;
};

function jobDeps(ctx: ActionCtx): JobDeps {
	return {
		runQuery: ctx.runQuery.bind(ctx),
		runMutation: ctx.runMutation.bind(ctx),
		env: process.env,
		now: Date.now,
		fetchTranscriptSegments,
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

/** The transcript fetch shares the job deadline: it is aborted when the deadline is reached. */
async function fetchTranscriptBefore(
	deps: JobDeps,
	videoId: string,
	deadlineAt: number,
): Promise<TranscriptEntry[] | undefined> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), Math.max(0, deadlineAt - deps.now()));
	try {
		return await deps.fetchTranscriptSegments(videoId, controller.signal);
	} catch (e) {
		console.error(`Transcript fetch failed for ${videoId}:`, e);
		return undefined;
	} finally {
		clearTimeout(timer);
	}
}

// Only 413 (request too large) is specific to this video. 400 is also returned when an
// organization or workspace spend limit is reached, so it may affect every video:
// https://platform.claude.com/docs/en/api/errors
const REQUEST_SPECIFIC_STATUSES = new Set([413]);

/**
 * One video post: transcript → analysis → article → one publish mutation. Nothing is written
 * unless both parts pass; an exhausted run records the failure codes and throws.
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
	if ((video.durationSeconds ?? 0) > SHORTS_THRESHOLD && !transcript?.length) {
		transcript = await fetchTranscriptBefore(deps, videoId, deadlineAt);
		if (transcript?.length && !options.dryRun && deps.now() <= deadlineAt) {
			await deps.runMutation(internal.videos.updateTranscript, { videoId, transcript });
		}
	}
	const eligibility = isEligibleForAi({ durationSeconds: video.durationSeconds, transcript });
	if (!eligibility.eligible) {
		log(`video ${videoId}: insufficient_source reason=${eligibility.reason}`);
		return { status: "insufficient_source", reason: eligibility.reason };
	}

	const config = resolveLlmConfig(deps.env);
	const storedAnalysis = options.parts === "article" ? storedAnalysisOf(video) : undefined;
	if (options.parts === "article" && !storedAnalysis) {
		throw new Error(`Video ${videoId} has no stored analysis; rerun with parts "all"`);
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

	let result: Awaited<ReturnType<typeof generateVideoPost>>;
	try {
		result = await generateVideoPost(
			{ title: video.title, description: video.description, transcript },
			channel?.name ?? "YouTube",
			ctx,
			{ storedAnalysis },
		);
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
	const channel = await deps.runQuery(internal.channels.getByChannelId, { channelId });
	if (!channel) return { status: "not_found" };
	const config = resolveLlmConfig(deps.env);
	const recentVideos = await deps.runQuery(internal.videos.listRecentByChannel, {
		channelId,
		limit: 10,
	});

	const deadlineAt = options.deadlineAt ?? deps.now() + JOB_DEADLINE_MS;
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

const videoIdArgs = { videoId: v.string() };

// processVideo and generateArticle keep their names so already-scheduled runs stay valid;
// both run the full job, because analysis and article are published together.
export const processVideo = internalAction({
	args: videoIdArgs,
	handler: (ctx, { videoId }) => runVideoPostJob(jobDeps(ctx), videoId),
});

export const generateArticle = internalAction({
	args: videoIdArgs,
	handler: (ctx, { videoId }) => runVideoPostJob(jobDeps(ctx), videoId),
});

export const generateChannelDescription = internalAction({
	args: { channelId: v.string() },
	handler: (ctx, { channelId }) => runChannelDescriptionJob(jobDeps(ctx), channelId),
});

// --- CLI commands (internal; run with `npx convex run youtube:<name> '<json>'`) ---

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

/**
 * Regenerates one video post now, ignoring the failure gate. With dryRun the result is returned
 * and nothing is written, but the provider calls are still made and billed.
 */
export const rerunVideo = internalAction({
	args: {
		target: v.union(
			v.object({ videoId: v.string() }),
			v.object({ slug: v.string(), channelId: v.optional(v.string()) }),
		),
		parts: v.optional(v.union(v.literal("all"), v.literal("article"))),
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, { target, parts, dryRun }): Promise<VideoJobResult> => {
		const videoId = await resolveVideoTarget(ctx, target);
		return runVideoPostJob(jobDeps(ctx), videoId, { force: true, parts, dryRun });
	},
});

/** Regenerates one channel description now; dryRun returns it without writing (still billed). */
export const rerunChannelDescription = internalAction({
	args: { channelId: v.string(), dryRun: v.optional(v.boolean()) },
	handler: (ctx, { channelId, dryRun }): Promise<ChannelJobResult> =>
		runChannelDescriptionJob(jobDeps(ctx), channelId, { dryRun }),
});

type AuditArgs = { table: "videos" | "channels"; cursor?: string | null; pageSize?: number };

export function runAudit(deps: Pick<ActionCtx, "runQuery">, args: AuditArgs): Promise<AuditPage> {
	const paginationOpts = { numItems: clampPageSize(args.pageSize), cursor: args.cursor ?? null };
	return args.table === "videos"
		? deps.runQuery(internal.videos.auditPage, { paginationOpts })
		: deps.runQuery(internal.channels.auditPage, { paginationOpts });
}

/**
 * One page of the content audit: no provider calls, no env keys, no writes. Pass the returned
 * continueCursor as cursor until isDone is true; audit each table separately.
 */
export const auditContent = internalAction({
	args: {
		table: v.union(v.literal("videos"), v.literal("channels")),
		cursor: v.optional(v.union(v.string(), v.null())),
		pageSize: v.optional(v.number()),
	},
	handler: (ctx, args): Promise<AuditPage> => runAudit(ctx, args),
});

export type RepairReceipt =
	| { videoId: string; status: "scheduled"; delayMs: number; issues: string[] }
	| { videoId: string; status: "valid" | "not_found" };

/** Re-validates each target and schedules a forced rerun only for failing or missing posts. */
export async function queueRepairs(deps: FanOutDeps, targets: string[]): Promise<RepairReceipt[]> {
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
		await deps.scheduler.runAfter(delayMs, internal.youtube.rerunVideo, { target: { videoId } });
		receipts.push({ videoId, status: "scheduled", delayMs, issues });
	}
	log(`regenerateInvalidPosts: scheduled ${scheduled} of ${targets.length}`);
	return receipts;
}

export const regenerateInvalidPosts = internalAction({
	args: { targets: v.array(v.string()) },
	handler: (ctx, { targets }): Promise<RepairReceipt[]> => queueRepairs(ctx, targets),
});

// --- Pipeline ---

type FanOutDeps = Pick<ActionCtx, "runQuery" | "scheduler"> & { log?: (line: string) => void };

// Each page reads full video documents incl. transcripts; small pages stay far below the
// per-function read limit.
const SWEEP_PAGE_SIZE = 25;

/**
 * Pages through sweep projections, selects candidates and schedules them 30 s apart. Pass the
 * sync's `stagger` so the sweep's jobs continue after the new-video jobs of the same run.
 */
export async function sweepVideos(
	deps: FanOutDeps & { now: () => number; stagger?: { queued: number } },
) {
	const stagger = deps.stagger ?? { queued: 0 };
	const log = deps.log ?? console.log;
	const rows: SweepRow[] = [];
	let cursor: string | null = null;
	let isDone = false;
	while (!isDone) {
		const result: PaginationResult<SweepRow> = await deps.runQuery(internal.videos.listSweepPage, {
			paginationOpts: { numItems: SWEEP_PAGE_SIZE, cursor },
		});
		rows.push(...result.page);
		cursor = result.continueCursor;
		isDone = result.isDone;
	}

	// One job type: processNewVideo fetches a missing transcript first and makes no LLM call
	// when the source is insufficient.
	const videoIds = selectSweepCandidates(rows, deps.now());
	for (const videoId of videoIds) {
		await deps.scheduler.runAfter(
			stagger.queued++ * JOB_STAGGER_MS,
			internal.youtube.processNewVideo,
			{
				videoId,
			},
		);
	}
	log(`sweep: checked ${rows.length} video(s), queued ${videoIds.length} job(s)`);
	return { queued: videoIds.length };
}

/** Schedules one description job per channel, 30 s apart. */
export async function queueChannelDescriptionJobs(deps: FanOutDeps) {
	const log = deps.log ?? console.log;
	const channels = await deps.runQuery(internal.channels.listAll);
	for (const [i, channel] of channels.entries()) {
		await deps.scheduler.runAfter(i * JOB_STAGGER_MS, internal.youtube.generateChannelDescription, {
			channelId: channel.channelId,
		});
	}
	log(`channel descriptions: queued ${channels.length} job(s)`);
	return { queued: channels.length };
}

/** Full job for one video: transcript → analysis → article → publish, in order. */
export const processNewVideo = internalAction({
	args: videoIdArgs,
	handler: (ctx, { videoId }) => runVideoPostJob(jobDeps(ctx), videoId),
});

export const refreshVideoStats = internalAction({
	args: {},
	handler: async (ctx) => {
		const videoIds = await ctx.runQuery(internal.videos.listAllVideoIds);
		if (videoIds.length === 0) return;

		console.log(`refreshVideoStats: Updating stats for ${videoIds.length} video(s)`);

		for (let i = 0; i < videoIds.length; i += 50) {
			const batch = videoIds.slice(i, i + 50);
			const data = await ytFetch<YouTubeListResponse<YouTubeVideoItem>>(
				`videos?part=statistics,snippet,contentDetails&id=${batch.join(",")}`,
			);

			for (const vid of data.items ?? []) {
				await ctx.runMutation(internal.videos.updateStats, {
					videoId: vid.id,
					viewCount: Number(vid.statistics?.viewCount) || 0,
					likeCount: Number(vid.statistics?.likeCount) || 0,
					thumbnailUrl: bestThumbnail(vid.snippet.thumbnails),
					duration: vid.contentDetails?.duration,
					durationSeconds: parseDuration(vid.contentDetails?.duration ?? ""),
				});
			}
		}
	},
});

export const syncAllChannels = internalAction({
	args: {},
	handler: async (ctx) => {
		requireEnv("YOUTUBE_API_KEY");
		resolveLlmConfig(process.env);

		const channels = await ctx.runQuery(internal.channels.listAll);
		if (channels.length === 0) {
			console.warn("syncAllChannels: No channels found. Add channels first.");
			return;
		}

		console.log(
			`syncAllChannels: Syncing ${channels.length} channel(s): ${channels.map((c) => c.name).join(", ")}`,
		);

		// 1. Sync new videos from YouTube; each insert schedules its own job, staggered across
		// all channels.
		const stagger = { queued: 0 };
		await forEachSafe(
			channels,
			(ch) => `sync ${ch.name} (${ch.channelId})`,
			(ch) => syncVideosForChannel(ctx, ch.channelId, 50, stagger),
		);

		// 2. Sweep: queue jobs for older videos with missing content, continuing the stagger.
		await sweepVideos({
			runQuery: ctx.runQuery.bind(ctx),
			scheduler: ctx.scheduler,
			now: Date.now,
			stagger,
		});
	},
});

async function refreshChannels(ctx: ActionCtx) {
	const channels = await ctx.runQuery(internal.channels.listAll);
	if (channels.length === 0) return;

	console.log(`refreshAllChannelInfo: Refreshing ${channels.length} channel(s)`);
	await forEachSafe(
		channels,
		(ch) => `refresh ${ch.name}`,
		(ch) => fetchAndUpsertChannel(ctx, ch.channelId),
	);
}

export const refreshAllChannelInfo = internalAction({
	args: {},
	handler: (ctx) => refreshChannels(ctx),
});

export const refreshAndGenerateAllChannelDescriptions = internalAction({
	args: {},
	handler: async (ctx) => {
		resolveLlmConfig(process.env);
		await refreshChannels(ctx);
		await queueChannelDescriptionJobs({
			runQuery: ctx.runQuery.bind(ctx),
			scheduler: ctx.scheduler,
		});
	},
});
