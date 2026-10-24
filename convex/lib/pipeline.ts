/** Pure pipeline rules: AI eligibility, job budget, failure gate, sweep selection and CLI helpers. */
import { SHORTS_THRESHOLD, type TranscriptSegment } from "../helpers";
import {
	type ValidationIssue,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
} from "./contentRules";

/** One deadline per job, below the 10-minute Node action limit. */
export const JOB_DEADLINE_MS = 8 * 60_000;
export const MIN_TRANSCRIPT_WORDS = 300;

export function transcriptWordCount(transcript: TranscriptSegment[] | undefined): number {
	if (!transcript?.length) return 0;
	return transcript.reduce(
		(count, segment) => count + (segment.text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0),
		0,
	);
}

export type Eligibility =
	| { eligible: true }
	| { eligible: false; reason: "short_video" | "transcript_too_short" };

/** Only regular videos (not Shorts) with a real transcript get an AI post. */
export function isEligibleForAi(video: {
	durationSeconds?: number;
	transcript?: TranscriptSegment[];
}): Eligibility {
	if ((video.durationSeconds ?? 0) <= SHORTS_THRESHOLD) {
		return { eligible: false, reason: "short_video" };
	}
	if (transcriptWordCount(video.transcript) < MIN_TRANSCRIPT_WORDS) {
		return { eligible: false, reason: "transcript_too_short" };
	}
	return { eligible: true };
}

/** The stored analysis of a processed video, or undefined when any part is missing. */
export function storedAnalysisOf(
	video: Partial<VideoAnalysis> & { processedAt?: number },
): VideoAnalysis | undefined {
	const { summary, seoTitle, seoDescription, themes, categories, keyTakeaways, faq } = video;
	const { relevanceScore } = video;
	if (
		video.processedAt === undefined ||
		summary === undefined ||
		seoTitle === undefined ||
		seoDescription === undefined ||
		themes === undefined ||
		categories === undefined ||
		keyTakeaways === undefined ||
		faq === undefined ||
		relevanceScore === undefined
	) {
		return undefined;
	}
	return {
		summary,
		seoTitle,
		seoDescription,
		themes,
		categories,
		keyTakeaways,
		faq,
		relevanceScore,
	};
}

// --- Automatic sweep ---

export const SWEEP_LIMIT = 10;
/** New videos get their own job from `videos.insert`; the sweep only picks up older ones. */
export const SWEEP_MIN_AGE_MS = 60 * 60_000;
export const FAILURE_GATE_COUNT = 3;
export const FAILURE_COOLDOWN_MS = 20 * 60 * 60_000;
/** Delay between scheduled jobs, so one sweep never runs many generations at once. */
export const JOB_STAGGER_MS = 30_000;

/** Projection returned by `videos.listSweepPage`; never contains the transcript. */
export type SweepRow = {
	videoId: string;
	publishedAt: string;
	_creationTime: number;
	hasTranscript: boolean;
	transcriptWordCount: number;
	isComplete: boolean;
	durationSeconds?: number;
	aiFailureCount?: number;
	aiLastFailedAt?: number;
};

/**
 * Video ids for the sweep: incomplete, non-Short videos older than one hour and not
 * failure-gated. Post-ready videos (transcript of enough words) come first, newest first; free
 * slots go to videos still missing a transcript. Short transcripts are skipped.
 */
export function selectSweepCandidates(rows: SweepRow[], now: number): string[] {
	const open = rows
		.filter((row) => {
			if (row.isComplete) return false;
			if (now - row._creationTime < SWEEP_MIN_AGE_MS) return false;
			if ((row.durationSeconds ?? 0) <= SHORTS_THRESHOLD) return false;
			if ((row.aiFailureCount ?? 0) >= FAILURE_GATE_COUNT) return false;
			return row.aiLastFailedAt === undefined || now - row.aiLastFailedAt >= FAILURE_COOLDOWN_MS;
		})
		.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
	const postReady = open.filter(
		(row) => row.hasTranscript && row.transcriptWordCount >= MIN_TRANSCRIPT_WORDS,
	);
	const missingTranscript = open.filter((row) => !row.hasTranscript);
	return [...postReady, ...missingTranscript].slice(0, SWEEP_LIMIT).map((row) => row.videoId);
}

// --- CLI commands ---

export const AUDIT_DEFAULT_PAGE_SIZE = 10;
export const AUDIT_MAX_PAGE_SIZE = 25;
export const MAX_REPAIR_TARGETS = 5;

export function clampPageSize(pageSize: number | undefined): number {
	const size = Math.floor(pageSize ?? AUDIT_DEFAULT_PAGE_SIZE);
	return Math.min(AUDIT_MAX_PAGE_SIZE, Math.max(1, size));
}

/** Slugs are not unique across channels; an ambiguous slug needs a channelId. */
export function pickVideoForSlug(
	matches: Array<{ videoId: string; channelId: string }>,
	target: { slug: string; channelId?: string },
): string {
	const candidates = target.channelId
		? matches.filter((match) => match.channelId === target.channelId)
		: matches;
	if (candidates.length === 0) throw new Error(`No video with slug "${target.slug}"`);
	if (candidates.length > 1) {
		const channels = candidates.map((c) => c.channelId).join(", ");
		throw new Error(`Slug "${target.slug}" is ambiguous (channels: ${channels}); pass channelId`);
	}
	return candidates[0].videoId;
}

export type AuditFinding = { part: "analysis" | "article"; issues: string[] };

function errorCodes(issues: ValidationIssue[]): string[] {
	return [...new Set(issues.filter((i) => i.severity === "error").map((i) => i.code))];
}

/** Re-validates a stored post with the current rules. Error codes only, no content. */
export function auditStoredPost(
	video: Partial<VideoAnalysis> & { title: string; processedAt?: number; article?: string },
): { missing: true } | { missing: false; findings: AuditFinding[] } {
	const analysis = storedAnalysisOf(video);
	if (!analysis || !video.article) return { missing: true };
	const findings: AuditFinding[] = [];
	const analysisIssues = errorCodes(validateAnalysis(analysis));
	if (analysisIssues.length) findings.push({ part: "analysis", issues: analysisIssues });
	const articleIssues = errorCodes(
		validateArticle(video.article, { title: video.title, seoTitle: analysis.seoTitle }),
	);
	if (articleIssues.length) findings.push({ part: "article", issues: articleIssues });
	return { missing: false, findings };
}

/** Result of one `videos.auditPage` or `channels.auditPage` call. */
export type AuditPage = {
	checked: number;
	failing: Array<{
		id: string;
		slug?: string;
		part: "analysis" | "article" | "channel";
		issues: string[];
	}>;
	missing: string[];
	continueCursor: string;
	isDone: boolean;
};
