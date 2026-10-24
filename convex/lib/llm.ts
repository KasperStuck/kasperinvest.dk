/**
 * LLM provider module: Anthropic Messages API (direct fetch) or OpenRouter, selected by AI_PROVIDER.
 * Pure TypeScript without Node-only APIs, so it runs in Convex actions, mutations and local scripts.
 *
 * Logs and errors carry only provider, model, status, error type, request-id, try number and token
 * usage. Never response bodies, model output, prompts or keys.
 */
import { z } from "zod";

// Anthropic: https://platform.claude.com/docs/en/api/messages/create
export const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
// https://platform.claude.com/docs/en/api/versioning
export const ANTHROPIC_VERSION = "2023-06-01";
// https://platform.claude.com/docs/en/about-claude/models/overview
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";
// Thinking tokens count toward max_tokens on Sonnet 5.5, so leave headroom for the visible output.
export const CLAUDE_MAX_TOKENS = 16_000;
// Effort defaults differ per model; send it explicitly so every model behaves alike.
// https://platform.claude.com/docs/en/build-with-claude/effort
export const CLAUDE_EFFORT = "medium";

export const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
// Reasoning-mode models burn tokens on internal "thinking"; give enough headroom for JSON output
export const OPENROUTER_MAX_TOKENS = 10_000;

export const TRANSIENT_RETRY_DELAYS_MS = [2_000, 8_000] as const;
export const MAX_REQUEST_TIMEOUT_MS = 180_000;
/** Do not start a provider call with less time than this left before the job deadline. */
export const MIN_REMAINING_MS = 20_000;
const TIMEOUT_MARGIN_MS = 10_000;

const PERMANENT_STATUSES = new Set([400, 401, 403, 404, 413]);
const TRANSIENT_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

export type LlmProvider = "claude" | "openrouter";
export type LlmConfig = { provider: LlmProvider; apiKey: string; model: string };
export type LlmPrompt = { system: string; user: string };
export type JsonFormat = { name: string; schema: Record<string, unknown> };
export type ProviderRequest = {
	url: string;
	headers: Record<string, string>;
	body: Record<string, unknown>;
};
export type LlmUsage = { inputTokens: number; outputTokens: number };
export type LlmCompletion = { text: string; usage: LlmUsage };
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type LlmCallOptions = {
	fetchImpl?: FetchLike;
	sleep?: (ms: number) => Promise<void>;
	now?: () => number;
	/** Absolute epoch ms; no request starts with less than MIN_REMAINING_MS left. */
	deadlineAt?: number;
	onUsage?: (usage: LlmUsage & { provider: LlmProvider; model: string }) => void;
	/** Called before every physical request, retries included; a throw stops the call unsent. */
	beforeRequest?: (request: LlmRequestInfo) => void;
	log?: (line: string) => void;
};

/** What a request may cost: prompt size and the max_tokens it is sent with. */
export type LlmRequestInfo = {
	provider: LlmProvider;
	model: string;
	promptChars: number;
	maxOutputTokens: number;
};

// --- Errors ---

/** Missing or invalid configuration. Stops the run. */
export class LlmConfigError extends Error {
	name = "LlmConfigError";
}

/** Non-2xx provider response. Permanent statuses stop the run; transient ones are retried. */
export class LlmHttpError extends Error {
	name = "LlmHttpError";
	constructor(
		readonly provider: LlmProvider,
		readonly status: number,
		readonly errorType?: string,
		readonly requestId?: string,
	) {
		super(
			`${provider} HTTP ${status}${errorType ? ` ${errorType}` : ""}${requestId ? ` request-id ${requestId}` : ""}`,
		);
	}

	get permanent(): boolean {
		if (PERMANENT_STATUSES.has(this.status)) return true;
		if (TRANSIENT_STATUSES.has(this.status)) return false;
		return this.status < 500;
	}
}

