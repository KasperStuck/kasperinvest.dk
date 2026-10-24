import { describe, expect, it } from "vitest";
import {
	auditStoredPost,
	clampPageSize,
	isEligibleForAi,
	pickVideoForSlug,
	type SweepRow,
	selectSweepCandidates,
	storedAnalysisOf,
	transcriptWordCount,
} from "./pipeline";

const HOUR = 60 * 60_000;
const NOW = Date.UTC(2026, 9, 21, 1, 0, 0);

function row(id: number, overrides: Partial<SweepRow> = {}): SweepRow {
	return {
		videoId: `v${id}`,
		publishedAt: new Date(Date.UTC(2026, 8, 1) + id * HOUR).toISOString(),
		_creationTime: NOW - 2 * HOUR,
		hasTranscript: true,
		transcriptWordCount: 500,
		isComplete: false,
		durationSeconds: 600,
		...overrides,
	};
}

describe("transcriptWordCount and isEligibleForAi", () => {
	it("counts words across segments", () => {
		expect(transcriptWordCount([{ text: "en to tre" }, { text: "fire, fem!" }])).toBe(5);
		expect(transcriptWordCount(undefined)).toBe(0);
	});

	it("rejects Shorts and short transcripts", () => {
		const transcript = Array.from({ length: 30 }, () => ({ text: "ord ".repeat(10) }));
		expect(isEligibleForAi({ durationSeconds: 600, transcript })).toEqual({ eligible: true });
		expect(isEligibleForAi({ durationSeconds: 90, transcript })).toEqual({
			eligible: false,
			reason: "short_video",
		});
		expect(isEligibleForAi({ durationSeconds: undefined, transcript })).toMatchObject({
			eligible: false,
		});
		expect(isEligibleForAi({ durationSeconds: 600, transcript: transcript.slice(1) })).toEqual({
			eligible: false,
			reason: "transcript_too_short",
		});
	});
});

describe("storedAnalysisOf", () => {
	it("needs every analysis field and processedAt", () => {
		const analysis = {
			summary: "s",
			seoTitle: "t",
			seoDescription: "d",
			themes: [],
			categories: [],
			keyTakeaways: [],
			faq: [],
			relevanceScore: 1,
		};
		expect(storedAnalysisOf({ ...analysis, processedAt: 1 })).toEqual(analysis);
		expect(storedAnalysisOf(analysis)).toBeUndefined();
		expect(storedAnalysisOf({ ...analysis, processedAt: 1, summary: undefined })).toBeUndefined();
	});
});

describe("selectSweepCandidates", () => {
	it("selects at most 10, newest first", () => {
		const rows = Array.from({ length: 15 }, (_, i) => row(i));
		const selected = selectSweepCandidates(rows, NOW);
		expect(selected).toEqual(["v14", "v13", "v12", "v11", "v10", "v9", "v8", "v7", "v6", "v5"]);
	});

	it("leaves videos younger than one hour to their own insert job", () => {
		const selected = selectSweepCandidates([row(1, { _creationTime: NOW - HOUR + 1 })], NOW);
		expect(selected).toEqual([]);
		expect(selectSweepCandidates([row(1, { _creationTime: NOW - HOUR })], NOW)).toHaveLength(1);
	});

	it("skips complete videos, Shorts and short transcripts", () => {
		const rows = [
			row(1, { isComplete: true }),
			row(2, { durationSeconds: 90 }),
			row(3, { durationSeconds: undefined }),
			row(4, { transcriptWordCount: 299 }),
		];
		expect(selectSweepCandidates(rows, NOW)).toEqual([]);
	});

	it("selects post-ready videos before newer videos that still miss a transcript", () => {
		const missing = Array.from({ length: 12 }, (_, i) =>
			row(100 + i, { hasTranscript: false, transcriptWordCount: 0 }),
		);
		const ready = row(1);
		const selected = selectSweepCandidates([...missing, ready], NOW);
		expect(selected).toHaveLength(10);
		expect(selected[0]).toBe("v1");
		expect(selected.slice(1)).toEqual([
			"v111",
			"v110",
			"v109",
			"v108",
			"v107",
			"v106",
			"v105",
			"v104",
			"v103",
		]);
	});

	it("fills free slots with videos that miss a transcript, failure-gated too", () => {
		const rows = [
			row(1, { hasTranscript: false, transcriptWordCount: 0 }),
			row(2),
			row(3, { hasTranscript: false, transcriptWordCount: 0, aiFailureCount: 3 }),
		];
		expect(selectSweepCandidates(rows, NOW)).toEqual(["v2", "v1"]);
	});

	it("applies the failure gate", () => {
		const rows = [
			row(1, { aiFailureCount: 3, aiLastFailedAt: NOW - 30 * HOUR }),
			row(2, { aiFailureCount: 1, aiLastFailedAt: NOW - 19 * HOUR }),
			row(3, { aiFailureCount: 2, aiLastFailedAt: NOW - 21 * HOUR }),
		];
		expect(selectSweepCandidates(rows, NOW)).toEqual(["v3"]);
	});

	it("does not let old failing videos starve a new one", () => {
		const failing = Array.from({ length: 12 }, (_, i) =>
			row(i, { aiFailureCount: 1, aiLastFailedAt: NOW - 2 * HOUR }),
		);
		const fresh = row(100, { publishedAt: "2026-01-01T00:00:00.000Z" });
		expect(selectSweepCandidates([...failing, fresh], NOW)).toEqual(["v100"]);
	});
});

