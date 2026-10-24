import { describe, expect, it } from "vitest";
import {
	computeCost,
	isPriced,
	PRICES_PER_MTOK,
	PRICING_SOURCE,
	requestCostBound,
} from "./pricing";

describe("pricing", () => {
	it("lists the Claude 5.5 list prices from the pricing page", () => {
		expect(PRICING_SOURCE).toBe("https://platform.claude.com/docs/en/about-claude/pricing");
		expect(PRICES_PER_MTOK["claude-sonnet-5-5"]).toEqual({ input: 2, output: 10 });
		expect(PRICES_PER_MTOK["claude-opus-5-5"]).toEqual({ input: 4, output: 20 });
		expect(PRICES_PER_MTOK["claude-haiku-5-5"]).toEqual({
			input: 0.1,
			output: 0.5,
			longPrompt: { overInputTokens: 100_000, input: 0.5, output: 2.5 },
		});
		expect(isPriced("claude-opus-5-5")).toBe(true);
		expect(isPriced("openrouter:x")).toBe(false);
		expect(isPriced("toString")).toBe(false);
	});

	it("prices one request per million tokens", () => {
		expect(
			computeCost("claude-sonnet-5-5", { inputTokens: 1_000_000, outputTokens: 100_000 }),
		).toBeCloseTo(3);
		expect(
			computeCost("claude-opus-5-5", { inputTokens: 500_000, outputTokens: 50_000 }),
		).toBeCloseTo(3);
		expect(computeCost("openrouter:x", { inputTokens: 1, outputTokens: 1 })).toBeNull();
	});

	it("prices a Haiku 5.5 request over 100,000 prompt tokens at the higher tier", () => {
		expect(
			computeCost("claude-haiku-5-5", { inputTokens: 100_000, outputTokens: 1_000_000 }),
		).toBeCloseTo(0.01 + 0.5);
		expect(
			computeCost("claude-haiku-5-5", { inputTokens: 100_001, outputTokens: 1_000_000 }),
		).toBeCloseTo((100_001 * 0.5) / 1_000_000 + 2.5);
	});

	it("reserves the full context window including schema and provider overhead, plus max output", () => {
		expect(
			requestCostBound("claude-sonnet-5-5", { promptChars: 4_000, maxOutputTokens: 16_000 }),
		).toBeCloseTo((1_000_000 * 2 + 16_000 * 10) / 1_000_000);
		expect(
			requestCostBound("claude-sonnet-5-5", { promptChars: 4_001, maxOutputTokens: 0 }),
		).toBeCloseTo(2);
		expect(requestCostBound("x", { promptChars: 1, maxOutputTokens: 1 })).toBeNull();
	});

	it("uses Haiku's highest possible tier and refuses invalid output limits", () => {
		expect(
			requestCostBound("claude-haiku-5-5", { promptChars: 1, maxOutputTokens: 16_000 }),
		).toBeCloseTo(0.54);
		for (const maxOutputTokens of [-1, Number.NaN, Number.POSITIVE_INFINITY, 128_001]) {
			expect(requestCostBound("claude-sonnet-5-5", { promptChars: 1, maxOutputTokens })).toBeNull();
		}
	});
});