/** The provider answered, but the content is unusable. Consumes one generation attempt. */
export class LlmContentError extends Error {
	name = "LlmContentError";
	constructor(
		readonly code: string,
		detail?: string,
	) {
		super(`LLM content error: ${code}${detail ? ` (${detail})` : ""}`);
	}
}

/** Transient failures persisted through every retry. Consumes one generation attempt. */
export class LlmUnavailableError extends Error {
	name = "LlmUnavailableError";
	readonly code = "provider_unavailable";
	constructor(provider: LlmProvider, cause: string) {
		super(`${provider} unavailable after retries: ${cause}`);
	}
}

/** Not enough time left before the job deadline to start a provider call. */
export class LlmDeadlineError extends Error {
	name = "LlmDeadlineError";
	readonly code = "deadline";
	constructor() {
		super("LLM call skipped: job deadline reached");
	}
}

// --- Config ---

export function resolveLlmConfig(env: Record<string, string | undefined>): LlmConfig {
	const provider = (env.AI_PROVIDER ?? "").trim().toLowerCase() || "openrouter";
	if (provider === "claude") {
		return {
			provider,
			apiKey: requireKey(env, "ANTHROPIC_API_KEY"),
			model: env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
		};
	}
	if (provider === "openrouter") {
		return {
			provider,
			apiKey: requireKey(env, "OPENROUTER_API_KEY"),
			model: env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
		};
	}
	throw new LlmConfigError('AI_PROVIDER must be "claude" or "openrouter" (or unset)');
}

function requireKey(env: Record<string, string | undefined>, name: string): string {
	const value = env[name]?.trim();
	if (!value) throw new LlmConfigError(`Missing ${name} env var`);
	return value;
}

// --- Request builders and response parsers ---

export function buildClaudeRequest(
	config: LlmConfig,
	prompt: LlmPrompt,
	json?: JsonFormat,
): ProviderRequest {
	const outputConfig: Record<string, unknown> = { effort: CLAUDE_EFFORT };
	// https://platform.claude.com/docs/en/build-with-claude/structured-outputs
	if (json) outputConfig.format = { type: "json_schema", schema: json.schema };
	return {
		url: ANTHROPIC_MESSAGES_URL,
		headers: {
			"x-api-key": config.apiKey,
			"anthropic-version": ANTHROPIC_VERSION,
			"content-type": "application/json",
		},
		body: {
			model: config.model,
			max_tokens: CLAUDE_MAX_TOKENS,
			system: prompt.system,
			messages: [{ role: "user", content: prompt.user }],
			output_config: outputConfig,
		},
	};
}

