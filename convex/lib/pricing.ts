/**
 * Claude list prices in USD per million tokens, for cost reports and the compare-models spend
 * cap. Thinking tokens are billed as output. Source (checked 2026-10-24): PRICING_SOURCE.
 */
import type { LlmUsage } from "./llm";

export const PRICING_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";

type Price = {
	input: number;
	output: number;
	/** A request with more prompt tokens than this pays these prices instead. */
	longPrompt?: { overInputTokens: number; input: number; output: number };
};

export const PRICES_PER_MTOK: Record<string, Price> = {
	"claude-haiku-5-5": {
		input: 0.1,
		output: 0.5,
		longPrompt: { overInputTokens: 100_000, input: 0.5, output: 2.5 },
	},
	"claude-sonnet-5-5": { input: 2, output: 10 },
	"claude-opus-5-5": { input: 4, output: 20 },
};

export function isPriced(model: string): boolean {
	return Object.keys(PRICES_PER_MTOK).includes(model);
}

/** Cost of one request; each request is priced on its own prompt length. Null when unpriced. */
export function computeCost(model: string, usage: LlmUsage): number | null {
	const price = isPriced(model) ? PRICES_PER_MTOK[model] : undefined;
	if (!price) return null;
	const { longPrompt } = price;
	const tier = longPrompt && usage.inputTokens > longPrompt.overInputTokens ? longPrompt : price;
	return (usage.inputTokens * tier.input + usage.outputTokens * tier.output) / 1_000_000;
}

/**
 * Complete-request admission bound for the direct Claude text transport, checked 2026-10-24.
 * https://platform.claude.com/docs/en/build-with-claude/context-windows documents a 1M input
 * ceiling for these pinned models; larger inputs are rejected. This includes system prompts,
 * messages and provider-added input (including structured-output instructions), without
 * relying on a tokenizer estimate. Thinking is included in max_tokens (at most 128k).
 * Reserve the ENTIRE input window plus maximum output, even though they share the window.
 * This deliberately over-reserves and selects Haiku's highest tier. No caching, server tools,
 * batch, fast mode or premium service tier is enabled by the current direct transport.
 * Token counting is only an estimate, not a tighter hard bound:
 * https://platform.claude.com/docs/en/build-with-claude/token-counting
 */
export function requestCostBound(
	model: string,
	request: { promptChars: number; maxOutputTokens: number },
): number | null {
	if (
		!isPriced(model) ||
		!Number.isSafeInteger(request.maxOutputTokens) ||
		request.maxOutputTokens < 0 ||
		request.maxOutputTokens > 128_000
	)
		return null;
	return computeCost(model, {
		inputTokens: 1_000_000,
		outputTokens: request.maxOutputTokens,
	});
}
