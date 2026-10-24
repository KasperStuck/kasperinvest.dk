/**
 * Fact-check step: the checker model extracts every concrete claim of a generated part and
 * checks it against the full source (title, description and the whole transcript, in chunks).
 * Its answer is verified deterministically: every segment is covered, every quote is real, and
 * evidence is a verbatim span of the source. Pure TypeScript without Node-only APIs.
 *
 * Feedback, errors and logs carry issue codes and snippets of the generated text only, never
 * source text.
 */
import { z } from "zod";
import { formatExamples, type ValidationIssue, type VideoAnalysis } from "./contentRules";
import { completeJson, type LlmCallOptions, type LlmConfig, LlmContentError } from "./llm";
import {
	buildFactCheckPrompt,
	buildFactRecheckPrompt,
	type FactCheckPromptInput,
	promptDescription,
} from "./prompts";
import { textSegments } from "./style";

export const FACT_CHUNK_CHARS = 60_000;
export const FACT_CHUNK_OVERLAP = 1_000;

const CLAIM_KINDS = ["number", "year", "name", "quote", "assertion"] as const;
const CLAIM_STATUSES = ["supported", "contradicted", "not_found"] as const;
type ClaimKind = (typeof CLAIM_KINDS)[number];
type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/** First chunk: coverage of every segment plus the claims and their status in this chunk. */
export const factCheckSchema = z.object({
	segments: z.array(
		z.object({ segmentId: z.string(), claimIds: z.array(z.string()), noFactReason: z.string() }),
	),
	claims: z.array(
		z.object({
			id: z.string(),
			segmentId: z.string(),
			candidateQuote: z.string(),
			kind: z.enum(CLAIM_KINDS),
			status: z.enum(CLAIM_STATUSES),
			evidenceQuote: z.string(),
		}),
	),
});

/** Every later chunk: the status of each first-chunk claim in this chunk. */
export const factRecheckSchema = z.object({
	claims: z.array(
		z.object({ id: z.string(), status: z.enum(CLAIM_STATUSES), evidenceQuote: z.string() }),
	),
});

/** Lowercases enum values and trims strings, like normalizeAnalysis does for the analysis. */
function normalizeFactAnswer(raw: unknown): unknown {
	if (typeof raw === "string") return raw.trim();
	if (Array.isArray(raw)) return raw.map(normalizeFactAnswer);
	if (typeof raw !== "object" || raw === null) return raw;
	return Object.fromEntries(
		Object.entries(raw).map(([key, value]) => [
			key,
			(key === "kind" || key === "status") && typeof value === "string"
				? value.trim().toLowerCase()
				: normalizeFactAnswer(value),
		]),
	);
}

// --- Candidate segments ---

/** A unit of generated text with a stable id the checker must account for. */
export type CandidateSegment = { id: string; text: string };

export function analysisSegments(analysis: VideoAnalysis): CandidateSegment[] {
	return [
		{ id: "summary", text: analysis.summary },
		{ id: "seoTitle", text: analysis.seoTitle },
		{ id: "seoDescription", text: analysis.seoDescription },
		{ id: "themes", text: analysis.themes.join(", ") },
		...analysis.keyTakeaways.map((text, i) => ({ id: `keyTakeaways.${i}`, text })),
		...analysis.faq.flatMap((f, i) => [
			{ id: `faq.${i}.question`, text: f.question },
			{ id: `faq.${i}.answer`, text: f.answer },
		]),
	];
}

/** Each heading, paragraph, list item and table cell, numbered s1, s2 … in page order. */
export function articleSegments(markdown: string): CandidateSegment[] {
	return textSegments(markdown).map((segment, i) => ({ id: `s${i + 1}`, text: segment.text }));
}

// --- Source ---

export type FactSource = {
	title: string;
	description: string;
	channelName: string;
	/** The whole transcript, not an excerpt. */
	transcriptText: string;
};

/** Consecutive chunks of `size` characters that overlap by `overlap`; at least one chunk. */
export function transcriptChunks(
	text: string,
	size = FACT_CHUNK_CHARS,
	overlap = FACT_CHUNK_OVERLAP,
): string[] {
	const chunks = [text.slice(0, size)];
	for (let start = size - overlap; start + overlap < text.length; start += size - overlap) {
		chunks.push(text.slice(start, start + size));
	}
	return chunks;
}

// --- Quote matching ---

const QUOTES: Array<[RegExp, string]> = [
	[/[‘’‚‛′]/g, "'"],
	[/[“”„‟″«»]/g, '"'],
];

