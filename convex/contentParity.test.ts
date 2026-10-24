/// <reference types="vite/client" />
/**
 * Every content rule must reject the same text in all three places: the generation loop (as
 * feedback to the next attempt), the publish mutation and the stored-content audit.
 */
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import type { VideoAnalysis } from "./lib/contentRules";
import {
	ARTICLE_SECTIONS,
	EXTRA_PARAGRAPH,
	passingFactCheck,
	transcriptOfWords,
	VIDEO_TITLE,
	validAnalysis,
	validArticle,
	validChannelDescription,
} from "./lib/fixtures.testing";
import type { LlmConfig } from "./lib/llm";
import { generateChannelDescription, generateVideoPost } from "./lib/videoPost";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");
const newTest = () => convexTest(schema, modules);

const PARAGRAPH = ARTICLE_SECTIONS[0].paragraphs[0];
const appendToParagraph = (text: string) =>
	validArticle().replace(PARAGRAPH, `${PARAGRAPH} ${text}`);
const LONG_SENTENCE =
	"Når investoren vælger en fond med lave omkostninger, et bredt globalt indeks, en akkumulerende udbyttepolitik og en kontotype med lav skat, og samtidig holder fast i en fast månedlig indbetaling gennem både gode og dårlige år på markedet, bliver resultatet ofte bedre end med en aktiv forvalter, der skifter mening hvert eneste kvartal og tager sig godt betalt for det.";
const SHORT_ARTICLE = ARTICLE_SECTIONS.map((s) => `## ${s.heading}\n\n${s.paragraphs[0]}`).join(
	"\n\n",
);

function analysisWith(fields: Partial<VideoAnalysis>): VideoAnalysis {
	return { ...validAnalysis(), ...fields };
}

function faqWith(index: number, fields: Partial<VideoAnalysis["faq"][number]>) {
	return validAnalysis().faq.map((f, i) => (i === index ? { ...f, ...fields } : f));
}

type PostCase =
	| { code: string; part: "analysis"; analysis: VideoAnalysis }
	| { code: string; part: "article"; article: string };

const POST_CASES: PostCase[] = [
	{ code: "thought_dash", part: "article", article: appendToParagraph("Renten steg – og faldt.") },
	{
		code: "thought_dash",
		part: "analysis",
		analysis: analysisWith({ seoTitle: "Indeksfonde – kom godt i gang i dag" }),
	},
	// En dashes between letters are not normalized, so they are fed back like any other dash.
	{
		code: "thought_dash",
		part: "analysis",
		analysis: analysisWith({ seoTitle: "Indeksfonde fra Q1\u2013Q3: kom godt i gang" }),
	},
	{
		code: "thought_dash",
		part: "article",
		article: appendToParagraph("Fra Q1&ndash;Q3 steg kursen."),
	},
	{ code: "ai_phrase", part: "article", article: appendToParagraph("Kort sagt er prisen vigtig.") },
	{
		code: "ai_phrase",
		part: "analysis",
		analysis: analysisWith({
			seoDescription:
				"Samlet set viser gennemgangen, hvordan du vælger en billig indeksfond og en konto med lav skat på lang sigt.",
		}),
	},
	{
		code: "closing_heading",
		part: "article",
		article: validArticle().replace("Hvad gør du, hvis markedet falder?", "Konklusion"),
	},
	{
		code: "starts_without_section",
		part: "article",
		article: `${EXTRA_PARAGRAPH}\n\n${validArticle()}`,
	},
	{
		code: "paragraph_too_long",
		part: "article",
		article: validArticle().replace(
			PARAGRAPH,
			[PARAGRAPH, ...ARTICLE_SECTIONS[1].paragraphs].join(" "),
		),
	},
	{
		code: "sentence_too_long",
		part: "article",
		article: validArticle().replace(PARAGRAPH, LONG_SENTENCE),
	},
	{
		code: "emphasis_only_paragraph",
		part: "article",
		article: `${validArticle()}\n\n*Tid i markedet slår timing af markedet.*`,
	},
	{
		code: "video_reference",
		part: "article",
		article: appendToParagraph("Det forklarer videoen grundigt."),
	},
	{
		code: "video_reference",
		part: "analysis",
		analysis: analysisWith({
			summary: validAnalysis().summary.replace("Lave omkostninger", "Videoen viser, at lave"),
		}),
	},
	{
		code: "anonymous_creator",
		part: "article",
		article: appendToParagraph("Det mener skaberen også."),
	},
	{
		code: "anonymous_creator",
		part: "analysis",
		analysis: analysisWith({
			keyTakeaways: [
				"Skaberen anbefaler en fond med lave omkostninger og bred spredning.",
				...validAnalysis().keyTakeaways.slice(1),
			],
		}),
	},
	{
		code: "duplicate_text",
		part: "article",
		article: appendToParagraph(
			"Lave omkostninger og den rigtige kontotype afgør, hvor meget danske begyndere tjener.",
		),
	},
	{
		code: "duplicate_text",
		part: "analysis",
		analysis: analysisWith({ seoDescription: validAnalysis().summary }),
	},
	{
		code: "unsupported_year",
		part: "article",
		article: appendToParagraph("I 2019 faldt kurserne kraftigt."),
	},
	{
		code: "unsupported_year",
		part: "analysis",
		analysis: analysisWith({ seoTitle: "Indeksfonde i 2019: kom godt i gang" }),
	},
	{
		code: "summary_length",
		part: "analysis",
		analysis: analysisWith({ summary: "Indeksfonde er billige." }),
	},
	{
		code: "summary_sentences",
		part: "analysis",
		analysis: analysisWith({ summary: `${validAnalysis().summary} Den nævner også skat.` }),
	},
	{
		code: "key_takeaway_length",
		part: "analysis",
		analysis: analysisWith({
			keyTakeaways: ["Lave omkostninger.", ...validAnalysis().keyTakeaways.slice(1)],
		}),
	},
	{
		code: "faq_question_mark",
		part: "analysis",
		analysis: analysisWith({
			faq: faqWith(0, { question: "Hvad er en indeksfond? Og hvad koster den?" }),
		}),
	},
	{
		code: "faq_answer_length",
		part: "analysis",
		analysis: analysisWith({
			faq: faqWith(0, { answer: "Den er billig. Den er bred. Den er enkel. Den er populær." }),
		}),
	},
	{
		code: "faq_unanswered",
		part: "analysis",
		analysis: analysisWith({
			faq: faqWith(1, { answer: "Det fremgår ikke af videoen, hvad fonden koster." }),
		}),
	},
	{
		code: "seo_title_separator",
		part: "analysis",
		analysis: analysisWith({ seoTitle: "Indeksfonde for begyndere | Guide" }),
	},
	{
		code: "too_many_sections",
		part: "article",
		article: `${validArticle()}\n\n## Hvad med obligationer?\n\n${PARAGRAPH}\n\n## Hvad med kontanter?\n\n${ARTICLE_SECTIONS[1].paragraphs[0]}`,
	},
	{ code: "word_count", part: "article", article: SHORT_ARTICLE },
];

