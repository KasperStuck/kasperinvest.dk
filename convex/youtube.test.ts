import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { judgeSchema, analysisSchema as videoAnalysisSchema } from "./lib/contentRules";
import {
	transcriptOfWords,
	VIDEO_TITLE,
	validAnalysis,
	validArticle,
	validChannelDescription,
} from "./lib/fixtures.testing";
import { LlmConfigError, LlmHttpError } from "./lib/llm";
import { JOB_DEADLINE_MS } from "./lib/pipeline";
import {
	type JobDeps,
	queueChannelDescriptionJobs,
	queueRepairs,
	resolveVideoTarget,
	runAudit,
	runChannelDescriptionJob,
	runVideoPostJob,
	sweepVideos,
	syncVideosForChannel,
} from "./youtube";

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

const DEADLINE_AT = 1_000_000 + JOB_DEADLINE_MS;

// --- judgeSchema ---

describe("judgeSchema", () => {
	const verdict = {
		score: 8,
		danish: true,
		topicMatch: true,
		sourceSupported: true,
		reason: "Godt skrevet",
	};

	it("accepts valid quality evaluation", () => {
		const result = judgeSchema.safeParse({ ...verdict, score: 9 });
		expect(result.success).toBe(true);
	});

	it("rejects score below 1", () => {
		const result = judgeSchema.safeParse({ ...verdict, score: 0 });
		expect(result.success).toBe(false);
	});

	it("rejects score above 10", () => {
		const result = judgeSchema.safeParse({ ...verdict, score: 11 });
		expect(result.success).toBe(false);
	});

	it("rejects missing reason", () => {
		const result = judgeSchema.safeParse({ ...verdict, reason: undefined });
		expect(result.success).toBe(false);
	});

	it("rejects missing score", () => {
		const result = judgeSchema.safeParse({ ...verdict, score: undefined });
		expect(result.success).toBe(false);
	});
});

// --- videoAnalysisSchema ---

