import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { SHORTS_THRESHOLD } from "./helpers";

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
	},
	handler: async (ctx, args) => {
		const id = await ctx.db.insert("videos", args);
		// Immediately trigger full processing pipeline for this video
		await ctx.scheduler.runAfter(0, internal.youtube.processNewVideo, {
			videoId: args.videoId,
		});
		return id;
	},
});

export const updateProcessedData = internalMutation({
	args: {
		videoId: v.string(),
		summary: v.string(),
		seoTitle: v.string(),
		seoDescription: v.string(),
		themes: v.array(v.string()),
		categories: v.array(v.string()),
		keyTakeaways: v.array(v.string()),
		faq: v.array(v.object({ question: v.string(), answer: v.string() })),
		relevanceScore: v.number(),
	},
	handler: async (
		ctx,
		{
			videoId,
			summary,
			seoTitle,
			seoDescription,
			themes,
			categories,
			keyTakeaways,
			faq,
			relevanceScore,
		},
	) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		if (video) {
			await ctx.db.patch(video._id, {
				summary,
				seoTitle,
				seoDescription,
				themes,
				categories: categories as typeof video.categories,
				keyTakeaways,
				faq,
				relevanceScore,
				processedAt: Date.now(),
			});
		}
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

export const updateArticle = internalMutation({
	args: {
		videoId: v.string(),
		article: v.string(),
	},
	handler: async (ctx, { videoId, article }) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		if (video) await ctx.db.patch(video._id, { article });
	},
});

export const updateStats = internalMutation({
	args: {
		videoId: v.string(),
		viewCount: v.number(),
		likeCount: v.number(),
		thumbnailUrl: v.optional(v.string()),
	},
	handler: async (ctx, { videoId, viewCount, likeCount, thumbnailUrl }) => {
		const video = await ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.first();

		if (video) {
			const patch: Record<string, unknown> = { viewCount, likeCount };
			if (thumbnailUrl && (!video.thumbnailUrl || video.thumbnailUrl === "")) {
				patch.thumbnailUrl = thumbnailUrl;
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

export const listUnprocessed = internalQuery({
	args: {},
	handler: async (ctx) =>
		ctx.db
			.query("videos")
			.filter((q) => q.eq(q.field("processedAt"), undefined))
			.take(10),
});

export const listWithoutArticle = internalQuery({
	args: {},
	handler: async (ctx) =>
		ctx.db
			.query("videos")
			.filter((q) =>
				q.and(q.eq(q.field("article"), undefined), q.neq(q.field("processedAt"), undefined)),
			)
			.take(10),
});

export const listWithoutTranscript = internalQuery({
	args: {},
	handler: async (ctx) =>
		ctx.db
			.query("videos")
			.filter((q) => q.eq(q.field("transcript"), undefined))
			.take(10),
});

export const listRecentByChannel = internalQuery({
	args: { channelId: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { channelId, limit }) =>
		ctx.db
			.query("videos")
			.withIndex("by_channelId_publishedAt", (q) => q.eq("channelId", channelId))
			.order("desc")
			.take(limit ?? 10),
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

// --- Public mutations (for local scripts) ---

export const needsTranscript = query({
	args: {},
	handler: async (ctx) =>
		ctx.db
			.query("videos")
			.filter((q) => q.eq(q.field("transcript"), undefined))
			.take(50),
});

export const resetProcessing = mutation({
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

export const resetAllProcessing = mutation({
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

export const backfillHashtags = mutation({
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

		if (video) await ctx.db.patch(video._id, { transcript });
	},
});