/** NFKC, lowercase, typographic quotes → ASCII, whitespace collapsed. Nothing else changes. */
export function matchKey(text: string): string {
	let key = text.normalize("NFKC").toLowerCase();
	for (const [pattern, replacement] of QUOTES) key = key.replace(pattern, replacement);
	return key.replace(/\s+/g, " ").trim();
}

const isAlnum = (char: string | undefined) => char !== undefined && /[\p{L}\p{N}]/u.test(char);
const isDigit = (char: string | undefined) => char !== undefined && /\d/.test(char);

/**
 * Whether `needle` is a contiguous span of `haystack` after matchKey, on token boundaries: a
 * match never starts or ends inside a word or number, so "5 %" is not found in "-5 %", "15 %"
 * or "2,5 %", and "000" is not found in "1.000".
 */
export function containsSpan(haystack: string, needle: string): boolean {
	return matchingSpans(haystack, needle).length > 0;
}

type Span = { start: number; end: number };

/** Up to two positions in matchKey(haystack): enough to distinguish absent, unique and ambiguous. */
function matchingSpans(haystack: string, needle: string): Span[] {
	const text = matchKey(haystack);
	const span = matchKey(needle);
	if (!span) return [];
	const matches: Span[] = [];
	for (let at = text.indexOf(span); at !== -1; at = text.indexOf(span, at + 1)) {
		const before = text[at - 1];
		const after = text[at + span.length];
		if (isAlnum(span[0]) && isAlnum(before)) continue;
		if (
			isDigit(span[0]) &&
			(/[-+−]/.test(before ?? "") || (/[.,]/.test(before ?? "") && isDigit(text[at - 2])))
		) {
			continue;
		}
		if (isAlnum(span[span.length - 1]) && isAlnum(after)) continue;
		if (
			isDigit(span[span.length - 1]) &&
			/[.,]/.test(after ?? "") &&
			isDigit(text[at + span.length + 1])
		) {
			continue;
		}
		matches.push({ start: at, end: at + span.length });
		if (matches.length === 2) break;
	}
	return matches;
}

/** Signed numbers with their decimal and grouping marks, e.g. "-5", "1.000", "0,5". */
function numberTokens(text: string): string[] {
	return (matchKey(text).match(/(?<![\p{L}\p{N}.,])[-+−]?\d+(?:[.,]\d+)*/gu) ?? []).map((token) =>
		token.replace("−", "-"),
	);
}

// --- Coverage ---

/** Whitespace tokens with a digit, without surrounding punctuation (a leading sign stays). */
function digitTokens(text: string): Array<Span & { text: string }> {
	return [...text.matchAll(/\S*\d\S*/gu)].map((match) => {
		const leading = match[0].match(/^[^\p{L}\p{N}\-+−]+/u)?.[0].length ?? 0;
		const token = match[0].slice(leading).replace(/[^\p{L}\p{N}%]+$/gu, "");
		const start = match.index + leading;
		return { text: token, start, end: start + token.length };
	});
}

// Periods are allowed only in initials, never after a full word at a sentence boundary.
const NAME_WORD = "(?:\\p{Lu}\\.)+|\\p{Lu}[\\p{L}\\p{N}&'’-]*";
const NAME = new RegExp(`(?<![\\p{L}\\p{N}])(?:${NAME_WORD})(?: +(?:${NAME_WORD}))+`, "gu");

