import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	type JobDeps,
	queueRepairs,
	resolveVideoTarget,
	runChannelDescriptionJob,
	runVideoPostJob,
} from "./aiPosts";
import {
	passingFactCheck,
	transcriptOfWords,
	VIDEO_TITLE,
	validAnalysis,
	validArticle,
	validChannelDescription,
} from "./lib/fixtures.testing";
import { LlmConfigError, LlmHttpError, LlmUnavailableError } from "./lib/llm";
import { JOB_DEADLINE_MS } from "./lib/pipeline";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const DEADLINE_AT = 1_000_000 + JOB_DEADLINE_MS;

// --- Video post and channel description jobs (fake deps, no Convex, no network) ---

type Call = { name: string; args: Record<string, unknown> };

function fakeProvider(
	options: {
		article?: string;
		/** Articles returned in order; the last one repeats. */
		articles?: string[];
		analysis?: Record<string, unknown>;
		channel?: string;
		status?: number;
		stopReason?: string;
	} = {},
) {
	const requests: Array<{ kind: string; user: string }> = [];
	const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
		const body = JSON.parse(String(init.body));
		const schema = body.output_config?.format?.schema;
		const kind = schema?.properties?.score
			? "judge"
			: schema?.properties?.segments
				? "fact_check"
				: schema?.properties?.claims
					? "fact_recheck"
					: schema?.properties?.summary
						? "analysis"
						: body.system.includes("kanalbeskrivelse")
							? "channel"
							: "article";
		const user = String(body.messages[0].content);
		requests.push({ kind, user });
		const articleCount = requests.filter((r) => r.kind === "article").length;
		if (options.status) {
			return new Response(JSON.stringify({ type: "error", error: { type: "x" } }), {
				status: options.status,
				headers: { "request-id": "req_err" },
			});
		}
		const text =
			kind === "fact_check" || kind === "fact_recheck"
				? passingFactCheck(user, schema)
				: kind === "judge"
					? JSON.stringify({
							score: 8,
							danish: true,
							topicMatch: true,
							sourceSupported: true,
							reason: "Fin",
						})
					: kind === "analysis"
						? JSON.stringify(options.analysis ?? validAnalysis())
						: kind === "channel"
							? (options.channel ?? validChannelDescription())
							: options.articles
								? options.articles[Math.min(articleCount, options.articles.length) - 1]
								: (options.article ?? validArticle());
		return new Response(
			JSON.stringify({
				content: [{ type: "text", text }],
				stop_reason: options.stopReason ?? "end_turn",
				usage: { input_tokens: 1200, output_tokens: 16000 },
			}),
			{ status: 200, headers: { "request-id": `req_${requests.length}` } },
		);
	});
	return { fetchImpl, requests };
}

function fakeDeps(
	state: {
		video?: Record<string, unknown> | null;
		channel?: Record<string, unknown> | null;
		publishResult?: { status: string };
		fetchedTranscript?: ReturnType<typeof transcriptOfWords>;
		env?: Record<string, string>;
	},
	provider = fakeProvider(),
) {
	const queries: Call[] = [];
	const mutations: Call[] = [];
	const deps = {
		runQuery: vi.fn(async (ref: unknown, args: Record<string, unknown>) => {
			const name = getFunctionName(ref as never);
			queries.push({ name, args });
			if (name === "videos:getByVideoId") return state.video ?? null;
			if (name === "channels:getByChannelId") return state.channel ?? null;
			if (name === "videos:listRecentByChannel") return [{ title: "Video 1", summary: "Om fonde" }];
			throw new Error(`unexpected query ${name}`);
		}),
		runMutation: vi.fn(async (ref: unknown, args: Record<string, unknown>) => {
			const name = getFunctionName(ref as never);
			mutations.push({ name, args });
			if (name === "videos:publishPost" || name === "channels:publishAiDescription") {
				return state.publishResult ?? { status: "published" };
			}
			if (name === "videos:updateTranscript") return { sourceVersion: 1 };
			return null;
		}),
		env: state.env ?? { AI_PROVIDER: "claude", ANTHROPIC_API_KEY: "test-key" },
		fetchImpl: provider.fetchImpl,
		now: () => 1_000_000,
		sleep: async () => {},
		fetchTranscriptSegments: vi.fn(
			async (_videoId: string, _timeoutMs: number) => state.fetchedTranscript ?? [],
		),
		log: vi.fn(),
	};
	return { deps: deps as unknown as JobDeps, queries, mutations, provider, raw: deps };
}

