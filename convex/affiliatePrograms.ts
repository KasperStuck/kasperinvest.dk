import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

// --- Internal mutations (called from sync actions) ---

export const upsert = internalMutation({
	args: {
		network: v.string(),
		externalId: v.string(),
		name: v.string(),
		url: v.string(),
		trackingUrl: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		market: v.string(),
		currency: v.string(),
		cookieDuration: v.optional(v.number()),
		networkCategory: v.optional(v.string()),
		savingsCategories: v.array(v.string()),
		commissions: v.array(
			v.object({
				name: v.string(),
				value: v.number(),
				type: v.string(),
				transactionType: v.string(),
			}),
		),
		status: v.string(),
		epc: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("affiliatePrograms")
			.withIndex("by_network_externalId", (q) =>
				q.eq("network", args.network).eq("externalId", args.externalId),
			)
			.first();

		const data = { ...args, lastSyncedAt: Date.now() };

		if (existing) {
			await ctx.db.patch(existing._id, data);
			return existing._id;
		}
		return ctx.db.insert("affiliatePrograms", data);
	},
});

export const markStale = internalMutation({
	args: { network: v.string(), activeIds: v.array(v.string()) },
	handler: async (ctx, { network, activeIds }) => {
		const all = await ctx.db
			.query("affiliatePrograms")
			.withIndex("by_network", (q) => q.eq("network", network))
			.collect();

		const activeSet = new Set(activeIds);
		for (const program of all) {
			if (!activeSet.has(program.externalId) && program.status !== "removed") {
				await ctx.db.patch(program._id, { status: "removed" });
			}
		}
	},
});

// --- Internal queries ---

export const listByNetwork = internalQuery({
	args: { network: v.string() },
	handler: async (ctx, { network }) =>
		ctx.db
			.query("affiliatePrograms")
			.withIndex("by_network", (q) => q.eq("network", network))
			.collect(),
});

// --- Public queries (frontend) ---

export const listApproved = query({
	args: { market: v.optional(v.string()) },
	handler: async (ctx, { market }) => {
		const programs = await ctx.db
			.query("affiliatePrograms")
			.withIndex("by_savingsCategory", (q) =>
				q.eq("market", market ?? "DK").eq("status", "approved"),
			)
			.collect();
		return programs;
	},
});

export const listByCategory = query({
	args: { category: v.string(), market: v.optional(v.string()) },
	handler: async (ctx, { category, market }) => {
		const programs = await ctx.db
			.query("affiliatePrograms")
			.withIndex("by_savingsCategory", (q) =>
				q.eq("market", market ?? "DK").eq("status", "approved"),
			)
			.collect();

		return programs.filter((p) => p.savingsCategories.includes(category));
	},
});
