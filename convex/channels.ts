import { v } from "convex/values";
import { query, internalMutation, internalQuery, mutation } from "./_generated/server";

export const upsert = internalMutation({
	args: {
		channelId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		customUrl: v.optional(v.string()),
		country: v.optional(v.string()),
		uploadsPlaylistId: v.string(),
		thumbnailUrl: v.optional(v.string()),
		bannerUrl: v.optional(v.string()),
		subscriberCount: v.optional(v.number()),
		videoCount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("channels")
			.withIndex("by_channelId", (q) => q.eq("channelId", args.channelId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, args);
			return existing._id;
		}

		return ctx.db.insert("channels", args);
	},
});

export const updateLastSynced = internalMutation({
	args: { channelId: v.string(), lastSyncedAt: v.number() },
	handler: async (ctx, { channelId, lastSyncedAt }) => {
		const channel = await ctx.db
			.query("channels")
			.withIndex("by_channelId", (q) => q.eq("channelId", channelId))
			.first();

		if (channel) await ctx.db.patch(channel._id, { lastSyncedAt });
	},
});

export const getByChannelId = internalQuery({
	args: { channelId: v.string() },
	handler: async (ctx, { channelId }) =>
		ctx.db
			.query("channels")
			.withIndex("by_channelId", (q) => q.eq("channelId", channelId))
			.first(),
});

export const listAll = internalQuery({
	args: {},
	handler: async (ctx) => ctx.db.query("channels").collect(),
});

// --- Public queries (frontend) ---

export const list = query({
	args: {},
	handler: async (ctx) => ctx.db.query("channels").collect(),
});

export const get = query({
	args: { channelId: v.string() },
	handler: async (ctx, { channelId }) =>
		ctx.db
			.query("channels")
			.withIndex("by_channelId", (q) => q.eq("channelId", channelId))
			.first(),
});

export const updateAiDescription = internalMutation({
	args: { channelId: v.string(), aiDescription: v.string() },
	handler: async (ctx, { channelId, aiDescription }) => {
		const channel = await ctx.db
			.query("channels")
			.withIndex("by_channelId", (q) => q.eq("channelId", channelId))
			.first();

		if (channel) await ctx.db.patch(channel._id, { aiDescription });
	},
});

export const resetAllAiDescriptions = mutation({
	args: {},
	handler: async (ctx) => {
		const channels = await ctx.db.query("channels").collect();
		for (const ch of channels) {
			await ctx.db.patch(ch._id, { aiDescription: undefined });
		}
		return { reset: channels.length };
	},
});

export const listWithoutAiDescription = internalQuery({
	args: {},
	handler: async (ctx) => {
		const channels = await ctx.db.query("channels").collect();
		return channels.filter((ch) => !ch.aiDescription);
	},
});
