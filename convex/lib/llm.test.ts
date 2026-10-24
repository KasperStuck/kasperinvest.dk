import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	ANTHROPIC_MESSAGES_URL,
	buildClaudeRequest,
	buildOpenRouterRequest,
	completeJson,
	completeText,
	type LlmConfig,
	LlmConfigError,
	LlmContentError,
	LlmDeadlineError,
	LlmHttpError,
	LlmUnavailableError,
	OPENROUTER_CHAT_URL,
	parseClaudeResponse,
	parseOpenRouterResponse,
	requestTimeoutMs,
	resolveLlmConfig,
	toProviderJsonSchema,
} from "./llm";

const claude: LlmConfig = { provider: "claude", apiKey: "test-anthropic-key", model: "claude-x" };
const openRouter: LlmConfig = { provider: "openrouter", apiKey: "test-or-key", model: "or-model" };
const prompt = { system: "System-instruks", user: "Bruger-prompt" };

function claudeBody(text: string, extra: Record<string, unknown> = {}) {
	return {
		id: "msg_1",
		type: "message",
		role: "assistant",
		content: [{ type: "text", text }],
		stop_reason: "end_turn",
		usage: { input_tokens: 12, output_tokens: 34 },
		...extra,
	};
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});
}

type FetchCall = { url: string; init: RequestInit };

function fakeFetch(responses: Array<Response | Error>) {
	const calls: FetchCall[] = [];
	const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
		calls.push({ url, init });
		const next = responses.shift();
		if (!next) throw new Error("unexpected extra fetch");
		if (next instanceof Error) throw next;
		return next;
	});
	return { fetchImpl, calls };
}

const noSleep = vi.fn(async (_ms: number) => {});