const config: LlmConfig = { provider: "claude", apiKey: "test-key", model: "claude-test" };
const PASS = { score: 8, danish: true, topicMatch: true, sourceSupported: true, reason: "Fin" };

function reply(text: string) {
	return new Response(
		JSON.stringify({
			content: [{ type: "text", text }],
			stop_reason: "end_turn",
			usage: { input_tokens: 1, output_tokens: 1 },
		}),
		{ status: 200 },
	);
}

/** Provider stub: the first answer of `badKind` is `bad`, every other answer is valid. */
function provider(badKind: "analysis" | "article" | "channel", bad: string) {
	const prompts: Array<{ kind: string; user: string }> = [];
	const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
		const body = JSON.parse(String(init.body));
		const schema = body.output_config?.format?.schema;
		const kind = schema?.properties?.score
			? "judge"
			: schema?.properties?.claims
				? "fact_check"
				: schema?.properties?.summary
					? "analysis"
					: badKind === "channel"
						? "channel"
						: "article";
		const user = String(body.messages[0].content);
		const first = !prompts.some((p) => p.kind === kind);
		prompts.push({ kind, user });
		if (kind === "judge") return reply(JSON.stringify(PASS));
		if (kind === "fact_check") return reply(passingFactCheck(user, schema));
		if (kind === badKind && first) return reply(bad);
		if (kind === "analysis") return reply(JSON.stringify(validAnalysis()));
		return reply(kind === "channel" ? validChannelDescription() : validArticle());
	});
	return { fetchImpl, prompts };
}

const source = {
	title: VIDEO_TITLE,
	description: "Om indeksfonde.",
	transcript: transcriptOfWords(400),
};

function context(fetchImpl: typeof fetch, log: (line: string) => void) {
	return {
		config,
		deadlineAt: 10 * 60_000,
		now: () => 0,
		llm: { fetchImpl },
		log,
		label: "parity",
	};
}

const baseVideo = {
	videoId: "vid1",
	slug: "saadan-investerer-du",
	channelId: "ch1",
	description: source.description,
	publishedAt: "2026-10-01T10:00:00Z",
	thumbnailUrl: "https://i.ytimg.com/x.jpg",
	durationSeconds: 600,
	title: VIDEO_TITLE,
	transcript: source.transcript,
};

