import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { SHORTS_THRESHOLD } from "./helpers";
import {
	hasErrors,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
} from "./lib/contentRules";
import {
	type AuditFinding,
	auditStoredPost,
	type SweepRow,
	storedAnalysisOf,
	transcriptWordCount,
} from "./lib/pipeline";

function findVideo(ctx: MutationCtx, videoId: string) {
	return ctx.db
		.query("videos")
		.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
		.first();
}

const analysisFields = v.object({
	summary: v.string(),
	seoTitle: v.string(),
	seoDescription: v.string(),
	themes: v.array(v.string()),
	categories: v.array(v.string()),
	keyTakeaways: v.array(v.string()),
	faq: v.array(v.object({ question: v.string(), answer: v.string() })),
	relevanceScore: v.number(),
});

// --- Internal mutations (called from actions) ---

export const insert = internalMutation({
	args: {
		videoId: v.string(),
		slug: v.optional(v.string()),
		channelId: v.string(),
		title: v.string(),
		description: v.string(),
		publishedAt: v.string(),
		thumbnailUrl: v.string(),
		duration: v.optional(v.string()),
		durationSeconds: v.optional(v.number()),
		viewCount: v.optional(v.number()),
		likeCount: v.optional(v.number()),
		tags: v.optional(v.array(v.string())),
		hashtags: v.optional(v.array(v.string())),
		/** Delay before the video's job; a channel sync staggers its new videos. */
		delayMs: v.optional(v.number()),
	},
	handler: async (ctx, { delayMs, ...fields }) => {
		const existing = await findVideo(ctx, fields.videoId);
		if (existing) return existing._id;
		const id = await ctx.db.insert("videos", fields);
		await ctx.scheduler.runAfter(delayMs ?? 0, internal.youtube.processNewVideo, {
			videoId: fields.videoId,
		});
		return id;
	},
});

/**
 * The only write path for AI content. Writes analysis (optional: article-only reruns keep the
 * stored analysis) and article together, after re-validation, the job deadline and an optimistic
 * guard on processedAt. Clears the failure state.
 */
export const publishPost = internalMutation({
	args: {
		videoId: v.string(),
		expectedProcessedAt: v.optional(v.number()),
		analysis: v.optional(analysisFields),
		article: v.string(),
		deadlineAt: v.number(),
	},
	handler: async (ctx, { videoId, expectedProcessedAt, analysis, article, deadlineAt }) => {
		const video = await findVideo(ctx, videoId);
		if (!video) return { status: "not_found" as const };
		if (Date.now() > deadlineAt) return { status: "deadline" as const };
		if (video.processedAt !== expectedProcessedAt) return { status: "stale" as const };

		// Categories are checked against the enum by validateAnalysis before the cast is relied on.
		const newAnalysis = analysis as VideoAnalysis | undefined;
		const effective = newAnalysis ?? storedAnalysisOf(video);
		if (!effective) return { status: "invalid" as const, issues: ["analysis_missing"] };
		const issues = [
			...(newAnalysis ? validateAnalysis(newAnalysis) : []),
			...validateArticle(article, { title: video.title, seoTitle: effective.seoTitle }),
		];
		if (hasErrors(issues)) {
			const codes = issues.filter((i) => i.severity === "error").map((i) => i.code);
			return { status: "invalid" as const, issues: [...new Set(codes)] };
		}

		await ctx.db.patch(video._id, {
			...newAnalysis,
			article,
			processedAt: Date.now(),
			aiFailureCount: undefined,
			aiLastFailedAt: undefined,
			aiLastIssues: undefined,
		});
		return { status: "published" as const };
	},
});

/** Records an exhausted AI run. Stored content stays untouched. */
export const recordAiFailure = internalMutation({
	args: { videoId: v.string(), issues: v.array(v.string()) },
	handler: async (ctx, { videoId, issues }) => {
		const video = await findVideo(ctx, videoId);
		if (!video) return;
		await ctx.db.patch(video._id, {
			aiFailureCount: (video.aiFailureCount ?? 0) + 1,
			aiLastFailedAt: Date.now(),
			aiLastIssues: issues,
		});
	},
});