describe("videoAnalysisSchema", () => {
	const validAnalysis = {
		summary: "En video om aktier og investering i danske markeder.",
		seoTitle: "Aktier i 2026: Sådan investerer du klogt",
		seoDescription: "Lær hvordan du investerer i aktier i 2026 med disse konkrete tips.",
		themes: ["aktier", "investering"],
		categories: ["aktier", "strategi"],
		keyTakeaways: ["Diversificér din portefølje", "Tænk langsigtet", "Hold omkostninger lave"],
		faq: [
			{ question: "Hvordan starter jeg med at investere?", answer: "Start med en bred ETF." },
			{ question: "Hvad er en ETF?", answer: "En fond der følger et indeks." },
		],
		relevanceScore: 85,
	};

	it("accepts a complete valid analysis", () => {
		const result = videoAnalysisSchema.safeParse(validAnalysis);
		expect(result.success).toBe(true);
	});

	it("rejects relevanceScore above 100", () => {
		const result = videoAnalysisSchema.safeParse({ ...validAnalysis, relevanceScore: 150 });
		expect(result.success).toBe(false);
	});

	it("rejects relevanceScore below 0", () => {
		const result = videoAnalysisSchema.safeParse({ ...validAnalysis, relevanceScore: -5 });
		expect(result.success).toBe(false);
	});

	it("rejects missing required fields", () => {
		const { summary: _, ...incomplete } = validAnalysis;
		const result = videoAnalysisSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it("rejects invalid FAQ structure", () => {
		const result = videoAnalysisSchema.safeParse({
			...validAnalysis,
			faq: [{ question: "test" }], // missing answer
		});
		expect(result.success).toBe(false);
	});

	it("accepts empty arrays for themes, categories, etc.", () => {
		const result = videoAnalysisSchema.safeParse({
			...validAnalysis,
			themes: [],
			categories: [],
			keyTakeaways: [],
			faq: [],
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-string themes", () => {
		const result = videoAnalysisSchema.safeParse({
			...validAnalysis,
			themes: [123, true],
		});
		expect(result.success).toBe(false);
	});

	it("rejects categories outside the enum", () => {
		const result = videoAnalysisSchema.safeParse({ ...validAnalysis, categories: ["ukendt"] });
		expect(result.success).toBe(false);
	});
});

// --- Video post and channel description jobs (fake deps, no Convex, no network) ---

type Call = { name: string; args: Record<string, unknown> };

function fakeProvider(
	options: { article?: string; channel?: string; status?: number; stopReason?: string } = {},
) {
	const requests: Array<{ kind: string }> = [];
	const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
		const body = JSON.parse(String(init.body));
		const schema = body.output_config?.format?.schema;
		const kind = schema?.properties?.score
			? "judge"
			: schema?.properties?.summary
				? "analysis"
				: body.system.includes("kanalbeskrivelse")
					? "channel"
					: "article";
		requests.push({ kind });
		if (options.status) {
			return new Response(JSON.stringify({ type: "error", error: { type: "x" } }), {
				status: options.status,
				headers: { "request-id": "req_err" },
			});
		}
		const text =
			kind === "judge"
				? JSON.stringify({
						score: 8,
						danish: true,
						topicMatch: true,
						sourceSupported: true,
						reason: "Fin",
					})
				: kind === "analysis"
					? JSON.stringify(validAnalysis())
					: kind === "channel"
						? (options.channel ?? validChannelDescription())
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
			return null;
		}),
		env: state.env ?? { AI_PROVIDER: "claude", ANTHROPIC_API_KEY: "test-key" },
		fetchImpl: provider.fetchImpl,
		now: () => 1_000_000,
		sleep: async () => {},
		fetchTranscriptSegments: vi.fn(async () => state.fetchedTranscript ?? []),
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
	it("publishes analysis and article in exactly one mutation", async () => {
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo({ processedAt: 5 }) });
		const result = await runVideoPostJob(deps, "vid1", { force: true });
		expect(result).toMatchObject({ status: "published" });
		expect(provider.requests.map((r) => r.kind)).toEqual(["analysis", "judge", "article", "judge"]);
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
		deps.now = () => (provider.requests.length >= 4 ? DEADLINE_AT + 1 : 1_000_000);
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
			if (provider.requests.length < 4) return 1_000_000;
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

	it("aborts the transcript fetch at the job deadline", async () => {
		vi.useFakeTimers();
		const { deps, mutations, provider } = fakeDeps({ video: baseVideo({ transcript: undefined }) });
		const start = Date.now();
		deps.now = () => Date.now();
		const signals: AbortSignal[] = [];
		deps.fetchTranscriptSegments = (_videoId, signal) => {
			signals.push(signal);
			return new Promise((_resolve, reject) => {
				signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
			});
		};
		const promise = runVideoPostJob(deps, "vid1", { deadlineAt: start + 60_000 });
		await vi.advanceTimersByTimeAsync(0);
		expect(signals[0]).toBeInstanceOf(AbortSignal);
		expect(signals[0].aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(60_000);
		expect(signals[0].aborted).toBe(true);
		expect(await promise).toMatchObject({ status: "insufficient_source" });
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
		expect(provider.requests).toHaveLength(4);
	});

	it("publishes nothing and records one failure when the article fails", async () => {
		const { deps, mutations, provider } = fakeDeps(
			{ video: baseVideo() },
			fakeProvider({ article: `${validArticle()}\n\n# Slut\n\nAfslutning.` }),
		);
		await expect(runVideoPostJob(deps, "vid1", {})).rejects.toThrow(/article.*h1/);
		expect(provider.requests.map((r) => r.kind)).toEqual([
			"analysis",
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
		expect(provider.requests.map((r) => r.kind)).toEqual(["article", "judge"]);
		expect(mutations[0].args).toEqual({
			videoId: "vid1",
			expectedProcessedAt: 5,
			article: validArticle(),
			deadlineAt: DEADLINE_AT,
		});
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

// --- Sweep and fan-out (fake scheduler) ---

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

describe("sweepVideos", () => {
	const HOUR = 60 * 60_000;
	const NOW = Date.UTC(2026, 9, 21, 1);
	const sweepRow = (id: number, overrides: Record<string, unknown> = {}) => ({
		videoId: `v${id}`,
		publishedAt: `2026-09-${String(id).padStart(2, "0")}T00:00:00Z`,
		_creationTime: NOW - 2 * HOUR,
		hasTranscript: true,
		transcriptWordCount: 500,
		isComplete: false,
		durationSeconds: 600,
		...overrides,
	});

	it("pages through all videos and queues staggered jobs", async () => {
		const pages = [
			{
				page: [sweepRow(1), sweepRow(2, { hasTranscript: false })],
				isDone: false,
				continueCursor: "c1",
			},
			{
				page: [sweepRow(3), sweepRow(4, { isComplete: true })],
				isDone: true,
				continueCursor: "c2",
			},
		];
		const cursors: unknown[] = [];
		const runQuery = vi.fn(async (ref: unknown, args: { paginationOpts: { cursor: unknown } }) => {
			expect(getFunctionName(ref as never)).toBe("videos:listSweepPage");
			cursors.push(args.paginationOpts.cursor);
			return pages.shift();
		});
		const { scheduler, scheduled } = fakeScheduler();
		const log = vi.fn();
		const result = await sweepVideos({
			runQuery: runQuery as never,
			scheduler: scheduler as never,
			now: () => NOW,
			log,
		});
		expect(cursors).toEqual([null, "c1"]);
		expect(result).toEqual({ queued: 3 });
		// Post-ready videos first; the video without transcript fills the remaining slot and
		// gets the same full job, which fetches the transcript first.
		expect(scheduled).toEqual([
			{ delay: 0, name: "youtube:processNewVideo", args: { videoId: "v3" } },
			{ delay: 30_000, name: "youtube:processNewVideo", args: { videoId: "v1" } },
			{ delay: 60_000, name: "youtube:processNewVideo", args: { videoId: "v2" } },
		]);
		expect(log.mock.calls.join("\n")).toContain("queued 3");
	});

	it("continues the stagger of the sync's new-video jobs", async () => {
		const runQuery = vi.fn(async () => ({
			page: [sweepRow(1), sweepRow(2)],
			isDone: true,
			continueCursor: "c",
		}));
		const { scheduler, scheduled } = fakeScheduler();
		// Two new-video jobs of the same syncAllChannels run already hold delays 0 and 30 s.
		const stagger = { queued: 2 };
		await sweepVideos({
			runQuery: runQuery as never,
			scheduler: scheduler as never,
			now: () => NOW,
			log: vi.fn(),
			stagger,
		});
		expect(scheduled.map((s) => [s.delay, s.args.videoId])).toEqual([
			[60_000, "v2"],
			[90_000, "v1"],
		]);
		expect(stagger).toEqual({ queued: 4 });
	});
});

describe("queueChannelDescriptionJobs", () => {
	it("schedules one staggered job per channel", async () => {
		const runQuery = vi.fn(async () => [
			{ channelId: "a", name: "A" },
			{ channelId: "b", name: "B" },
			{ channelId: "c", name: "C" },
		]);
		const { scheduler, scheduled } = fakeScheduler();
		const result = await queueChannelDescriptionJobs({
			runQuery: runQuery as never,
			scheduler: scheduler as never,
			log: vi.fn(),
		});
		expect(result).toEqual({ queued: 3 });
		expect(scheduled.map((s) => [s.delay, s.name, s.args.channelId])).toEqual([
			[0, "youtube:generateChannelDescription", "a"],
			[30_000, "youtube:generateChannelDescription", "b"],
			[60_000, "youtube:generateChannelDescription", "c"],
		]);
	});
});

describe("syncVideosForChannel", () => {
	it("staggers new-video jobs across all channels of one run", async () => {
		vi.stubEnv("YOUTUBE_API_KEY", "test-yt-key");
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string) => {
				const params = new URL(url).searchParams;
				if (url.includes("/playlistItems?")) {
					const ids = params.get("playlistId") === "UU1" ? ["a1", "a2"] : ["b1"];
					return Response.json({
						items: ids.map((videoId) => ({ snippet: { resourceId: { videoId } } })),
					});
				}
				return Response.json({
					items: (params.get("id") ?? "").split(",").map((id) => ({
						id,
						snippet: { title: `Video ${id}`, publishedAt: "2026-10-01T00:00:00Z", thumbnails: {} },
						contentDetails: { duration: "PT10M" },
					})),
				});
			}),
		);
		const inserts: Array<Record<string, unknown>> = [];
		const ctx = {
			runQuery: vi.fn(async (ref: unknown, args: Record<string, unknown>) => {
				const name = getFunctionName(ref as never);
				if (name === "channels:getByChannelId") {
					return { uploadsPlaylistId: args.channelId === "ch1" ? "UU1" : "UU2" };
				}
				return null;
			}),
			runMutation: vi.fn(async (ref: unknown, args: Record<string, unknown>) => {
				if (getFunctionName(ref as never) === "videos:insert") inserts.push(args);
			}),
		};
		vi.spyOn(console, "log").mockImplementation(() => {});
		const stagger = { queued: 0 };
		await syncVideosForChannel(ctx as never, "ch1", 50, stagger);
		await syncVideosForChannel(ctx as never, "ch2", 50, stagger);
		expect(inserts.map((args) => [args.videoId, args.delayMs])).toEqual([
			["a1", 0],
			["a2", 30_000],
			["b1", 60_000],
		]);
	});
});

// --- CLI commands (fake deps) ---

describe("runAudit", () => {
	it("reads one clamped page per table without writes or provider calls", async () => {
		vi.stubGlobal("fetch", () => {
			throw new Error("no network in audit");
		});
		const page = { checked: 0, failing: [], missing: [], continueCursor: "c", isDone: true };
		const runQuery = vi.fn(async (_ref: unknown, _args: unknown) => page);
		const runMutation = vi.fn();
		const deps = { runQuery, runMutation } as never;

		expect(await runAudit(deps, { table: "videos", pageSize: 100 })).toBe(page);
		await runAudit(deps, { table: "channels", cursor: "abc" });
		expect(runQuery.mock.calls.map(([ref, args]) => [getFunctionName(ref as never), args])).toEqual(
			[
				["videos:auditPage", { paginationOpts: { numItems: 25, cursor: null } }],
				["channels:auditPage", { paginationOpts: { numItems: 10, cursor: "abc" } }],
			],
		);
		expect(runMutation).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});

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
			{ delay: 0, name: "youtube:rerunVideo", args: { target: { videoId: "bad" } } },
			{ delay: 30_000, name: "youtube:rerunVideo", args: { target: { videoId: "empty" } } },
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
