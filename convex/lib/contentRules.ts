/**
 * Deterministic content rules for AI-generated video posts and channel descriptions.
 * Pure TypeScript without Node-only APIs: it also runs inside Convex mutations before a write.
 */
import { marked, type Token, walkTokens } from "marked";
import { z } from "zod";

export const CATEGORIES = [
	"privatøkonomi",
	"aktier",
	"ETF",
	"obligationer",
	"skat",
	"pension",
	"strategi",
	"psykologi",
	"analyse",
	"krypto",
	"bolig",
	"FIRE",
	"marked",
	"andet",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Bounds shared by validators and prompts. The page appends " - KasperInvest" to seoTitle. */
export const LIMITS = {
	seoTitle: { min: 30, max: 50 },
	seoDescription: { min: 110, max: 160 },
	summary: { min: 80, max: 600 },
	themes: { min: 1, max: 8 },
	categories: { min: 1, max: 3 },
	keyTakeaways: { min: 3, max: 6 },
	faq: { min: 3, max: 5 },
	relevanceScore: { min: 0, max: 100 },
	articleWords: { min: 800, max: 1500 },
	articleSections: { min: 3 },
	channelWords: { min: 50, max: 100 },
	channelParagraphWords: { min: 15 },
} as const;

export const analysisSchema = z.object({
	summary: z.string(),
	seoTitle: z.string(),
	seoDescription: z.string(),
	themes: z.array(z.string()),
	categories: z.array(z.enum(CATEGORIES)),
	keyTakeaways: z.array(z.string()),
	faq: z.array(z.object({ question: z.string(), answer: z.string() })),
	relevanceScore: z.number().min(0).max(100),
});

export type VideoAnalysis = z.infer<typeof analysisSchema>;

export const judgeSchema = z.object({
	score: z.number().min(1).max(10),
	danish: z.boolean(),
	topicMatch: z.boolean(),
	sourceSupported: z.boolean(),
	reason: z.string(),
});

export type JudgeVerdict = z.infer<typeof judgeSchema>;

export type ValidationIssue = {
	code: string;
	path?: string;
	/** Danish; fed back to the generator on the next attempt. */
	message: string;
	severity: "error" | "warning";
};

export function hasErrors(issues: ValidationIssue[]): boolean {
	return issues.some((issue) => issue.severity === "error");
}

function error(code: string, message: string, path?: string): ValidationIssue {
	return path ? { code, path, message, severity: "error" } : { code, message, severity: "error" };
}

function warning(code: string, message: string): ValidationIssue {
	return { code, message, severity: "warning" };
}

// Strict on purpose: any "<" that a browser could read as a tag, comment or processing
// instruction (e.g. "</script/x>", "<svg/onload=…>", "<!--", "<?"). Danish prose never needs it.
const MARKUP_PATTERN = /<[a-z/!?]/i;
const URL_PATTERN = /https?:\/\/|\bwww\./i;

export function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Lowercase, letters and digits only, single spaces. Used to compare headings with titles. */
function normalizeHeadingText(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
}

// --- Analysis ---

function trimDeep(value: unknown): unknown {
	if (typeof value === "string") return value.trim();
	if (Array.isArray(value)) return value.map(trimDeep);
	if (typeof value === "object" && value !== null) {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, trimDeep(v)]));
	}
	return value;
}

