/// <reference types="vite/client" />

import type { PaginationResult } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import {
	transcriptOfWords,
	VIDEO_TITLE,
	validAnalysis,
	validArticle,
} from "./lib/fixtures.testing";
import type { SweepRow } from "./lib/pipeline";
import schema from "./schema";
import { needsTranscript, saveTranscript } from "./videos";

const modules = import.meta.glob("./**/*.*s");
const newTest = () => convexTest(schema, modules);
type TestConvex = ReturnType<typeof newTest>;

const baseVideo = {
	videoId: "vid1",
	slug: "saadan-investerer-du",
	channelId: "ch1",
	title: VIDEO_TITLE,
	description: "Om indeksfonde.",
	publishedAt: "2026-10-01T10:00:00Z",
	thumbnailUrl: "https://i.ytimg.com/x.jpg",
	durationSeconds: 600,
};

// Fake timers keep scheduled actions (e.g. aiPosts.generateVideoPost after insert) from running.
beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

const openDeadline = () => Date.now() + 60_000;

async function seed(t: TestConvex, fields: Record<string, unknown> = {}) {
	await t.run((ctx) => ctx.db.insert("videos", { ...baseVideo, ...fields }));
}

async function load(t: TestConvex, videoId = "vid1") {
	return t.run((ctx) =>
		ctx.db
			.query("videos")
			.withIndex("by_videoId", (q) => q.eq("videoId", videoId))
			.unique(),
	);
}

