/**
 * Read-only spot checks of stored AI posts: pulls a seeded random (or filtered) sample from a
 * Convex deployment, re-validates it with the rules in this checkout and writes one review file
 * per post (in page order) plus a report, metrics, a manifest and regeneration targets to
 * .content-research/. Transcripts are used in memory for word counts and the year check only;
 * they are never written or printed.
 *
 * Usage: bun scripts/content-sample.ts (--prod | --dev | --deployment-name NAME | --input FILE)
 *        [--channels-input FILE] [--n 10] [--seed S] [--channel CHANNEL_ID]
 *        [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--failing-only] [--eligible-only]
 *        [--min-relevance N] [--ids a,b,c] [--out .content-research/DIR]
 *
 * Live mode runs `node_modules/.bin/convex run` on four read-only queries only (ALLOWED_FUNCTIONS).
 */

import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { SHORTS_THRESHOLD } from "../convex/helpers";
import {
	hasErrors,
	OVERUSE_CAPS,
	type ValidationIssue,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
} from "../convex/lib/contentRules";
import {
	MIN_TRANSCRIPT_WORDS,
	storedAnalysisOf,
	transcriptWordCount,
} from "../convex/lib/pipeline";
import {
	AI_PHRASES,
	countOveruse,
	countWords,
	findThoughtDashes,
	RULESET_VERSION,
	splitSentences,
	textSegments,
} from "../convex/lib/style";

export const SWEEP_PAGE_SIZE = 25;
/** listByChannel returns full documents incl. transcripts, newest first. */
export const CHANNEL_SCAN_LIMIT = 50;
/** Upper bound of documents read per run, so a strict filter cannot read the whole table. */
export const MAX_DOCUMENT_READS = 300;
export const MAX_SAMPLE = 100;
const LOW_RELEVANCE = 40;
const CONVEX_BIN = "node_modules/.bin/convex";

// --- Arguments ---

export type Selector = { kind: "prod" } | { kind: "dev" } | { kind: "deployment"; name: string };

export type Options = {
	mode:
		| { kind: "live"; selector: Selector }
		| { kind: "offline"; input: string; channelsInput?: string };
	n: number;
	seed: string;
	channel?: string;
	from?: string;
	to?: string;
	failingOnly: boolean;
	eligibleOnly: boolean;
	minRelevance?: number;
	ids?: string[];
	out?: string;
};

function value(argv: string[], i: number, flag: string): string {
	const next = argv[i + 1];
	if (next === undefined || next.startsWith("--")) throw new Error(`${flag} needs a value`);
	return next;
}