function dedupeCaseInsensitive(values: unknown[]): unknown[] {
	const seen = new Set<string>();
	return values.filter((value) => {
		if (typeof value !== "string") return true;
		const key = value.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/** Fixes what a model commonly gets slightly wrong (enum casing, whitespace, duplicates). */
export function normalizeAnalysis(raw: unknown): unknown {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return raw;
	const value = trimDeep(raw) as Record<string, unknown>;
	if (Array.isArray(value.categories)) {
		value.categories = dedupeCaseInsensitive(
			value.categories.map((category) =>
				typeof category === "string"
					? (CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase()) ?? category)
					: category,
			),
		);
	}
	if (Array.isArray(value.themes)) value.themes = dedupeCaseInsensitive(value.themes);
	return value;
}

function checkLength(
	issues: ValidationIssue[],
	field: "seoTitle" | "seoDescription" | "summary",
	code: string,
	value: string,
) {
	const { min, max } = LIMITS[field];
	const length = value.trim().length;
	if (length < min || length > max) {
		issues.push(error(code, `${field} skal være ${min}-${max} tegn (nu ${length}).`, field));
	}
}

function checkCount(
	issues: ValidationIssue[],
	field: "themes" | "categories" | "keyTakeaways" | "faq",
	code: string,
	count: number,
) {
	const { min, max } = LIMITS[field];
	if (count < min || count > max) {
		issues.push(error(code, `${field} skal have ${min}-${max} elementer (nu ${count}).`, field));
	}
}

function hasDuplicates(values: string[]): boolean {
	const keys = values.map((value) => value.trim().toLowerCase());
	return new Set(keys).size !== keys.length;
}

export function validateAnalysis(analysis: VideoAnalysis): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const strings: Array<[string, string]> = [
		["summary", analysis.summary],
		["seoTitle", analysis.seoTitle],
		["seoDescription", analysis.seoDescription],
		...analysis.themes.map((t, i): [string, string] => [`themes.${i}`, t]),
		...analysis.categories.map((c, i): [string, string] => [`categories.${i}`, c]),
		...analysis.keyTakeaways.map((t, i): [string, string] => [`keyTakeaways.${i}`, t]),
		...analysis.faq.flatMap(
			(f, i): Array<[string, string]> => [
				[`faq.${i}.question`, f.question],
				[`faq.${i}.answer`, f.answer],
			],
		),
	];
	for (const [path, value] of strings) {
		if (!value.trim()) issues.push(error("empty_value", `${path} må ikke være tomt.`, path));
		if (MARKUP_PATTERN.test(value))
			issues.push(error("html", `${path} må ikke indeholde HTML.`, path));
		if (URL_PATTERN.test(value)) {
			issues.push(error("url", `${path} må ikke indeholde links eller URL'er.`, path));
		}
	}

	checkLength(issues, "seoTitle", "seo_title_length", analysis.seoTitle);
	checkLength(issues, "seoDescription", "seo_description_length", analysis.seoDescription);
	checkLength(issues, "summary", "summary_length", analysis.summary);

	checkCount(issues, "themes", "themes_count", analysis.themes.length);
	if (hasDuplicates(analysis.themes)) {
		issues.push(error("themes_duplicate", "themes må ikke gentage samme tema.", "themes"));
	}
	checkCount(issues, "categories", "categories_count", analysis.categories.length);
	if (hasDuplicates(analysis.categories)) {
		issues.push(
			error("categories_duplicate", "categories må ikke gentage en kategori.", "categories"),
		);
	}
	for (const category of analysis.categories) {
		if (!(CATEGORIES as readonly string[]).includes(category)) {
			issues.push(error("category_invalid", `Ukendt kategori: ${category}.`, "categories"));
		}
	}
	checkCount(issues, "keyTakeaways", "key_takeaways_count", analysis.keyTakeaways.length);

	checkCount(issues, "faq", "faq_count", analysis.faq.length);
	if (hasDuplicates(analysis.faq.map((f) => f.question))) {
		issues.push(error("faq_duplicate", "FAQ-spørgsmål må ikke gentages.", "faq"));
	}
	analysis.faq.forEach((f, i) => {
		if (!f.question.trim().endsWith("?")) {
			issues.push(
				error("faq_question_mark", "Hvert FAQ-spørgsmål skal slutte med '?'.", `faq.${i}.question`),
			);
		}
	});

	const { min, max } = LIMITS.relevanceScore;
	const score = analysis.relevanceScore;
	if (!Number.isFinite(score) || score < min || score > max) {
		issues.push(
			error("relevance_range", `relevanceScore skal være ${min}-${max}.`, "relevanceScore"),
		);
	}
	return issues;
}

// --- Article ---

/** CRLF → LF, trim, and strip one fence that wraps the whole answer. */
export function normalizeArticle(markdown: string): string {
	const text = markdown.replace(/\r\n?/g, "\n").trim();
	const fenced = text.match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
	return (fenced ? fenced[1] : text).trim();
}

type TokenWithChildren = Token & { tokens?: Token[]; items?: Token[] };

/** Text a reader sees: leaf text without Markdown syntax or HTML, table cells included. */
function visibleText(tokens: Token[]): string {
	const parts: string[] = [];
	// marked's own walker also visits list items and table header and body cells.
	walkTokens(tokens, (token) => {
		const parent = token as TokenWithChildren;
		if (parent.tokens || parent.items) return;
		if (token.type === "text" || token.type === "codespan" || token.type === "escape") {
			parts.push(token.text);
		} else if (token.type === "br" || token.type === "space") {
			parts.push(" ");
		}
	});
	return parts.join("");
}

const RESERVED_HEADINGS = /^(hovedpointer|ofte stillede spørgsmål|faq)\b/;
const VIDEO_REFERENCES = /\b(i denne video|i videoen|videoen handler om)\b/i;
const SENTENCE_END = /[.!?"”»«’']$/;

// Frequent Danish function words; their share separates Danish from e.g. English prose.
const DANISH_MARKERS = new Set([
	"og",
	"i",
	"at",
	"det",
	"en",
	"er",
	"til",
	"på",
	"som",
	"for",
	"med",
	"af",
	"den",
	"de",
	"ikke",
	"har",
	"kan",
	"du",
	"et",
	"om",
	"men",
	"så",
	"der",
	"over",
	"efter",
	"når",
	"også",
	"eller",
	"din",
	"dit",
]);
const MIN_DANISH_MARKER_SHARE = 0.12;

// Words too common to show that a title's topic is covered.
const TITLE_STOP_WORDS = new Set([
	...DANISH_MARKERS,
	"ingen",
	"sådan",
	"hvordan",
	"hvad",
	"hvorfor",
	"derfor",
	"mere",
	"mest",
	"bedste",
	"bliver",
	"skal",
	"vil",
	"ville",
	"være",
	"have",
	"dine",
	"jeg",
	"min",
	"mine",
	"vores",
	"guide",
]);

function wordsOf(text: string): string[] {
	return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function validateArticle(
	markdown: string,
	meta: { title: string; seoTitle?: string },
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const add = (issue: ValidationIssue) => {
		if (!issues.some((i) => i.code === issue.code)) issues.push(issue);
	};
	const tokens = marked.lexer(markdown);
	const blocks = tokens.filter((token) => token.type !== "space");

	// Covers browser-recognized markup that Markdown renders as text, e.g. "</script/x>".
	if (MARKUP_PATTERN.test(markdown)) add(error("html", "Brug kun Markdown, aldrig HTML."));

	if (blocks[0]?.type !== "paragraph") {
		add(error("intro_missing", "Artiklen skal starte med et indledende afsnit uden overskrift."));
	}

	const titles = [meta.title, meta.seoTitle]
		.filter((t): t is string => Boolean(t))
		.map(normalizeHeadingText);
	let sections = 0;
	walkTokens(tokens, (token) => {
		switch (token.type) {
			case "html":
				add(error("html", "Brug kun Markdown, aldrig HTML."));
				break;
			case "link":
			case "image":
				add(error("url", "Artiklen må ikke indeholde links, billeder eller URL'er."));
				break;
			case "code":
				add(error("code", "Artiklen må ikke indeholde kodeblokke."));
				break;
			case "heading": {
				const text = normalizeHeadingText(visibleText(token.tokens ?? []));
				if (token.depth === 1) add(error("h1", "Brug aldrig H1 (#); siden har allerede en H1."));
				if (token.depth === 2) sections++;
				if (token.depth === 3 && sections === 0) {
					add(error("h3_before_h2", "En ### må kun stå inde i en ##-sektion."));
				}
				if (token.depth >= 4) add(error("heading_too_deep", "Brug kun ## og ###."));
				if (titles.includes(text)) {
					add(error("heading_repeats_title", "En overskrift må ikke gentage titlen."));
				}
				if (RESERVED_HEADINGS.test(text)) {
					add(
						error(
							"reserved_heading",
							"Brug ikke overskrifterne Hovedpointer, Ofte stillede spørgsmål eller FAQ; siden viser dem selv.",
						),
					);
				}
				break;
			}
		}
	});
	if (sections < LIMITS.articleSections.min) {
		add(
			error(
				"too_few_sections",
				`Artiklen skal have mindst ${LIMITS.articleSections.min} sektioner med ##.`,
			),
		);
	}

	const text = visibleText(tokens);
	if (URL_PATTERN.test(text)) {
		add(error("url", "Artiklen må ikke indeholde links, billeder eller URL'er."));
	}
	if (VIDEO_REFERENCES.test(text)) {
		add(
			error(
				"video_reference",
				'Skriv som en selvstændig artikel; undgå "i denne video", "i videoen" og "videoen handler om".',
			),
		);
	}
	const wordCount = countWords(text);
	const { min, max } = LIMITS.articleWords;
	if (wordCount < min || wordCount > max) {
		add(error("word_count", `Artiklen skal være ${min}-${max} ord (nu ${wordCount}).`));
	}
	if (!SENTENCE_END.test(text.trimEnd())) {
		add(error("unfinished_ending", "Artiklen skal slutte med en afsluttet sætning."));
	}

	const words = wordsOf(text);
	const markerShare = words.filter((w) => DANISH_MARKERS.has(w)).length / (words.length || 1);
	if (markerShare < MIN_DANISH_MARKER_SHARE) {
		add(warning("not_danish", "Teksten ligner ikke naturligt dansk."));
	}
	const titleKeywords = wordsOf(meta.title).filter(
		(w) => w.length >= 4 && !TITLE_STOP_WORDS.has(w),
	);
	const articleWords = new Set(words);
	if (titleKeywords.length > 0 && !titleKeywords.some((w) => articleWords.has(w))) {
		add(warning("title_keywords_missing", "Artiklen nævner ingen nøgleord fra videoens titel."));
	}
	return issues;
}

// --- Channel description ---

const FIRST_PERSON = /(?<![\p{L}\p{N}])(jeg|mig|min|mit|mine|vi|os|vores|vore)(?![\p{L}\p{N}])/iu;
const MARKUP_LINE = /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>)/m;

export function normalizeChannelDescription(text: string): string {
	return text.replace(/\r\n?/g, "\n").trim();
}

/** Two paragraphs, split like the channel page does (blank lines). */
export function validateChannelDescription(raw: string): ValidationIssue[] {
	const text = normalizeChannelDescription(raw);
	const issues: ValidationIssue[] = [];
	const paragraphs = text.split(/\n{2,}/);
	if (paragraphs.length !== 2) {
		issues.push(error("paragraph_count", "Beskrivelsen skal have præcis 2 afsnit."));
	}
	if (paragraphs.some((p) => countWords(p) < LIMITS.channelParagraphWords.min)) {
		issues.push(
			error(
				"paragraph_too_short",
				`Hvert afsnit skal have mindst ${LIMITS.channelParagraphWords.min} ord.`,
			),
		);
	}
	const wordCount = countWords(text);
	const { min, max } = LIMITS.channelWords;
	if (wordCount < min || wordCount > max) {
		issues.push(error("word_count", `Beskrivelsen skal være ${min}-${max} ord (nu ${wordCount}).`));
	}
	if (MARKUP_LINE.test(text)) {
		issues.push(error("markup", "Brug ingen overskrifter, lister eller citater; kun to afsnit."));
	}
	if (MARKUP_PATTERN.test(text)) issues.push(error("html", "Brug ikke HTML."));
	if (URL_PATTERN.test(text)) issues.push(error("url", "Inkludér ikke links eller URL'er."));
	if (FIRST_PERSON.test(text)) {
		issues.push(error("first_person", "Skriv ikke i første person (jeg, vi, vores osv.)."));
	}
	return issues;
}