function baseVideo(overrides: Record<string, unknown> = {}) {
	return {
		videoId: "vid1",
		channelId: "ch1",
		title: VIDEO_TITLE,
		description: "Om indeksfonde.",
		durationSeconds: 600,
		transcript: transcriptOfWords(400),
		...overrides,
	};
}

describe("runVideoPostJob", () => {
	it.each(
		[
			"analysis generate",
			"analysis fact-check",
			"analysis judge",
			"article generate",
			"article fact-check",
			"article judge",
		].flatMap((stage, successfulCalls) =>
			[429, 503, "network"].map((failure) => ({ stage, successfulCalls, failure })),
		),
	)("stops on $failure during $stage without a video failure or content repair", async ({
		successfulCalls,
		failure,
	}) => {
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo() });
		const healthy = provider.fetchImpl;
		const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
			if (healthy.mock.calls.length < successfulCalls) return healthy(url, init);
			if (failure === "network") throw new TypeError("connection lost");
			return new Response("{}", { status: Number(failure) });
		});
		const sleep = vi.fn(async (_ms: number) => {});
		deps.fetchImpl = fetchImpl;
		deps.sleep = sleep;
		await expect(runVideoPostJob(deps, "vid1")).rejects.toBeInstanceOf(LlmUnavailableError);
		expect(fetchImpl).toHaveBeenCalledTimes(successfulCalls + 3);
		expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([2_000, 8_000]);
		expect(mutations).toEqual([]);
	});
	it("publishes analysis and article in exactly one mutation", async () => {
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo({ processedAt: 5 }) });
		const result = await runVideoPostJob(deps, "vid1", { force: true });
		expect(result).toMatchObject({ status: "published" });
		expect(provider.requests.map((r) => r.kind)).toEqual([
			"analysis",
			"fact_check",
			"judge",
			"article",
			"fact_check",
			"judge",
		]);
		expect(mutations).toHaveLength(1);
		expect(mutations[0].name).toBe("videos:publishPost");
		expect(mutations[0].args).toMatchObject({
			videoId: "vid1",
			expectedProcessedAt: 5,
			article: validArticle(),
			analysis: validAnalysis(),
			deadlineAt: DEADLINE_AT,
		});
	});

	it("publishes nothing when the deadline passes before publish", async () => {
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo() });
		deps.now = () => (provider.requests.length >= 6 ? DEADLINE_AT + 1 : 1_000_000);
		await expect(runVideoPostJob(deps, "vid1", { deadlineAt: DEADLINE_AT })).rejects.toThrow(
			/deadline/,
		);
		expect(mutations).toEqual([
			{ name: "videos:recordAiFailure", args: { videoId: "vid1", issues: ["deadline"] } },
		]);
	});

	it("publishes nothing when the deadline passes after the final judge returns", async () => {
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo() });
		// The loop's own check right after the last judge still sees the deadline itself, so only
		// the job's pre-publish check can stop the publish.
		let readsAfterLastJudge = 0;
		deps.now = () => {
			if (provider.requests.length < 6) return 1_000_000;
			return readsAfterLastJudge++ === 0 ? DEADLINE_AT : DEADLINE_AT + 1;
		};
		await expect(runVideoPostJob(deps, "vid1", { deadlineAt: DEADLINE_AT })).rejects.toThrow(
			/publish issues=deadline/,
		);
		expect(readsAfterLastJudge).toBe(2);
		expect(mutations).toEqual([
			{ name: "videos:recordAiFailure", args: { videoId: "vid1", issues: ["deadline"] } },
		]);
	});

	it("logs billed usage of rejected responses without a usage callback", async () => {
		const { deps, mutations, provider, raw } = fakeDeps(
			{ video: baseVideo() },
			fakeProvider({ stopReason: "max_tokens" }),
		);
		await expect(runVideoPostJob(deps, "vid1", {})).rejects.toThrow(/analysis/);
		const usageLines = raw.log.mock.calls
			.map(([line]) => String(line))
			.filter((line) => line.includes("input_tokens=1200 output_tokens=16000"));
		expect(provider.requests).toHaveLength(3);
		expect(usageLines).toHaveLength(3);
		for (const [i, line] of usageLines.entries()) {
			expect(line).toContain("provider=claude model=claude-sonnet-5-5");
			expect(line).toContain(`request-id=req_${i + 1}`);
		}
		expect(mutations.map((m) => m.name)).toEqual(["videos:recordAiFailure"]);
	});

	it("bounds the transcript fetch by the time left before the job deadline", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { deps, mutations, provider, raw } = fakeDeps({
			video: baseVideo({ transcript: undefined }),
		});
		raw.fetchTranscriptSegments.mockRejectedValueOnce(new Error("timed out"));
		const result = await runVideoPostJob(deps, "vid1", { deadlineAt: 1_000_000 + 60_000 });
		expect(raw.fetchTranscriptSegments).toHaveBeenCalledWith("vid1", 60_000);
		expect(result).toMatchObject({ status: "insufficient_source" });
		expect(mutations).toEqual([]);
		expect(provider.fetchImpl).not.toHaveBeenCalled();
	});

	it("does not save a transcript that arrives after the deadline", async () => {
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo({ transcript: undefined }) });
		let clock = 1_000_000;
		deps.now = () => clock;
		deps.fetchTranscriptSegments = async () => {
			clock = DEADLINE_AT + 1;
			return transcriptOfWords(400);
		};
		await expect(runVideoPostJob(deps, "vid1", { deadlineAt: DEADLINE_AT })).rejects.toThrow(
			/deadline/,
		);
		expect(mutations.map((m) => m.name)).not.toContain("videos:updateTranscript");
		expect(mutations.map((m) => m.name)).not.toContain("videos:publishPost");
		expect(provider.fetchImpl).not.toHaveBeenCalled();
	});

	it("fetches and saves a missing transcript before generating", async () => {
		const { deps, mutations, provider } = fakeDeps({
			video: baseVideo({ transcript: undefined }),
			fetchedTranscript: transcriptOfWords(400),
		});
		await runVideoPostJob(deps, "vid1", {});
		expect(mutations.map((m) => m.name)).toEqual(["videos:updateTranscript", "videos:publishPost"]);
		// The job's own transcript write raises the source version it expects at publish.
		expect(mutations[1].args.expectedSourceVersion).toBe(1);
		expect(provider.requests).toHaveLength(6);
	});

	it("publishes nothing and records one failure when the article fails", async () => {
		const { deps, mutations, provider } = fakeDeps(
			{ video: baseVideo() },
			fakeProvider({ article: `${validArticle()}\n\n# Slut\n\nAfslutning.` }),
		);
		await expect(runVideoPostJob(deps, "vid1", {})).rejects.toThrow(/article.*h1/);
		expect(provider.requests.map((r) => r.kind)).toEqual([
			"analysis",
			"fact_check",
			"judge",
			"article",
			"article",
			"article",
		]);
		expect(mutations.map((m) => m.name)).toEqual(["videos:recordAiFailure"]);
		expect(mutations[0].args).toEqual({ videoId: "vid1", issues: ["h1"] });
	});

	it("makes no mutation in dry-run mode", async () => {
		const { deps, mutations } = fakeDeps({
			video: baseVideo({ transcript: undefined }),
			fetchedTranscript: transcriptOfWords(400),
		});
		const result = await runVideoPostJob(deps, "vid1", { dryRun: true });
		expect(result).toMatchObject({
			status: "dry_run",
			analysis: validAnalysis(),
			article: validArticle(),
		});
		expect(mutations).toEqual([]);
	});

	it("dry-run failure records nothing", async () => {
		const { deps, mutations } = fakeDeps({ video: baseVideo() }, fakeProvider({ article: "kort" }));
		await expect(runVideoPostJob(deps, "vid1", { dryRun: true })).rejects.toThrow();
		expect(mutations).toEqual([]);
	});

	it("reports a stale guard without overwriting", async () => {
		const { deps, mutations } = fakeDeps({
			video: baseVideo(),
			publishResult: { status: "stale" },
		});
		const result = await runVideoPostJob(deps, "vid1", {});
		expect(result).toMatchObject({ status: "stale" });
		expect(mutations.map((m) => m.name)).toEqual(["videos:publishPost"]);
	});

	it("skips Shorts and short transcripts without a provider call", async () => {
		for (const video of [
			baseVideo({ durationSeconds: 90 }),
			baseVideo({ transcript: transcriptOfWords(299) }),
			baseVideo({ transcript: undefined }),
		]) {
			const { deps, mutations, provider } = fakeDeps({ video });
			const result = await runVideoPostJob(deps, "vid1", {});
			expect(result).toMatchObject({ status: "insufficient_source" });
			expect(provider.fetchImpl).not.toHaveBeenCalled();
			expect(mutations.filter((m) => m.name !== "videos:updateTranscript")).toEqual([]);
		}
	});

	it("records a per-video failure only for a request-specific HTTP 413", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { deps, mutations } = fakeDeps({ video: baseVideo() }, fakeProvider({ status: 413 }));
		await expect(runVideoPostJob(deps, "vid1", {})).rejects.toBeInstanceOf(LlmHttpError);
		expect(mutations).toEqual([
			{
				name: "videos:recordAiFailure",
				args: { videoId: "vid1", issues: ["provider_rejected_request"] },
			},
		]);
	});

	it("throws deployment-wide provider errors without touching the failure state", async () => {
		// 400 is also the spend-limit status: https://platform.claude.com/docs/en/api/errors
		const loud = vi.spyOn(console, "error").mockImplementation(() => {});
		const statuses = [400, 401, 403, 404, 422];
		for (const status of statuses) {
			const { deps, mutations } = fakeDeps({ video: baseVideo() }, fakeProvider({ status }));
			await expect(runVideoPostJob(deps, "vid1", {})).rejects.toBeInstanceOf(LlmHttpError);
			expect(mutations).toEqual([]);
		}
		expect(loud.mock.calls.map(([line]) => String(line))).toEqual(
			statuses.map((status) => expect.stringContaining(`HTTP ${status} x request-id req_err`)),
		);
	});

	it("throws a configuration error before any provider call", async () => {
		const { deps, mutations, provider } = fakeDeps({
			video: baseVideo(),
			env: { AI_PROVIDER: "claude" },
		});
		await expect(runVideoPostJob(deps, "vid1", {})).rejects.toBeInstanceOf(LlmConfigError);
		expect(provider.fetchImpl).not.toHaveBeenCalled();
		expect(mutations).toEqual([]);
	});

	it("skips a complete video unless forced", async () => {
		const { deps, provider } = fakeDeps({
			video: baseVideo({ processedAt: 5, article: validArticle() }),
		});
		expect(await runVideoPostJob(deps, "vid1", {})).toEqual({ status: "skipped" });
		expect(provider.fetchImpl).not.toHaveBeenCalled();
	});

	it("regenerates only the article from the stored analysis", async () => {
		const { deps, mutations, provider } = fakeDeps({
			video: baseVideo({ ...validAnalysis(), processedAt: 5, article: "gammel" }),
		});
		const result = await runVideoPostJob(deps, "vid1", { force: true, parts: "article" });
		expect(result).toMatchObject({ status: "published" });
		expect(provider.requests.map((r) => r.kind)).toEqual(["article", "fact_check", "judge"]);
		expect(mutations[0].args).toEqual({
			videoId: "vid1",
			expectedProcessedAt: 5,
			article: validArticle(),
			deadlineAt: DEADLINE_AT,
		});
	});

	it("stops an article-only rerun before any provider call when the stored analysis fails", async () => {
		const { deps, mutations, provider } = fakeDeps({
			video: baseVideo({
				...validAnalysis(),
				summary: "Videoen handler om fonde.",
				processedAt: 5,
				article: "gammel",
			}),
		});
		await expect(runVideoPostJob(deps, "vid1", { force: true, parts: "article" })).rejects.toThrow(
			/vid1 has an invalid stored analysis \(issues=summary_length,video_reference\); rerun with parts "all"/,
		);
		expect(provider.fetchImpl).not.toHaveBeenCalled();
		expect(mutations).toEqual([]);
	});

	it("feeds a thought dash back and publishes the corrected article", async () => {
		const dashed = validArticle().replace("Det holder de", "Det holder – de");
		const { deps, mutations, provider } = fakeDeps(
			{ video: baseVideo() },
			fakeProvider({ articles: [dashed, validArticle()] }),
		);
		const result = await runVideoPostJob(deps, "vid1", {});
		expect(result).toEqual({ status: "published", attempts: { analysis: 1, article: 2 } });
		const articles = provider.requests.filter((r) => r.kind === "article");
		expect(articles[0].user).not.toContain("Dit forrige forsøg");
		expect(articles[1].user).toContain("Brug ikke tankestreger (1 fundet:");
		expect(articles[1].user).toContain("holder – de");
		expect(mutations.map((m) => m.name)).toEqual(["videos:publishPost"]);
		expect(mutations[0].args.article).toBe(validArticle());
	});

	it("accepts a year from the transcript and rejects one that is not in the source", async () => {
		const analysis = { ...validAnalysis(), seoTitle: "Indeksfonde i 2019: kom godt i gang" };
		const transcript = [
			...transcriptOfWords(400),
			{ text: "i 2019 faldt kurserne", offset: 0, duration: 1 },
		];
		const supported = fakeDeps({ video: baseVideo({ transcript }) }, fakeProvider({ analysis }));
		expect(await runVideoPostJob(supported.deps, "vid1", {})).toMatchObject({
			status: "published",
		});
		const unsupported = fakeDeps({ video: baseVideo() }, fakeProvider({ analysis }));
		await expect(runVideoPostJob(unsupported.deps, "vid1", {})).rejects.toThrow(
			/analysis issues=unsupported_year/,
		);
		expect(unsupported.provider.requests.map((r) => r.kind)).toEqual([
			"analysis",
			"analysis",
			"analysis",
		]);
	});

	it("expects the source version it read at start when it publishes", async () => {
		const { deps, mutations } = fakeDeps({
			video: baseVideo({ sourceVersion: 4 }),
			publishResult: { status: "stale" },
		});
		expect(await runVideoPostJob(deps, "vid1", {})).toMatchObject({ status: "stale" });
		expect(mutations[0].args).toMatchObject({ expectedSourceVersion: 4 });
	});

	it("starts the 25-minute deadline when the job starts", async () => {
		expect(JOB_DEADLINE_MS).toBe(25 * 60_000);
		const { deps, mutations } = fakeDeps({ video: baseVideo() });
		deps.now = () => 7_000_000;
		await runVideoPostJob(deps, "vid1", {});
		expect(mutations[0].args.deadlineAt).toBe(7_000_000 + 25 * 60_000);
	});

	it("finishes and publishes work that takes more than ten minutes", async () => {
		vi.useFakeTimers();
		const provider = fakeProvider();
		const slowFetch = vi.fn(
			(url: string, init: RequestInit) =>
				new Promise<Response>((resolve) => {
					setTimeout(() => resolve(provider.fetchImpl(url, init)), 150_000);
				}),
		);
		const { deps, mutations } = fakeDeps({ video: baseVideo() });
		deps.fetchImpl = slowFetch;
		deps.now = () => Date.now();
		const start = Date.now();
		let settled = false;
		const job = runVideoPostJob(deps, "vid1", {}).finally(() => {
			settled = true;
		});
		while (!settled) await vi.advanceTimersByTimeAsync(10_000);
		expect(await job).toMatchObject({ status: "published" });
		expect(slowFetch).toHaveBeenCalledTimes(6);
		expect(Date.now() - start).toBeGreaterThan(10 * 60_000);
		expect(mutations.map((m) => m.name)).toEqual(["videos:publishPost"]);
		expect(mutations[0].args.deadlineAt).toBe(start + JOB_DEADLINE_MS);
	});

	it("returns not_found for an unknown video", async () => {
		const { deps } = fakeDeps({ video: null });
		expect(await runVideoPostJob(deps, "nope", {})).toEqual({ status: "not_found" });
	});
});