export function buildOpenRouterRequest(
	config: LlmConfig,
	prompt: LlmPrompt,
	json?: JsonFormat,
): ProviderRequest {
	const body: Record<string, unknown> = {
		model: config.model,
		messages: [
			{ role: "system", content: prompt.system },
			{ role: "user", content: prompt.user },
		],
		max_tokens: OPENROUTER_MAX_TOKENS,
		// Disable reasoning on OpenRouter: reasoning-mode models (nemotron) otherwise burn 800-1000
		// tokens "thinking" before output, producing truncated/empty content and slow (30s+) calls.
		reasoning: { enabled: false },
	};
	if (json) {
		body.response_format = {
			type: "json_schema",
			json_schema: { name: json.name, strict: false, schema: json.schema },
		};
	}
	return {
		url: OPENROUTER_CHAT_URL,
		headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
		body,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tokenCount(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Token usage of any response with a usage object, including ones whose content is rejected. */
export function readUsage(provider: LlmProvider, data: unknown): LlmUsage | undefined {
	if (!isRecord(data) || !isRecord(data.usage)) return undefined;
	const { usage } = data;
	return provider === "claude"
		? { inputTokens: tokenCount(usage.input_tokens), outputTokens: tokenCount(usage.output_tokens) }
		: {
				inputTokens: tokenCount(usage.prompt_tokens),
				outputTokens: tokenCount(usage.completion_tokens),
			};
}

const NO_USAGE: LlmUsage = { inputTokens: 0, outputTokens: 0 };

/** Joins the `text` blocks of a Messages API response; thinking blocks are ignored. */
export function parseClaudeResponse(data: unknown): LlmCompletion {
	if (!isRecord(data) || !Array.isArray(data.content)) {
		throw new LlmContentError("malformed_response");
	}
	// Only end_turn is a complete answer; refusal and max_tokens arrive as HTTP 200.
	// https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
	if (data.stop_reason !== "end_turn") {
		throw new LlmContentError("stop_reason", String(data.stop_reason));
	}
	const text = data.content
		.filter((block) => isRecord(block) && block.type === "text" && typeof block.text === "string")
		.map((block) => (block as { text: string }).text)
		.join("");
	if (!text.trim()) throw new LlmContentError("empty_output");
	return { text, usage: readUsage("claude", data) ?? NO_USAGE };
}

export function parseOpenRouterResponse(data: unknown): LlmCompletion {
	if (!isRecord(data)) throw new LlmContentError("malformed_response");
	if (data.error) throw new LlmContentError("provider_error");
	const choice = Array.isArray(data.choices) ? data.choices[0] : undefined;
	const message = isRecord(choice) && isRecord(choice.message) ? choice.message : undefined;
	const text = typeof message?.content === "string" ? message.content : "";
	if (!text.trim()) throw new LlmContentError("empty_output");
	return { text, usage: readUsage("openrouter", data) ?? NO_USAGE };
}

// --- JSON schema for structured output ---

// Claude structured outputs reject numeric and length bounds and minItems above 1.
const UNSUPPORTED_KEYWORDS = [
	"$schema",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"multipleOf",
	"minLength",
	"maxLength",
	"maxItems",
];

/** Converts a zod schema to a JSON schema both providers accept; zod still validates the result. */
export function toProviderJsonSchema(schema: z.ZodType): Record<string, unknown> {
	return stripSchema(z.toJSONSchema(schema)) as Record<string, unknown>;
}

function stripSchema(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(stripSchema);
	if (!isRecord(node)) return node;
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(node)) {
		if (UNSUPPORTED_KEYWORDS.includes(key)) continue;
		if (key === "minItems" && typeof value === "number" && value > 1) continue;
		result[key] = stripSchema(value);
	}
	if (result.type === "object") result.additionalProperties = false;
	return result;
}

// --- Transport ---

export function requestTimeoutMs(remainingMs: number): number {
	return Math.min(MAX_REQUEST_TIMEOUT_MS, remainingMs - TIMEOUT_MARGIN_MS);
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function readErrorType(res: Response): Promise<string | undefined> {
	try {
		const data: unknown = await res.json();
		if (isRecord(data) && isRecord(data.error) && typeof data.error.type === "string") {
			return data.error.type;
		}
	} catch {
		// Body is not JSON; the status code is enough.
	}
	return undefined;
}

async function sendOnce(
	config: LlmConfig,
	request: ProviderRequest,
	fetchImpl: FetchLike,
	timeoutMs: number,
): Promise<{ data: unknown; requestId?: string }> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetchImpl(request.url, {
			method: "POST",
			headers: request.headers,
			body: JSON.stringify(request.body),
			signal: controller.signal,
		});
		const requestId = res.headers.get("request-id") ?? undefined;
		if (!res.ok) {
			throw new LlmHttpError(config.provider, res.status, await readErrorType(res), requestId);
		}
		// A failed body read (disconnect, timeout abort) is a transport error and is retried;
		// only a body that arrived but is not JSON is a content error.
		const body = await res.text();
		try {
			return { data: JSON.parse(body), requestId };
		} catch {
			throw new LlmContentError("malformed_response");
		}
	} finally {
		clearTimeout(timer);
	}
}

function describeFailure(error: unknown): string {
	if (error instanceof LlmHttpError) return error.message;
	if (error instanceof Error) return `network ${error.name}`;
	return "network error";
}

async function complete(
	config: LlmConfig,
	prompt: LlmPrompt,
	json: JsonFormat | undefined,
	options: LlmCallOptions,
): Promise<LlmCompletion> {
	const fetchImpl = options.fetchImpl ?? ((url, init) => fetch(url, init));
	const sleep = options.sleep ?? defaultSleep;
	const now = options.now ?? Date.now;
	const log = options.log ?? console.log;
	const deadlineAt = options.deadlineAt ?? Number.POSITIVE_INFINITY;
	const request =
		config.provider === "claude"
			? buildClaudeRequest(config, prompt, json)
			: buildOpenRouterRequest(config, prompt, json);
	const where = `provider=${config.provider} model=${config.model}`;
	const requestInfo: LlmRequestInfo = {
		provider: config.provider,
		model: config.model,
		promptChars: prompt.system.length + prompt.user.length,
		maxOutputTokens: config.provider === "claude" ? CLAUDE_MAX_TOKENS : OPENROUTER_MAX_TOKENS,
	};

	let lastFailure = "";
	for (let attempt = 0; attempt <= TRANSIENT_RETRY_DELAYS_MS.length; attempt++) {
		if (attempt > 0) {
			const delay = TRANSIENT_RETRY_DELAYS_MS[attempt - 1];
			if (deadlineAt - now() - delay < MIN_REMAINING_MS) break;
			await sleep(delay);
		}
		const remaining = deadlineAt - now();
		if (remaining < MIN_REMAINING_MS) {
			if (attempt === 0) throw new LlmDeadlineError();
			break;
		}

		// Outside the try: a refusal here (e.g. a spend cap) must not be retried.
		options.beforeRequest?.(requestInfo);
		try {
			const { data, requestId } = await sendOnce(
				config,
				request,
				fetchImpl,
				requestTimeoutMs(remaining),
			);
			// Billed even when the content is rejected below (max_tokens, refusal, empty output),
			// so usage is logged and reported before parsing.
			const usage = readUsage(config.provider, data);
			if (usage) {
				log(
					`llm usage ${where} try=${attempt + 1} request-id=${requestId ?? "-"} input_tokens=${usage.inputTokens} output_tokens=${usage.outputTokens}`,
				);
				options.onUsage?.({ provider: config.provider, model: config.model, ...usage });
			}
			const completion =
				config.provider === "claude" ? parseClaudeResponse(data) : parseOpenRouterResponse(data);
			log(`llm ok ${where} try=${attempt + 1} request-id=${requestId ?? "-"}`);
			return completion;
		} catch (error) {
			if (error instanceof LlmContentError) {
				log(`llm content_error ${where} try=${attempt + 1} code=${error.code}`);
				throw error;
			}
			lastFailure = describeFailure(error);
			log(`llm error ${where} try=${attempt + 1} ${lastFailure}`);
			if (error instanceof LlmHttpError && error.permanent) throw error;
		}
	}
	throw new LlmUnavailableError(config.provider, lastFailure);
}

export function completeText(
	config: LlmConfig,
	prompt: LlmPrompt,
	options: LlmCallOptions = {},
): Promise<LlmCompletion> {
	return complete(config, prompt, undefined, options);
}

/** Envelope → JSON.parse → normalize → strict zod parse. */
export async function completeJson<T>(
	config: LlmConfig,
	schema: z.ZodType<T>,
	prompt: LlmPrompt,
	options: LlmCallOptions & { name: string; normalize?: (raw: unknown) => unknown },
): Promise<{ value: T; usage: LlmUsage }> {
	const json = { name: options.name, schema: toProviderJsonSchema(schema) };
	const { text, usage } = await complete(config, prompt, json, options);
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new LlmContentError("invalid_json");
	}
	const parsed = schema.safeParse(options.normalize ? options.normalize(raw) : raw);
	if (!parsed.success) {
		const paths = parsed.error.issues.map((issue) => issue.path.join(".") || "(root)");
		throw new LlmContentError("schema_mismatch", [...new Set(paths)].join(", "));
	}
	return { value: parsed.data, usage };
}
