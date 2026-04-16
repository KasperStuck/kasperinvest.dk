/** Pure helper functions shared between Convex actions and tests. */

/** Known YouTube thumbnail size keys. */
export type ThumbnailKey = "default" | "medium" | "high" | "standard" | "maxres";

/** YouTube thumbnail map — each key is optional, but only known sizes are allowed. */
export type Thumbnails = Partial<Record<ThumbnailKey, { url: string }>>;

/** A single segment from a transcript. */
export interface TranscriptSegment {
	text: string;
}

/** Duration (seconds) at or below which a video is classified as a Short. */
export const SHORTS_THRESHOLD = 90 as const;

export function parseDuration(iso: string): number {
	const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!m) return 0;
	return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

export function bestThumbnail(thumbnails: Thumbnails): string {
	return thumbnails?.maxres?.url ?? thumbnails?.high?.url ?? thumbnails?.medium?.url ?? "";
}

export function extractHashtags(raw: string): string[] {
	const tags = new Set<string>();
	for (const match of raw.matchAll(/#(\S+)/g)) {
		const tag = match[1].replace(/[.,;:!?)]+$/, "").toLowerCase();
		if (tag.length > 1) tags.add(tag);
	}
	return [...tags];
}

export function getTranscriptText(
	transcript: TranscriptSegment[] | undefined,
	maxLength: number,
): string {
	if (!transcript?.length) return "";
	return transcript
		.map((seg) => seg.text)
		.join(" ")
		.slice(0, maxLength);
}

export async function forEachSafe<T>(
	items: T[],
	label: (item: T) => string,
	fn: (item: T) => Promise<unknown>,
) {
	for (const item of items) {
		try {
			await fn(item);
		} catch (e) {
			console.error(`Failed: ${label(item)}`, e);
		}
	}
}

const SKIP_SECTION_PATTERNS: readonly RegExp[] = [
	/^Spar eller tjen penge via mine/i,
	/^\(?Annoncelinks?\)?/i,
	/^Mine? andre kanaler/i,
	/^Følg mig p[aå]/i,
	/^Sociale medier/i,
	/^Links?:/i,
	/^Affiliate/i,
	/^Sponsoreret/i,
	/^Annoncelinks/i,
] as const;

const SKIP_LINE_PATTERNS: readonly RegExp[] = [
	/^https?:\/\/\S+$/,
	/^HUSK:?\s*Jeg er ikke r[aå]dgiver/i,
	/^Disclaimer/i,
	/^Dette er ikke (?:finansiel |investerings)?r[aå]dgivning/i,
	/^(#\S+\s*)+$/,
] as const;

export function cleanDescription(raw: string): string {
	const cleaned: string[] = [];
	let skipping = false;

	for (const line of raw.split("\n")) {
		const trimmed = line.trim();

		if (SKIP_SECTION_PATTERNS.some((p) => p.test(trimmed))) {
			skipping = true;
			continue;
		}

		if (/^-{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)) {
			skipping = false;
			continue;
		}

		if (skipping) continue;
		if (SKIP_LINE_PATTERNS.some((p) => p.test(trimmed))) continue;

		const cleanedLine = trimmed
			.replace(/https?:\/\/\S+/g, "")
			.replace(
				/^(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|\u{200D}|\u{20E3}|[\u{E0020}-\u{E007F}])+\s*/u,
				"",
			)
			.trim();

		if (cleanedLine) cleaned.push(cleanedLine);
	}

	return cleaned
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
