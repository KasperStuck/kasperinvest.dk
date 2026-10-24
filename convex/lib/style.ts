/**
 * Style detectors shared by the content rules, the prompts and scripts/content-sample.ts:
 * visible text per Markdown block, thought dashes, AI phrases, sentences, verbatim repetition
 * and years. Pure TypeScript without Node-only APIs: it also runs inside Convex mutations.
 */
import { marked, type Token, type Tokens } from "marked";
import type { TranscriptSegment } from "../helpers";

/** Changes when a rule, threshold or phrase list changes; sampler reports record it. */
export const RULESET_VERSION = "2026-10-24";

export function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Lowercase letter and digit runs. Used for verbatim comparisons. */
export function normalizedWords(text: string): string[] {
	return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

// --- Visible text ---

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
	ndash: "–",
	mdash: "—",
	minus: "−",
	hellip: "…",
	laquo: "«",
	raquo: "»",
	ldquo: "“",
	rdquo: "”",
	lsquo: "‘",
	rsquo: "’",
	shy: "­",
};

/** Decodes numeric and common named HTML entities; marked keeps them as written. */
export function decodeEntities(text: string): string {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name: string) => {
		if (name.startsWith("#")) {
			const hex = name[1].toLowerCase() === "x";
			const code = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
			return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
		}
		return NAMED_ENTITIES[name.toLowerCase()] ?? match;
	});
}

export type TextSegment =
	| { kind: "heading"; depth: number; text: string }
	| { kind: "paragraph"; text: string; emphasisOnly: boolean }
	| { kind: "list_item" | "table_cell"; text: string };

type InlineToken = Token & { tokens?: Token[] };

function inlineText(tokens: Token[] | undefined): string {
	let text = "";
	for (const token of (tokens ?? []) as InlineToken[]) {
		if (token.tokens?.length) text += inlineText(token.tokens);
		else if (token.type === "text" || token.type === "codespan" || token.type === "escape") {
			text += token.text;
		} else if (token.type === "br") text += " ";
	}
	return text;
}