describe("publishPost", () => {
	it("writes analysis and article together and clears the failure state", async () => {
		const t = newTest();
		await seed(t, { aiFailureCount: 2, aiLastFailedAt: 1, aiLastIssues: ["h1"] });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			analysis: validAnalysis(),
			article: validArticle(),
		});
		expect(result).toEqual({ status: "published" });
		const video = await load(t);
		expect(video).toMatchObject({ ...validAnalysis(), article: validArticle() });
		expect(video?.processedAt).toEqual(expect.any(Number));
		expect(video?.aiFailureCount).toBeUndefined();
		expect(video?.aiLastFailedAt).toBeUndefined();
		expect(video?.aiLastIssues).toBeUndefined();
	});

	it("rejects a stale write and keeps the stored post", async () => {
		const t = newTest();
		await seed(t, { ...validAnalysis(), article: "gammel", processedAt: 5 });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			expectedProcessedAt: 4,
			analysis: validAnalysis(),
			article: validArticle(),
		});
		expect(result).toEqual({ status: "stale" });
		expect((await load(t))?.article).toBe("gammel");
	});

	it("re-validates and rejects invalid content", async () => {
		const t = newTest();
		await seed(t, { article: "gammel" });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			analysis: { ...validAnalysis(), seoTitle: "kort" },
			article: `${validArticle()}\n\n# Slut\n\nAfslutning.`,
		});
		expect(result).toEqual({ status: "invalid", issues: ["seo_title_length", "h1"] });
		expect((await load(t))?.article).toBe("gammel");
	});

	it("publishes only the article on top of the stored analysis", async () => {
		const t = newTest();
		await seed(t, { ...validAnalysis(), article: "gammel", processedAt: 5 });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			expectedProcessedAt: 5,
			article: validArticle(),
		});
		expect(result).toEqual({ status: "published" });
		const video = await load(t);
		expect(video?.article).toBe(validArticle());
		expect(video?.seoTitle).toBe(validAnalysis().seoTitle);
		expect(video?.processedAt).not.toBe(5);
	});

	it("re-validates the stored analysis on an article-only publish", async () => {
		const t = newTest();
		const stale = { ...validAnalysis(), summary: "Videoen handler om fonde." };
		await seed(t, { ...stale, article: "gammel", processedAt: 5 });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			expectedProcessedAt: 5,
			article: validArticle(),
		});
		expect(result).toEqual({
			status: "invalid",
			issues: ["summary_length", "video_reference"],
		});
		const video = await load(t);
		expect(video?.article).toBe("gammel");
		expect(video?.processedAt).toBe(5);
	});

	it("rejects a thought dash in the article atomically and keeps the stored post", async () => {
		const t = newTest();
		await seed(t, { ...validAnalysis(), article: "gammel", processedAt: 5 });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			expectedProcessedAt: 5,
			analysis: { ...validAnalysis(), seoTitle: "En helt ny titel om indeksfonde" },
			article: validArticle().replace("Det holder de", "Det holder – de"),
		});
		expect(result).toEqual({ status: "invalid", issues: ["thought_dash"] });
		const video = await load(t);
		expect(video?.article).toBe("gammel");
		expect(video?.seoTitle).toBe(validAnalysis().seoTitle);
		expect(video?.processedAt).toBe(5);
	});

	it("never publishes an en dash in any field, literal or entity-encoded", async () => {
		const dashes = ["\u2013", "&ndash;", "&#8211;", "&#x2013;"];
		const analysis = validAnalysis();
		const fieldCases = (dash: string): Array<{ analysis?: object; article?: string }> => [
			{
				analysis: { ...analysis, summary: analysis.summary.replace(" og den", ` ${dash} og den`) },
			},
			{ analysis: { ...analysis, seoTitle: `Indeksfonde 2020${dash}2024: kom i gang` } },
			{
				analysis: {
					...analysis,
					seoDescription: analysis.seoDescription.replace(", hvad", ` ${dash} hvad`),
				},
			},
			{ analysis: { ...analysis, themes: ["indeksfonde", `Q1${dash}Q3`] } },
			{
				analysis: {
					...analysis,
					keyTakeaways: [
						`${analysis.keyTakeaways[0].slice(0, -1)} i 5${dash}6 år.`,
						...analysis.keyTakeaways.slice(1),
					],
				},
			},
			{
				analysis: {
					...analysis,
					faq: analysis.faq.map((f, i) =>
						i === 0 ? { ...f, question: `Hvad er en fond${dash}kort?` } : f,
					),
				},
			},
			{
				analysis: {
					...analysis,
					faq: analysis.faq.map((f, i) =>
						i === 1 ? { ...f, answer: `${f.answer.slice(0, -1)} i 5${dash}6 år.` } : f,
					),
				},
			},
			{ article: validArticle().replace("Det holder de", `Det holder 5${dash}6 de`) },
			{ article: validArticle().replace("## Hvad koster", `## 2020${dash}2024: hvad koster`) },
		];
		for (const dash of dashes) {
			for (const fields of fieldCases(dash)) {
				const t = newTest();
				await seed(t, { transcript: transcriptOfWords(400) });
				const result = await t.mutation(internal.videos.publishPost, {
					deadlineAt: openDeadline(),
					videoId: "vid1",
					analysis: validAnalysis(),
					article: validArticle(),
					...fields,
				} as never);
				expect(result, `${dash} ${JSON.stringify(fields).slice(0, 80)}`).toMatchObject({
					status: "invalid",
					issues: expect.arrayContaining(["thought_dash"]),
				});
				const video = await load(t);
				expect(JSON.stringify(video)).not.toMatch(/\u2013|&ndash;|&#8211;|&#x2013;/i);
			}
		}
	});

	it("checks years against the stored transcript", async () => {
		const t = newTest();
		await seed(t, {
			transcript: [{ text: "siden 2019 er renten steget", offset: 0, duration: 1 }],
		});
		const analysis = { ...validAnalysis(), seoTitle: "Indeksfonde i 2019: kom godt i gang" };
		expect(
			await t.mutation(internal.videos.publishPost, {
				deadlineAt: openDeadline(),
				videoId: "vid1",
				analysis: { ...analysis, seoTitle: "Indeksfonde i 2018: kom godt i gang" },
				article: validArticle(),
			}),
		).toEqual({ status: "invalid", issues: ["unsupported_year"] });
		expect(
			await t.mutation(internal.videos.publishPost, {
				deadlineAt: openDeadline(),
				videoId: "vid1",
				analysis,
				article: validArticle(),
			}),
		).toEqual({ status: "published" });
	});

	it("refuses an article-only publish without a stored analysis", async () => {
		const t = newTest();
		await seed(t);
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "vid1",
			article: validArticle(),
		});
		expect(result).toEqual({ status: "invalid", issues: ["analysis_missing"] });
	});

	it("rejects an article with HTML or links inside a Markdown table", async () => {
		const t = newTest();
		await seed(t, { article: "gammel" });
		for (const cell of ["<img src=x onerror=alert(1)>", "[klik](javascript:alert(1))"]) {
			const article = `${validArticle()}\n\n| Fond | Pris |\n| --- | --- |\n| ${cell} | Lav |\n\nDet var alt.`;
			const result = await t.mutation(internal.videos.publishPost, {
				deadlineAt: openDeadline(),
				videoId: "vid1",
				analysis: validAnalysis(),
				article,
			});
			expect(result).toMatchObject({ status: "invalid" });
			expect((result as { issues: string[] }).issues).toEqual(
				expect.arrayContaining([cell.startsWith("<") ? "html" : "url"]),
			);
		}
		expect((await load(t))?.article).toBe("gammel");
	});

	it("rejects a publish after the job deadline", async () => {
		const t = newTest();
		await seed(t, { article: "gammel" });
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: Date.now() - 1,
			videoId: "vid1",
			analysis: validAnalysis(),
			article: validArticle(),
		});
		expect(result).toEqual({ status: "deadline" });
		expect((await load(t))?.article).toBe("gammel");
	});

	it("returns not_found for an unknown video", async () => {
		const t = newTest();
		const result = await t.mutation(internal.videos.publishPost, {
			deadlineAt: openDeadline(),
			videoId: "nope",
			article: validArticle(),
		});
		expect(result).toEqual({ status: "not_found" });
	});
});