describe.each(POST_CASES)("$code in the $part", (testCase) => {
	const bad = testCase.part === "analysis" ? JSON.stringify(testCase.analysis) : testCase.article;
	const analysis = testCase.part === "analysis" ? testCase.analysis : validAnalysis();
	const article = testCase.part === "article" ? testCase.article : validArticle();

	it("is fed back to the next generation attempt", async () => {
		const { fetchImpl, prompts } = provider(testCase.part, bad);
		const lines: string[] = [];
		const result = await generateVideoPost(
			source,
			"Kanal",
			context(fetchImpl as never, (line) => lines.push(line)),
		);
		expect(result).toMatchObject({ ok: true });
		const attempt = lines.find((line) => line.includes(`${testCase.part} attempt 1/3: issues=`));
		expect(attempt?.split("issues=")[1].split(",")).toContain(testCase.code);
		const retry = prompts.filter((p) => p.kind === testCase.part)[1];
		expect(retry.user).toContain("Dit forrige forsøg blev afvist");
	});

	it("is rejected by publishPost without changing the stored post", async () => {
		const t = newTest();
		await t.run((ctx) => ctx.db.insert("videos", { ...baseVideo, article: "gammel" }));
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: Date.now() + 60_000,
			videoId: "vid1",
			analysis,
			article,
		});
		expect(result).toMatchObject({ status: "invalid" });
		expect((result as { issues: string[] }).issues).toContain(testCase.code);
		const stored = await t.run((ctx) => ctx.db.query("videos").first());
		expect(stored?.article).toBe("gammel");
		expect(stored?.processedAt).toBeUndefined();
	});

	it("is reported by the audit of the stored post", async () => {
		const t = newTest();
		await t.run((ctx) =>
			ctx.db.insert("videos", { ...baseVideo, ...analysis, article, processedAt: 1 }),
		);
		const audit = await t.query(internal.videos.auditOne, { videoId: "vid1" });
		expect(audit).toMatchObject({ missing: false });
		const findings = (audit as { findings: Array<{ part: string; issues: string[] }> }).findings;
		expect(findings.find((f) => f.part === testCase.part)?.issues).toContain(testCase.code);
	});
});

const CHANNEL_CASES = [
	{
		code: "thought_dash",
		text: validChannelDescription().replace("og investering", "– og investering"),
	},
	{
		code: "ai_phrase",
		text: validChannelDescription().replace(
			"Udsendelserne følger",
			"Kort sagt følger udsendelserne",
		),
	},
	{
		code: "sentence_too_long",
		text: validChannelDescription().replace(
			"hver eneste uge.",
			"hver eneste uge, og den forklarer også roligt og grundigt, hvordan renter, skat og gebyrer påvirker afkastet for helt almindelige familier over mange år.",
		),
	},
];

describe.each(CHANNEL_CASES)("$code in the channel description", ({ code, text }) => {
	it("is fed back to the next generation attempt", async () => {
		const { fetchImpl, prompts } = provider("channel", text);
		const lines: string[] = [];
		const result = await generateChannelDescription(
			{ name: "Kanal" },
			[],
			context(fetchImpl as never, (line) => lines.push(line)),
		);
		expect(result).toMatchObject({ ok: true, attempts: 2 });
		const attempt = lines.find((line) => line.includes("description attempt 1/3: issues="));
		expect(attempt?.split("issues=")[1].split(",")).toContain(code);
		expect(prompts.filter((p) => p.kind === "channel")[1].user).toContain(
			"Dit forrige forsøg blev afvist",
		);
	});

	it("is rejected by publishAiDescription and reported by the channel audit", async () => {
		const t = newTest();
		const channel = { channelId: "ch1", name: "Kanal", uploadsPlaylistId: "UU1" };
		await t.run((ctx) => ctx.db.insert("channels", { ...channel, aiDescription: "gammel" }));
		const result = await t.mutation(internal.channels.publishAiDescription, {
			deadlineAt: Date.now() + 60_000,
			channelId: "ch1",
			aiDescription: text,
			expectedAiDescription: "gammel",
		});
		expect(result).toMatchObject({ status: "invalid" });
		expect((result as { issues: string[] }).issues).toContain(code);

		await t.run((ctx) =>
			ctx.db.insert("channels", { ...channel, channelId: "ch2", aiDescription: text }),
		);
		const page = await t.query(internal.channels.auditPage, {
			paginationOpts: { numItems: 10, cursor: null },
		});
		expect(page.failing.find((f) => f.id === "ch2")?.issues).toContain(code);
	});
});

describe("valid fixtures", () => {
	it("pass every rule in all three places", async () => {
		const { fetchImpl, prompts } = provider("article", validArticle());
		const result = await generateVideoPost(
			source,
			"Kanal",
			context(fetchImpl as never, () => {}),
		);
		expect(result).toMatchObject({ ok: true, attempts: { analysis: 1, article: 1 } });
		expect(prompts.map((p) => p.kind)).toEqual([
			"analysis",
			"fact_check",
			"judge",
			"article",
			"fact_check",
			"judge",
		]);
		const t = newTest();
		await t.run((ctx) => ctx.db.insert("videos", baseVideo));
		expect(
			await t.mutation(internal.videos.publishPost, {
				deadlineAt: Date.now() + 60_000,
				videoId: "vid1",
				analysis: validAnalysis(),
				article: validArticle(),
			}),
		).toEqual({ status: "published" });
		expect(await t.query(internal.videos.auditOne, { videoId: "vid1" })).toEqual({
			missing: false,
			findings: [],
		});
	});
});
