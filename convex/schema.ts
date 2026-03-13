import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const category = v.union(
	v.literal("privatøkonomi"),
	v.literal("aktier"),
	v.literal("ETF"),
	v.literal("obligationer"),
	v.literal("skat"),
	v.literal("pension"),
	v.literal("strategi"),
	v.literal("psykologi"),
	v.literal("analyse"),
	v.literal("krypto"),
	v.literal("bolig"),
	v.literal("FIRE"),
	v.literal("marked"),
	v.literal("andet"),
);

export default defineSchema({
	channels: defineTable({
		channelId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		customUrl: v.optional(v.string()),
		country: v.optional(v.string()),
		uploadsPlaylistId: v.string(),
		thumbnailUrl: v.optional(v.string()),
		thumbnailStorageId: v.optional(v.id("_storage")),
		bannerUrl: v.optional(v.string()),
		subscriberCount: v.optional(v.number()),
		videoCount: v.optional(v.number()),
		lastSyncedAt: v.optional(v.number()),
		aiDescription: v.optional(v.string()),
	})
		.index("by_channelId", ["channelId"])
		.index("by_customUrl", ["customUrl"]),

	videos: defineTable({
		// YouTube metadata
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
		isShort: v.optional(v.boolean()),

		// Transcript
		transcript: v.optional(
			v.array(
				v.object({
					text: v.string(),
					offset: v.number(),
					duration: v.number(),
				}),
			),
		),

		// AI-generated
		summary: v.optional(v.string()),
		seoTitle: v.optional(v.string()),
		seoDescription: v.optional(v.string()),
		article: v.optional(v.string()),
		faq: v.optional(
			v.array(
				v.object({
					question: v.string(),
					answer: v.string(),
				}),
			),
		),
		themes: v.optional(v.array(v.string())),
		categories: v.optional(v.array(category)),
		keyTakeaways: v.optional(v.array(v.string())),
		relevanceScore: v.optional(v.number()),
		processedAt: v.optional(v.number()),
	})
		.index("by_videoId", ["videoId"])
		.index("by_slug", ["slug"])
		.index("by_channelId", ["channelId"])
		.index("by_publishedAt", ["publishedAt"])
		.index("by_channelId_publishedAt", ["channelId", "publishedAt"])
		.index("by_isShort_publishedAt", ["isShort", "publishedAt"]),
});