describe("recordAiFailure", () => {
	it("counts failures and keeps only issue codes", async () => {
		const t = newTest();
		await seed(t, { article: "gammel" });
		await t.mutation(internal.videos.recordAiFailure, { videoId: "vid1", issues: ["h1"] });
		await t.mutation(internal.videos.recordAiFailure, {
			videoId: "vid1",
			issues: ["word_count", "deadline"],
		});
		const video = await load(t);
		expect(video?.aiFailureCount).toBe(2);
		expect(video?.aiLastIssues).toEqual(["word_count", "deadline"]);
		expect(video?.aiLastFailedAt).toEqual(expect.any(Number));
		expect(video?.article).toBe("gammel");
	});
});

describe("insert", () => {
	it("is idempotent and schedules the pipeline once", async () => {
		const t = newTest();
		const first = await t.mutation(internal.videos.insert, baseVideo);
		const second = await t.mutation(internal.videos.insert, baseVideo);
		expect(second).toBe(first);
		const count = await t.run(async (ctx) => (await ctx.db.query("videos").collect()).length);
		expect(count).toBe(1);
		const scheduled = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
		expect(scheduled.map((job) => job.name)).toEqual(["aiPosts:generateVideoPost"]);
	});

	it("schedules the job after the given delay and does not store the delay", async () => {
		const t = newTest();
		const before = Date.now();
		await t.mutation(internal.videos.insert, { ...baseVideo, delayMs: 60_000 });
		const scheduled = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
		expect(scheduled[0].scheduledTime).toBe(before + 60_000);
		expect(await load(t)).not.toHaveProperty("delayMs");
	});
});

describe("updateStats", () => {
	it("fills a missing or zero duration once YouTube reports one", async () => {
		const t = newTest();
		await seed(t, { durationSeconds: 0, duration: "P0D" });
		await seed(t, { videoId: "vid2" });
		await t.run(async (ctx) => {
			const video = await ctx.db
				.query("videos")
				.withIndex("by_videoId", (q) => q.eq("videoId", "vid2"))
				.unique();
			if (video) await ctx.db.patch(video._id, { durationSeconds: undefined });
		});
		for (const videoId of ["vid1", "vid2"]) {
			await t.mutation(internal.videos.updateStats, {
				videoId,
				viewCount: 10,
				likeCount: 1,
				duration: "PT12M5S",
				durationSeconds: 725,
			});
		}
		expect(await load(t)).toMatchObject({
			duration: "PT12M5S",
			durationSeconds: 725,
			viewCount: 10,
		});
		expect(await load(t, "vid2")).toMatchObject({ durationSeconds: 725 });
	});

	it("keeps a stored positive duration and ignores a zero one", async () => {
		const t = newTest();
		await seed(t, { durationSeconds: 600, duration: "PT10M" });
		await seed(t, { videoId: "live", durationSeconds: 0, duration: "P0D" });
		await t.mutation(internal.videos.updateStats, {
			videoId: "vid1",
			viewCount: 1,
			likeCount: 1,
			duration: "PT11M",
			durationSeconds: 660,
		});
		await t.mutation(internal.videos.updateStats, {
			videoId: "live",
			viewCount: 1,
			likeCount: 1,
			duration: "P0D",
			durationSeconds: 0,
		});
		expect(await load(t)).toMatchObject({ durationSeconds: 600, duration: "PT10M" });
		expect(await load(t, "live")).toMatchObject({ durationSeconds: 0, duration: "P0D" });
	});
});

