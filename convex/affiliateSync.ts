"use node";

import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// --- Adtraction API schemas ---

const CommissionSchema = z.object({
	id: z.number(),
	type: z.string(),
	name: z.string(),
	value: z.number(),
	transactionType: z.number(),
});

const ProgramSchema = z.object({
	programId: z.number(),
	market: z.string(),
	currency: z.string(),
	approvalStatus: z.number(),
	programName: z.string(),
	programURL: z.string(),
	cookieDuration: z.number().optional(),
	commissions: z.array(CommissionSchema).optional(),
	logoURL: z.string().optional(),
	trackingURL: z.string().optional(),
	categoryName: z.string().optional(),
	categoryId: z.number().optional(),
	status: z.number().optional(),
	brandCategoryImage: z.string().optional(),
	epc: z.number().optional(),
});

// --- Savings category mapping ---
// Programs are matched by keywords found in their name, URL, and commission names.
// This is fully dynamic — no programIds are hardcoded.

const CATEGORY_KEYWORDS: Record<string, string[]> = {
	el: ["elpriser", "strøm", "energi", "ewii"],
	mobil: ["mobil", "mobile", "simkort", "mobilabonnement", "greentel", "lyca", "oister"],
	internet: ["internet", "fiber", "bredbånd", "hiper", "coax", "5g"],
	tv: ["tv", "parabol", "antenne", "allente"],
	streaming: ["streaming", "allente"],
	"bank-laan": ["bank", "lån", "kredit", "findbank"],
	investering: ["invest", "aktie", "saxo", "nordnet", "robo", "fond"],
	"tjen-penge": ["gallup", "undersøgelse", "panel", "kantar"],
};

function mapSavingsCategories(program: z.infer<typeof ProgramSchema>): string[] {
	const haystack = [
		program.programName,
		program.programURL,
		...(program.commissions?.map((c) => c.name) ?? []),
	]
		.join(" ")
		.toLowerCase();

	return Object.entries(CATEGORY_KEYWORDS)
		.filter(([_, keywords]) => keywords.some((kw) => haystack.includes(kw)))
		.map(([category]) => category);
}

// --- Sync action ---

export const syncAdtraction = internalAction({
	args: { market: v.optional(v.string()) },
	handler: async (ctx, { market: marketArg }) => {
		const apiKey = process.env.ADTRACTION_API_KEY;
		const channelId = process.env.ADTRACTION_CHANNEL_ID;
		const network = process.env.ADTRACTION_NETWORK ?? "adtraction";
		if (!apiKey || !channelId) {
			console.warn("syncAdtraction: Missing ADTRACTION_API_KEY or ADTRACTION_CHANNEL_ID");
			return { synced: 0 };
		}

		const market = marketArg ?? "DK";

		const res = await fetch("https://api.adtraction.net/v3/partner/programs", {
			method: "POST",
			headers: {
				"X-Token": apiKey,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				market,
				channelId: Number(channelId),
				approvalStatus: 1,
			}),
		});

		if (!res.ok) {
			throw new Error(`Adtraction API error: ${res.status} ${res.statusText}`);
		}

		const raw = await res.json();
		const programs = z.array(ProgramSchema).parse(raw);

		console.log(`syncAdtraction: ${programs.length} approved programs from ${network} (${market})`);

		const activeIds: string[] = [];

		for (const p of programs) {
			const externalId = String(p.programId);
			activeIds.push(externalId);

			await ctx.runMutation(internal.affiliatePrograms.upsert, {
				network,
				externalId,
				name: p.programName.replace(/ DK$/, ""),
				url: p.programURL,
				trackingUrl: p.trackingURL,
				logoUrl: p.logoURL,
				market: p.market,
				currency: p.currency,
				cookieDuration: p.cookieDuration,
				networkCategory: p.categoryName,
				savingsCategories: mapSavingsCategories(p),
				commissions: (p.commissions ?? [])
					.filter((c) => c.value > 0)
					.map((c) => ({
						name: c.name,
						value: c.value,
						type: c.type,
						transactionType: c.transactionType === 4 ? "lead" : "sale",
					})),
				status: "approved",
				epc: p.epc,
			});
		}

		// Mark removed programs
		await ctx.runMutation(internal.affiliatePrograms.markStale, {
			network,
			activeIds,
		});

		console.log(`syncAdtraction: Synced ${programs.length} program(s)`);
		return { synced: programs.length };
	},
});