describe("runChannelDescriptionJob", () => {
	const channel = { channelId: "ch1", name: "Kanal", description: "Om penge", aiDescription: "gl" };

	it("publishes a valid description with the optimistic guard", async () => {
		const { deps, mutations, provider } = fakeDeps({ channel });
		const result = await runChannelDescriptionJob(deps, "ch1", {});
		expect(result).toMatchObject({ status: "published" });
		expect(provider.requests.map((r) => r.kind)).toEqual(["channel", "judge"]);
		expect(mutations).toEqual([
			{
				name: "channels:publishAiDescription",
				args: {
					channelId: "ch1",
					aiDescription: validChannelDescription(),
					expectedAiDescription: "gl",
					deadlineAt: DEADLINE_AT,
				},
			},
		]);
	});

	it("publishes nothing when the deadline passes before publish", async () => {
		const { deps, mutations, provider } = fakeDeps({ channel });
		deps.now = () => (provider.requests.length >= 2 ? DEADLINE_AT + 1 : 1_000_000);
		await expect(
			runChannelDescriptionJob(deps, "ch1", { deadlineAt: DEADLINE_AT }),
		).rejects.toThrow(/deadline/);
		expect(mutations).toEqual([]);
	});

	it("publishes nothing when the deadline passes after the judge returns", async () => {
		const { deps, mutations, provider } = fakeDeps({ channel });
		let readsAfterJudge = 0;
		deps.now = () => {
			if (provider.requests.length < 2) return 1_000_000;
			return readsAfterJudge++ === 0 ? DEADLINE_AT : DEADLINE_AT + 1;
		};
		await expect(
			runChannelDescriptionJob(deps, "ch1", { deadlineAt: DEADLINE_AT }),
		).rejects.toThrow(/not published.*deadline/);
		expect(readsAfterJudge).toBe(2);
		expect(mutations).toEqual([]);
	});

	it("publishes nothing when every attempt fails", async () => {
		const { deps, mutations } = fakeDeps(
			{ channel },
			fakeProvider({ channel: "Vi laver videoer om penge." }),
		);
		await expect(runChannelDescriptionJob(deps, "ch1", {})).rejects.toThrow(/channel/);
		expect(mutations).toEqual([]);
	});

	it("makes no mutation in dry-run mode", async () => {
		const { deps, mutations } = fakeDeps({ channel });
		const result = await runChannelDescriptionJob(deps, "ch1", { dryRun: true });
		expect(result).toMatchObject({ status: "dry_run", aiDescription: validChannelDescription() });
		expect(mutations).toEqual([]);
	});
});

