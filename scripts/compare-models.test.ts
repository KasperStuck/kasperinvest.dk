import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validAnalysis, validArticle } from "../convex/lib/fixtures.testing";
import { completeText } from "../convex/lib/llm";
import { PRICING_SOURCE } from "../convex/lib/pricing";
import {
	aggregateRanks,
	anonymize,
	callBounds,
	checkBudget,
	createSpendGuard,
	createUsageMeter,
	DEFAULT_JUDGE_MODEL,
	DEFAULT_MODELS,
	judgeSelfWarning,
	parseArgs,
	type RunRecord,
	rankArticles,
	renderReport,
	requirePrices,
	SpendCapError,
} from "./compare-models";
import { renderVisiblePost } from "./content-sample";

beforeEach(() => {
	vi.stubGlobal("fetch", () => {
		throw new Error("real fetch must not be used in tests");
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("parseArgs", () => {
	it("parses slugs, models, flags and output directory", () => {
		expect(
			parseArgs([
				"--slugs",
				"a,b , c",
				"--models",
				"claude-haiku-5-5,claude-opus-5-5",
				"--include-openrouter",
				"--out",
				"/tmp/x",
				"--judge-model",
				"claude-sonnet-5-5",
				"--max-usd",
				"2.5",
				"--yes",
			]),
		).toEqual({
			slugs: ["a", "b", "c"],
			models: ["claude-haiku-5-5", "claude-opus-5-5"],
			judgeModel: "claude-sonnet-5-5",
			includeOpenRouter: true,
			outDir: "/tmp/x",
			maxUsd: 2.5,
			yes: true,
		});
	});

	it("defaults to the three Claude 5.5 models", () => {
		expect(parseArgs(["--slugs", "a", "--max-usd", "1"])).toEqual({
			slugs: ["a"],
			models: DEFAULT_MODELS,
			judgeModel: DEFAULT_JUDGE_MODEL,
			includeOpenRouter: false,
			outDir: undefined,
			maxUsd: 1,
			yes: false,
		});
		expect(DEFAULT_MODELS).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"]);
		expect(DEFAULT_JUDGE_MODEL).toBe("claude-opus-5-5");
	});

	it("rejects missing slugs and unknown flags", () => {
		expect(() => parseArgs(["--max-usd", "1"])).toThrow(/--slugs/);
		expect(() => parseArgs(["--max-usd", "1", "--slugs"])).toThrow(/--slugs/);
		expect(() => parseArgs(["--slugs", "a", "--max-usd", "1", "--fast"])).toThrow(/--fast/);
		expect(() => parseArgs(["--slugs", "a", "--max-usd", "1", "--judge-model"])).toThrow(
			/--judge-model/,
		);
	});

	it("requires a positive --max-usd", () => {
		expect(() => parseArgs(["--slugs", "a"])).toThrow(/--max-usd is required/);
		for (const value of ["0", "-1", "abc", "Infinity"]) {
			expect(() => parseArgs(["--slugs", "a", "--max-usd", value]), value).toThrow(/--max-usd/);
		}
		expect(() => parseArgs(["--slugs", "a", "--max-usd"])).toThrow(/--max-usd/);
	});
});

describe("budget guard", () => {
	it("bounds the provider calls per post from each transcript's fact-check chunks", () => {
		// Per post 6C + 12 logical calls; one ranking call per evaluator and slug; 3 tries each.
		expect(callBounds({ chunksPerSlug: [1, 2], generators: 3, evaluators: 3 })).toEqual({
			logical: 3 * 18 + 3 * 24 + 2 * 3,
			physical: 3 * 18 * 3 + 3 * 24 * 3 + 2 * 3 * 3,
		});
	});

	it("refuses more than 5 slugs or 4 models without --yes", () => {
		const six = ["1", "2", "3", "4", "5", "6"];
		expect(() => checkBudget({ slugs: six, generators: 3, yes: false })).toThrow(/--yes/);
		expect(() => checkBudget({ slugs: ["a"], generators: 5, yes: false })).toThrow(/--yes/);
		expect(() => checkBudget({ slugs: six, generators: 5, yes: true })).not.toThrow();
		expect(() =>
			checkBudget({ slugs: ["1", "2", "3", "4", "5"], generators: 4, yes: false }),
		).not.toThrow();
	});

	it("refuses models without a list price, because --max-usd cannot bound them", () => {
		expect(() => requirePrices(["claude-sonnet-5-5", "claude-opus-5-5"])).not.toThrow();
		expect(() => requirePrices(["claude-sonnet-5-5", "openrouter:x"])).toThrow(
			/openrouter:x has no list price/,
		);
	});
});

describe("createSpendGuard", () => {
	const request = {
		provider: "claude" as const,
		model: "claude-sonnet-5-5",
		promptChars: 4_000,
		maxOutputTokens: 16_000,
	};
	// The full 1M context window at $2 plus 16,000 output tokens at $10 per million.
	const estimate = 2.16;

	it("aborts before a request whose reservation could exceed the cap", () => {
		const guard = createSpendGuard(3);
		guard.beforeRequest(request);
		expect(guard.spentUsd()).toBeCloseTo(estimate);
		expect(() => guard.beforeRequest(request)).toThrow(SpendCapError);
		expect(() => guard.beforeRequest(request)).toThrow(/--max-usd 3/);
	});

	it("replaces the reservation with the actual usage", () => {
		const guard = createSpendGuard(3);
		guard.beforeRequest(request);
		guard.onUsage({
			provider: "claude",
			model: "claude-sonnet-5-5",
			inputTokens: 1_000,
			outputTokens: 1_000,
		});
		expect(guard.spentUsd()).toBeCloseTo(0.012);
		guard.beforeRequest(request);
		expect(guard.spentUsd()).toBeCloseTo(0.012 + estimate);
	});

	it("keeps the reservation of a request that reported no usage", () => {
		const guard = createSpendGuard(5);
		guard.beforeRequest(request);
		guard.beforeRequest(request);
		guard.onUsage({
			provider: "claude",
			model: "claude-sonnet-5-5",
			inputTokens: 1_000,
			outputTokens: 1_000,
		});
		expect(guard.spentUsd()).toBeCloseTo(estimate + 0.012);
	});

	it("refuses the review's overspend probe before sending", () => {
		expect(() => createSpendGuard(0.164).beforeRequest(request)).toThrow(SpendCapError);
	});

	it("does not release reservations for missing, invalid, zero or mismatched usage", () => {
		for (const usage of [
			{ inputTokens: 1_000, outputTokens: 0 },
			{ inputTokens: 0, outputTokens: 1_000 },
			{ inputTokens: -1, outputTokens: 1_000 },
			{ inputTokens: 1.5, outputTokens: 1_000 },
			{ inputTokens: Number.NaN, outputTokens: 1_000 },
		]) {
			const guard = createSpendGuard(3);
			guard.beforeRequest(request);
			guard.onUsage({ provider: "claude", model: request.model, ...usage });
			expect(guard.spentUsd()).toBeCloseTo(estimate);
		}
		const guard = createSpendGuard(3);
		guard.beforeRequest(request);
		guard.onUsage({
			provider: "claude",
			model: "claude-haiku-5-5",
			inputTokens: 1,
			outputTokens: 1,
		});
		expect(guard.spentUsd()).toBeCloseTo(estimate);
	});

	it("refuses unsupported providers even when the model name has a list price", () => {
		expect(() => createSpendGuard(3).beforeRequest({ ...request, provider: "openrouter" })).toThrow(
			SpendCapError,
		);
	});

	it("reserves each physical retry and stops unsent when ambiguous requests fill the cap", async () => {
		const guard = createSpendGuard(5);
		const fetchImpl = vi.fn(async () => {
			throw new TypeError("connection lost after send");
		});
		await expect(
			completeText(
				{ provider: "claude", model: request.model, apiKey: "test-key" },
				{ system: "Dansk tekst", user: "漢字🦆".repeat(1_000) },
				{ ...guard, fetchImpl, sleep: async () => {}, log: () => {} },
			),
		).rejects.toBeInstanceOf(SpendCapError);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(guard.spentUsd()).toBeCloseTo(estimate * 2);
	});

	it("refuses an unpriced model", () => {
		expect(() => createSpendGuard(1).beforeRequest({ ...request, model: "or-model" })).toThrow(
			SpendCapError,
		);
	});
});

describe("createUsageMeter", () => {
	it("reads prices from the shared table", () => {
		expect(PRICING_SOURCE).toBe("https://platform.claude.com/docs/en/about-claude/pricing");
	});

	it("prices generator and judge calls each at their own model", () => {
		const meter = createUsageMeter();
		meter.add({ model: "claude-sonnet-5-5", inputTokens: 1_000_000, outputTokens: 0 });
		meter.add({ model: "claude-opus-5-5", inputTokens: 0, outputTokens: 100_000 });
		expect(meter.usage).toEqual({ inputTokens: 1_000_000, outputTokens: 100_000 });
		expect(meter.costUsd()).toBeCloseTo(2 + 2);
		meter.add({ model: "or-model", inputTokens: 1, outputTokens: 1 });
		expect(meter.costUsd()).toBeNull();
	});
});

describe("anonymize and aggregateRanks", () => {
	it("labels items in shuffled order and keeps the mapping", () => {
		const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0);
		const { labeled, mapping } = anonymize(["m1", "m2", "m3"], random);
		expect(labeled.map((l) => l.label)).toEqual(["A", "B", "C"]);
		expect(new Set(labeled.map((l) => l.item))).toEqual(new Set(["m1", "m2", "m3"]));
		expect(labeled.map((l) => l.item)).not.toEqual(["m1", "m2", "m3"]);
		for (const { label, item } of labeled) expect(mapping[label]).toBe(item);
	});

	it("excludes each evaluator's own article from the mean rank", () => {
		const mapping = { A: "m1", B: "m2", C: "m3" };
		const result = aggregateRanks([
			{ evaluator: "m1", mapping, ranks: { A: 1, B: 2, C: 3 } },
			{ evaluator: "m2", mapping, ranks: { A: 3, B: 1, C: 2 } },
			{ evaluator: "m1", mapping: { A: "m3", B: "m2", C: "m1" }, ranks: { A: 1, B: 3, C: 2 } },
		]);
		expect(result.m1).toEqual({ meanRank: 3, count: 1, byEvaluator: { m1: 1.5, m2: 3 } });
		expect(result.m2).toEqual({ meanRank: 2.5, count: 2, byEvaluator: { m1: 2.5, m2: 1 } });
		expect(result.m3).toEqual({ meanRank: 2, count: 3, byEvaluator: { m1: 2, m2: 2 } });
	});

	it("reports no mean rank when only the model itself ranked its article", () => {
		const result = aggregateRanks([
			{ evaluator: "m1", mapping: { A: "m1", B: "m2" }, ranks: { A: 1, B: 2 } },
		]);
		expect(result.m1).toEqual({ meanRank: null, count: 0, byEvaluator: { m1: 1 } });
	});
});

describe("rankArticles", () => {
	const config = { provider: "claude" as const, apiKey: "k", model: "claude-opus-5-5" };
	const labeled = [
		{ label: "A", item: "Artikel A." },
		{ label: "B", item: "Artikel B." },
	];

	function rankingResponse(rankings: unknown) {
		return new Response(
			JSON.stringify({
				content: [{ type: "text", text: JSON.stringify({ rankings }) }],
				stop_reason: "end_turn",
				usage: { input_tokens: 100, output_tokens: 10 },
			}),
			{ status: 200 },
		);
	}

	it("ranks whole posts: summary, key takeaways, article and FAQ", async () => {
		const fetchImpl = vi.fn(async (_url: string, _init: RequestInit) =>
			rankingResponse([
				{ label: "A", rank: 1, reason: "Bedst." },
				{ label: "B", rank: 2, reason: "Næstbedst." },
			]),
		);
		const post = renderVisiblePost(validAnalysis(), validArticle());
		await rankArticles(
			config,
			"Titel",
			[
				{ label: "A", item: post },
				{ label: "B", item: "Indlæg B." },
			],
			{ fetchImpl, log: () => {} },
		);
		const body = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
		expect(body.system).toMatch(/kortbeskrivelse, hovedpointer, artikel og FAQ/);
		expect(body.messages[0].content).toContain('<indlæg etiket="A">');
		expect(body.messages[0].content).toContain(validAnalysis().summary);
		expect(body.messages[0].content).toContain(validAnalysis().faq[0].question);
		expect(body.messages[0].content).toContain("## Hovedpointer");
	});

	it("asks the model for a blind ranking and returns ranks per label", async () => {
		const fetchImpl = vi.fn(async (_url: string, _init: RequestInit) =>
			rankingResponse([
				{ label: "B", rank: 1, reason: "Mest naturligt dansk." },
				{ label: "A", rank: 2, reason: "Anglicismer." },
			]),
		);
		const result = await rankArticles(config, "Titel", labeled, { fetchImpl, log: () => {} });
		expect(result).toMatchObject({ ok: true, ranks: { A: 2, B: 1 } });
		expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 10 });
		const body = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
		expect(body.model).toBe("claude-opus-5-5");
		expect(body.messages[0].content).toContain("Artikel B.");
		expect(body.messages[0].content).not.toContain("claude");
	});

	it("lets the spend cap abort the run instead of recording a failed ranking", async () => {
		const fetchImpl = vi.fn(async () => rankingResponse([]));
		await expect(
			rankArticles(config, "Titel", labeled, {
				fetchImpl,
				log: () => {},
				beforeRequest: () => {
					throw new SpendCapError("cap");
				},
			}),
		).rejects.toBeInstanceOf(SpendCapError);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("rejects a ranking that is not a permutation of the labels", async () => {
		const fetchImpl = vi.fn(async () =>
			rankingResponse([
				{ label: "A", rank: 1, reason: "x" },
				{ label: "B", rank: 1, reason: "y" },
			]),
		);
		const result = await rankArticles(config, "Titel", labeled, { fetchImpl, log: () => {} });
		expect(result).toMatchObject({ ok: false });
	});
});

describe("renderReport", () => {
	it("renders a summary table and the articles by label only", () => {
		const runs: RunRecord[] = [
			{
				slug: "s",
				model: "claude-sonnet-5-5",
				status: "passed",
				attempts: { analysis: 1, article: 2 },
				issues: [],
				inputTokens: 1000,
				outputTokens: 500,
				costUsd: 0.007,
				latencyMs: 12_000,
				article: "Tekst fra sonnet.",
			},
			{
				slug: "s",
				model: "claude-haiku-5-5",
				status: "failed",
				attempts: { analysis: 3 },
				issues: ["seo_title_length"],
				inputTokens: 2000,
				outputTokens: 800,
				costUsd: 0.0006,
				latencyMs: 8_000,
			},
		];
		runs.push(
			{
				slug: "t",
				model: "claude-haiku-5-5",
				status: "error",
				attempts: {},
				issues: [],
				inputTokens: 100,
				outputTokens: 0,
				costUsd: 0.0002,
				latencyMs: 2_000,
				error: "claude HTTP 529",
			},
			{
				slug: "u",
				model: "claude-haiku-5-5",
				status: "insufficient_source",
				attempts: {},
				issues: [],
				inputTokens: 0,
				outputTokens: 0,
				costUsd: 0,
				latencyMs: 0,
			},
		);
		const report = renderReport({
			runs,
			judgeModel: "claude-opus-5-5",
			meanRanks: {
				"claude-sonnet-5-5": {
					meanRank: 1,
					count: 2,
					byEvaluator: { "claude-sonnet-5-5": 1, "claude-haiku-5-5": 1 },
				},
			},
			blind: [
				{
					slug: "s",
					labeled: [
						{
							label: "A",
							item: renderVisiblePost(validAnalysis(), "Tekst fra sonnet."),
							warnings: ["ai_word_overuse"],
						},
					],
				},
			],
		});
		expect(report).toContain(
			"| Model | Pass rate | Errors | Mean attempts | Mean cost per post (USD) | Mean latency (s) | Mean blind Danish rank (excl. own) |",
		);
		expect(report).toContain("| claude-sonnet-5-5 | 1/1 | 0 | 3.0 | 0.0070 | 12.0 | 1.00 |");
		// The error counts as a run that did not pass; the skipped video is not a run.
		expect(report).toContain("| claude-haiku-5-5 | 0/2 | 1 | 3.0 | 0.0004 | 5.0 | - |");
		expect(report).toContain("| Generator | claude-haiku-5-5 | claude-sonnet-5-5 |");
		expect(report).toContain("| claude-sonnet-5-5 | 1.00 | 1.00 |");
		expect(report).toContain("Judge and fact-check model for every generator: claude-opus-5-5");
		expect(report).toContain("### Indlæg A");
		expect(report).toContain("Tekst fra sonnet.");
		expect(report).toContain(validAnalysis().summary);
		expect(report).toContain(validAnalysis().faq[0].answer);
		expect(report).toContain("Regeladvarsler: ai_word_overuse");
		expect(report).toContain(PRICING_SOURCE);
		const articles = report.slice(report.indexOf("### Indlæg A"));
		expect(articles).not.toContain("claude-sonnet-5-5");
		expect(report).toContain("# Posts (blind)");
		// The judge did not generate here, so there is no self-judging note.
		expect(report).not.toContain("judged its own output");
	});

	it("marks under the table that the judge also generated", () => {
		const run: RunRecord = {
			slug: "s",
			model: "claude-opus-5-5",
			status: "passed",
			attempts: { analysis: 1, article: 1 },
			issues: [],
			inputTokens: 1,
			outputTokens: 1,
			costUsd: 0,
			latencyMs: 1,
		};
		const report = renderReport({
			runs: [run],
			judgeModel: "claude-opus-5-5",
			meanRanks: {},
			blind: [],
		});
		const paragraphs = report.split("\n\n");
		expect(paragraphs[1]).toContain("| claude-opus-5-5 |");
		expect(paragraphs[2]).toBe(judgeSelfWarning("claude-opus-5-5", ["claude-opus-5-5"]));
	});
});

describe("judgeSelfWarning", () => {
	it("warns only when the judge model is also a generator", () => {
		expect(judgeSelfWarning(DEFAULT_JUDGE_MODEL, DEFAULT_MODELS)).toBe(
			"Warning: judge model claude-opus-5-5 is also a generator, so it judged its own output.",
		);
		expect(
			judgeSelfWarning("claude-opus-5-5", ["claude-haiku-5-5", "claude-sonnet-5-5"]),
		).toBeUndefined();
	});
});