/** Runs of capitalized words, excluding only the recognized sentence prefix "Ifølge". */
function nameCandidates(text: string): Array<Span & { name: string }> {
	return [...text.matchAll(NAME)].flatMap((match) => {
		const sentenceStart = match.index === 0 || /[.!?:]\s+$/.test(text.slice(0, match.index));
		const prefix = sentenceStart ? (match[0].match(/^Ifølge +/u)?.[0] ?? "") : "";
		const name = match[0].slice(prefix.length).replace(/[.']+$/, "");
		if (!name.includes(" ")) return [];
		const start = text.slice(0, match.index + prefix.length).toLowerCase().length;
		return [{ start, end: start + matchKey(name).length, name }];
	});
}

/**
 * Digit-bearing tokens and capitalized multi-word names of each segment that no claim quote of
 * the same segment contains. Names from the title or the channel name need no claim.
 */
export function findUncovered(
	segments: CandidateSegment[],
	claims: Array<{ segmentId: string; candidateQuote: string }>,
	source: Pick<FactSource, "title" | "channelName">,
): string[] {
	const own = [source.title, source.channelName];
	const digits: string[] = [];
	const names: string[] = [];
	for (const segment of segments) {
		const text = segment.text.normalize("NFKC").replace(/\s+/g, " ").trim();
		const key = matchKey(text);
		const spans = claims
			.filter((claim) => claim.segmentId === segment.id)
			.flatMap((claim) => {
				const matches = matchingSpans(text, claim.candidateQuote);
				// Repeated short quotes do not identify which occurrence was checked. Require
				// enough surrounding context to locate a single span, rather than covering all.
				return matches.length === 1 ? matches : [];
			});
		const covered = ({ start, end }: Span) =>
			spans.some((span) => span.start <= start && span.end >= end);
		for (const token of digitTokens(key)) {
			if (!covered(token)) digits.push(token.text);
		}
		for (const candidate of nameCandidates(text)) {
			const { name } = candidate;
			if (own.some((metadata) => containsSpan(metadata, name)) || covered(candidate)) continue;
			names.push(name);
		}
	}
	return [...digits, ...names];
}

// --- Verification of the checker's answer ---

type Claim = z.infer<typeof factCheckSchema>["claims"][number];

function coverageError(): never {
	throw new LlmContentError("fact_check_coverage");
}

/** Every segment exactly once, every claim listed in its own segment, every quote real. */
function verifyExtraction(
	answer: z.infer<typeof factCheckSchema>,
	segments: CandidateSegment[],
): Claim[] {
	const byId = new Map(segments.map((segment) => [segment.id, segment]));
	const claimsById = new Map<string, Claim>();
	for (const claim of answer.claims) {
		if (claimsById.has(claim.id) || !byId.has(claim.segmentId)) coverageError();
		claimsById.set(claim.id, claim);
	}
	const seen = new Set<string>();
	const listed = new Set<string>();
	for (const { segmentId, claimIds, noFactReason } of answer.segments) {
		if (seen.has(segmentId) || !byId.has(segmentId)) coverageError();
		seen.add(segmentId);
		if (claimIds.length === 0 && !noFactReason.trim()) coverageError();
		for (const id of claimIds) {
			if (claimsById.get(id)?.segmentId !== segmentId || listed.has(id)) coverageError();
			listed.add(id);
		}
	}
	if (seen.size !== segments.length || listed.size !== claimsById.size) coverageError();
	for (const claim of answer.claims) {
		const segment = byId.get(claim.segmentId) as CandidateSegment;
		if (!containsSpan(segment.text, claim.candidateQuote)) {
			throw new LlmContentError("fact_check_quote");
		}
	}
	return answer.claims;
}

/** Exactly the given claim ids, each once. */
function verifyRecheck(
	answer: z.infer<typeof factRecheckSchema>,
	claims: Claim[],
): Map<string, { status: ClaimStatus; evidenceQuote: string }> {
	const expected = new Set(claims.map((claim) => claim.id));
	const result = new Map<string, { status: ClaimStatus; evidenceQuote: string }>();
	for (const { id, status, evidenceQuote } of answer.claims) {
		if (!expected.has(id) || result.has(id)) coverageError();
		result.set(id, { status, evidenceQuote });
	}
	if (result.size !== expected.size) coverageError();
	return result;
}

/** Only names and years may rest on the title and description; everything else on the transcript. */
const METADATA_KINDS: ReadonlySet<ClaimKind> = new Set(["name", "year"]);

/**
 * The checker's status, kept only when its evidence is a verbatim span of the allowed source
 * text. A supported number or year must also carry the same numbers as its evidence, so a sign
 * flip or a different amount is never accepted.
 */
function verifiedStatus(
	claim: Pick<Claim, "kind" | "candidateQuote">,
	answer: { status: ClaimStatus; evidenceQuote: string },
	chunk: string,
	metadata: string,
): ClaimStatus {
	if (answer.status === "not_found" || !answer.evidenceQuote.trim()) return "not_found";
	const inSource =
		containsSpan(chunk, answer.evidenceQuote) ||
		(METADATA_KINDS.has(claim.kind) && containsSpan(metadata, answer.evidenceQuote));
	if (!inSource) return "not_found";
	if (answer.status === "supported" && (claim.kind === "number" || claim.kind === "year")) {
		const evidence = numberTokens(answer.evidenceQuote);
		const missing = numberTokens(claim.candidateQuote).some((n) => !evidence.includes(n));
		if (evidence.length > 0 && missing) return "not_found";
	}
	return answer.status;
}

type Outcome = "supported" | "contradicted" | "ambiguous" | "not_found";

/** Supported (or contradicted) only when no chunk says the opposite. */
function aggregate(statuses: ClaimStatus[]): Outcome {
	const supported = statuses.includes("supported");
	const contradicted = statuses.includes("contradicted");
	if (supported && contradicted) return "ambiguous";
	if (supported) return "supported";
	if (contradicted) return "contradicted";
	return "not_found";
}

// --- Feedback ---

function factError(code: string, message: string): ValidationIssue {
	return { code, message, severity: "error" };
}

function factIssues(outcomes: Array<{ claim: Claim; outcome: Outcome }>, uncovered: string[]) {
	const quotes = (outcome: Outcome) =>
		outcomes.filter((o) => o.outcome === outcome).map((o) => o.claim.candidateQuote);
	const issues: ValidationIssue[] = [];
	const contradicted = quotes("contradicted");
	if (contradicted.length) {
		issues.push(
			factError(
				"fact_contradicted",
				`Disse påstande strider mod kilden (${contradicted.length}: ${formatExamples(contradicted)}). Ret dem, så de svarer til transskriptionen.`,
			),
		);
	}
	const ambiguous = quotes("ambiguous");
	if (ambiguous.length) {
		issues.push(
			factError(
				"fact_ambiguous",
				`Kilden siger både ét og andet om disse påstande (${ambiguous.length}: ${formatExamples(ambiguous)}); præcisér hvem der siger hvad, eller fjern påstanden.`,
			),
		);
	}
	const unsupported = quotes("not_found");
	if (unsupported.length) {
		issues.push(
			factError(
				"fact_unsupported",
				`Disse påstande kunne ikke findes i kilden (${unsupported.length}: ${formatExamples(unsupported)}). Tal, citater og finansielle påstande skal stå i transskriptionen; fjern dem, eller skriv kun det, kilden siger.`,
			),
		);
	}
	if (uncovered.length) {
		issues.push(
			factError(
				"fact_uncovered",
				`Disse tal eller navne kunne ikke knyttes til en påstand fra kilden (${uncovered.length}: ${formatExamples(uncovered)}). Brug kun tal og navne fra kilden, og skriv dem i en tydelig sætning.`,
			),
		);
	}
	return issues;
}

// --- Step ---

export type FactCheckResult = {
	/** Errors only; empty when every claim is supported and every number and name is covered. */
	issues: ValidationIssue[];
	/** Candidate quotes of the supported claims, for the judge. */
	verifiedClaims: string[];
};

/**
 * One call per transcript chunk: the first extracts and checks every claim, each later one
 * rechecks every claim. A malformed or incomplete answer is an LlmContentError, which consumes
 * the generation attempt like a malformed judge answer.
 */
export async function factCheck(input: {
	config: LlmConfig;
	part: FactCheckPromptInput["part"];
	segments: CandidateSegment[];
	source: FactSource;
	call: LlmCallOptions;
}): Promise<FactCheckResult> {
	const { source, call } = input;
	const chunks = transcriptChunks(source.transcriptText);
	const metadata = `${source.title}\n${promptDescription(source.description)}`;
	const promptInput = (index: number): FactCheckPromptInput => ({
		part: input.part,
		title: source.title,
		description: source.description,
		channelName: source.channelName,
		chunk: { index: index + 1, count: chunks.length, text: chunks[index] },
	});

	const { value: first } = await completeJson(
		input.config,
		factCheckSchema,
		buildFactCheckPrompt({ ...promptInput(0), segments: input.segments }),
		{ ...call, name: "fact_check", normalize: normalizeFactAnswer },
	);
	const claims = verifyExtraction(first, input.segments);
	const statuses = new Map(
		claims.map((claim) => [claim.id, [verifiedStatus(claim, claim, chunks[0], metadata)]]),
	);
	for (let index = 1; index < chunks.length && claims.length > 0; index++) {
		const { value } = await completeJson(
			input.config,
			factRecheckSchema,
			buildFactRecheckPrompt({ ...promptInput(index), claims }),
			{ ...call, name: "fact_recheck", normalize: normalizeFactAnswer },
		);
		for (const [id, answer] of verifyRecheck(value, claims)) {
			const claim = claims.find((c) => c.id === id) as Claim;
			statuses.get(id)?.push(verifiedStatus(claim, answer, chunks[index], metadata));
		}
	}

	const outcomes = claims.map((claim) => ({
		claim,
		outcome: aggregate(statuses.get(claim.id) ?? []),
	}));
	const uncovered = findUncovered(input.segments, claims, source);
	return {
		issues: factIssues(outcomes, uncovered),
		verifiedClaims: outcomes
			.filter((o) => o.outcome === "supported")
			.map((o) => o.claim.candidateQuote),
	};
}
