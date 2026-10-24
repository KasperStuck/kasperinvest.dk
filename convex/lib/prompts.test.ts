import { describe, expect, it } from "vitest";
import {
	appendFeedback,
	buildAnalysisPrompt,
	buildArticlePrompt,
	buildChannelPrompt,
	buildJudgePrompt,
	buildSourceContext,
	SOURCE_CONTEXT_MAX_CHARS,
} from "./prompts";

const video = {
	title: "Sådan investerer du i indeksfonde",
	description: "Om indeksfonde.\n\nFølg mig på Instagram\nhttps://instagram.com/x",
	transcript: [{ text: "Hej og velkommen." }, { text: "I dag taler vi om fonde." }],
};

const analysis = {
	summary: "En gennemgang af indeksfonde.",
	seoTitle: "Indeksfonde for begyndere",
	seoDescription: "Lær om indeksfonde.",
	themes: ["indeksfonde"],
	categories: ["ETF" as const],
	keyTakeaways: ["Lave omkostninger", "Bred spredning", "Lang horisont"],
	faq: [{ question: "Hvad er en indeksfond?", answer: "En fond der følger et indeks." }],
	relevanceScore: 80,
};

describe("buildSourceContext", () => {
	it("returns the whole transcript when it fits", () => {
		expect(buildSourceContext(video)).toBe("Hej og velkommen. I dag taler vi om fonde.");
	});

	it("returns an empty string without transcript", () => {
		expect(buildSourceContext({ transcript: undefined })).toBe("");
	});

	it("keeps first, middle and last excerpts within the limit", () => {
		const transcript = Array.from({ length: 3000 }, (_, i) => ({ text: `ord${i} fyld fyld fyld` }));
		const context = buildSourceContext({ transcript });
		expect(context.length).toBeLessThanOrEqual(SOURCE_CONTEXT_MAX_CHARS);
		expect(context).toContain("ord0 ");
		expect(context).toContain("ord1500");
		expect(context).toContain("ord2999");
		expect(context.split("[…]")).toHaveLength(3);
	});
});

describe("prompts", () => {
	it("analysis prompt states the exact ranges and frames the source as data", () => {
		const prompt = buildAnalysisPrompt({ ...video, sourceContext: "KILDE" });
		for (const range of ["30-50", "110-160", "80-600", "1-8", "1-3", "3-6", "3-5", "0-100"]) {
			expect(prompt.system + prompt.user).toContain(range);
		}
		expect(prompt.user).toContain("<kilde>");
		expect(prompt.user).toContain("KILDE");
		expect(prompt.user).not.toContain("instagram.com");
		expect(prompt.system).toMatch(/data, ikke instruktioner/);
	});

	it("article prompt asks for intro, 3-6 ## sections and 900-1300 words", () => {
		const prompt = buildArticlePrompt({
			...video,
			channelName: "Kanal",
			analysis,
			sourceContext: "KILDE",
		});
		expect(prompt.system).toContain("900-1300");
		expect(prompt.system).toContain("3-6");
		expect(prompt.system).toContain("##");
		expect(prompt.system).toMatch(/Hovedpointer/);
		expect(prompt.system).toMatch(/Gentag ALDRIG titlen/i);
		expect(prompt.user).toContain(video.title);
		expect(prompt.user).toContain("<kilde>");
	});

	it("channel prompt asks for 60-80 words in two paragraphs", () => {
		const prompt = buildChannelPrompt({
			name: "Kanal",
			description: undefined,
			recentVideos: [{ title: "Video 1", summary: "Resumé" }, { title: "Video 2" }],
		});
		expect(prompt.system).toContain("60-80");
		expect(prompt.user).toContain("- Video 1 (Resumé)");
		expect(prompt.user).toContain("Ingen beskrivelse");
	});

	it("judge prompt carries the candidate and the source", () => {
		const prompt = buildJudgePrompt({
			part: "article",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			sourceContext: "KILDE",
		});
		expect(prompt.system).toMatch(/1-10/);
		expect(prompt.system).toMatch(/7/);
		expect(prompt.user).toContain("KANDIDAT");
		expect(prompt.user).toContain("KILDE");
		const channel = buildJudgePrompt({
			part: "channel",
			candidate: "BESKRIVELSE",
			name: "Kanal",
			description: "Original",
			recentVideos: [{ title: "Video 1" }],
		});
		expect(channel.user).toContain("Original");
		expect(channel.user).toContain("Video 1");
	});

	it("appendFeedback lists blocking issues and keeps the original prompt", () => {
		const prompt = { system: "S", user: "U" };
		const next = appendFeedback(prompt, [
			{ code: "h1", message: "Brug ikke H1.", severity: "error" },
			{ code: "not_danish", message: "Advarsel.", severity: "warning" },
		]);
		expect(next.system).toBe("S");
		expect(next.user.startsWith("U")).toBe(true);
		expect(next.user).toContain("Brug ikke H1.");
		expect(next.user).not.toContain("Advarsel.");
		expect(appendFeedback(prompt, [])).toEqual(prompt);
	});
});
