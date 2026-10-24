import { describe, expect, it, vi } from "vitest";
import type { VideoAnalysis } from "./contentRules";
import { FACT_CHUNK_CHARS } from "./factCheck";
import {
	passingFactCheck,
	transcriptOfWords,
	VIDEO_TITLE,
	validAnalysis,
	validArticle,
	validChannelDescription,
} from "./fixtures.testing";
import { MAX_ATTEMPTS } from "./generation";
import type { LlmConfig } from "./llm";
import {
	generateChannelDescription,
	generateVideoPost,
	maxLogicalCallsPerPost,
	maxPhysicalCallsPerPost,
} from "./videoPost";

const generator: LlmConfig = { provider: "claude", apiKey: "test-key", model: "claude-gen" };
const judge: LlmConfig = { provider: "claude", apiKey: "test-key", model: "claude-judge" };

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

describe("generateChannelDescription", () => {
	const verdict = {
		score: 8,
		danish: true,
		topicMatch: true,
		sourceSupported: true,
		reason: "Fin",
	};

	function run(judgeConfig?: LlmConfig) {
		const models: string[] = [];
		const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
			const body = JSON.parse(String(init.body));
			models.push(body.model);
			return reply(body.output_config.format ? JSON.stringify(verdict) : validChannelDescription());
		});
		const result = generateChannelDescription({ name: "Kanal" }, [], {
			config: generator,
			judgeConfig,
			deadlineAt: 10 * 60_000,
			now: () => 0,
			llm: { fetchImpl },
			log: () => {},
			label: "test",
		});
		return { result, models };
	}

	it("judges with the generator model by default", async () => {
		const { result, models } = run();
		expect(await result).toMatchObject({ ok: true });
		expect(models).toEqual(["claude-gen", "claude-gen"]);
	});

	it("judges with a separate judge model when one is given", async () => {
		const { result, models } = run(judge);
		expect(await result).toMatchObject({ ok: true });
		expect(models).toEqual(["claude-gen", "claude-judge"]);
	});
});

describe("generateVideoPost judge context", () => {
	const source = { title: VIDEO_TITLE, description: "Om indeksfonde.", transcript: undefined };
	const verdict = {
		score: 8,
		danish: true,
		topicMatch: true,
		sourceSupported: true,
		reason: "Fin",
	};

	function run(analysis: VideoAnalysis, article: string) {
		const judgePrompts: string[] = [];
		const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
			const body = JSON.parse(String(init.body));
			const schema = body.output_config?.format?.schema;
			if (schema?.properties?.score) {
				judgePrompts.push(String(body.messages[0].content));
				return reply(JSON.stringify(verdict));
			}
			if (schema?.properties?.claims) {
				return reply(passingFactCheck(String(body.messages[0].content), schema));
			}
			return reply(schema?.properties?.summary ? JSON.stringify(analysis) : article);
		});
		const result = generateVideoPost(source, "Kanal X", {
			config: generator,
			deadlineAt: 10 * 60_000,
			now: () => 0,
			llm: { fetchImpl },
			log: () => {},
			label: "test",
		});
		return { result, judgePrompts };
	}

	it("gives the article judge the summary, SEO description and key takeaways", async () => {
		// A paraphrase of the summary: no shared run of eight words, so only the judge can see it.
		const paraphrase = validArticle().replace(
			"Et eksempel gør det tydeligt.",
			"Billige fonde og den rette konto bestemmer udbyttet for nye investorer. Et eksempel gør det tydeligt.",
		);
		const { result, judgePrompts } = run(validAnalysis(), paraphrase);
		expect(await result).toMatchObject({ ok: true, attempts: { analysis: 1, article: 1 } });
		const [analysisJudge, articleJudge] = judgePrompts;
		expect(analysisJudge).toContain("Kanal: Kanal X");
		expect(analysisJudge).not.toContain("Vises allerede på siden");
		expect(articleJudge).toContain("Vises allerede på siden");
		expect(articleJudge).toContain(`Kortbeskrivelse: ${validAnalysis().summary}`);
		expect(articleJudge).toContain(`SEO-beskrivelse: ${validAnalysis().seoDescription}`);
		expect(articleJudge).toContain(`- ${validAnalysis().keyTakeaways[0]}`);
		expect(articleJudge).toContain("Billige fonde og den rette konto");
	});

	it("lists rule warnings for the judge to weigh in context", async () => {
		const analysis = {
			...validAnalysis(),
			keyTakeaways: [
				"Lave omkostninger er afgørende for afkastet over tyve år.",
				"En lang horisont er afgørende, når markedet falder kraftigt.",
				...validAnalysis().keyTakeaways.slice(2),
			],
		};
		const { result, judgePrompts } = run(analysis, validArticle());
		expect(await result).toMatchObject({ ok: true });
		expect(judgePrompts[0]).toContain("Automatiske advarsler");
		expect(judgePrompts[0]).toContain('"afgørende" 2 gange');
		expect(judgePrompts[1]).not.toContain("Automatiske advarsler");
	});
});