function date(text: string, flag: string): string {
	const valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`));
	if (!valid || new Date(`${text}T00:00:00Z`).toISOString().slice(0, 10) !== text) {
		throw new Error(`${flag} needs a date as YYYY-MM-DD`);
	}
	return text;
}

function integer(text: string, flag: string, min: number, max: number): number {
	const number = Number(text);
	if (!Number.isInteger(number) || number < min || number > max) {
		throw new Error(`${flag} needs a whole number from ${min} to ${max}`);
	}
	return number;
}

export function parseArgs(argv: string[]): Options {
	const sources: Options["mode"][] = [];
	let channelsInput: string | undefined;
	const options: Omit<Options, "mode"> = {
		n: 10,
		seed: String(Date.now()),
		failingOnly: false,
		eligibleOnly: false,
	};
	const given = new Set<string>();
	for (let i = 0; i < argv.length; i++) {
		const flag = argv[i];
		given.add(flag);
		switch (flag) {
			case "--prod":
				sources.push({ kind: "live", selector: { kind: "prod" } });
				break;
			case "--dev":
				sources.push({ kind: "live", selector: { kind: "dev" } });
				break;
			case "--deployment-name":
				sources.push({
					kind: "live",
					selector: { kind: "deployment", name: value(argv, i++, flag) },
				});
				break;
			case "--input":
				sources.push({ kind: "offline", input: value(argv, i++, flag) });
				break;
			case "--channels-input":
				channelsInput = value(argv, i++, flag);
				break;
			case "--n":
				options.n = integer(value(argv, i++, flag), flag, 1, MAX_SAMPLE);
				break;
			case "--seed":
				options.seed = value(argv, i++, flag);
				break;
			case "--channel": {
				const channel = value(argv, i++, flag);
				if (channel.startsWith("@")) {
					throw new Error("--channel needs a channel id (UC…); @handles are not resolved");
				}
				options.channel = channel;
				break;
			}
			case "--from":
				options.from = date(value(argv, i++, flag), flag);
				break;
			case "--to":
				options.to = date(value(argv, i++, flag), flag);
				break;
			case "--failing-only":
				options.failingOnly = true;
				break;
			case "--eligible-only":
				options.eligibleOnly = true;
				break;
			case "--min-relevance":
				options.minRelevance = integer(value(argv, i++, flag), flag, 0, 100);
				break;
			case "--ids": {
				const ids = value(argv, i++, flag)
					.split(",")
					.map((id) => id.trim())
					.filter(Boolean);
				if (ids.length === 0 || ids.length > MAX_SAMPLE) {
					throw new Error(`--ids needs 1-${MAX_SAMPLE} comma-separated video ids`);
				}
				options.ids = ids;
				break;
			}
			case "--out":
				options.out = value(argv, i++, flag);
				break;
			default:
				throw new Error(`Unknown argument ${flag}`);
		}
	}
	if (sources.length !== 1) {
		throw new Error("Pass exactly one of --prod, --dev, --deployment-name NAME or --input FILE");
	}
	const [mode] = sources;
	if (channelsInput !== undefined) {
		if (mode.kind !== "offline") throw new Error("--channels-input works only with --input");
		mode.channelsInput = channelsInput;
	}
	if (options.ids) {
		const random = ["--n", "--seed", "--channel", "--from", "--to"];
		const filters = ["--failing-only", "--eligible-only", "--min-relevance"];
		const clash = [...random, ...filters].filter((flag) => given.has(flag));
		if (clash.length) throw new Error(`--ids is a fixed cohort; remove ${clash.join(", ")}`);
		options.n = options.ids.length;
	}
	return { mode, ...options };
}

/** Output directory: inside <root>/.content-research, never the folder itself or outside it. */
export function resolveOutDir(out: string | undefined, root: string, now: Date): string {
	const base = resolve(root, ".content-research");
	const dir = out
		? resolve(root, out)
		: join(base, `content-sample-${now.toISOString().replace(/[:.]/g, "-")}`);
	const inside = relative(base, dir);
	if (!inside || inside.startsWith("..") || isAbsolute(inside)) {
		throw new Error("--out must be a directory inside .content-research/");
	}
	return dir;
}

// --- Documents (parsed from unknown; the record type has no transcript) ---

const videoSchema = z.object({
	videoId: z.string(),
	slug: z.string().optional(),
	channelId: z.string(),
	title: z.string(),
	description: z.string(),
	publishedAt: z.string(),
	durationSeconds: z.number().optional(),
	processedAt: z.number().optional(),
	summary: z.string().optional(),
	seoTitle: z.string().optional(),
	seoDescription: z.string().optional(),
	themes: z.array(z.string()).optional(),
	categories: z.array(z.string()).optional(),
	keyTakeaways: z.array(z.string()).optional(),
	faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
	relevanceScore: z.number().optional(),
	article: z.string().optional(),
	transcript: z.array(z.object({ text: z.string() })).optional(),
});

type VideoDoc = z.infer<typeof videoSchema>;

const channelSchema = z.object({
	channelId: z.string(),
	name: z.string(),
	customUrl: z.string().optional(),
});

type Channel = z.infer<typeof channelSchema>;

/** The projection of `videos:listSweepPage` (convex/lib/pipeline.ts SweepRow). */
const sweepRowSchema = z.object({
	videoId: z.string(),
	publishedAt: z.string(),
	hasTranscript: z.boolean(),
	transcriptWordCount: z.number(),
	isComplete: z.boolean(),
	durationSeconds: z.number().optional(),
	aiFailureCount: z.number().optional(),
});

type PopulationRow = z.infer<typeof sweepRowSchema>;

const sweepPageSchema = z.object({
	page: z.array(sweepRowSchema),
	isDone: z.boolean(),
	continueCursor: z.string(),
});

/** Parses without ever putting received values into the error: field names only. */
function parse<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
	const result = schema.safeParse(data);
	if (result.success) return result.data;
	const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".") || "(root)"))];
	throw new Error(`${context}: unexpected shape (fields: ${fields.slice(0, 5).join(", ")})`);
}

// --- Data sources ---

export type DataSource = {
	/** "requested --prod" etc. for Convex (the CLI resolves the deployment), "offline FILE" for a dump. */
	origin: string;
	/** Population rows: listSweepPage live, the whole file offline. */
	populationLabel: string;
	listPopulation(): Promise<PopulationRow[]>;
	getVideo(videoId: string): Promise<VideoDoc | null>;
	listChannelVideos(channelId: string): Promise<VideoDoc[]>;
	getChannel(channelId: string): Promise<Channel | null>;
};

export const ALLOWED_FUNCTIONS = new Set([
	"videos:listSweepPage",
	"videos:getByVideoId",
	"videos:listByChannel",
	"channels:getByChannelId",
] as const);

type AllowedFunction = typeof ALLOWED_FUNCTIONS extends Set<infer T> ? T : never;

/** `convex run` argv. The only place that names a function; anything else is refused. */
export function convexArgs(
	selector: Selector,
	name: AllowedFunction,
	args: Record<string, unknown>,
): string[] {
	if (!ALLOWED_FUNCTIONS.has(name)) throw new Error(`Function ${name} is not allowed`);
	const deployment =
		selector.kind === "prod"
			? ["--prod"]
			: selector.kind === "deployment"
				? ["--deployment-name", selector.name]
				: [];
	return ["run", name, JSON.stringify(args), ...deployment];
}

/** Runs the Convex CLI with an argument array (no shell). Stderr is discarded, never shown. */
export type Runner = (args: string[]) => Promise<{ code: number; stdout: string }>;

export const runConvexCli: Runner = (args) =>
	new Promise((resolvePromise, reject) => {
		const child = spawn(CONVEX_BIN, args, { shell: false, stdio: ["ignore", "pipe", "ignore"] });
		const chunks: Buffer[] = [];
		child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
		child.on("error", () => reject(new Error(`Could not start ${CONVEX_BIN}`)));
		child.on("close", (code) =>
			resolvePromise({ code: code ?? 1, stdout: Buffer.concat(chunks).toString("utf8") }),
		);
	});

export function createConvexSource(
	selector: Selector,
	runner: Runner,
	env: Record<string, string | undefined>,
): DataSource {
	// A deploy key overrides --prod / --deployment-name in the CLI, so the target would be unclear.
	if (env.CONVEX_DEPLOY_KEY) {
		throw new Error("CONVEX_DEPLOY_KEY is set; unset it so the deployment flag decides the target");
	}
	const flag =
		selector.kind === "prod"
			? "--prod"
			: selector.kind === "deployment"
				? `--deployment-name ${selector.name}`
				: "--dev (the CLI's default deployment)";

	async function run(name: AllowedFunction, args: Record<string, unknown>): Promise<unknown> {
		const { code, stdout } = await runner(convexArgs(selector, name, args));
		if (code !== 0) {
			throw new Error(
				`convex run ${name} failed (exit ${code}); run it yourself with the same deployment flag to see the CLI error`,
			);
		}
		if (!stdout.trim()) return null;
		try {
			return JSON.parse(stdout) as unknown;
		} catch {
			throw new Error(`convex run ${name} returned invalid JSON`);
		}
	}

	async function required(name: AllowedFunction, args: Record<string, unknown>) {
		const result = await run(name, args);
		if (result === null) throw new Error(`convex run ${name} returned no output`);
		return result;
	}

	const channels = new Map<string, Channel | null>();
	return {
		origin: `requested ${flag}`,
		populationLabel: "listSweepPage",
		async listPopulation() {
			const rows: PopulationRow[] = [];
			let cursor: string | null = null;
			let isDone = false;
			while (!isDone) {
				const result: z.infer<typeof sweepPageSchema> = parse(
					sweepPageSchema,
					await required("videos:listSweepPage", {
						paginationOpts: { numItems: SWEEP_PAGE_SIZE, cursor },
					}),
					"videos:listSweepPage",
				);
				rows.push(...result.page);
				cursor = result.continueCursor;
				isDone = result.isDone;
			}
			return rows;
		},
		async getVideo(videoId) {
			const result = await run("videos:getByVideoId", { videoId });
			return result === null ? null : parse(videoSchema, result, "videos:getByVideoId");
		},
		async listChannelVideos(channelId) {
			const result = await required("videos:listByChannel", {
				channelId,
				limit: CHANNEL_SCAN_LIMIT,
			});
			return parse(z.array(videoSchema), result, "videos:listByChannel");
		},
		async getChannel(channelId) {
			if (!channels.has(channelId)) {
				const result = await run("channels:getByChannelId", { channelId });
				channels.set(
					channelId,
					result === null ? null : parse(channelSchema, result, "channels:getByChannelId"),
				);
			}
			return channels.get(channelId) ?? null;
		},
	};
}

async function readJsonLines<T>(file: string, schema: z.ZodType<T>): Promise<T[]> {
	const lines = (await readFile(file, "utf8")).split("\n");
	const rows: T[] = [];
	for (const [i, line] of lines.entries()) {
		if (!line.trim()) continue;
		let data: unknown;
		try {
			data = JSON.parse(line);
		} catch {
			throw new Error(`${file} line ${i + 1}: invalid JSON`);
		}
		rows.push(parse(schema, data, `${file} line ${i + 1}`));
	}
	return rows;
}

function isComplete(video: VideoDoc): boolean {
	return video.processedAt !== undefined && Boolean(video.article);
}

/** A jsonl dump of video documents (e.g. from `convex export`), optionally with channels. */
export async function createOfflineSource(
	input: string,
	channelsInput?: string,
): Promise<DataSource> {
	const videos = new Map<string, VideoDoc>();
	for (const video of await readJsonLines(input, videoSchema)) videos.set(video.videoId, video);
	const channels = new Map<string, Channel>();
	if (channelsInput) {
		for (const channel of await readJsonLines(channelsInput, channelSchema)) {
			channels.set(channel.channelId, channel);
		}
	}
	return {
		origin: `offline ${input}`,
		populationLabel: "inputfil",
		listPopulation: async () =>
			[...videos.values()].map((video) => ({
				videoId: video.videoId,
				publishedAt: video.publishedAt,
				hasTranscript: Boolean(video.transcript?.length),
				transcriptWordCount: transcriptWordCount(video.transcript),
				isComplete: isComplete(video),
				durationSeconds: video.durationSeconds,
			})),
		getVideo: async (videoId) => videos.get(videoId) ?? null,
		listChannelVideos: async (channelId) =>
			[...videos.values()].filter((video) => video.channelId === channelId),
		getChannel: async (channelId) => channels.get(channelId) ?? null,
	};
}

// --- Review of one post (the transcript is dropped here) ---

type FieldGroup = "summary" | "seoTitle" | "seoDescription" | "keyTakeaways" | "faq" | "article";

type PostRecord = {
	videoId: string;
	slug?: string;
	title: string;
	channelName?: string;
	pagePath?: string;
	publishedAt: string;
	durationSeconds?: number;
	processedAt?: number;
	relevanceScore: number;
	analysis: VideoAnalysis;
	article: string;
	/** Known eligibility: a transcript of enough words and longer than a Short. */
	eligible: boolean;
	transcriptWords: number;
	issues: { analysis: ValidationIssue[]; article: ValidationIssue[] };
	flags: string[];
	metrics: PostMetrics;
};

type PostMetrics = {
	articleWords: number;
	paragraphWords: number[];
	sentenceWords: number[];
	h2: number;
	h3: number;
	seoTitleChars: number;
	pageTitleChars: number;
	seoDescriptionChars: number;
	summaryChars: number;
	summarySentences: number;
	faqCount: number;
	faqAnswerWords: number[];
	dashes: Record<FieldGroup, { illegal: number; ambiguous: number; digitRanges: number }>;
	aiPhrases: Record<string, number>;
	overuse: Record<string, number>;
};

function measure(analysis: VideoAnalysis, article: string): PostMetrics {
	const segments = textSegments(article);
	const prose = segments.filter((s) => s.kind === "paragraph" || s.kind === "list_item");
	const articleTexts = segments.map((s) => s.text);
	const groups: Record<FieldGroup, string[]> = {
		summary: [analysis.summary],
		seoTitle: [analysis.seoTitle],
		seoDescription: [analysis.seoDescription],
		keyTakeaways: analysis.keyTakeaways,
		faq: analysis.faq.flatMap((f) => [f.question, f.answer]),
		article: articleTexts,
	};
	const dashes = Object.fromEntries(
		Object.entries(groups).map(([group, texts]) => {
			const hits = texts.map(findThoughtDashes);
			return [
				group,
				{
					illegal: hits.reduce((sum, h) => sum + h.illegal.length, 0),
					ambiguous: hits.reduce((sum, h) => sum + h.ambiguous.length, 0),
					digitRanges: hits.reduce((sum, h) => sum + h.ranges, 0),
				},
			];
		}),
	) as PostMetrics["dashes"];
	const allTexts = Object.values(groups).flat();
	const aiPhrases: Record<string, number> = {};
	for (const { label, pattern } of AI_PHRASES) {
		const count = allTexts.reduce((sum, text) => sum + [...text.matchAll(pattern)].length, 0);
		if (count) aiPhrases[label] = count;
	}
	const overuse = Object.fromEntries(
		[...countOveruse(allTexts)].map(([label, entry]) => [label, entry.count]),
	);
	return {
		articleWords: countWords(articleTexts.join(" ")),
		paragraphWords: segments.filter((s) => s.kind === "paragraph").map((s) => countWords(s.text)),
		sentenceWords: prose.flatMap((s) => splitSentences(s.text)).map(countWords),
		h2: segments.filter((s) => s.kind === "heading" && s.depth === 2).length,
		h3: segments.filter((s) => s.kind === "heading" && s.depth === 3).length,
		seoTitleChars: analysis.seoTitle.length,
		pageTitleChars: `${analysis.seoTitle} - KasperInvest`.length,
		seoDescriptionChars: analysis.seoDescription.length,
		summaryChars: analysis.summary.length,
		summarySentences: splitSentences(analysis.summary).length,
		faqCount: analysis.faq.length,
		faqAnswerWords: analysis.faq.map((f) => countWords(f.answer)),
		dashes,
		aiPhrases,
		overuse,
	};
}

/** Validates and measures one stored post; returns undefined when it has no complete post. */
function review(video: VideoDoc, channel: Channel | null): PostRecord | undefined {
	// Categories are checked against the enum by validateAnalysis.
	const analysis = storedAnalysisOf(video as Partial<VideoAnalysis> & { processedAt?: number });
	if (!analysis || !video.article) return undefined;
	const source = {
		title: video.title,
		description: video.description,
		transcript: video.transcript,
	};
	const transcriptWords = transcriptWordCount(video.transcript);
	const isShort = (video.durationSeconds ?? 0) <= SHORTS_THRESHOLD;
	const flags = [
		...(analysis.relevanceScore < LOW_RELEVANCE ? ["low_relevance"] : []),
		...(isShort ? ["old_short_post"] : []),
	];
	const handle = channel?.customUrl?.replace(/^@/, "");
	return {
		videoId: video.videoId,
		slug: video.slug,
		title: video.title,
		channelName: channel?.name,
		pagePath: handle && video.slug ? `/youtube/${handle}/${video.slug}` : undefined,
		publishedAt: video.publishedAt,
		durationSeconds: video.durationSeconds,
		processedAt: video.processedAt,
		relevanceScore: analysis.relevanceScore,
		analysis,
		article: video.article,
		eligible: !isShort && transcriptWords >= MIN_TRANSCRIPT_WORDS,
		transcriptWords,
		issues: {
			analysis: validateAnalysis(analysis, source),
			article: validateArticle(video.article, {
				title: video.title,
				seoTitle: analysis.seoTitle,
				analysis,
				source,
			}),
		},
		flags,
		metrics: measure(analysis, video.article),
	};
}

function failing(record: PostRecord): boolean {
	return hasErrors([...record.issues.analysis, ...record.issues.article]);
}

// --- Selection ---

/** FNV-1a hash of the seed into a mulberry32 generator. */
function seededRandom(seed: string): () => number {
	let state = 0x811c9dc5;
	for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 0x01000193) >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

function shuffle<T>(items: T[], random: () => number): T[] {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

type Facts = { publishedAt: string; durationSeconds?: number; eligible: boolean };

function inDateRange(publishedAt: string, options: Options): boolean {
	const day = publishedAt.slice(0, 10);
	return (!options.from || day >= options.from) && (!options.to || day <= options.to);
}

function passesPreFilters(facts: Facts, options: Options): boolean {
	return inDateRange(facts.publishedAt, options) && (!options.eligibleOnly || facts.eligible);
}

function rowEligible(row: PopulationRow): boolean {
	return (
		(row.durationSeconds ?? 0) > SHORTS_THRESHOLD &&
		row.hasTranscript &&
		row.transcriptWordCount >= MIN_TRANSCRIPT_WORDS
	);
}

function dedupe(rows: PopulationRow[]): PopulationRow[] {
	const seen = new Map<string, PopulationRow>();
	for (const row of rows) if (!seen.has(row.videoId)) seen.set(row.videoId, row);
	return [...seen.values()];
}

// --- Report ---

type Population = {
	total: number;
	withPost: number;
	shortsWithPost: number;
	eligible: number;
	eligibleWithPost: number;
	withFailureState: number;
	transcriptWordsMedian: number;
};

function populationOf(rows: PopulationRow[]): Population {
	const words = rows.filter((r) => r.hasTranscript).map((r) => r.transcriptWordCount);
	return {
		total: rows.length,
		withPost: rows.filter((r) => r.isComplete).length,
		shortsWithPost: rows.filter((r) => r.isComplete && (r.durationSeconds ?? 0) <= SHORTS_THRESHOLD)
			.length,
		eligible: rows.filter(rowEligible).length,
		eligibleWithPost: rows.filter((r) => r.isComplete && rowEligible(r)).length,
		withFailureState: rows.filter((r) => (r.aiFailureCount ?? 0) > 0).length,
		transcriptWordsMedian: quantile(words, 0.5),
	};
}

function quantile(values: number[], q: number): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

function spread(values: number[]) {
	return {
		min: values.length ? Math.min(...values) : 0,
		median: quantile(values, 0.5),
		p95: quantile(values, 0.95),
		max: values.length ? Math.max(...values) : 0,
	};
}

function countBy(records: PostRecord[], pick: (record: PostRecord) => string[]) {
	const counts: Record<string, number> = {};
	for (const record of records) {
		for (const key of new Set(pick(record))) counts[key] = (counts[key] ?? 0) + 1;
	}
	return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

const codesOf = (issues: ValidationIssue[], severity: "error" | "warning") =>
	issues.filter((i) => i.severity === severity).map((i) => i.code);

function sampleMetrics(records: PostRecord[]) {
	const all = (record: PostRecord) => [...record.issues.analysis, ...record.issues.article];
	const metrics = records.map((r) => r.metrics);
	const sum = (pick: (m: PostMetrics) => number) => metrics.reduce((s, m) => s + pick(m), 0);
	const groups: FieldGroup[] = [
		"summary",
		"seoTitle",
		"seoDescription",
		"keyTakeaways",
		"faq",
		"article",
	];
	const aiPhrases: Record<string, { posts: number; total: number }> = {};
	const overuse: Record<string, { posts: number; total: number; postsOverArticleCap: number }> = {};
	for (const m of metrics) {
		for (const [label, count] of Object.entries(m.aiPhrases)) {
			aiPhrases[label] ??= { posts: 0, total: 0 };
			aiPhrases[label].posts++;
			aiPhrases[label].total += count;
		}
		for (const [label, count] of Object.entries(m.overuse)) {
			overuse[label] ??= { posts: 0, total: 0, postsOverArticleCap: 0 };
			overuse[label].posts++;
			overuse[label].total += count;
			if (count > OVERUSE_CAPS.article) overuse[label].postsOverArticleCap++;
		}
	}
	return {
		posts: records.length,
		failingPosts: records.filter(failing).length,
		errorPosts: countBy(records, (r) => codesOf(all(r), "error")),
		warningPosts: countBy(records, (r) => codesOf(all(r), "warning")),
		flags: countBy(records, (r) => r.flags),
		dashes: Object.fromEntries(
			groups.map((group) => [
				group,
				{
					postsWithIllegal: metrics.filter((m) => m.dashes[group].illegal > 0).length,
					illegal: sum((m) => m.dashes[group].illegal),
					ambiguous: sum((m) => m.dashes[group].ambiguous),
					digitRanges: sum((m) => m.dashes[group].digitRanges),
				},
			]),
		),
		aiPhrases,
		overuse,
		articleWords: spread(metrics.map((m) => m.articleWords)),
		paragraphWords: spread(metrics.flatMap((m) => m.paragraphWords)),
		sentencesOver40Words: metrics.flatMap((m) => m.sentenceWords).filter((w) => w > 40).length,
		sentenceWords: spread(metrics.flatMap((m) => m.sentenceWords)),
		h2: spread(metrics.map((m) => m.h2)),
		h3: spread(metrics.map((m) => m.h3)),
		seoTitleChars: spread(metrics.map((m) => m.seoTitleChars)),
		pageTitleChars: spread(metrics.map((m) => m.pageTitleChars)),
		seoDescriptionChars: spread(metrics.map((m) => m.seoDescriptionChars)),
		summaryChars: spread(metrics.map((m) => m.summaryChars)),
		summarySentences: spread(metrics.map((m) => m.summarySentences)),
		faqCount: spread(metrics.map((m) => m.faqCount)),
		faqAnswerWords: spread(metrics.flatMap((m) => m.faqAnswerWords)),
		relevance: {
			under40: records.filter((r) => r.relevanceScore < 40).length,
			from40to69: records.filter((r) => r.relevanceScore >= 40 && r.relevanceScore < 70).length,
			from70: records.filter((r) => r.relevanceScore >= 70).length,
		},
		processedAt: spread(records.map((r) => r.processedAt ?? 0)),
	};
}

/** The post as a reader sees it: summary, Hovedpointer, article, FAQ. */
export function renderVisiblePost(analysis: VideoAnalysis, article: string): string {
	return [
		analysis.summary,
		`## Hovedpointer\n\n${analysis.keyTakeaways.map((t) => `- ${t}`).join("\n")}`,
		article,
		`## Ofte stillede spørgsmål\n\n${analysis.faq.map((f) => `**${f.question}**\n\n${f.answer}`).join("\n\n")}`,
	].join("\n\n");
}