function clean(text: string): string {
	return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function isEmphasisOnly(tokens: Token[]): boolean {
	const visible = tokens.filter((token) => !(token.type === "text" && !token.text.trim()));
	return visible.length === 1 && (visible[0].type === "em" || visible[0].type === "strong");
}

function collectSegments(tokens: Token[], segments: TextSegment[]) {
	const push = (segment: TextSegment) => {
		if (segment.text) segments.push(segment);
	};
	for (const token of tokens) {
		switch (token.type) {
			case "heading":
				push({ kind: "heading", depth: token.depth, text: clean(inlineText(token.tokens)) });
				break;
			case "paragraph":
				push({
					kind: "paragraph",
					text: clean(inlineText(token.tokens)),
					emphasisOnly: isEmphasisOnly(token.tokens ?? []),
				});
				break;
			case "list":
				for (const item of (token as Tokens.List).items) {
					collectSegments(item.tokens, segments);
				}
				break;
			// Marked represents the ordinary text of a tight list item as a block text token.
			case "text":
				push({ kind: "list_item", text: clean(inlineText([token])) });
				break;
			case "table": {
				const table = token as Tokens.Table;
				for (const cell of [...table.header, ...table.rows.flat()]) {
					push({ kind: "table_cell", text: clean(inlineText(cell.tokens)) });
				}
				break;
			}
			case "blockquote":
				collectSegments(token.tokens ?? [], segments);
				break;
		}
	}
}

/**
 * Visible text per block: each heading, paragraph, list item and table cell, with inline
 * formatting flattened and HTML entities decoded. Code and HTML blocks are left out; the
 * rules reject them separately.
 */
export function textSegments(markdown: string | Token[]): TextSegment[] {
	const tokens = typeof markdown === "string" ? marked.lexer(markdown) : markdown;
	const segments: TextSegment[] = [];
	collectSegments(tokens, segments);
	return segments;
}

// --- Snippets ---

const SNIPPET_MAX = 40;

/** At most 40 characters of `text` around [start, end), on one line. */
function snippetAt(text: string, start: number, end: number): string {
	const room = Math.max(0, SNIPPET_MAX - (end - start));
	const from = Math.max(0, start - Math.ceil(room / 2));
	return text
		.slice(from, from + SNIPPET_MAX)
		.replace(/\s+/g, " ")
		.trim();
}

// --- Thought dashes ---

export type DashHits = {
	/** Snippets around thought dashes and every en dash. */
	illegal: string[];
	/** Snippets around a spaced hyphen next to a capitalized word, e.g. a fund name. */
	ambiguous: string[];
	/** En dashes directly between two digits (also in `illegal`); normalizeDashRanges fixes them. */
	ranges: number;
};

const HORIZONTAL_SPACE = "[^\\S\\n]";
const SPACED_HYPHEN = new RegExp(
	`(?<=(\\S+)${HORIZONTAL_SPACE}+)-(?=${HORIZONTAL_SPACE}+(\\S+))`,
	"gu",
);

function firstLetterOrDigit(word: string): string {
	return word.match(/[\p{L}\p{N}]/u)?.[0] ?? "";
}

/**
 * "–", "—" and "―" are never allowed, ranges included; " - " is a thought dash between
 * lowercase words or digits and ambiguous next to a capitalized word. Unspaced hyphens,
 * negative numbers and list markers are not dashes. Decode HTML entities first.
 */
export function findThoughtDashes(text: string): DashHits {
	const hits: DashHits = { illegal: [], ambiguous: [], ranges: 0 };
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === "–" || char === "—" || char === "―") {
			hits.illegal.push(snippetAt(text, i, i + 1));
			if (char === "–" && /\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? "")) {
				hits.ranges++;
			}
		}
	}
	for (const match of text.matchAll(SPACED_HYPHEN)) {
		const capitalized = [match[1], match[2]].some((word) =>
			/\p{Lu}/u.test(firstLetterOrDigit(word)),
		);
		const snippet = snippetAt(text, match.index, match.index + 1);
		(capitalized ? hits.ambiguous : hits.illegal).push(snippet);
	}
	return hits;
}

const EN_DASH = "(?:\u2013|&ndash;|&#8211;|&#x2013;)";
const DIGIT_RANGE = new RegExp(`(?<=\\d)${EN_DASH}(?=\\d)`, "gi");

/**
 * The deterministic normalize step: an en dash (literal or entity) directly between two digits
 * becomes a hyphen, so a range never costs a paid retry. Every other dash is left for the rules.
 */
export function normalizeDashRanges(text: string): string {
	return text.replace(DIGIT_RANGE, "-");
}

/**
 * Text fed back to the model (e.g. the judge's reason) without any en or em dash, so the next
 * attempt is not primed to write one: ranges get a hyphen, every other dash becomes a comma.
 */