function fakeScheduler() {
	const scheduled: Array<{ delay: number; name: string; args: Record<string, unknown> }> = [];
	return {
		scheduled,
		scheduler: {
			runAfter: vi.fn(async (delay: number, ref: unknown, args: Record<string, unknown>) => {
				scheduled.push({ delay, name: getFunctionName(ref as never), args });
			}),
		},
	};
}

// --- CLI helpers (fake deps) ---

describe("queueRepairs", () => {
	it("schedules only failing or missing posts, 30 s apart", async () => {
		const audits: Record<string, unknown> = {
			bad: { missing: false, findings: [{ part: "article", issues: ["h1"] }] },
			ok: { missing: false, findings: [] },
			empty: { missing: true },
			gone: null,
		};
		const runQuery = vi.fn(
			async (_ref: unknown, args: { videoId: string }) => audits[args.videoId],
		);
		const { scheduler, scheduled } = fakeScheduler();
		const receipts = await queueRepairs(
			{ runQuery: runQuery as never, scheduler: scheduler as never, log: vi.fn() },
			["bad", "ok", "empty", "gone"],
		);
		expect(receipts).toEqual([
			{ videoId: "bad", status: "scheduled", delayMs: 0, issues: ["h1"] },
			{ videoId: "ok", status: "valid" },
			{ videoId: "empty", status: "scheduled", delayMs: 30_000, issues: ["missing"] },
			{ videoId: "gone", status: "not_found" },
		]);
		expect(scheduled).toEqual([
			{ delay: 0, name: "aiPosts:rerunVideo", args: { target: { videoId: "bad" } } },
			{ delay: 30_000, name: "aiPosts:rerunVideo", args: { target: { videoId: "empty" } } },
		]);
	});

	it("refuses more than five targets", async () => {
		const { scheduler } = fakeScheduler();
		await expect(
			queueRepairs({ runQuery: vi.fn() as never, scheduler: scheduler as never }, [
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
			]),
		).rejects.toThrow(/at most 5/);
	});
});

describe("resolveVideoTarget", () => {
	it("passes a videoId through and resolves a slug", async () => {
		const runQuery = vi.fn(async (_ref: unknown, _args: unknown) => [
			{ videoId: "a", channelId: "ch1" },
		]);
		expect(await resolveVideoTarget({ runQuery } as never, { videoId: "x" })).toBe("x");
		expect(runQuery).not.toHaveBeenCalled();
		expect(await resolveVideoTarget({ runQuery } as never, { slug: "s" })).toBe("a");
		expect(getFunctionName(runQuery.mock.calls[0][0] as never)).toBe("videos:findBySlug");
		await resolveVideoTarget({ runQuery } as never, { slug: "s", channelId: "ch1" });
		expect(runQuery.mock.calls[1][1]).toEqual({ slug: "s", channelId: "ch1" });
	});
});