beforeEach(() => {
	noSleep.mockClear();
	// Any accidental use of the real network fails loudly.
	vi.stubGlobal("fetch", () => {
		throw new Error("real fetch must not be used in tests");
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("resolveLlmConfig", () => {
	it("defaults to OpenRouter when AI_PROVIDER is unset or empty", () => {
		for (const AI_PROVIDER of [undefined, "", "  "]) {
			expect(resolveLlmConfig({ AI_PROVIDER, OPENROUTER_API_KEY: "k" })).toEqual({
				provider: "openrouter",
				apiKey: "k",
				model: "nvidia/nemotron-3-super-120b-a12b:free",
			});
		}
	});

	it("selects Claude case-insensitively with the default model", () => {
		expect(resolveLlmConfig({ AI_PROVIDER: " Claude ", ANTHROPIC_API_KEY: "a" })).toEqual({
			provider: "claude",
			apiKey: "a",
			model: "claude-sonnet-5-5",
		});
	});

	it("honours model overrides", () => {
		expect(
			resolveLlmConfig({ AI_PROVIDER: "claude", ANTHROPIC_API_KEY: "a", ANTHROPIC_MODEL: "m1" })
				.model,
		).toBe("m1");
		expect(resolveLlmConfig({ OPENROUTER_API_KEY: "k", OPENROUTER_MODEL: "m2" }).model).toBe("m2");
	});

	it("rejects an unknown provider and names the variable", () => {
		expect(() => resolveLlmConfig({ AI_PROVIDER: "gpt" })).toThrow(LlmConfigError);
		expect(() => resolveLlmConfig({ AI_PROVIDER: "gpt" })).toThrow(/AI_PROVIDER/);
	});

	it("requires the key of the selected provider only", () => {
		expect(() => resolveLlmConfig({ AI_PROVIDER: "claude", OPENROUTER_API_KEY: "k" })).toThrow(
			/ANTHROPIC_API_KEY/,
		);
		expect(() => resolveLlmConfig({ ANTHROPIC_API_KEY: "a" })).toThrow(/OPENROUTER_API_KEY/);
	});
});

describe("buildClaudeRequest", () => {
	it("builds the exact Messages API request for text", () => {
		const req = buildClaudeRequest(claude, prompt);
		expect(req.url).toBe("https://api.anthropic.com/v1/messages");
		expect(req.headers).toEqual({
			"x-api-key": "test-anthropic-key",
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
		});
		expect(req.body).toEqual({
			model: "claude-x",
			max_tokens: 16000,
			system: "System-instruks",
			messages: [{ role: "user", content: "Bruger-prompt" }],
			output_config: { effort: "medium" },
		});
	});

	it("adds a json_schema format only when a schema is given", () => {
		const schema = { type: "object", properties: {}, additionalProperties: false };
		const req = buildClaudeRequest(claude, prompt, { name: "x", schema });
		expect(req.body.output_config).toEqual({
			effort: "medium",
			format: { type: "json_schema", schema },
		});
		expect(req.body).not.toHaveProperty("thinking");
		expect(req.body).not.toHaveProperty("temperature");
		expect(req.body).not.toHaveProperty("tools");
	});
});

describe("buildOpenRouterRequest", () => {
	it("keeps today's OpenRouter body", () => {
		const schema = { type: "object" };
		const req = buildOpenRouterRequest(openRouter, prompt, { name: "video_analysis", schema });
		expect(req.url).toBe("https://openrouter.ai/api/v1/chat/completions");
		expect(req.headers).toEqual({
			Authorization: "Bearer test-or-key",
			"Content-Type": "application/json",
		});
		expect(req.body).toEqual({
			model: "or-model",
			messages: [
				{ role: "system", content: "System-instruks" },
				{ role: "user", content: "Bruger-prompt" },
			],
			max_tokens: 10000,
			reasoning: { enabled: false },
			response_format: {
				type: "json_schema",
				json_schema: { name: "video_analysis", strict: false, schema },
			},
		});
		expect(buildOpenRouterRequest(openRouter, prompt).body).not.toHaveProperty("response_format");
	});

	it("parses content and usage", () => {
		expect(
			parseOpenRouterResponse({
				choices: [{ message: { content: "hej" } }],
				usage: { prompt_tokens: 3, completion_tokens: 4 },
			}),
		).toEqual({ text: "hej", usage: { inputTokens: 3, outputTokens: 4 } });
		expect(() => parseOpenRouterResponse({ choices: [] })).toThrow(LlmContentError);
		expect(() => parseOpenRouterResponse({ error: { message: "x" } })).toThrow(LlmContentError);
	});
});

describe("toProviderJsonSchema", () => {
	it("strips unsupported keywords and closes objects", () => {
		const schema = z.object({
			title: z.string().min(30).max(50),
			score: z.number().min(0).max(100),
			count: z.number().int(),
			list: z.array(z.string()).min(3).max(6),
			one: z.array(z.string()).min(1),
			nested: z.object({ q: z.string() }),
			items: z.array(z.object({ a: z.string() })),
		});
		const wire = toProviderJsonSchema(schema);
		const text = JSON.stringify(wire);
		for (const keyword of [
			"$schema",
			"minimum",
			"maximum",
			"exclusiveMinimum",
			"exclusiveMaximum",
			"multipleOf",
			"minLength",
			"maxLength",
			"maxItems",
		]) {
			expect(text).not.toContain(`"${keyword}"`);
		}
		const props = wire.properties as Record<string, Record<string, unknown>>;
		expect(props.list).not.toHaveProperty("minItems");
		expect(props.one.minItems).toBe(1);
		expect(wire.additionalProperties).toBe(false);
		expect(props.nested.additionalProperties).toBe(false);
		expect((props.items.items as Record<string, unknown>).additionalProperties).toBe(false);
		expect(wire.required).toEqual(["title", "score", "count", "list", "one", "nested", "items"]);
	});
});

describe("parseClaudeResponse", () => {
	it("joins text blocks and skips thinking blocks", () => {
		const parsed = parseClaudeResponse({
			content: [
				{ type: "thinking", thinking: "skjult", signature: "s" },
				{ type: "redacted_thinking", data: "x" },
				{ type: "text", text: "Del 1. " },
				{ type: "text", text: "Del 2." },
			],
			stop_reason: "end_turn",
			usage: { input_tokens: 5, output_tokens: 6 },
		});
		expect(parsed).toEqual({ text: "Del 1. Del 2.", usage: { inputTokens: 5, outputTokens: 6 } });
	});

	it("accepts only end_turn", () => {
		expect(parseClaudeResponse(claudeBody("ok")).text).toBe("ok");
		for (const stop of [
			"max_tokens",
			"refusal",
			"pause_turn",
			"tool_use",
			"stop_sequence",
			"model_context_window_exceeded",
			null,
		]) {
			expect(() => parseClaudeResponse(claudeBody("x", { stop_reason: stop }))).toThrow(
				LlmContentError,
			);
		}
	});

	it("rejects empty text and malformed envelopes", () => {
		expect(() => parseClaudeResponse(claudeBody("   "))).toThrow(LlmContentError);
		expect(() => parseClaudeResponse("nope")).toThrow(LlmContentError);
		expect(() => parseClaudeResponse({ stop_reason: "end_turn" })).toThrow(LlmContentError);
	});
});

describe("completeText transport", () => {
	it("calls only the Claude endpoint and reports usage", async () => {
		const { fetchImpl, calls } = fakeFetch([jsonResponse(claudeBody("Svar"))]);
		const onUsage = vi.fn();
		const result = await completeText(claude, prompt, { fetchImpl, sleep: noSleep, onUsage });
		expect(result.text).toBe("Svar");
		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe(ANTHROPIC_MESSAGES_URL);
		expect(calls[0].init.method).toBe("POST");
		expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
		expect(JSON.parse(String(calls[0].init.body)).model).toBe("claude-x");
		expect(onUsage).toHaveBeenCalledWith({
			provider: "claude",
			model: "claude-x",
			inputTokens: 12,
			outputTokens: 34,
		});
	});

	it("announces every physical request before it is sent, retries included", async () => {
		const overloaded = () =>
			jsonResponse({ type: "error", error: { type: "overloaded_error" } }, 529);
		const { fetchImpl } = fakeFetch([overloaded(), jsonResponse(claudeBody("Svar"))]);
		const beforeRequest = vi.fn();
		await completeText(claude, prompt, { fetchImpl, sleep: noSleep, beforeRequest });
		const announced = {
			provider: "claude",
			model: "claude-x",
			promptChars: prompt.system.length + prompt.user.length,
			maxOutputTokens: 16_000,
		};
		expect(beforeRequest.mock.calls).toEqual([[announced], [announced]]);
	});

	it("stops without sending or retrying when the request announcement throws", async () => {
		const { fetchImpl } = fakeFetch([jsonResponse(claudeBody("Svar"))]);
		const stop = new Error("cap");
		await expect(
			completeText(claude, prompt, {
				fetchImpl,
				sleep: noSleep,
				beforeRequest: () => {
					throw stop;
				},
			}),
		).rejects.toBe(stop);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("calls only the OpenRouter endpoint for openrouter", async () => {
		const { fetchImpl, calls } = fakeFetch([
			jsonResponse({ choices: [{ message: { content: "x" } }] }),
		]);
		await completeText(openRouter, prompt, { fetchImpl, sleep: noSleep });
		expect(calls[0].url).toBe(OPENROUTER_CHAT_URL);
	});

	it("retries 529 with backoff, then fails as provider_unavailable", async () => {
		const overloaded = () =>
			jsonResponse(
				{ type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
				529,
				{ "request-id": "req_123" },
			);
		const { fetchImpl } = fakeFetch([overloaded(), overloaded(), overloaded()]);
		const log = vi.fn();
		const error = await completeText(claude, prompt, { fetchImpl, sleep: noSleep, log }).catch(
			(e: unknown) => e,
		);
		expect(error).toBeInstanceOf(LlmUnavailableError);
		expect((error as LlmUnavailableError).code).toBe("provider_unavailable");
		expect(fetchImpl).toHaveBeenCalledTimes(3);
		expect(noSleep.mock.calls.map(([ms]) => ms)).toEqual([2000, 8000]);
		expect(log.mock.calls.join("\n")).toContain("req_123");
		expect(log.mock.calls.join("\n")).toContain("overloaded_error");
	});

	it("recovers when a retry succeeds", async () => {
		const { fetchImpl } = fakeFetch([
			jsonResponse({ type: "error", error: { type: "rate_limit_error" } }, 429),
			new TypeError("fetch failed"),
			jsonResponse(claudeBody("Endelig")),
		]);
		const result = await completeText(claude, prompt, { fetchImpl, sleep: noSleep });
		expect(result.text).toBe("Endelig");
		expect(fetchImpl).toHaveBeenCalledTimes(3);
	});

	it("stops immediately on 401", async () => {
		const { fetchImpl } = fakeFetch([
			jsonResponse({ type: "error", error: { type: "authentication_error" } }, 401),
		]);
		const error = await completeText(claude, prompt, { fetchImpl, sleep: noSleep }).catch(
			(e: unknown) => e,
		);
		expect(error).toBeInstanceOf(LlmHttpError);
		expect((error as LlmHttpError).permanent).toBe(true);
		expect((error as LlmHttpError).status).toBe(401);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
		expect(noSleep).not.toHaveBeenCalled();
	});

	it("does not call the provider when the deadline is too close", async () => {
		const { fetchImpl } = fakeFetch([]);
		const error = await completeText(claude, prompt, {
			fetchImpl,
			sleep: noSleep,
			now: () => 1_000_000,
			deadlineAt: 1_000_000 + 19_999,
		}).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(LlmDeadlineError);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("derives the request timeout from the remaining time", () => {
		expect(requestTimeoutMs(600_000)).toBe(180_000);
		expect(requestTimeoutMs(40_000)).toBe(30_000);
	});

	it("aborts a hanging request at the timeout and skips retries past the deadline", async () => {
		vi.useFakeTimers();
		const fetchImpl = vi.fn(
			(_url: string, init: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init.signal?.addEventListener("abort", () =>
						reject(new DOMException("aborted", "AbortError")),
					);
				}),
		);
		const promise = completeText(claude, prompt, {
			fetchImpl,
			now: () => Date.now(),
			deadlineAt: Date.now() + 40_000,
		}).catch((e: unknown) => e);
		await vi.advanceTimersByTimeAsync(29_999);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		const error = await promise;
		expect(error).toBeInstanceOf(LlmUnavailableError);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it("retries a disconnect during the body read as a transient failure", async () => {
		const broken = new Response(
			new ReadableStream({
				start(controller) {
					controller.error(new TypeError("terminated"));
				},
			}),
			{ status: 200 },
		);
		const { fetchImpl } = fakeFetch([broken, jsonResponse(claudeBody("Igen"))]);
		const result = await completeText(claude, prompt, { fetchImpl, sleep: noSleep });
		expect(result.text).toBe("Igen");
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it("treats an abort during the body read as a timeout, not a content error", async () => {
		vi.useFakeTimers();
		const fetchImpl = vi.fn(
			async (_url: string, init: RequestInit) =>
				new Response(
					new ReadableStream({
						start(controller) {
							init.signal?.addEventListener("abort", () =>
								controller.error(new DOMException("aborted", "AbortError")),
							);
						},
					}),
					{ status: 200 },
				),
		);
		const promise = completeText(claude, prompt, {
			fetchImpl,
			now: () => Date.now(),
			deadlineAt: Date.now() + 40_000,
		}).catch((e: unknown) => e);
		await vi.advanceTimersByTimeAsync(30_000);
		const error = await promise;
		expect(error).toBeInstanceOf(LlmUnavailableError);
	});

	it("keeps a JSON syntax error in the body as a content error", async () => {
		const { fetchImpl } = fakeFetch([new Response("ikke json", { status: 200 })]);
		const error = await completeText(claude, prompt, { fetchImpl, sleep: noSleep }).catch(
			(e: unknown) => e,
		);
		expect(error).toBeInstanceOf(LlmContentError);
		expect((error as LlmContentError).code).toBe("malformed_response");
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it("reports billed usage even when the content is rejected", async () => {
		const rejected = [
			claudeBody("Halv tekst", { stop_reason: "max_tokens" }),
			claudeBody("", { stop_reason: "refusal", content: [] }),
			claudeBody("   "),
		];
		for (const body of rejected) {
			const { fetchImpl } = fakeFetch([jsonResponse(body)]);
			const onUsage = vi.fn();
			const error = await completeText(claude, prompt, {
				fetchImpl,
				sleep: noSleep,
				onUsage,
			}).catch((e: unknown) => e);
			expect(error).toBeInstanceOf(LlmContentError);
			expect(onUsage).toHaveBeenCalledWith({
				provider: "claude",
				model: "claude-x",
				inputTokens: 12,
				outputTokens: 34,
			});
		}
		const { fetchImpl } = fakeFetch([
			jsonResponse({
				choices: [{ message: { content: "" } }],
				usage: { prompt_tokens: 5, completion_tokens: 6 },
			}),
		]);
		const onUsage = vi.fn();
		await completeText(openRouter, prompt, { fetchImpl, sleep: noSleep, onUsage }).catch(() => {});
		expect(onUsage).toHaveBeenCalledWith({
			provider: "openrouter",
			model: "or-model",
			inputTokens: 5,
			outputTokens: 6,
		});
	});

	it("never leaks response bodies, prompts or keys into errors or logs", async () => {
		const secretBody = {
			type: "error",
			error: {
				type: "invalid_request_error",
				message: "sk-ant-FAKE-SECRET echoed Bruger-prompt",
			},
		};
		const { fetchImpl } = fakeFetch([
			jsonResponse(secretBody, 400, { "request-id": "req_9" }),
			jsonResponse(claudeBody("sk-ant-FAKE-SECRET Bruger-prompt not json")),
		]);
		const log = vi.fn();
		const httpError = await completeText(claude, prompt, {
			fetchImpl,
			sleep: noSleep,
			log,
		}).catch((e: unknown) => e);
		const contentError = await completeJson(claude, z.object({ a: z.string() }), prompt, {
			fetchImpl,
			sleep: noSleep,
			log,
			name: "x",
		}).catch((e: unknown) => e);
		expect(contentError).toBeInstanceOf(LlmContentError);
		const surfaced = [
			String(httpError),
			(httpError as Error).message,
			String(contentError),
			JSON.stringify(log.mock.calls),
		].join("\n");
		expect(surfaced).toContain("req_9");
		for (const leaked of ["sk-ant-FAKE-SECRET", "Bruger-prompt", "test-anthropic-key"]) {
			expect(surfaced).not.toContain(leaked);
		}
	});
});

describe("completeJson", () => {
	const schema = z.object({ category: z.enum(["ETF", "aktier"]) });
	const normalize = (raw: unknown) => {
		const value = raw as { category?: string };
		return value.category?.toLowerCase() === "etf" ? { ...value, category: "ETF" } : raw;
	};

	it("normalizes before the strict parse", async () => {
		const { fetchImpl, calls } = fakeFetch([jsonResponse(claudeBody('{"category":"Etf"}'))]);
		const result = await completeJson(claude, schema, prompt, {
			fetchImpl,
			sleep: noSleep,
			name: "cat",
			normalize,
		});
		expect(result.value).toEqual({ category: "ETF" });
		const body = JSON.parse(String(calls[0].init.body));
		expect(body.output_config.format.type).toBe("json_schema");
		expect(body.output_config.format.schema.additionalProperties).toBe(false);
	});

	it("rejects a schema mismatch as a content error", async () => {
		const { fetchImpl } = fakeFetch([jsonResponse(claudeBody('{"category":"Etf"}'))]);
		const error = await completeJson(claude, schema, prompt, {
			fetchImpl,
			sleep: noSleep,
			name: "cat",
		}).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(LlmContentError);
		expect((error as LlmContentError).code).toBe("schema_mismatch");
	});

	it("rejects invalid JSON as a content error", async () => {
		const { fetchImpl } = fakeFetch([jsonResponse(claudeBody("ikke json"))]);
		const error = await completeJson(claude, schema, prompt, {
			fetchImpl,
			sleep: noSleep,
			name: "cat",
		}).catch((e: unknown) => e);
		expect((error as LlmContentError).code).toBe("invalid_json");
	});
});