export function replaceDashes(text: string): string {
	return normalizeDashRanges(text)
		.replace(/&(?:ndash|mdash);|&#(?:8211|8212|x2013|x2014);/gi, "\u2013")
		.replace(/\s*[\u2013\u2014\u2015]\s*/g, ", ");
}

// --- AI phrases ---

type Phrase = { label: string; pattern: RegExp };

/** Whole phrase with Unicode letter boundaries; a space also matches ", " and runs of spaces. */
function phrase(label: string, source: string): Phrase {
	const body = source.replaceAll(" ", ",?\\s+");
	return { label, pattern: new RegExp(`(?<!\\p{L})${body}(?!\\p{L})`, "giu") };
}

/** Filler phrases that are never needed. Any hit is an error. */
export const AI_PHRASES: Phrase[] = [
	phrase("i en verden, hvor", "i en verden hvor"),
	phrase(
		"i dagens hurtigt skiftende verden",
		"i dagens (?:hurtigt )?(?:skiftende|foranderlige) verden",
	),
	phrase("lad os dykke ned i", "lad os (?:dykke|se nærmere|kigge nærmere)"),
	phrase("dykke ned i", "dykke(?:r|t)? (?:dybere )?ned i"),
	phrase("det er værd at bemærke", "det er værd at bemærke"),
	phrase("det er vigtigt at bemærke", "det er vigtigt at bemærke"),
	phrase("spiller en afgørende rolle", "spiller en (?:afgørende|central|vigtig) rolle"),
	phrase("nøglen til succes", "nøglen til succes"),
	phrase("når alt kommer til alt", "når alt kommer til alt"),
	phrase("alt i alt", "alt i alt"),
	phrase("kort sagt", "kort sagt"),
	phrase("samlet set", "samlet set"),
	phrase("afslutningsvis", "afslutningsvis"),
	phrase("game changer", "game(?:-|\\s)?changer\\p{L}*"),
	phrase("banebrydende", "banebrydende"),
	phrase("sømløs", "sømløs\\p{L}*"),
	phrase("holistisk", "holistisk\\p{L}*"),
	phrase("din økonomiske rejse", "(?:økonomiske |finansielle |investerings)rejse\\p{L}*"),
	phrase(
		"navigere gennem det komplekse landskab",
		"navigere(?:r)? (?:gennem|i) (?:det )?(?:komplekse|finansielle) landskab\\p{L}*",
	),
	phrase(
		"det finansielle landskab",
		"det (?:finansielle|økonomiske|investerings\\p{L}*) landskab\\p{L}*",
	),
];

/** Words that are fine once but read as AI filler when repeated; a cap applies per part. */
export const AI_OVERUSE: Phrase[] = [
	phrase("afgørende", "afgørende"),
	phrase("det er vigtigt at", "det er vigtigt at"),
	phrase("ikke kun … men også", "ikke kun(?!\\p{L}).*?(?<!\\p{L})men også"),
	phrase("ikke bare", "ikke bare"),
	phrase("understrege", "understreg\\p{L}*"),
	phrase("i sidste ende", "i sidste ende"),
	phrase("i bund og grund", "i bund og grund"),
	phrase("tværtimod", "tværtimod"),
	phrase("robust", "robust\\p{L}*"),
	phrase("essentiel", "essentiel\\p{L}*"),
	phrase("det handler om", "det handler om"),
];

/** Snippets around every match of a global `pattern` in `text`. */
export function findSnippets(text: string, pattern: RegExp): string[] {
	return [...text.matchAll(pattern)].map((match) =>
		snippetAt(text, match.index, match.index + match[0].length),
	);
}

/** Snippets of every banned filler phrase in `text`; overlapping hits count once. */
export function findAiPhrases(text: string): string[] {
	const ranges = AI_PHRASES.flatMap(({ pattern }) =>
		[...text.matchAll(pattern)].map((match) => [match.index, match.index + match[0].length]),
	).sort((a, b) => a[0] - b[0]);
	const snippets: string[] = [];
	let lastEnd = -1;
	for (const [start, end] of ranges) {
		if (start < lastEnd) continue;
		snippets.push(snippetAt(text, start, end));
		lastEnd = end;
	}
	return snippets;
}

/** Occurrences per overused label across `texts`; "ikke kun … men også" counts per sentence. */
export function countOveruse(texts: string[]): Map<string, { count: number; examples: string[] }> {
	const counts = new Map<string, { count: number; examples: string[] }>();
	for (const sentence of texts.flatMap(splitSentences)) {
		for (const { label, pattern } of AI_OVERUSE) {
			for (const match of sentence.matchAll(pattern)) {
				const entry = counts.get(label) ?? { count: 0, examples: [] };
				entry.count++;
				entry.examples.push(snippetAt(sentence, match.index, match.index + match[0].length));
				counts.set(label, entry);
			}
		}
	}
	return counts;
}

// --- Sentences ---

/** Abbreviations that never end a sentence, even before a capital letter (lowercase, no final "."). */
const NON_TERMINAL_ABBREVIATIONS = new Set([
	"f.eks",
	"fx",
	"bl.a",
	"dvs",
	"ca",
	"jf",
	"nr",
	"inkl",
	"ekskl",
	"evt",
	"hhv",
	"ift",
	"mht",
	"vedr",
	"pga",
	"iflg",
	"ifm",
]);

const SENTENCE_BOUNDARY = /[.!?…]+["”»’)]*(?= )/g;

function endsWithAbbreviation(textBefore: string): boolean {
	const word = textBefore.slice(textBefore.lastIndexOf(" ") + 1).toLowerCase();
	return NON_TERMINAL_ABBREVIATIONS.has(word) || /^(?:\p{L}\.)*\p{L}$/u.test(word);
}

/**
 * Splits at ".", "!", "?" or "…" followed by a space and a character that is not lowercase.
 * A lowercase next word continues the sentence (e.g. "ca. 5 kr. om måneden"); listed
 * abbreviations and single-letter initials never end one. Text without an end mark is one
 * sentence.
 */
export function splitSentences(text: string): string[] {
	const normalized = text.replace(/\s+/g, " ").trim();
	const sentences: string[] = [];
	let start = 0;
	for (const match of normalized.matchAll(SENTENCE_BOUNDARY)) {
		const end = match.index + match[0].length;
		const next = normalized[end + 1];
		if (next === undefined || /\p{Ll}/u.test(next)) continue;
		if (match[0].startsWith(".") && endsWithAbbreviation(normalized.slice(start, match.index))) {
			continue;
		}
		sentences.push(normalized.slice(start, end));
		start = end + 1;
	}
	if (start < normalized.length) sentences.push(normalized.slice(start));
	return sentences;
}

// --- Verbatim repetition ---

export const SHARED_RUN_WORDS = 8;

/** The first run of `size` normalized words that `a` and `b` share, if any. */
export function sharedRun(a: string, b: string, size = SHARED_RUN_WORDS): string | undefined {
	const grams = new Set<string>();
	const bWords = normalizedWords(b);
	for (let i = 0; i + size <= bWords.length; i++) grams.add(bWords.slice(i, i + size).join(" "));
	const aWords = normalizedWords(a);
	for (let i = 0; i + size <= aWords.length; i++) {
		const gram = aWords.slice(i, i + size).join(" ");
		if (grams.has(gram)) return gram;
	}
	return undefined;
}

// --- Years ---

// A standalone 1900-2099 token: not inside a word or number, not a decimal ("0,2024"), not a
// thousands group ("2019.000", "2019 000") and not an amount or count ("2000 kr", "1950 %").
const YEAR =
	/(?<![\p{L}\p{N}]|\d,)(?:19|20)\d{2}(?![\p{L}\p{N}]|[.\s]\d{3}(?!\d))(?!\s?(?:%|\$|€|(?:kr|kroner|procent|usd|dkk|aktier|stk)(?!\p{L})))/giu;

export function findYears(text: string): string[] {
	return [...text.matchAll(YEAR)]
		.filter((match) => {
			const after = text.slice(match.index + match[0].length);
			// Preserve year-first dotted dates, but do not turn 2000,50 or 2024.75 into years.
			return (
				!/^[.,]\d/.test(after) ||
				/^\.(?:0?[1-9]|1[0-2])\.(?:0?[1-9]|[12]\d|3[01])(?!\d)/.test(after)
			);
		})
		.map((match) => match[0]);
}

/** Every 19xx/20xx token of the source, loosely matched. */
export function sourceYears(sourceText: string): Set<string> {
	return new Set(sourceText.match(/(?<!\d)(?:19|20)\d{2}(?!\d)/g) ?? []);
}

/** Title, description and full transcript: the text a generated year must come from. */
export function postSourceText(source: {
	title: string;
	description: string;
	transcript?: Pick<TranscriptSegment, "text">[];
}): string {
	return [source.title, source.description, ...(source.transcript ?? []).map((s) => s.text)].join(
		"\n",
	);
}