const isoDate = (ms: number | undefined) => (ms === undefined ? "-" : new Date(ms).toISOString());

function issueLines(issues: ValidationIssue[]): string[] {
	return issues.map(
		(i) => `- ${i.severity === "error" ? "Fejl" : "Advarsel"} \`${i.code}\`: ${i.message}`,
	);
}

function renderPostFile(record: PostRecord): string {
	const { analysis, metrics } = record;
	const meta = [
		`Kanal: ${record.channelName ?? record.videoId}`,
		`Udgivet: ${record.publishedAt}`,
		`Varighed: ${record.durationSeconds ?? "-"} s`,
		`Relevans: ${record.relevanceScore}`,
		`processedAt: ${isoDate(record.processedAt)}`,
		`Side: ${record.pagePath ?? "-"}`,
	].join(" · ");
	const longestSentence = Math.max(0, ...metrics.sentenceWords);
	return `# ${record.title}

${meta}

## SEO

- Sidetitel: ${analysis.seoTitle} - KasperInvest (${metrics.pageTitleChars} tegn; seoTitle ${metrics.seoTitleChars})
- seoDescription (${metrics.seoDescriptionChars} tegn): ${analysis.seoDescription}
- Kategorier: ${analysis.categories.join(", ")}
- Temaer: ${analysis.themes.join(", ") || "-"}

${renderVisiblePost(analysis, record.article)}

## Stikprøve-noter

- Regelsæt: ${RULESET_VERSION}
- Flag: ${record.flags.join(", ") || "-"}
- Artikel: ${metrics.articleWords} ord (synlig tekst som i validatoren), ${metrics.h2} × ##, ${metrics.h3} × ###
- Længste afsnit: ${Math.max(0, ...metrics.paragraphWords)} ord; længste sætning: ${longestSentence} ord
- Transskription: ${record.transcriptWords} ord (ikke gemt)

### Analyse

${issueLines(record.issues.analysis).join("\n") || "- Ingen fund"}

### Artikel

${issueLines(record.issues.article).join("\n") || "- Ingen fund"}
`;
}

