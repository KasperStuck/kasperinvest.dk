import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	aggregateRanks,
	anonymize,
	checkBudget,
	computeCost,
	createUsageMeter,
	DEFAULT_JUDGE_MODEL,
	DEFAULT_MODELS,
	judgeSelfWarning,
	maxProviderCalls,
	PRICING_SOURCE,
	parseArgs,
	type RunRecord,
	rankArticles,
	renderReport,
} from "./compare-models";

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
				"--yes",
			]),
		).toEqual({
			slugs: ["a", "b", "c"],
			models: ["claude-haiku-5-5", "claude-opus-5-5"],
			judgeModel: "claude-sonnet-5-5",
			includeOpenRouter: true,
			outDir: "/tmp/x",
			yes: true,
		});
	});

	it("defaults to the three Claude 5.5 models", () => {
		expect(parseArgs(["--slugs", "a"])).toEqual({
			slugs: ["a"],
			models: DEFAULT_MODELS,
			judgeModel: DEFAULT_JUDGE_MODEL,
			includeOpenRouter: false,
			outDir: undefined,
			yes: false,
		});
		expect(DEFAULT_MODELS).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"]);
		expect(DEFAULT_JUDGE_MODEL).toBe("claude-opus-5-5");
	});

	it("rejects missing slugs and unknown flags", () => {
		expect(() => parseArgs([])).toThrow(/--slugs/);
		expect(() => parseArgs(["--slugs"])).toThrow(/--slugs/);
		expect(() => parseArgs(["--slugs", "a", "--fast"])).toThrow(/--fast/);
		expect(() => parseArgs(["--slugs", "a", "--judge-model"])).toThrow(/--judge-model/);
	});
});

describe("budget guard", () => {
	it("counts the configured maximum of provider calls", () => {
		// 2 slugs × 3 generators × 2 parts × 3 attempts × 2 calls + 2 slugs × 3 evaluators
		expect(maxProviderCalls({ slugs: 2, generators: 3, evaluators: 3 })).toBe(78);
	});

	it("refuses more than 5 slugs or 4 models without --yes", () => {
		const six = ["1", "2", "3", "4", "5", "6"];
		expect(() => checkBudget({ slugs: six, generators: 3, evaluators: 3, yes: false })).toThrow(
			/--yes/,
		);
		expect(() => checkBudget({ slugs: ["a"], generators: 5, evaluators: 4, yes: false })).toThrow(
			/--yes/,
		);
		expect(checkBudget({ slugs: six, generators: 5, evaluators: 4, yes: true }).maxCalls).toBe(
			6 * 5 * 12 + 6 * 4,
		);
		expect(
			checkBudget({ slugs: ["1", "2", "3", "4", "5"], generators: 4, evaluators: 3, yes: false })
				.maxCalls,
		).toBe(5 * 4 * 12 + 5 * 3);
	});
});

describe("computeCost", () => {
	it("prices tokens per million from the table", () => {
		expect(PRICING_SOURCE).toBe("https://platform.claude.com/docs/en/about-claude/pricing");
		expect(
			computeCost("claude-sonnet-5-5", { inputTokens: 1_000_000, outputTokens: 100_000 }),
		).toBeCloseTo(3);
		expect(
			computeCost("claude-opus-5-5", { inputTokens: 500_000, outputTokens: 50_000 }),
		).toBeCloseTo(3);
		expect(
			computeCost("claude-haiku-5-5", { inputTokens: 1_000_000, outputTokens: 1_000_000 }),
		).toBeCloseTo(0.6);
	});

	it("returns null for a model without a known price", () => {
		expect(computeCost("openrouter:x", { inputTokens: 1, outputTokens: 1 })).toBeNull();
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
			blind: [{ slug: "s", labeled: [{ label: "A", item: "Tekst fra sonnet." }] }],
		});
		expect(report).toContain(
			"| Model | Pass rate | Errors | Mean attempts | Mean cost per post (USD) | Mean latency (s) | Mean blind Danish rank (excl. own) |",
		);
		expect(report).toContain("| claude-sonnet-5-5 | 1/1 | 0 | 3.0 | 0.0070 | 12.0 | 1.00 |");
		// The error counts as a run that did not pass; the skipped video is not a run.
		expect(report).toContain("| claude-haiku-5-5 | 0/2 | 1 | 3.0 | 0.0004 | 5.0 | - |");
		expect(report).toContain("| Generator | claude-haiku-5-5 | claude-sonnet-5-5 |");
		expect(report).toContain("| claude-sonnet-5-5 | 1.00 | 1.00 |");
		expect(report).toContain("Judge for every generator: claude-opus-5-5");
		expect(report).toContain("### Artikel A");
		expect(report).toContain("Tekst fra sonnet.");
		expect(report).toContain(PRICING_SOURCE);
		const articles = report.slice(report.indexOf("### Artikel A"));
		expect(articles).not.toContain("claude-sonnet-5-5");
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
