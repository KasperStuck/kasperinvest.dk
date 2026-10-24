/// <reference types="vite/client" />

import { getFunctionName } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { judgeSchema, analysisSchema as videoAnalysisSchema } from "./lib/contentRules";
import schema from "./schema";
import {
	queueChannelDescriptionJobs,
	runAudit,
	sweepVideos,
	syncVideosForChannel,
} from "./youtube";

const modules = import.meta.glob("./**/*.*s");

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

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
			{ delay: 0, name: "aiPosts:generateVideoPost", args: { videoId: "v3" } },
			{ delay: 30_000, name: "aiPosts:generateVideoPost", args: { videoId: "v1" } },
			{ delay: 60_000, name: "aiPosts:generateVideoPost", args: { videoId: "v2" } },
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
			[0, "aiPosts:generateChannelDescription", "a"],
			[30_000, "aiPosts:generateChannelDescription", "b"],
			[60_000, "aiPosts:generateChannelDescription", "c"],
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

// --- Old entry points (Node wrappers that forward to aiPosts) ---

describe("old entry points", () => {
	async function scheduled(t: ReturnType<typeof convexTest>) {
		const jobs = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
		return jobs.map((job) => ({ name: job.name, args: job.args }));
	}

	it("schedule the aiPosts job with unchanged args for already-scheduled video and channel jobs", async () => {
		// Fake timers keep the forwarded jobs from running.
		vi.useFakeTimers();
		const t = convexTest(schema, modules);
		await t.action(internal.youtube.processNewVideo, { videoId: "a" });
		await t.action(internal.youtube.processVideo, { videoId: "b" });
		await t.action(internal.youtube.generateArticle, { videoId: "c" });
		await t.action(internal.youtube.generateChannelDescription, { channelId: "ch" });
		expect(await scheduled(t)).toEqual([
			{ name: "aiPosts:generateVideoPost", args: [{ videoId: "a" }] },
			{ name: "aiPosts:generateVideoPost", args: [{ videoId: "b" }] },
			{ name: "aiPosts:generateVideoPost", args: [{ videoId: "c" }] },
			{ name: "aiPosts:generateChannelDescription", args: [{ channelId: "ch" }] },
		]);
	});

	it("forward the old CLI commands to aiPosts and return their results", async () => {
		vi.useFakeTimers();
		vi.spyOn(console, "log").mockImplementation(() => {});
		const t = convexTest(schema, modules);
		expect(await t.action(internal.youtube.rerunVideo, { target: { videoId: "nope" } })).toEqual({
			status: "not_found",
		});
		expect(
			await t.action(internal.youtube.rerunChannelDescription, { channelId: "nope", dryRun: true }),
		).toEqual({ status: "not_found" });
		expect(await t.action(internal.youtube.regenerateInvalidPosts, { targets: ["gone"] })).toEqual([
			{ videoId: "gone", status: "not_found" },
		]);
		await t.run((ctx) =>
			ctx.db.insert("videos", {
				videoId: "v1",
				channelId: "ch1",
				title: "T",
				description: "",
				publishedAt: "2026-10-01T00:00:00Z",
				thumbnailUrl: "x",
			}),
		);
		expect(await t.action(internal.youtube.regenerateInvalidPosts, { targets: ["v1"] })).toEqual([
			{ videoId: "v1", status: "scheduled", delayMs: 0, issues: ["missing"] },
		]);
		expect(await scheduled(t)).toEqual([
			{ name: "aiPosts:rerunVideo", args: [{ target: { videoId: "v1" } }] },
		]);
	});
});
