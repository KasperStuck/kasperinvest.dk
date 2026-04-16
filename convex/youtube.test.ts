import { describe, expect, it } from "vitest";
import { z } from "zod";

// --- Zod schemas (mirrored from youtube.ts since they aren't exported) ---

const qualitySchema = z.object({
	score: z.number().min(1).max(10),
	reason: z.string(),
});

const videoAnalysisSchema = z.object({
	summary: z.string(),
	seoTitle: z.string(),
	seoDescription: z.string(),
	themes: z.array(z.string()),
	categories: z.array(z.string()),
	keyTakeaways: z.array(z.string()),
	faq: z.array(z.object({ question: z.string(), answer: z.string() })),
	relevanceScore: z.number().min(0).max(100),
});

// --- qualitySchema ---

describe("qualitySchema", () => {
	it("accepts valid quality evaluation", () => {
		const result = qualitySchema.safeParse({ score: 9, reason: "Godt skrevet" });
		expect(result.success).toBe(true);
	});

	it("rejects score below 1", () => {
		const result = qualitySchema.safeParse({ score: 0, reason: "For lav" });
		expect(result.success).toBe(false);
	});

	it("rejects score above 10", () => {
		const result = qualitySchema.safeParse({ score: 11, reason: "For høj" });
		expect(result.success).toBe(false);
	});

	it("rejects missing reason", () => {
		const result = qualitySchema.safeParse({ score: 5 });
		expect(result.success).toBe(false);
	});

	it("rejects missing score", () => {
		const result = qualitySchema.safeParse({ reason: "test" });
		expect(result.success).toBe(false);
	});
});

// --- videoAnalysisSchema ---

describe("videoAnalysisSchema", () => {
	const validAnalysis = {
		summary: "En video om aktier og investering i danske markeder.",
		seoTitle: "Aktier i 2026: Sådan investerer du klogt",
		seoDescription: "Lær hvordan du investerer i aktier i 2026 med disse konkrete tips.",
		themes: ["aktier", "investering"],
		categories: ["aktier", "strategi"],
		keyTakeaways: ["Diversificér din portefølje", "Tænk langsigtet", "Hold omkostninger lave"],
		faq: [
			{ question: "Hvordan starter jeg med at investere?", answer: "Start med en bred ETF." },
			{ question: "Hvad er en ETF?", answer: "En fond der følger et indeks." },
		],
		relevanceScore: 85,
	};

	it("accepts a complete valid analysis", () => {
		const result = videoAnalysisSchema.safeParse(validAnalysis);
		expect(result.success).toBe(true);
	});

	it("rejects relevanceScore above 100", () => {
		const result = videoAnalysisSchema.safeParse({ ...validAnalysis, relevanceScore: 150 });
		expect(result.success).toBe(false);
	});

	it("rejects relevanceScore below 0", () => {
		const result = videoAnalysisSchema.safeParse({ ...validAnalysis, relevanceScore: -5 });
		expect(result.success).toBe(false);
	});

	it("rejects missing required fields", () => {
		const { summary: _, ...incomplete } = validAnalysis;
		const result = videoAnalysisSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it("rejects invalid FAQ structure", () => {
		const result = videoAnalysisSchema.safeParse({
			...validAnalysis,
			faq: [{ question: "test" }], // missing answer
		});
		expect(result.success).toBe(false);
	});

	it("accepts empty arrays for themes, categories, etc.", () => {
		const result = videoAnalysisSchema.safeParse({
			...validAnalysis,
			themes: [],
			categories: [],
			keyTakeaways: [],
			faq: [],
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-string themes", () => {
		const result = videoAnalysisSchema.safeParse({
			...validAnalysis,
			themes: [123, true],
		});
		expect(result.success).toBe(false);
	});
});
