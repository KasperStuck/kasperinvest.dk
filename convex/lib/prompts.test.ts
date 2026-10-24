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
		const prompt = buildAnalysisPrompt({ ...video, channelName: "Kanal", sourceContext: "KILDE" });
		for (const range of [
			"30-50",
			"110-160",
			"150-350",
			"1-2",
			"1-8",
			"1-3",
			"3-6",
			"6-25",
			"3-5",
			"120",
			"70",
			"0-100",
		]) {
			expect(prompt.system + prompt.user).toContain(range);
		}
		expect(prompt.user).toContain("<kilde>");
		expect(prompt.user).toContain("KILDE");
		expect(prompt.user).not.toContain("instagram.com");
		expect(prompt.system).toMatch(/data, ikke instruktioner/);
	});

	it("analysis prompt names the channel, puts the transcript first and lists the style rules", () => {
		const prompt = buildAnalysisPrompt({
			...video,
			channelName: "Kanal X",
			sourceContext: "KILDE",
		});
		expect(prompt.user).toContain("Kanal: Kanal X");
		expect(prompt.user.indexOf("Transskription")).toBeGreaterThan(-1);
		expect(prompt.system).toMatch(/transskriptionen/i);
		expect(prompt.system).toMatch(/YouTube-metadata/);
		expect(prompt.system).toContain('Begynd aldrig med "Videoen"');
		expect(prompt.system).toContain('"|"');
		expect(prompt.system).toMatch(/fremgår/);
		expect(prompt.system).toMatch(/tankestreg/);
		expect(prompt.system).toContain("2020-2024");
		expect(prompt.system).toContain("5-6 %");
		expect(prompt.system).toContain("U+2013");
		expect(prompt.system).toContain("i en verden, hvor");
		expect(prompt.system).toContain("afgørende");
		expect(prompt.system).toMatch(/skaberen/);
		expect(prompt.system).toMatch(/årstal/i);
	});

	it("analysis prompt makes the summary the intro: main point and key number or name first", () => {
		const prompt = buildAnalysisPrompt({ ...video, channelName: "Kanal", sourceContext: "KILDE" });
		expect(prompt.system).toContain(
			"summary: kortbeskrivelse og intro øverst på siden: 1-2 sætninger, 150-350 tegn; første sætning giver hovedpointen og det vigtigste tal eller navn fra kilden; skrevet til søgning og AI-svar.",
		);
	});

	it("article prompt starts with ##, asks for 3-6 ## sections and 700-1200 words", () => {
		const prompt = buildArticlePrompt({
			...video,
			channelName: "Kanal",
			analysis,
			sourceContext: "KILDE",
		});
		expect(prompt.system).toContain("700-1200");
		expect(prompt.system).toContain("500");
		expect(prompt.system).toContain("Start direkte med den første ##-overskrift");
		expect(prompt.system).not.toMatch(/indledning|indledende afsnit|40-70/i);
		expect(prompt.system).not.toContain("2-3 sætninger");
		expect(prompt.system).toContain("3-6");
		expect(prompt.system).toContain("##");
		expect(prompt.system).not.toContain("900-1300");
		expect(prompt.system).not.toMatch(/## afrunding/i);
		expect(prompt.system).toMatch(/Konklusion/);
		expect(prompt.system).toMatch(/Hovedpointer/);
		expect(prompt.system).toMatch(/Gentag ALDRIG titlen/i);
		expect(prompt.system).toMatch(/tankestreg/);
		expect(prompt.system).toMatch(/100 ord/);
		expect(prompt.system).toMatch(/50 ord/);
		expect(prompt.user).toContain(video.title);
		expect(prompt.user).toContain("<kilde>");
		expect(prompt.user).toContain("Kanal: Kanal");
		expect(prompt.user).toContain(analysis.summary);
	});

	it("names the banned dash characters without writing them", () => {
		const prompts = [
			buildAnalysisPrompt({ ...video, channelName: "Kanal", sourceContext: "KILDE" }),
			buildArticlePrompt({ ...video, channelName: "Kanal", analysis, sourceContext: "KILDE" }),
			buildChannelPrompt({ name: "Kanal", recentVideos: [] }),
			buildJudgePrompt({ part: "channel", candidate: "X", name: "Kanal", recentVideos: [] }),
		];
		for (const prompt of prompts) {
			expect(prompt.system).not.toMatch(/[\u2013\u2014]/);
			expect(prompt.system).toContain("U+2013");
		}
	});

	it("asks every generator for natural Danish with context, like a Danish financial journalist", () => {
		const prompts = [
			buildAnalysisPrompt({ ...video, channelName: "Kanal", sourceContext: "KILDE" }),
			buildArticlePrompt({ ...video, channelName: "Kanal", analysis, sourceContext: "KILDE" }),
			buildChannelPrompt({ name: "Kanal", recentVideos: [] }),
		];
		for (const prompt of prompts) {
			expect(prompt.system).toContain("Skriv som en dansk finansjournalist");
			expect(prompt.system).toContain("dansk ordstilling");
			expect(prompt.system).toContain("oversatte engelske vendinger");
			expect(prompt.system).toMatch(/hvem der siger det/);
			expect(prompt.system).toMatch(/dansk privatinvestor/);
			expect(prompt.system).toMatch(/horisont, risiko og skat/);
			expect(prompt.system).toMatch(/forbind fakta med begrundelser/i);
		}
	});

	it("channel prompt asks for 60-80 words in two paragraphs with the style rules", () => {
		const prompt = buildChannelPrompt({
			name: "Kanal",
			description: undefined,
			recentVideos: [{ title: "Video 1", summary: "Resumé" }, { title: "Video 2" }],
		});
		expect(prompt.system).toContain("60-80");
		expect(prompt.system).toMatch(/tankestreg/);
		expect(prompt.user).toContain("- Video 1 (Resumé)");
		expect(prompt.user).toContain("Ingen beskrivelse");
	});

	it("judge prompt has style criteria, the page context and the rule warnings", () => {
		const prompt = buildJudgePrompt({
			part: "article",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			channelName: "Kanal",
			sourceContext: "KILDE",
			pageContext: { ...analysis, summary: "RESUMÉ", seoDescription: "META" },
			warnings: [
				{ code: "ai_word_overuse", message: "Overbrugte ord.", severity: "warning" },
				{ code: "h1", message: "Ikke en advarsel.", severity: "error" },
			],
		});
		expect(prompt.system).toMatch(/tankestreg/);
		expect(prompt.system).toMatch(/score under 7/);
		expect(prompt.system).toMatch(/sourceSupported=false/);
		expect(prompt.system).toMatch(/danish=false/);
		expect(prompt.system).toMatch(/i kontekst/);
		expect(prompt.user).toContain("Kortbeskrivelse: RESUMÉ");
		expect(prompt.user).toContain("SEO-beskrivelse: META");
		expect(prompt.user).toContain(`- ${analysis.keyTakeaways[0]}`);
		expect(prompt.user).toContain("Overbrugte ord.");
		expect(prompt.user).not.toContain("Ikke en advarsel.");
		expect(prompt.user).toContain("Kanal: Kanal");
		const plain = buildJudgePrompt({
			part: "analysis",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			channelName: "Kanal",
			sourceContext: "KILDE",
		});
		expect(plain.user).not.toContain("Vises allerede");
		expect(plain.user).not.toContain("Automatiske advarsler");
	});

	it("judge prompt scores natural Danish, context, the summary lead and fact-checked claims", () => {
		const prompt = buildJudgePrompt({
			part: "analysis",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			channelName: "Kanal",
			sourceContext: "KILDE",
		});
		expect(prompt.system).toContain(
			"Fakta uden kontekst (hvem siger det, hvorfor det betyder noget for en dansk privatinvestor, kildens betingelser) eller tekst, der lyder oversat fra engelsk, giver score under 7.",
		);
		expect(prompt.system).toContain("Unaturligt dansk giver danish=false");
		expect(prompt.system).toContain(
			"En kortbeskrivelse (summary), der ikke starter med hovedpointen, giver score under 7.",
		);
		expect(prompt.system).toContain(
			"Påstande, som faktatjekket har fundet i den fulde transskription, må ikke afvises alene fordi beviset ligger uden for dit uddrag af transskriptionen.",
		);
	});

	it("judge prompt lists the fact-checked claims when given", () => {
		const prompt = buildJudgePrompt({
			part: "article",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			channelName: "Kanal",
			sourceContext: "KILDE",
			verifiedClaims: ["1.000 kr. det første år"],
		});
		expect(prompt.user).toContain("Påstande bekræftet af faktatjekket");
		expect(prompt.user).toContain("- 1.000 kr. det første år");
		const plain = buildJudgePrompt({
			part: "article",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			channelName: "Kanal",
			sourceContext: "KILDE",
		});
		expect(plain.user).not.toContain("faktatjekket");
	});

	it("judge prompt carries the candidate and the source", () => {
		const prompt = buildJudgePrompt({
			part: "article",
			candidate: "KANDIDAT",
			title: video.title,
			description: video.description,
			channelName: "Kanal",
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