describe("updateTranscript", () => {
	it("stores a transcript", async () => {
		const t = newTest();
		await seed(t);
		await t.mutation(internal.videos.updateTranscript, {
			videoId: "vid1",
			transcript: transcriptOfWords(20),
		});
		expect((await load(t))?.transcript).toHaveLength(2);
	});
});

describe("listSweepPage", () => {
	it("returns projections without transcripts, page by page", async () => {
		const t = newTest();
		for (let i = 0; i < 5; i++) {
			await seed(t, {
				videoId: `v${i}`,
				transcript: i === 0 ? undefined : transcriptOfWords(i * 100),
				...(i === 4 ? { ...validAnalysis(), article: "x", processedAt: 1, aiFailureCount: 2 } : {}),
			});
		}
		const seen: string[] = [];
		let cursor: string | null = null;
		let isDone = false;
		let pages = 0;
		while (!isDone) {
			const result: PaginationResult<SweepRow> = await t.query(internal.videos.listSweepPage, {
				paginationOpts: { numItems: 2, cursor },
			});
			for (const row of result.page) {
				expect(row).not.toHaveProperty("transcript");
				expect(row).not.toHaveProperty("article");
				seen.push(row.videoId);
			}
			if (pages === 0) {
				expect(result.page[0]).toMatchObject({
					videoId: "v0",
					hasTranscript: false,
					transcriptWordCount: 0,
					isComplete: false,
					durationSeconds: 600,
				});
				expect(result.page[1]).toMatchObject({ hasTranscript: true, transcriptWordCount: 100 });
			}
			cursor = result.continueCursor;
			isDone = result.isDone;
			pages++;
		}
		expect(seen).toEqual(["v0", "v1", "v2", "v3", "v4"]);
		const last = await t.query(internal.videos.listSweepPage, {
			paginationOpts: { numItems: 10, cursor: null },
		});
		expect(last.page[4]).toMatchObject({ isComplete: true, aiFailureCount: 2 });
	});
});

describe("auditPage", () => {
	it("pages through every video once and reports failing and missing posts", async () => {
		const t = newTest();
		for (let i = 0; i < 5; i++) {
			await seed(t, {
				videoId: `v${i}`,
				slug: `slug-${i}`,
				transcript: transcriptOfWords(400),
				...(i % 2 === 0 ? { ...validAnalysis(), processedAt: 1, article: validArticle() } : {}),
				...(i === 2 ? { article: "## Kun en overskrift\n\nKort." } : {}),
			});
		}
		await seed(t, { videoId: "short", durationSeconds: 30 });
		const checked: number[] = [];
		const failing: unknown[] = [];
		const missing: string[] = [];
		let cursor: string | null = null;
		let isDone = false;
		while (!isDone) {
			const page: {
				checked: number;
				failing: unknown[];
				missing: string[];
				continueCursor: string;
				isDone: boolean;
			} = await t.query(internal.videos.auditPage, { paginationOpts: { numItems: 2, cursor } });
			checked.push(page.checked);
			failing.push(...page.failing);
			missing.push(...page.missing);
			cursor = page.continueCursor;
			isDone = page.isDone;
		}
		expect(checked.reduce((a, b) => a + b, 0)).toBe(6);
		expect(missing).toEqual(["v1", "v3"]);
		expect(failing).toEqual([
			{
				id: "v2",
				slug: "slug-2",
				part: "article",
				issues: ["too_few_sections", "word_count"],
			},
		]);
		expect(JSON.stringify(failing)).not.toContain("investering");
	});
});