describe("generateVideoPost fact-check", () => {
	const verdict = {
		score: 8,
		danish: true,
		topicMatch: true,
		sourceSupported: true,
		reason: "Fin",
	};
	const transcriptText = (words: number) =>
		transcriptOfWords(words)
			.map((s) => s.text)
			.join(" ");

	type Kind = "analysis" | "article" | "judge" | "fact_check" | "fact_recheck";

	/** Records every request; `facts` overrides the fact-check answer for a given call index. */
	function provider(
		options: {
			facts?: (user: string, schema: Record<string, unknown>, index: number) => unknown;
			verdicts?: Array<typeof verdict>;
		} = {},
	) {
		const calls: Array<{ kind: Kind; model: string; user: string }> = [];
		const verdicts = [...(options.verdicts ?? [])];
		const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
			const body = JSON.parse(String(init.body));
			const schema = body.output_config?.format?.schema;
			const user = String(body.messages[0].content);
			const kind: Kind = schema?.properties?.score
				? "judge"
				: schema?.properties?.segments
					? "fact_check"
					: schema?.properties?.claims
						? "fact_recheck"
						: schema?.properties?.summary
							? "analysis"
							: "article";
			calls.push({ kind, model: body.model, user });
			if (kind === "judge") return reply(JSON.stringify(verdicts.shift() ?? verdict));
			if (kind === "fact_check" || kind === "fact_recheck") {
				const index = calls.filter((c) => c.kind === kind).length - 1;
				const custom = options.facts?.(user, schema, index);
				return reply(custom ? JSON.stringify(custom) : passingFactCheck(user, schema));
			}
			return reply(kind === "analysis" ? JSON.stringify(validAnalysis()) : validArticle());
		});
		return { fetchImpl, calls };
	}

	function context(
		fetchImpl: typeof fetch,
		extra: { judgeConfig?: LlmConfig; log?: (l: string) => void } = {},
	) {
		return {
			config: generator,
			deadlineAt: 10 * 60_000,
			now: () => 0,
			llm: { fetchImpl },
			log: extra.log ?? (() => {}),
			label: "test",
			judgeConfig: extra.judgeConfig,
		};
	}

	const video = (words = 400) => ({
		title: VIDEO_TITLE,
		description: "Om indeksfonde.",
		transcript: transcriptOfWords(words),
	});

	it("fact-checks each part after its rules and before its judge, with the judge model", async () => {
		const { fetchImpl, calls } = provider();
		const result = await generateVideoPost(
			video(),
			"Kanal",
			context(fetchImpl as never, { judgeConfig: judge }),
		);
		expect(result).toMatchObject({ ok: true, attempts: { analysis: 1, article: 1 } });
		expect(calls.map((c) => [c.kind, c.model])).toEqual([
			["analysis", "claude-gen"],
			["fact_check", "claude-judge"],
			["judge", "claude-judge"],
			["article", "claude-gen"],
			["fact_check", "claude-judge"],
			["judge", "claude-judge"],
		]);
		const [analysisCheck, articleCheck] = calls.filter((c) => c.kind === "fact_check");
		expect(analysisCheck.user).toContain("[summary] ");
		expect(analysisCheck.user).toContain("[faq.0.answer] ");
		expect(articleCheck.user).toContain("[s1] Hvad koster en indeksfond om året?");
		expect(articleCheck.user).toContain("Transskription, del 1 af 1");
	});

	it("uses the generator as checker when no judge model is set and lists verified claims for the judge", async () => {
		const { fetchImpl, calls } = provider();
		await generateVideoPost(video(), "Kanal", context(fetchImpl as never));
		expect(calls.filter((c) => c.kind === "fact_check").map((c) => c.model)).toEqual([
			"claude-gen",
			"claude-gen",
		]);
		const articleJudge = calls.filter((c) => c.kind === "judge")[1];
		expect(articleJudge.user).toContain("Påstande bekræftet af faktatjekket");
		expect(articleJudge.user).toContain("- Hvad koster en indeksfond om året?");
	});

	it("keeps transcript text out of feedback and logs when a claim is contradicted", async () => {
		const sentinel = "SENTINEL-KILDE-TEKST";
		const transcript = [
			...transcriptOfWords(400),
			{ text: `${sentinel} siger noget andet`, offset: 0, duration: 1 },
		];
		const { fetchImpl, calls } = provider({
			facts: (user, schema, index) => {
				if (index !== 0) return undefined;
				const passing = JSON.parse(passingFactCheck(user, schema));
				passing.claims[0] = {
					...passing.claims[0],
					status: "contradicted",
					evidenceQuote: `${sentinel} siger noget andet`,
				};
				return passing;
			},
		});
		const lines: string[] = [];
		const result = await generateVideoPost(
			{ ...video(), transcript },
			"Kanal",
			context(fetchImpl as never, { log: (line) => lines.push(line) }),
		);
		expect(result).toMatchObject({ ok: true, attempts: { analysis: 2, article: 1 } });
		const retry = calls.filter((c) => c.kind === "analysis")[1].user;
		const feedback = retry.slice(retry.indexOf("Dit forrige forsøg"));
		expect(feedback).toContain("Disse påstande strider mod kilden");
		expect(feedback).not.toContain(sentinel);
		expect(lines.join("\n")).toContain("fact-check issues=fact_contradicted");
		expect(lines.join("\n")).not.toContain(sentinel);
	});

	it("checks long transcripts chunk by chunk", async () => {
		const words = Math.ceil((FACT_CHUNK_CHARS * 1.5) / "investering ".length);
		expect(transcriptText(words).length).toBeGreaterThan(FACT_CHUNK_CHARS);
		const { fetchImpl, calls } = provider();
		const result = await generateVideoPost(video(words), "Kanal", context(fetchImpl as never));
		expect(result).toMatchObject({ ok: true });
		expect(calls.map((c) => c.kind)).toEqual([
			"analysis",
			"fact_check",
			"fact_recheck",
			"judge",
			"article",
			"fact_check",
			"fact_recheck",
			"judge",
		]);
	});

	it("bounds the calls per post at 6C + 12 logical and 3x that physical", async () => {
		expect(maxLogicalCallsPerPost(1)).toBe(18);
		expect(maxLogicalCallsPerPost(2)).toBe(24);
		expect(maxLogicalCallsPerPost(3)).toBe(2 * MAX_ATTEMPTS * (2 + 3));
		expect(maxPhysicalCallsPerPost(2)).toBe(72);
		// Worst case: the analysis passes on its last attempt and the article never passes.
		const words = Math.ceil((FACT_CHUNK_CHARS * 1.5) / "investering ".length);
		const low = { ...verdict, score: 3 };
		const { fetchImpl, calls } = provider({ verdicts: [low, low, verdict, low, low, low] });
		const result = await generateVideoPost(video(words), "Kanal", context(fetchImpl as never));
		expect(result).toMatchObject({
			ok: false,
			part: "article",
			attempts: { analysis: 3, article: 3 },
		});
		expect(calls).toHaveLength(maxLogicalCallsPerPost(2));
	});

	it("does not fact-check the channel description", async () => {
		const kinds: string[] = [];
		const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
			const body = JSON.parse(String(init.body));
			const schema = body.output_config?.format?.schema;
			kinds.push(schema?.properties?.claims ? "fact" : schema ? "judge" : "channel");
			return reply(schema ? JSON.stringify(verdict) : validChannelDescription());
		});
		await generateChannelDescription({ name: "Kanal" }, [], context(fetchImpl as never));
		expect(kinds).toEqual(["channel", "judge"]);
	});
});