describe("CLI helpers", () => {
	it("clamps the audit page size", () => {
		expect(clampPageSize(undefined)).toBe(10);
		expect(clampPageSize(3)).toBe(3);
		expect(clampPageSize(100)).toBe(25);
		expect(clampPageSize(0)).toBe(1);
		expect(clampPageSize(2.7)).toBe(2);
	});

	it("resolves a slug to exactly one video", () => {
		const matches = [
			{ videoId: "a", channelId: "ch1" },
			{ videoId: "b", channelId: "ch2" },
		];
		expect(pickVideoForSlug([matches[0]], { slug: "s" })).toBe("a");
		expect(pickVideoForSlug(matches, { slug: "s", channelId: "ch2" })).toBe("b");
		expect(() => pickVideoForSlug(matches, { slug: "s" })).toThrow(/ambiguous.*ch1, ch2/);
		expect(() => pickVideoForSlug([], { slug: "s" })).toThrow(/No video/);
		expect(() => pickVideoForSlug(matches, { slug: "s", channelId: "ch3" })).toThrow(/No video/);
	});
});

describe("auditStoredPost", () => {
	const analysis = {
		summary:
			"Videoen gennemgår, hvordan danske begyndere kan komme i gang med indeksfonde, og hvorfor lave omkostninger betyder meget.",
		seoTitle: "Indeksfonde for begyndere: kom godt i gang",
		seoDescription:
			"Lær hvordan du vælger en billig indeksfond, hvad aktiesparekontoen betyder for skatten, og hvorfor tid er din vigtigste allierede.",
		themes: ["indeksfonde"],
		categories: ["ETF" as const],
		keyTakeaways: ["a", "b", "c"],
		faq: [
			{ question: "Et?", answer: "Ja." },
			{ question: "To?", answer: "Ja." },
			{ question: "Tre?", answer: "Ja." },
		],
		relevanceScore: 50,
	};

	it("reports missing content", () => {
		expect(auditStoredPost({ title: "T" })).toEqual({ missing: true });
		expect(auditStoredPost({ title: "T", ...analysis, processedAt: 1 })).toEqual({
			missing: true,
		});
	});

	it("reports failing parts with error codes only", () => {
		const result = auditStoredPost({
			title: "T",
			...analysis,
			seoTitle: "kort",
			processedAt: 1,
			article: "## Overskrift\n\nKort tekst.",
		});
		expect(result).toEqual({
			missing: false,
			findings: [
				{ part: "analysis", issues: ["seo_title_length"] },
				{ part: "article", issues: ["intro_missing", "too_few_sections", "word_count"] },
			],
		});
	});
});