describe("saveTranscript", () => {
	it("registers transcript maintenance as internal, not public", () => {
		for (const operation of [needsTranscript, saveTranscript]) {
			expect(operation).toHaveProperty("isInternal", true);
			expect(operation).not.toHaveProperty("isPublic");
		}
	});

	it("lists only missing transcript IDs without returning stored content", async () => {
		const t = newTest();
		await seed(t, { article: "Private generated text" });
		await seed(t, { videoId: "vid2", transcript: transcriptOfWords(20) });
		expect(await t.query(internal.videos.needsTranscript, {})).toEqual([{ videoId: "vid1" }]);
	});

	it("writes only when the video has no transcript", async () => {
		const t = newTest();
		await seed(t);
		await seed(t, { videoId: "vid2", transcript: transcriptOfWords(20) });
		await t.mutation(internal.videos.saveTranscript, {
			videoId: "vid1",
			transcript: transcriptOfWords(30),
		});
		await t.mutation(internal.videos.saveTranscript, {
			videoId: "vid2",
			transcript: transcriptOfWords(500),
		});
		expect((await load(t, "vid1"))?.transcript).toHaveLength(3);
		expect((await load(t, "vid2"))?.transcript).toHaveLength(2);
		expect((await load(t, "vid1"))?.sourceVersion).toBe(1);
		expect((await load(t, "vid2"))?.sourceVersion).toBeUndefined();
	});

	it("fills an empty transcript once, increments its source version and ignores a missing ID", async () => {
		const t = newTest();
		await seed(t, { transcript: [], sourceVersion: 4 });
		await t.mutation(internal.videos.saveTranscript, {
			videoId: "vid1",
			transcript: transcriptOfWords(30),
		});
		await t.mutation(internal.videos.saveTranscript, {
			videoId: "vid1",
			transcript: transcriptOfWords(50),
		});
		await t.mutation(internal.videos.saveTranscript, { videoId: "absent", transcript: [] });
		expect((await load(t))?.sourceVersion).toBe(5);
		expect((await load(t))?.transcript).toHaveLength(3);
		expect(await load(t, "absent")).toBeNull();
	});
});

describe("sourceVersion", () => {
	it("is raised by every transcript write", async () => {
		const t = newTest();
		await seed(t);
		expect(
			await t.mutation(internal.videos.updateTranscript, {
				videoId: "vid1",
				transcript: transcriptOfWords(30),
			}),
		).toEqual({ sourceVersion: 1 });
		expect(
			await t.mutation(internal.videos.updateTranscript, {
				videoId: "vid1",
				transcript: transcriptOfWords(40),
			}),
		).toEqual({ sourceVersion: 2 });
		expect((await load(t))?.sourceVersion).toBe(2);
		expect(
			await t.mutation(internal.videos.updateTranscript, { videoId: "nope", transcript: [] }),
		).toBeNull();
	});

	it("makes publishPost stale when the source changed after the job read it", async () => {
		const t = newTest();
		await seed(t, { transcript: transcriptOfWords(400), sourceVersion: 1 });
		await t.mutation(internal.videos.updateTranscript, {
			videoId: "vid1",
			transcript: transcriptOfWords(400),
		});
		const publish = (expectedSourceVersion?: number) =>
			t.mutation(internal.videos.publishPost, {
				deadlineAt: openDeadline(),
				videoId: "vid1",
				expectedSourceVersion,
				analysis: validAnalysis(),
				article: validArticle(),
			});
		expect(await publish(1)).toEqual({ status: "stale" });
		expect(await publish(undefined)).toEqual({ status: "stale" });
		expect((await load(t))?.article).toBeUndefined();
		expect(await publish(2)).toEqual({ status: "published" });
	});
});

describe("findBySlug", () => {
	it("finds the requested channel among more than ten matches", async () => {
		const t = newTest();
		for (let i = 0; i < 10; i++)
			await seed(t, { videoId: `a${i}`, slug: "same", channelId: "ch1" });
		await seed(t, { videoId: "b", slug: "same", channelId: "ch2" });
		expect(await t.query(internal.videos.findBySlug, { slug: "same", channelId: "ch2" })).toEqual([
			{ videoId: "b", channelId: "ch2" },
		]);
	});

	it("returns every match with its channel", async () => {
		const t = newTest();
		await seed(t, { videoId: "a", slug: "same", channelId: "ch1" });
		await seed(t, { videoId: "b", slug: "same", channelId: "ch2" });
		await seed(t, { videoId: "c", slug: "other" });
		expect(await t.query(internal.videos.findBySlug, { slug: "same" })).toEqual([
			{ videoId: "a", channelId: "ch1" },
			{ videoId: "b", channelId: "ch2" },
		]);
	});
});