export const updateTranscript = internalMutation({
	args: {
		videoId: v.string(),
		transcript: v.array(
			v.object({
				text: v.string(),
				offset: v.number(),
				duration: v.number(),
			}),
		),
	},
	handler: async (ctx, { videoId, transcript }) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		if (video) await ctx.db.patch(video._id, { transcript });
	},
});

export const updateStats = internalMutation({
	args: {
		videoId: v.string(),
		viewCount: v.number(),
		likeCount: v.number(),
		thumbnailUrl: v.optional(v.string()),
		duration: v.optional(v.string()),
		durationSeconds: v.optional(v.number()),
	},
	handler: async (
		ctx,
		{ videoId, viewCount, likeCount, thumbnailUrl, duration, durationSeconds },
	) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		if (video) {
			const patch: Record<string, unknown> = { viewCount, likeCount };
			if (thumbnailUrl && (!video.thumbnailUrl || video.thumbnailUrl === "")) {
				patch.thumbnailUrl = thumbnailUrl;
			}
			// Live and upcoming videos sync with duration P0D (0 s); fill it in once it is known,
			// otherwise they stay treated as Shorts.
			if (!video.durationSeconds && durationSeconds && durationSeconds > 0) {
				patch.durationSeconds = durationSeconds;
				if (duration) patch.duration = duration;
			}
			await ctx.db.patch(video._id, patch);
		}
	},
});

export const listAllVideoIds = internalQuery({
	args: {},
	handler: async (ctx) => {
		const videos = await ctx.db.query("videos").collect();
		return videos.map((v) => v.videoId);
	},
});

// --- Internal queries (called from actions) ---

export const getByVideoId = internalQuery({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) =>
		ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first(),
});

/** One page of sweep projections (flags and counts, never transcripts or AI text). */
export const listSweepPage = internalQuery({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, { paginationOpts }) => {
		const result = await ctx.db.query("videos").paginate(paginationOpts);
		return {
			...result,
			page: result.page.map(
				(video): SweepRow => ({
					videoId: video.videoId,
					publishedAt: video.publishedAt,
					_creationTime: video._creationTime,
					hasTranscript: Boolean(video.transcript?.length),
					transcriptWordCount: transcriptWordCount(video.transcript),
					isComplete: video.processedAt !== undefined && Boolean(video.article),
					durationSeconds: video.durationSeconds,
					aiFailureCount: video.aiFailureCount,
					aiLastFailedAt: video.aiLastFailedAt,
				}),
			),
		};
	},
});

/** Titles and summaries only: input for the channel description. */
export const listRecentByChannel = internalQuery({
	args: { channelId: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { channelId, limit }) => {
		const videos = await ctx.db
			.query("videos")
			.withIndex("by_channelId_publishedAt", (q) => q.eq("channelId", channelId))
			.order("desc")
			.take(limit ?? 10);
		return videos.map((video) => ({ title: video.title, summary: video.summary }));
	},
});

/** Every video with this slug (in one channel, if given); the caller resolves ambiguity. */
export const findBySlug = internalQuery({
	args: { slug: v.string(), channelId: v.optional(v.string()) },
	handler: async (ctx, { slug, channelId }) => {
		const videos = await ctx.db
			.query("videos")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.collect();
		return videos
			.filter((video) => channelId === undefined || video.channelId === channelId)
			.map((video) => ({ videoId: video.videoId, channelId: video.channelId }));
	},
});

/** Audit of one stored post (error codes only), or null when the video does not exist. */
export const auditOne = internalQuery({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();
		return video ? auditStoredPost(video) : null;
	},
});

/**
 * One audit page: re-validates stored posts with the current rules. Returns ids and issue codes
 * only. Shorts are not expected to have a post and are not reported as missing.
 */
export const auditPage = internalQuery({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, { paginationOpts }) => {
		const result = await ctx.db.query("videos").paginate(paginationOpts);
		const failing: Array<{ id: string; slug?: string } & AuditFinding> = [];
		const missing: string[] = [];
		for (const video of result.page) {
			const audit = auditStoredPost(video);
			if (audit.missing) {
				if ((video.durationSeconds ?? 0) > SHORTS_THRESHOLD) missing.push(video.videoId);
				continue;
			}
			for (const finding of audit.findings) {
				failing.push({ id: video.videoId, slug: video.slug, ...finding });
			}
		}
		return {
			checked: result.page.length,
			failing,
			missing,
			continueCursor: result.continueCursor,
			isDone: result.isDone,
		};
	},
});