function table(rows: Array<[string, string | number]>, header: [string, string]): string {
	return [
		`| ${header[0]} | ${header[1]} |`,
		"| --- | --- |",
		...rows.map(([a, b]) => `| ${a} | ${b} |`),
	].join("\n");
}

function renderReport(input: {
	options: Options;
	origin: string;
	populationLabel: string;
	population: Population;
	metrics: ReturnType<typeof sampleMetrics>;
	counts: SampleCounts;
	records: PostRecord[];
	files: string[];
	createdAt: string;
}): string {
	const { options, metrics, counts, population } = input;
	const filtered =
		options.failingOnly || options.minRelevance !== undefined || options.eligibleOnly;
	const spreadRows = (rows: Array<[string, ReturnType<typeof spread>]>): Array<[string, string]> =>
		rows.map(([label, s]) => [label, `${s.min} / ${s.median} / ${s.p95} / ${s.max}`]);
	const records = input.records.map((record, i) => {
		const parts = (["analysis", "article"] as const)
			.map((part) => [part, codesOf(record.issues[part], "error")] as const)
			.filter(([, codes]) => codes.length)
			.map(
				([part, codes]) => `${part === "analysis" ? "analyse" : "artikel"}: ${codes.join(", ")}`,
			);
		const flags = record.flags.length ? ` (${record.flags.join(", ")})` : "";
		return `- [${record.title}](${input.files[i]}): ${parts.join("; ") || "ingen fejl"}${flags}`;
	});
	return `# Stikprøve af AI-indlæg

- Kilde: ${input.origin}
- Tidspunkt: ${input.createdAt}
- Regelsæt: ${RULESET_VERSION} (reglerne i denne checkout, ikke de deployede)
- Seed: ${options.seed}
- Filtre: ${JSON.stringify({ channel: options.channel, from: options.from, to: options.to, failingOnly: options.failingOnly, eligibleOnly: options.eligibleOnly, minRelevance: options.minRelevance, ids: options.ids })}
- Udvalgt: ${counts.selected} af ${options.n} ønskede indlæg (læst ${counts.read}, mangler ${counts.missing}, uden indlæg ${counts.withoutPost}, fravalgt af filtre ${counts.filteredOut})

## Population (${input.populationLabel})

${table(
	[
		["Videoer", population.total],
		["Med indlæg", population.withPost],
		["Shorts (≤90 s) med indlæg", population.shortsWithPost],
		["Egnede (>90 s og transskription ≥300 ord)", population.eligible],
		["Egnede med indlæg", population.eligibleWithPost],
		["Med fejltilstand (aiFailureCount > 0)", population.withFailureState],
		["Transskription, median ord", population.transcriptWordsMedian],
	],
	["Mål", "Antal"],
)}

## Stikprøve (${metrics.posts} indlæg)

${filtered ? "Stikprøven er filtreret; tallene gælder kun stikprøven og kan ikke overføres til hele populationen.\n\n" : ""}Indlæg med mindst én fejl: ${metrics.failingPosts} af ${metrics.posts}.

### Fejl (indlæg pr. kode)

${table(Object.entries(metrics.errorPosts), ["Kode", "Indlæg"])}

### Advarsler (indlæg pr. kode)

${table(Object.entries(metrics.warningPosts), ["Kode", "Indlæg"])}

### Tankestreger pr. felt

${[
	"| Felt | Indlæg med fejl | Fejl | Tvivl (navn?) | Heraf intervaller mellem tal |",
	"| --- | --- | --- | --- | --- |",
	...Object.entries(metrics.dashes).map(
		([group, d]) =>
			`| ${group} | ${d.postsWithIllegal} | ${d.illegal} | ${d.ambiguous} | ${d.digitRanges} |`,
	),
].join("\n")}

### Standardvendinger (fejl)

${table(
	Object.entries(metrics.aiPhrases).map(([label, s]) => [
		label,
		`${s.posts} indlæg, ${s.total} i alt`,
	]),
	["Vending", "Fund"],
)}

### Overbrugte ord (advarsel)

${table(
	Object.entries(metrics.overuse).map(([label, s]) => [
		label,
		`${s.posts} indlæg, ${s.total} i alt, ${s.postsOverArticleCap} over ${OVERUSE_CAPS.article}`,
	]),
	["Ord", "Fund"],
)}

### Længder (min / median / p95 / max)

${table(
	spreadRows([
		["Artikel, ord (synlig tekst)", metrics.articleWords],
		["Afsnit, ord", metrics.paragraphWords],
		["Sætninger, ord", metrics.sentenceWords],
		["## pr. artikel", metrics.h2],
		["### pr. artikel", metrics.h3],
		["seoTitle, tegn", metrics.seoTitleChars],
		["Sidetitel med ' - KasperInvest', tegn", metrics.pageTitleChars],
		["seoDescription, tegn", metrics.seoDescriptionChars],
		["summary, tegn", metrics.summaryChars],
		["summary, sætninger", metrics.summarySentences],
		["FAQ, antal", metrics.faqCount],
		["FAQ-svar, ord", metrics.faqAnswerWords],
	]),
	["Mål", "Værdi"],
)}

Sætninger over 40 ord: ${metrics.sentencesOver40Words}. Relevans: under 40: ${metrics.relevance.under40}, 40-69: ${metrics.relevance.from40to69}, 70+: ${metrics.relevance.from70}. Flag: ${JSON.stringify(metrics.flags)}.

## Indlæg

${records.join("\n")}

targets.txt: egnede (>90 s, transskription ≥300 ord), relevans ≥${LOW_RELEVANCE} og fejlende indlæg, højst 5 pr. linje til \`youtube:regenerateInvalidPosts\`.
`;
}

