"use node";

import type { PaginationResult } from "convex/server";
import { v } from "convex/values";
import slugify from "slugify";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalAction } from "./_generated/server";
import type { ChannelJobResult, RepairReceipt, TranscriptEntry, VideoJobResult } from "./aiPosts";
import { regenerateInvalidPostsArgs, rerunChannelDescriptionArgs, rerunVideoArgs } from "./aiPosts";
import {
	bestThumbnail,
	extractHashtags,
	forEachSafe,
	parseDuration,
	type Thumbnails,
} from "./helpers";
import { resolveLlmConfig } from "./lib/llm";
import {
	type AuditPage,
	clampPageSize,
	JOB_STAGGER_MS,
	type SweepRow,
	selectSweepCandidates,
	TRANSCRIPT_FETCH_MAX_MS,
} from "./lib/pipeline";

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
 * Transcript only, no LLM call. The sweep no longer schedules it (the aiPosts job fetches the
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
				AbortSignal.timeout(TRANSCRIPT_FETCH_MAX_MS),
			);
			if (transcript.length === 0) return;
			await ctx.runMutation(internal.videos.updateTranscript, { videoId, transcript });
		} catch (e) {
			console.error(`Transcript fetch failed for ${videoId}:`, e);
		}
	},
});

/**
 * The transcript for an aiPosts job, which runs in the Convex runtime: the transcript library
 * needs Node. Gives up after `timeoutMs` (the job's time left), at most TRANSCRIPT_FETCH_MAX_MS.
 * Writes nothing; failures are thrown to the job.
 */
export const fetchTranscriptForJob = internalAction({
	args: { videoId: v.string(), timeoutMs: v.number() },
	handler: (_ctx, { videoId, timeoutMs }): Promise<TranscriptEntry[]> =>
		fetchTranscriptSegments(
			videoId,
			AbortSignal.timeout(Math.max(1, Math.min(timeoutMs, TRANSCRIPT_FETCH_MAX_MS))),
		),
});

// --- Old AI job names ---
// Jobs already scheduled in production still call these names, so they keep their args. Each
// hands the job to aiPosts (Convex runtime, 30-minute limit) instead of running it here (Node,
// 10-minute limit).

const videoIdArgs = { videoId: v.string() };

async function forwardVideoJob(ctx: ActionCtx, { videoId }: { videoId: string }): Promise<null> {
	await ctx.scheduler.runAfter(0, internal.aiPosts.generateVideoPost, { videoId });
	return null;
}

export const processNewVideo = internalAction({ args: videoIdArgs, handler: forwardVideoJob });
export const processVideo = internalAction({ args: videoIdArgs, handler: forwardVideoJob });
export const generateArticle = internalAction({ args: videoIdArgs, handler: forwardVideoJob });

export const generateChannelDescription = internalAction({
	args: { channelId: v.string() },
	handler: async (ctx, { channelId }): Promise<null> => {
		await ctx.scheduler.runAfter(0, internal.aiPosts.generateChannelDescription, { channelId });
		return null;
	},
});

// The old CLI names wait for the aiPosts action and return its result, so they stay bound by
// this Node action's 10-minute limit; use the aiPosts names for long runs.

/** Deprecated: use aiPosts:rerunVideo. */
export const rerunVideo = internalAction({
	args: rerunVideoArgs,
	handler: (ctx, args): Promise<VideoJobResult> => ctx.runAction(internal.aiPosts.rerunVideo, args),
});

/** Deprecated: use aiPosts:rerunChannelDescription. */
export const rerunChannelDescription = internalAction({
	args: rerunChannelDescriptionArgs,
	handler: (ctx, args): Promise<ChannelJobResult> =>
		ctx.runAction(internal.aiPosts.rerunChannelDescription, args),
});

/** Deprecated: use aiPosts:regenerateInvalidPosts. */
export const regenerateInvalidPosts = internalAction({
	args: regenerateInvalidPostsArgs,
	handler: (ctx, args): Promise<RepairReceipt[]> =>
		ctx.runAction(internal.aiPosts.regenerateInvalidPosts, args),
});

// --- CLI commands (internal; run with `npx convex run youtube:<name> '<json>'`) ---

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

	// One job type: the aiPosts job fetches a missing transcript first and makes no LLM call
	// when the source is insufficient.
	const videoIds = selectSweepCandidates(rows, deps.now());
	for (const videoId of videoIds) {
		await deps.scheduler.runAfter(
			stagger.queued++ * JOB_STAGGER_MS,
			internal.aiPosts.generateVideoPost,
			{ videoId },
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
		await deps.scheduler.runAfter(i * JOB_STAGGER_MS, internal.aiPosts.generateChannelDescription, {
			channelId: channel.channelId,
		});
	}
	log(`channel descriptions: queued ${channels.length} job(s)`);
	return { queued: channels.length };
}

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