// --- Public queries (frontend) ---

export const listByChannel = query({
	args: { channelId: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { channelId, limit }) =>
		ctx.db
			.query("videos")
			.withIndex("by_channelId_publishedAt", (q) => q.eq("channelId", channelId))
			.order("desc")
			.take(limit ?? 20),
});

export const listRecent = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) =>
		ctx.db
			.query("videos")
			.withIndex("by_publishedAt")
			.order("desc")
			.take(limit ?? 20),
});

export const listRecentVideosOnly = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) => {
		const videos = await ctx.db
			.query("videos")
			.withIndex("by_publishedAt")
			.order("desc")
			.take((limit ?? 20) * 3);

		return videos.filter((v) => (v.durationSeconds ?? 0) > SHORTS_THRESHOLD).slice(0, limit ?? 20);
	},
});

export const listByCategory = query({
	args: { category: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { category, limit }) => {
		const videos = await ctx.db.query("videos").withIndex("by_publishedAt").order("desc").take(100);

		return videos.filter((v) => v.categories?.includes(category as never)).slice(0, limit ?? 20);
	},
});

export const get = query({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) =>
		ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first(),
});

export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }) =>
		ctx.db
			.query("videos")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.first(),
});

export const getNextByChannel = query({
	args: { channelId: v.string(), publishedAt: v.string() },
	handler: async (ctx, { channelId, publishedAt }) =>
		ctx.db
			.query("videos")
			.withIndex("by_channelId_publishedAt", (q) =>
				q.eq("channelId", channelId).lt("publishedAt", publishedAt),
			)
			.order("desc")
			.first(),
});

// --- Public query and mutation for scripts/sync-transcripts.ts ---

export const needsTranscript = query({
	args: {},
	handler: async (ctx) =>
		ctx.db
			.query("videos")
			.filter((q) => q.eq(q.field("transcript"), undefined))
			.take(50),
});

export const saveTranscript = mutation({
	args: {
		videoId: v.string(),
		transcript: v.array(
			v.object({
				text: v.string(),
				offset: v.number(),
				duration: v.number(),
			}),
		),
	},
	handler: async (ctx, { videoId, transcript }) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		// Unauthenticated: only fill a missing transcript, never replace one.
		if (video && !video.transcript?.length) await ctx.db.patch(video._id, { transcript });
	},
});

// --- Internal maintenance (CLI only: `npx convex run videos:<name>`) ---

export const resetProcessing = internalMutation({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		if (video) {
			await ctx.db.patch(video._id, {
				processedAt: undefined,
				summary: undefined,
				seoTitle: undefined,
				seoDescription: undefined,
				themes: undefined,
				categories: undefined,
				keyTakeaways: undefined,
				faq: undefined,
				article: undefined,
				relevanceScore: undefined,
			});
		}
	},
});

export const resetAllProcessing = internalMutation({
	args: {},
	handler: async (ctx) => {
		const videos = await ctx.db.query("videos").collect();
		for (const video of videos) {
			await ctx.db.patch(video._id, {
				processedAt: undefined,
				summary: undefined,
				seoTitle: undefined,
				seoDescription: undefined,
				themes: undefined,
				categories: undefined,
				keyTakeaways: undefined,
				faq: undefined,
				article: undefined,
				relevanceScore: undefined,
			});
		}
		return { reset: videos.length };
	},
});

export const backfillHashtags = internalMutation({
	args: {},
	handler: async (ctx) => {
		const videos = await ctx.db
			.query("videos")
			.filter((q) => q.eq(q.field("hashtags"), undefined))
			.collect();

		for (const video of videos) {
			const hashtags: string[] = [];
			for (const match of video.description.matchAll(/#(\S+)/g)) {
				const tag = match[1].replace(/[.,;:!?)]+$/, "").toLowerCase();
				if (tag.length > 1 && !hashtags.includes(tag)) hashtags.push(tag);
			}
			await ctx.db.patch(video._id, { hashtags });
		}
		return { updated: videos.length };
	},
});