// --- Run ---

type SampleCounts = {
	read: number;
	missing: number;
	withoutPost: number;
	filteredOut: number;
	selected: number;
};

export type SampleResult = {
	selected: string[];
	counts: SampleCounts;
	population: Population;
	outDir: string;
};

function fileName(index: number, record: PostRecord): string {
	const name = (record.slug ?? record.videoId).replace(/[^a-z0-9-]+/gi, "-").slice(0, 60);
	return `${String(index + 1).padStart(2, "0")}-${name}.md`;
}

export async function runSample(
	options: Options,
	source: DataSource,
	deps: { outDir: string; now: () => Date; gitRevision: string; log: (line: string) => void },
): Promise<SampleResult> {
	const population = dedupe(await source.listPopulation());
	const counts: SampleCounts = { read: 0, missing: 0, withoutPost: 0, filteredOut: 0, selected: 0 };
	const records: PostRecord[] = [];

	const accept = async (video: VideoDoc | null) => {
		if (!video) {
			counts.missing++;
			return;
		}
		const record = review(video, await source.getChannel(video.channelId));
		if (!record) {
			counts.withoutPost++;
			return;
		}
		const keep =
			passesPreFilters(record, options) &&
			(options.minRelevance === undefined || record.relevanceScore >= options.minRelevance) &&
			(!options.failingOnly || failing(record));
		if (keep) records.push(record);
		else counts.filteredOut++;
	};

	if (options.ids) {
		for (const id of options.ids) {
			counts.read++;
			await accept(await source.getVideo(id));
		}
	} else if (options.channel) {
		const videos = await source.listChannelVideos(options.channel);
		for (const video of shuffle(videos, seededRandom(options.seed))) {
			if (records.length >= options.n) break;
			counts.read++;
			await accept(video);
		}
	} else {
		const candidates = population.filter(
			(row) => row.isComplete && passesPreFilters({ ...row, eligible: rowEligible(row) }, options),
		);
		for (const row of shuffle(candidates, seededRandom(options.seed))) {
			if (records.length >= options.n || counts.read >= MAX_DOCUMENT_READS) break;
			counts.read++;
			await accept(await source.getVideo(row.videoId));
		}
	}
	counts.selected = records.length;

	const createdAt = deps.now().toISOString();
	const metrics = sampleMetrics(records);
	const files = records.map((record, i) => fileName(i, record));
	const targets = records
		.filter((r) => r.eligible && r.relevanceScore >= LOW_RELEVANCE && failing(r))
		.map((r) => r.videoId);
	const targetLines: string[] = [];
	for (let i = 0; i < targets.length; i += 5) {
		targetLines.push(JSON.stringify(targets.slice(i, i + 5)));
	}
	const summary = populationOf(population);

	await mkdir(deps.outDir, { recursive: true });
	for (const [i, record] of records.entries()) {
		await writeFile(join(deps.outDir, files[i]), renderPostFile(record));
	}
	await writeFile(
		join(deps.outDir, "report.md"),
		renderReport({
			options,
			origin: source.origin,
			populationLabel: source.populationLabel,
			population: summary,
			metrics,
			counts,
			records,
			files,
			createdAt,
		}),
	);
	await writeFile(
		join(deps.outDir, "metrics.json"),
		`${JSON.stringify({ rulesetVersion: RULESET_VERSION, population: summary, sample: metrics }, null, 2)}\n`,
	);
	await writeFile(
		join(deps.outDir, "manifest.json"),
		`${JSON.stringify(
			{
				rulesetVersion: RULESET_VERSION,
				origin: source.origin,
				createdAt,
				seed: options.seed,
				n: options.n,
				filters: {
					channel: options.channel,
					from: options.from,
					to: options.to,
					failingOnly: options.failingOnly,
					eligibleOnly: options.eligibleOnly,
					minRelevance: options.minRelevance,
					ids: options.ids,
				},
				counts,
				gitRevision: deps.gitRevision,
				posts: records.map((r) => ({ videoId: r.videoId, processedAt: r.processedAt })),
			},
			null,
			2,
		)}\n`,
	);
	await writeFile(join(deps.outDir, "targets.txt"), targetLines.map((l) => `${l}\n`).join(""));

	deps.log(
		`Sampled ${counts.selected} of ${options.n} requested (read ${counts.read}, missing ${counts.missing}, without post ${counts.withoutPost}, filtered ${counts.filteredOut}); population ${summary.total}; seed ${options.seed}; targets ${targets.length}.`,
	);
	deps.log(`Output: ${deps.outDir}`);
	return {
		selected: records.map((r) => r.videoId),
		counts,
		population: summary,
		outDir: deps.outDir,
	};
}

function gitRevision(): string {
	try {
		return execFileSync("git", ["rev-parse", "HEAD"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return "unknown";
	}
}

async function main(argv: string[]) {
	const options = parseArgs(argv);
	const now = new Date();
	const outDir = resolveOutDir(options.out, process.cwd(), now);
	const source =
		options.mode.kind === "live"
			? createConvexSource(options.mode.selector, runConvexCli, process.env)
			: await createOfflineSource(options.mode.input, options.mode.channelsInput);
	await runSample(options, source, {
		outDir,
		now: () => now,
		gitRevision: gitRevision(),
		log: (line) => console.log(line),
	});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main(process.argv.slice(2)).catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : "content-sample failed");
		process.exit(1);
	});
}
