import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	transcriptOfWords,
	VIDEO_TITLE,
	validAnalysis,
	validArticle,
} from "../convex/lib/fixtures.testing";
import { RULESET_VERSION } from "../convex/lib/style";
import {
	ALLOWED_FUNCTIONS,
	CHANNEL_SCAN_LIMIT,
	convexArgs,
	createConvexSource,
	createOfflineSource,
	type Options,
	parseArgs,
	type Runner,
	renderVisiblePost,
	resolveOutDir,
	runSample,
	SWEEP_PAGE_SIZE,
} from "./content-sample";

const SENTINEL = "SENTINEL-7f3a-transcript";

beforeEach(() => {
	vi.stubGlobal("fetch", () => {
		throw new Error("real fetch must not be used in tests");
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

/** A stored video post: valid by default, transcript with the sentinel. */
function doc(i: number, overrides: Record<string, unknown> = {}) {
	return {
		_id: `id${i}`,
		_creationTime: 1_700_000_000_000 + i,
		videoId: `v${i}`,
		slug: `video-${i}`,
		channelId: "ch1",
		title: VIDEO_TITLE,
		description: "Om indeksfonde.",
		publishedAt: `2026-09-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
		thumbnailUrl: "https://i.ytimg.com/x.jpg",
		durationSeconds: 600,
		transcript: [{ text: SENTINEL, offset: 0, duration: 1 }, ...transcriptOfWords(400)],
		...validAnalysis(),
		article: validArticle(),
		processedAt: 1_760_000_000_000,
		...overrides,
	};
}

const DASHED = validArticle().replace("Det holder de", "Det holder – de");

function sweepRow(video: ReturnType<typeof doc>) {
	return {
		videoId: video.videoId,
		publishedAt: video.publishedAt,
		_creationTime: video._creationTime,
		hasTranscript: Boolean(video.transcript?.length),
		transcriptWordCount: 401,
		isComplete: video.processedAt !== undefined && Boolean(video.article),
		durationSeconds: video.durationSeconds,
	};
}

/** Fake `convex run`: answers the allowed functions from `videos`, records every argv. */
function fakeRunner(videos: Array<ReturnType<typeof doc>>, options: { pageSize?: number } = {}) {
	const calls: string[][] = [];
	const pageSize = options.pageSize ?? SWEEP_PAGE_SIZE;
	const runner: Runner = vi.fn(async (args: string[]) => {
		calls.push(args);
		const [, name, json] = args;
		const input = JSON.parse(json);
		const out = (value: unknown) => ({
			code: 0,
			stdout: value === null ? "" : `${JSON.stringify(value, null, 2)}\n`,
		});
		if (name === "videos:listSweepPage") {
			const start = input.paginationOpts.cursor ? Number(input.paginationOpts.cursor) : 0;
			const page = videos.slice(start, start + pageSize).map(sweepRow);
			const next = start + pageSize;
			return out({ page, isDone: next >= videos.length, continueCursor: String(next) });
		}
		if (name === "videos:getByVideoId") {
			return out(videos.find((v) => v.videoId === input.videoId) ?? null);
		}
		if (name === "videos:listByChannel") {
			return out(videos.filter((v) => v.channelId === input.channelId).slice(0, input.limit));
		}
		if (name === "channels:getByChannelId") {
			return out(
				input.channelId === "ch1"
					? { channelId: "ch1", name: "Kanal Et", customUrl: "@kanalet", uploadsPlaylistId: "U" }
					: null,
			);
		}
		throw new Error(`unexpected ${name}`);
	});
	return { runner, calls };
}

function options(overrides: Partial<Options> = {}): Options {
	return {
		mode: { kind: "live", selector: { kind: "prod" } },
		n: 3,
		seed: "1",
		failingOnly: false,
		eligibleOnly: false,
		...overrides,
	};
}

let dirs: string[] = [];

async function tempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "content-sample-test-"));
	dirs.push(dir);
	return dir;
}

afterEach(async () => {
	for (const dir of dirs) await rm(dir, { recursive: true, force: true });
	dirs = [];
});

async function readAll(dir: string): Promise<string> {
	const files = await readdir(dir);
	const contents = await Promise.all(files.map((file) => readFile(join(dir, file), "utf8")));
	return contents.join("\n");
}

async function sample(
	videos: Array<ReturnType<typeof doc>>,
	opts: Partial<Options> = {},
	runnerOptions: { pageSize?: number } = {},
) {
	const { runner, calls } = fakeRunner(videos, runnerOptions);
	const outDir = await tempDir();
	const lines: string[] = [];
	const source = createConvexSource({ kind: "prod" }, runner, {});
	const result = await runSample(options(opts), source, {
		outDir,
		now: () => new Date("2026-10-24T08:00:00Z"),
		gitRevision: "abc123",
		log: (line) => lines.push(line),
	});
	return { result, calls, outDir, lines };
}

describe("parseArgs", () => {
	it("needs exactly one source and maps the deployment flags", () => {
		expect(parseArgs(["--prod"]).mode).toEqual({ kind: "live", selector: { kind: "prod" } });
		expect(parseArgs(["--dev"]).mode).toEqual({ kind: "live", selector: { kind: "dev" } });
		expect(parseArgs(["--deployment-name", "amicable-goshawk-655"]).mode).toEqual({
			kind: "live",
			selector: { kind: "deployment", name: "amicable-goshawk-655" },
		});
		expect(parseArgs(["--input", "a.jsonl", "--channels-input", "c.jsonl"]).mode).toEqual({
			kind: "offline",
			input: "a.jsonl",
			channelsInput: "c.jsonl",
		});
		expect(() => parseArgs([])).toThrow(/exactly one of --prod, --dev, --deployment-name/);
		expect(() => parseArgs(["--prod", "--dev"])).toThrow(/exactly one/);
		expect(() => parseArgs(["--prod", "--input", "a"])).toThrow(/exactly one/);
		expect(() => parseArgs(["--deployment-name"])).toThrow(/--deployment-name needs/);
		expect(() => parseArgs(["--prod", "--channels-input", "c"])).toThrow(/--input/);
	});

	it("parses count, seed and filters with defaults", () => {
		const parsed = parseArgs([
			"--dev",
			"--n",
			"25",
			"--seed",
			"20261024",
			"--channel",
			"UC123",
			"--from",
			"2026-01-01",
			"--to",
			"2026-06-30",
			"--failing-only",
			"--eligible-only",
			"--min-relevance",
			"40",
			"--out",
			".content-research/x",
		]);
		expect(parsed).toEqual({
			mode: { kind: "live", selector: { kind: "dev" } },
			n: 25,
			seed: "20261024",
			channel: "UC123",
			from: "2026-01-01",
			to: "2026-06-30",
			failingOnly: true,
			eligibleOnly: true,
			minRelevance: 40,
			out: ".content-research/x",
		});
		const defaults = parseArgs(["--prod"]);
		expect(defaults.n).toBe(10);
		expect(defaults.seed).toMatch(/^\d+$/);
	});

	it("rejects bad values and unknown flags", () => {
		expect(() => parseArgs(["--prod", "--n", "0"])).toThrow(/--n/);
		expect(() => parseArgs(["--prod", "--n", "101"])).toThrow(/--n/);
		expect(() => parseArgs(["--prod", "--n", "2.5"])).toThrow(/--n/);
		expect(() => parseArgs(["--prod", "--from", "2026-13-01"])).toThrow(/--from/);
		expect(() => parseArgs(["--prod", "--to", "1. maj"])).toThrow(/--to/);
		expect(() => parseArgs(["--prod", "--min-relevance", "x"])).toThrow(/--min-relevance/);
		expect(() => parseArgs(["--prod", "--channel", "@kanal"])).toThrow(/channel id/);
		expect(() => parseArgs(["--prod", "--push"])).toThrow(/Unknown argument --push/);
	});

	it("takes an ordered id cohort without random filters", () => {
		expect(parseArgs(["--prod", "--ids", "b, a ,c"])).toMatchObject({ ids: ["b", "a", "c"] });
		expect(() => parseArgs(["--prod", "--ids", "a", "--failing-only"])).toThrow(/--ids/);
		expect(() => parseArgs(["--prod", "--ids", "a", "--n", "2"])).toThrow(/--ids/);
	});
});

describe("convex transport", () => {
	it("builds read-only argv for the allowed functions and each deployment selector", () => {
		expect(convexArgs({ kind: "prod" }, "videos:getByVideoId", { videoId: "a" })).toEqual([
			"run",
			"videos:getByVideoId",
			'{"videoId":"a"}',
			"--prod",
		]);
		expect(convexArgs({ kind: "dev" }, "channels:getByChannelId", { channelId: "c" })).toEqual([
			"run",
			"channels:getByChannelId",
			'{"channelId":"c"}',
		]);
		expect(
			convexArgs({ kind: "deployment", name: "x-y-1" }, "videos:listByChannel", {
				channelId: "c",
				limit: 5,
			}),
		).toEqual([
			"run",
			"videos:listByChannel",
			'{"channelId":"c","limit":5}',
			"--deployment-name",
			"x-y-1",
		]);
		expect([...ALLOWED_FUNCTIONS].sort()).toEqual([
			"channels:getByChannelId",
			"videos:getByVideoId",
			"videos:listByChannel",
			"videos:listSweepPage",
		]);
	});

	it("refuses any other function before spawning", () => {
		for (const name of [
			"youtube:rerunVideo",
			"videos:publishPost",
			"videos:resetAllProcessing",
			"youtube:auditContent",
		]) {
			expect(() => convexArgs({ kind: "prod" }, name as never, {})).toThrow(/not allowed/);
		}
	});

	it("refuses to run when CONVEX_DEPLOY_KEY is set", () => {
		const runner = vi.fn();
		expect(() => createConvexSource({ kind: "prod" }, runner, { CONVEX_DEPLOY_KEY: "x" })).toThrow(
			/CONVEX_DEPLOY_KEY/,
		);
		expect(runner).not.toHaveBeenCalled();
	});

	it("reads an empty stdout as a missing document only for get functions", async () => {
		const runner: Runner = vi.fn(async () => ({ code: 0, stdout: "" }));
		const source = createConvexSource({ kind: "prod" }, runner, {});
		expect(await source.getVideo("gone")).toBeNull();
		expect(await source.getChannel("gone")).toBeNull();
		await expect(source.listPopulation()).rejects.toThrow(
			"convex run videos:listSweepPage returned no output",
		);
	});

	it("fails without echoing stdout or stderr", async () => {
		const failing: Runner = async () => ({ code: 1, stdout: SENTINEL });
		await expect(createConvexSource({ kind: "prod" }, failing, {}).getVideo("a")).rejects.toThrow(
			/^convex run videos:getByVideoId failed \(exit 1\)/,
		);
		const garbage: Runner = async () => ({ code: 0, stdout: `{${SENTINEL}` });
		const error = await createConvexSource({ kind: "prod" }, garbage, {})
			.getVideo("a")
			.catch((e: Error) => e);
		expect(String(error)).toContain("returned invalid JSON");
		expect(String(error)).not.toContain(SENTINEL);
		const wrongShape: Runner = async () => ({
			code: 0,
			stdout: JSON.stringify({ videoId: 5, transcript: [{ text: SENTINEL }] }),
		});
		const shapeError = await createConvexSource({ kind: "prod" }, wrongShape, {})
			.getVideo("a")
			.catch((e: Error) => e);
		expect(String(shapeError)).toMatch(/unexpected shape \(fields: .*videoId/);
		expect(String(shapeError)).not.toContain(SENTINEL);
	});
});

describe("runSample (live, fake transport)", () => {
	it("pages past 1000 videos and only calls allowed functions with safe argv", async () => {
		const videos = Array.from({ length: 1030 }, (_, i) => doc(i));
		const { result, calls } = await sample(videos, { n: 2 });
		const pages = calls.filter((args) => args[1] === "videos:listSweepPage");
		expect(pages).toHaveLength(Math.ceil(1030 / SWEEP_PAGE_SIZE));
		expect(JSON.parse(pages[1][2])).toEqual({
			paginationOpts: { numItems: SWEEP_PAGE_SIZE, cursor: String(SWEEP_PAGE_SIZE) },
		});
		expect(result.population.total).toBe(1030);
		for (const args of calls) {
			expect(args[0]).toBe("run");
			expect(ALLOWED_FUNCTIONS.has(args[1] as never)).toBe(true);
			expect(args.slice(3)).toEqual(["--prod"]);
			for (const flag of ["--push", "--watch", "--identity", "--component"]) {
				expect(args).not.toContain(flag);
			}
		}
	});

	it("is deterministic per seed and dedupes ids across pages", async () => {
		const videos = Array.from({ length: 40 }, (_, i) => doc(i));
		const first = await sample(videos, { n: 5, seed: "42" });
		const again = await sample(videos, { n: 5, seed: "42" });
		const other = await sample(videos, { n: 5, seed: "43" });
		expect(first.result.selected).toEqual(again.result.selected);
		expect(first.result.selected).not.toEqual(other.result.selected);
		expect(new Set(first.result.selected).size).toBe(5);
		const duplicated = [...videos.slice(0, 3), videos[0], videos[1]];
		const deduped = await sample(duplicated, { n: 10 }, { pageSize: 2 });
		expect(deduped.result.population.total).toBe(3);
		expect([...deduped.result.selected].sort()).toEqual(["v0", "v1", "v2"]);
	});

	it("skips deleted documents and reports fewer matches than requested", async () => {
		const videos = [doc(1), doc(2), doc(3, { article: undefined })];
		const { runner } = fakeRunner(videos);
		const deleting: Runner = async (args) =>
			args[1] === "videos:getByVideoId" && args[2].includes('"v2"')
				? { code: 0, stdout: "" }
				: runner(args);
		const outDir = await tempDir();
		const result = await runSample(
			options({ n: 5 }),
			createConvexSource({ kind: "prod" }, deleting, {}),
			{ outDir, now: () => new Date(0), gitRevision: "x", log: () => {} },
		);
		expect(result.selected).toEqual(["v1"]);
		expect(result.counts).toMatchObject({ read: 2, missing: 1, selected: 1 });
		const report = await readFile(join(outDir, "report.md"), "utf8");
		expect(report).toContain("1 af 5 ønskede indlæg");
	});

	it("filters by date, eligibility, relevance and failing local rules", async () => {
		const videos = [
			doc(1, { publishedAt: "2025-12-31T23:00:00Z" }),
			doc(2, { publishedAt: "2026-01-15T10:00:00Z" }),
			doc(3, { publishedAt: "2026-01-20T10:00:00Z", durationSeconds: 60 }),
			doc(4, { publishedAt: "2026-01-21T10:00:00Z", relevanceScore: 30, article: DASHED }),
			doc(5, { publishedAt: "2026-01-22T10:00:00Z", article: DASHED }),
			doc(6, { publishedAt: "2026-02-01T10:00:00Z" }),
		];
		const dated = await sample(videos, { n: 10, from: "2026-01-01", to: "2026-01-31" });
		expect([...dated.result.selected].sort()).toEqual(["v2", "v3", "v4", "v5"]);
		const eligible = await sample(videos, {
			n: 10,
			from: "2026-01-01",
			to: "2026-01-31",
			eligibleOnly: true,
		});
		expect([...eligible.result.selected].sort()).toEqual(["v2", "v4", "v5"]);
		const relevant = await sample(videos, { n: 10, minRelevance: 40 });
		expect(relevant.result.selected).not.toContain("v4");
		const failing = await sample(videos, { n: 10, failingOnly: true });
		expect([...failing.result.selected].sort()).toEqual(["v4", "v5"]);
	});

	it("samples one channel through the indexed listByChannel query", async () => {
		const videos = [doc(1), doc(2, { channelId: "ch2" }), doc(3)];
		const { result, calls } = await sample(videos, { n: 10, channel: "ch1" });
		expect([...result.selected].sort()).toEqual(["v1", "v3"]);
		const byChannel = calls.filter((args) => args[1] === "videos:listByChannel");
		expect(byChannel.map((args) => JSON.parse(args[2]))).toEqual([
			{ channelId: "ch1", limit: CHANNEL_SCAN_LIMIT },
		]);
		expect(calls.some((args) => args[1] === "videos:getByVideoId")).toBe(false);
	});

	it("keeps the order of an id cohort", async () => {
		const videos = [doc(1), doc(2), doc(3)];
		const { result } = await sample(videos, { ids: ["v3", "v1", "nope"], n: 3 });
		expect(result.selected).toEqual(["v3", "v1"]);
		expect(result.counts.missing).toBe(1);
	});

	it("writes review files in page order, metrics, manifest and targets in fives", async () => {
		const failing = Array.from({ length: 7 }, (_, i) => doc(i, { article: DASHED }));
		const others = [
			doc(10, { article: DASHED, relevanceScore: 20 }),
			doc(11, { article: DASHED, durationSeconds: 45 }),
			doc(12),
		];
		const { result, outDir, lines } = await sample([...failing, ...others], { n: 10 });
		const files = (await readdir(outDir)).sort();
		expect(files).toEqual(
			expect.arrayContaining(["manifest.json", "metrics.json", "report.md", "targets.txt"]),
		);
		expect(files.filter((f) => f.endsWith(".md") && f !== "report.md")).toHaveLength(10);

		const targets = (await readFile(join(outDir, "targets.txt"), "utf8")).trim().split("\n");
		expect(targets.map((line) => JSON.parse(line).length)).toEqual([5, 2]);
		expect(targets.join()).not.toMatch(/v1[012]/);

		const post = await readFile(
			join(outDir, files.find((f) => f.includes("video-0")) ?? ""),
			"utf8",
		);
		const order = [
			"Kanal Et",
			"## SEO",
			validAnalysis().summary,
			"## Hovedpointer",
			"## Hvad koster",
			"## Ofte stillede spørgsmål",
			"## Stikprøve-noter",
		];
		const positions = order.map((text) => post.indexOf(text));
		expect(positions.every((p) => p >= 0)).toBe(true);
		expect([...positions].sort((a, b) => a - b)).toEqual(positions);
		expect(post).toContain("/youtube/kanalet/video-0");
		expect(post).toContain("thought_dash");
		expect(post).toContain("holder – de");

		const flagged = await readFile(
			join(outDir, files.find((f) => f.includes("video-10")) ?? ""),
			"utf8",
		);
		expect(flagged).toContain("low_relevance");
		const short = await readFile(
			join(outDir, files.find((f) => f.includes("video-11")) ?? ""),
			"utf8",
		);
		expect(short).toContain("old_short_post");

		const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
		expect(manifest).toMatchObject({
			rulesetVersion: RULESET_VERSION,
			origin: "requested --prod",
			seed: "1",
			gitRevision: "abc123",
		});
		expect(manifest.posts).toHaveLength(10);
		expect(manifest.posts[0]).toEqual({
			videoId: expect.any(String),
			processedAt: 1_760_000_000_000,
		});

		const metrics = JSON.parse(await readFile(join(outDir, "metrics.json"), "utf8"));
		expect(metrics.sample.errorPosts.thought_dash).toBe(9);
		expect(metrics.population).toMatchObject({ total: 10, withPost: 10, shortsWithPost: 1 });
		const report = await readFile(join(outDir, "report.md"), "utf8");
		expect(report).toContain("Population (listSweepPage)");
		expect(report).toContain("Stikprøve");
		expect(report).toContain(RULESET_VERSION);
		expect(lines.join("\n")).toContain(outDir);
		expect(result.selected).toHaveLength(10);
	});

	it("never writes or prints the transcript", async () => {
		const videos = [doc(1), doc(2, { article: DASHED })];
		const { outDir, lines } = await sample(videos, { n: 2 });
		expect(await readAll(outDir)).not.toContain(SENTINEL);
		expect(lines.join("\n")).not.toContain(SENTINEL);
	});
});

describe("runSample (offline input)", () => {
	async function inputFile(rows: unknown[]): Promise<string> {
		const dir = await tempDir();
		const file = join(dir, "raw.jsonl");
		await writeFile(file, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
		return file;
	}

	it("samples a jsonl dump and never writes or prints its transcripts", async () => {
		const withoutTranscript = doc(3, { transcript: undefined, article: DASHED });
		const file = await inputFile([doc(1), doc(2, { article: DASHED }), withoutTranscript]);
		const source = await createOfflineSource(file);
		const outDir = await tempDir();
		const lines: string[] = [];
		const result = await runSample(
			options({ mode: { kind: "offline", input: file }, n: 3 }),
			source,
			{ outDir, now: () => new Date(0), gitRevision: "x", log: (line) => lines.push(line) },
		);
		expect(result.selected).toHaveLength(3);
		const written = await readAll(outDir);
		expect(written).not.toContain(SENTINEL);
		expect(lines.join("\n")).not.toContain(SENTINEL);
		// A post without a known transcript is never a paid regeneration target.
		const targets = await readFile(join(outDir, "targets.txt"), "utf8");
		expect(targets).toContain('"v2"');
		expect(targets).not.toContain('"v3"');
		const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
		expect(manifest.origin).toBe(`offline ${file}`);
	});

	it("names only the line of an invalid row", async () => {
		const dir = await tempDir();
		const file = join(dir, "bad.jsonl");
		await writeFile(
			file,
			`${JSON.stringify(doc(1))}\n{"transcript":"${SENTINEL}"\n${JSON.stringify({ ...doc(2), title: 5 })}\n`,
		);
		const error = await createOfflineSource(file).catch((e: Error) => e);
		expect(String(error)).toMatch(/line 2: invalid JSON/);
		expect(String(error)).not.toContain(SENTINEL);
		await writeFile(file, `${JSON.stringify({ ...doc(2), title: 5 })}\n`);
		const shape = await createOfflineSource(file).catch((e: Error) => e);
		expect(String(shape)).toMatch(/line 1: unexpected shape \(fields: title\)/);
		expect(String(shape)).not.toContain(SENTINEL);
	});
});

describe("resolveOutDir", () => {
	it("keeps output inside .content-research", () => {
		const root = "/repo";
		const now = new Date("2026-10-24T08:00:00.123Z");
		expect(resolveOutDir(undefined, root, now)).toBe(
			"/repo/.content-research/content-sample-2026-10-24T08-00-00-123Z",
		);
		expect(resolveOutDir(".content-research/mine", root, now)).toBe("/repo/.content-research/mine");
		expect(() => resolveOutDir(".content-research", root, now)).toThrow(/inside/);
		expect(() => resolveOutDir(".content-research/../src", root, now)).toThrow(/inside/);
		expect(() => resolveOutDir("/tmp/x", root, now)).toThrow(/inside/);
	});
});

describe("renderVisiblePost", () => {
	it("renders summary, Hovedpointer, article and FAQ in page order", () => {
		const text = renderVisiblePost(validAnalysis(), "## Artikel\n\nTekst.");
		const order = [
			validAnalysis().summary,
			"## Hovedpointer",
			`- ${validAnalysis().keyTakeaways[0]}`,
			"## Artikel",
			"## Ofte stillede spørgsmål",
			`**${validAnalysis().faq[0].question}**`,
			validAnalysis().faq[0].answer,
		];
		const positions = order.map((part) => text.indexOf(part));
		expect(positions.every((p) => p >= 0)).toBe(true);
		expect([...positions].sort((a, b) => a - b)).toEqual(positions);
	});
});
