import { describe, expect, it, vi } from "vitest";
import { validChannelDescription } from "./fixtures.testing";
import type { LlmConfig } from "./llm";
import { generateChannelDescription } from "./videoPost";

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
