/**
 * Deterministic content rules for AI-generated video posts and channel descriptions.
 * Pure TypeScript without Node-only APIs: it also runs inside Convex mutations before a write.
 */
import { marked, walkTokens } from "marked";
import { z } from "zod";
import type { TranscriptSegment } from "../helpers";
import {
	countOveruse,
	countWords,
	decodeEntities,
	findAiPhrases,
	findSnippets,
	findThoughtDashes,
	findYears,
	normalizeDashRanges,
	normalizedWords,
	postSourceText,
	sharedRun,
	sourceYears,
	splitSentences,
	textSegments,
} from "./style";

export { countWords } from "./style";

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
	summary: { min: 150, max: 350 },
	summarySentences: { min: 1, max: 2 },
	themes: { min: 1, max: 8 },
	categories: { min: 1, max: 3 },
	keyTakeaways: { min: 3, max: 6 },
	keyTakeawayWords: { min: 6, max: 25 },
	faq: { min: 3, max: 5 },
	faqQuestionChars: { max: 120 },
	faqAnswerWords: { max: 70 },
	faqAnswerSentences: { min: 1, max: 3 },
	relevanceScore: { min: 0, max: 100 },
	articleWords: { min: 500, max: 1500 },
	/** What the prompt asks for; the validator accepts articleWords. */
	articleTargetWords: { min: 700, max: 1200 },
	articleSections: { min: 3, max: 6 },
	paragraphWords: { target: 70, warn: 80, max: 100 },
	sentenceWords: { target: 30, warn: 40, max: 50 },
	sentenceMeanWords: { warn: 25 },
	channelWords: { min: 50, max: 100 },
	channelParagraphWords: { min: 15 },
} as const;

/** Uses per part of a word from AI_OVERUSE before it is reported as overused. */
export const OVERUSE_CAPS = { analysis: 1, article: 2, channel: 1 } as const;

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

/** What a video post is generated from; generated years must appear in it. */
export type PostSource = { title: string; description: string; transcript?: TranscriptSegment[] };

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

/** Lowercase, letters and digits only, single spaces. Used to compare headings with titles. */
function normalizeHeadingText(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
}

// --- Rules shared by every part ---

const EXAMPLE_MAX = 40;

function shorten(text: string): string {
	if (text.length <= EXAMPLE_MAX) return text;
	return `${text.slice(0, EXAMPLE_MAX - 1).replace(/\s+\S*$/, "")}…`;
}

/** Up to five quoted snippets of generated text, never of the source. */
export function formatExamples(snippets: string[]): string {
	return snippets
		.slice(0, 5)
		.map((snippet) => `"${shorten(snippet)}"`)
		.join(", ");
}

/** Thought dashes, filler phrases and overused words: one issue per code for the part. */
function styleIssues(texts: string[], overuseCap: number): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	// Entities count too: the page renders "&ndash;" in an article as the dash itself.
	const dashes = texts.map((text) => findThoughtDashes(decodeEntities(text)));
	const illegal = dashes.flatMap((hits) => hits.illegal);
	if (illegal.length) {
		issues.push(
			error(
				"thought_dash",
				`Brug ikke tankestreger (${illegal.length} fundet: ${formatExamples(illegal)}). Skriv sætningen om med punktum, komma eller kolon. Skriv intervaller med almindelig bindestreg uden mellemrum, fx 2020-2024 og 5-6 %. Bindestreg i sammensatte ord er fint, fx ETF-investering.`,
			),
		);
	}
	const ambiguous = dashes.flatMap((hits) => hits.ambiguous);
	if (ambiguous.length) {
		issues.push(
			warning(
				"thought_dash_ambiguous",
				`Mulig tankestreg ved et navn (${ambiguous.length}: ${formatExamples(ambiguous)}); kontrollér om det er et navn.`,
			),
		);
	}
	const phrases = texts.flatMap(findAiPhrases);
	if (phrases.length) {
		issues.push(
			error(
				"ai_phrase",
				`Fjern standardvendinger (${phrases.length}: ${formatExamples(phrases)}). Skriv den konkrete oplysning direkte.`,
			),
		);
	}
	const overused = [...countOveruse(texts)].filter(([, entry]) => entry.count > overuseCap);
	if (overused.length) {
		const list = overused.map(([label, entry]) => `"${label}" ${entry.count} gange`).join(", ");
		issues.push(
			warning(
				"ai_word_overuse",
				`Overbrugte ord (${list}); højst ${overuseCap} gang(e) her. Vurdér om de kan undværes.`,
			),
		);
	}
	return issues;
}

/** The longest sentence decides: error over the max, warning over the warn level. */
function sentenceLengthIssue(texts: string[]): ValidationIssue | undefined {
	const { warn, max, target } = LIMITS.sentenceWords;
	const longest = Math.max(0, ...texts.flatMap(splitSentences).map(countWords));
	if (longest > max) {
		return error(
			"sentence_too_long",
			`En sætning må højst have ${max} ord (den længste har ${longest}). Del lange sætninger op; sigt efter højst ${target} ord.`,
		);
	}
	if (longest > warn) {
		return warning(
			"sentence_too_long",
			`En sætning har ${longest} ord; sigt efter højst ${target} ord.`,
		);
	}
	return undefined;
}

const ANONYMOUS_CREATOR = /(?<!\p{L})(?:(?:video)?skaberen|youtuberen)(?!\p{L})/iu;
const ANONYMOUS_CREATOR_MESSAGE =
	"Brug kanalens navn eller et personnavn fra kilden i stedet for 'skaberen' eller 'youtuberen'.";

function videoReference(found: string[]): ValidationIssue {
	return error(
		"video_reference",
		`Skriv om emnet, ikke om videoen (${formatExamples(found)}). Nævn personen eller kanalen ved navn.`,
	);
}

function duplicateText(part: string, source: string, run: string): ValidationIssue {
	return error(
		"duplicate_text",
		`${part} gentager ordret en formulering fra ${source} ('${shorten(run)}'). Skriv nyt indhold i hver del.`,
	);
}

/**
 * Generated years must come from the source. Without a transcript the check cannot be
 * completed, so it is a warning (offline audits); without a source it is skipped.
 */
function yearIssue(texts: string[], source: PostSource | undefined): ValidationIssue | undefined {
	if (!source) return undefined;
	const known = sourceYears(postSourceText(source));
	const unknown = [...new Set(texts.flatMap(findYears))].filter((year) => !known.has(year));
	if (unknown.length === 0) return undefined;
	const message = `Årstallet ${unknown.join(", ")} står ikke i kilden. Brug kun årstal fra titel, beskrivelse eller transskription.`;
	return source.transcript?.length
		? error("unsupported_year", message)
		: warning("year_unverified", message);
}

// --- Analysis ---

/** Trims every string and turns en dash ranges between digits into hyphens. */
function normalizeStrings(value: unknown): unknown {
	if (typeof value === "string") return normalizeDashRanges(value.trim());
	if (Array.isArray(value)) return value.map(normalizeStrings);
	if (typeof value === "object" && value !== null) {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeStrings(v)]));
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

/**
 * Fixes what a model commonly gets slightly wrong (enum casing, whitespace, duplicates, en dash
 * ranges such as 2020–2024).
 */
export function normalizeAnalysis(raw: unknown): unknown {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return raw;
	const value = normalizeStrings(raw) as Record<string, unknown>;
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
	field: "seoTitle" | "seoDescription",
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

const VIDEO_OPENER = /^(?:I )?(?:[Vv]ideoen|[Dd]enne video|[Vv]ideoens)\b/;
const SEO_TITLE_SEPARATOR = /\||kasperinvest/i;
const FAQ_UNANSWERED = [
	/(?:fremgår|oplyses|nævnes|angives) ikke (?:af|i) (?:kilden|videoen|beskrivelsen|videobeskrivelsen|transskriptionen)/i,
	/(?:ifølge|i|af) (?:videobeskrivelsen|beskrivelsen|transskriptionen)(?!\p{L})/iu,
	/ikke (?:oplyst|nævnt|angivet|specificeret) i (?:videoen|beskrivelsen|kilden)/i,
];

function checkSummary(issues: ValidationIssue[], summary: string) {
	const { min, max } = LIMITS.summary;
	const length = summary.trim().length;
	if (length < min || length > max) {
		issues.push(
			error(
				"summary_length",
				`Kortbeskrivelsen (summary) skal være ${min}-${max} tegn (nu ${length}).`,
				"summary",
			),
		);
	}
	const sentences = splitSentences(summary).length;
	if (sentences < LIMITS.summarySentences.min || sentences > LIMITS.summarySentences.max) {
		issues.push(
			error(
				"summary_sentences",
				`Kortbeskrivelsen skal være ${LIMITS.summarySentences.min}-${LIMITS.summarySentences.max} sætninger, og første sætning skal give hovedpointen (nu ${sentences}).`,
				"summary",
			),
		);
	}
}

function checkKeyTakeaways(issues: ValidationIssue[], keyTakeaways: string[]) {
	const { min, max } = LIMITS.keyTakeawayWords;
	const index = keyTakeaways.findIndex((takeaway) => {
		const words = countWords(takeaway);
		return words < min || words > max;
	});
	if (index === -1) return;
	issues.push(
		error(
			"key_takeaway_length",
			`Hver hovedpointe skal være ${min}-${max} ord (keyTakeaways.${index} har ${countWords(keyTakeaways[index])}).`,
			`keyTakeaways.${index}`,
		),
	);
}

function checkFaq(issues: ValidationIssue[], faq: VideoAnalysis["faq"]) {
	checkCount(issues, "faq", "faq_count", faq.length);
	if (hasDuplicates(faq.map((f) => f.question))) {
		issues.push(error("faq_duplicate", "FAQ-spørgsmål må ikke gentages.", "faq"));
	}
	const badQuestion = faq.findIndex(({ question }) => {
		const text = question.trim();
		const marks = text.match(/\?/g)?.length ?? 0;
		return marks !== 1 || !text.endsWith("?") || text.length > LIMITS.faqQuestionChars.max;
	});
	if (badQuestion !== -1) {
		issues.push(
			error(
				"faq_question_mark",
				`Hvert FAQ-spørgsmål skal være ét unikt spørgsmål på højst ${LIMITS.faqQuestionChars.max} tegn, der slutter med '?'.`,
				`faq.${badQuestion}.question`,
			),
		);
	}
	const { min, max } = LIMITS.faqAnswerSentences;
	const badAnswer = faq.findIndex(({ answer }) => {
		const sentences = splitSentences(answer).length;
		return countWords(answer) > LIMITS.faqAnswerWords.max || sentences < min || sentences > max;
	});
	if (badAnswer !== -1) {
		issues.push(
			error(
				"faq_answer_length",
				`Hvert FAQ-svar skal være ${min}-${max} sætninger og højst ${LIMITS.faqAnswerWords.max} ord (faq.${badAnswer}.answer har ${countWords(faq[badAnswer].answer)} ord).`,
				`faq.${badAnswer}.answer`,
			),
		);
	}
	const unanswered = faq.findIndex(({ answer }) => FAQ_UNANSWERED.some((p) => p.test(answer)));
	if (unanswered !== -1) {
		issues.push(
			error(
				"faq_unanswered",
				"Et FAQ-svar må ikke sige, at noget ikke fremgår, eller henvise til kilden. Vælg et spørgsmål, som transskriptionen besvarer.",
				`faq.${unanswered}.answer`,
			),
		);
	}
}

function checkAnalysisDuplicates(issues: ValidationIssue[], analysis: VideoAnalysis) {
	const { summary, seoDescription } = analysis;
	const sameText = normalizedWords(summary).join(" ") === normalizedWords(seoDescription).join(" ");
	const descriptionRun = sameText ? seoDescription : sharedRun(seoDescription, summary);
	if (descriptionRun) {
		issues.push(duplicateText("seoDescription", "summary", descriptionRun));
		return;
	}
	for (const [i, takeaway] of analysis.keyTakeaways.entries()) {
		const run = sharedRun(takeaway, summary);
		if (run) {
			issues.push(duplicateText(`keyTakeaways.${i}`, "summary", run));
			return;
		}
	}
}

/** `source` enables the year check; every production caller passes it. */
export function validateAnalysis(analysis: VideoAnalysis, source?: PostSource): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const generated: Array<[string, string]> = [
		["summary", analysis.summary],
		["seoTitle", analysis.seoTitle],
		["seoDescription", analysis.seoDescription],
		...analysis.themes.map((t, i): [string, string] => [`themes.${i}`, t]),
		...analysis.keyTakeaways.map((t, i): [string, string] => [`keyTakeaways.${i}`, t]),
		...analysis.faq.flatMap(
			(f, i): Array<[string, string]> => [
				[`faq.${i}.question`, f.question],
				[`faq.${i}.answer`, f.answer],
			],
		),
	];
	const strings: Array<[string, string]> = [
		...generated,
		...analysis.categories.map((c, i): [string, string] => [`categories.${i}`, c]),
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
	if (SEO_TITLE_SEPARATOR.test(analysis.seoTitle)) {
		issues.push(
			error(
				"seo_title_separator",
				"seoTitle må ikke indeholde '|' eller 'KasperInvest'. Siden tilføjer selv ' - KasperInvest'.",
				"seoTitle",
			),
		);
	}
	checkLength(issues, "seoDescription", "seo_description_length", analysis.seoDescription);
	checkSummary(issues, analysis.summary);

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
	checkKeyTakeaways(issues, analysis.keyTakeaways);
	checkFaq(issues, analysis.faq);

	const { min, max } = LIMITS.relevanceScore;
	const score = analysis.relevanceScore;
	if (!Number.isFinite(score) || score < min || score > max) {
		issues.push(
			error("relevance_range", `relevanceScore skal være ${min}-${max}.`, "relevanceScore"),
		);
	}

	const texts = generated.map(([, value]) => value);
	issues.push(...styleIssues(texts, OVERUSE_CAPS.analysis));
	const sentence = sentenceLengthIssue([
		analysis.summary,
		...analysis.keyTakeaways,
		...analysis.faq.map((f) => f.answer),
	]);
	if (sentence) issues.push(sentence);
	const openers = [analysis.summary, ...analysis.keyTakeaways, ...analysis.faq.map((f) => f.answer)]
		.map((text) => text.trim())
		.filter((text) => VIDEO_OPENER.test(text));
	if (openers.length) issues.push(videoReference(openers));
	if (texts.some((text) => ANONYMOUS_CREATOR.test(text))) {
		issues.push(error("anonymous_creator", ANONYMOUS_CREATOR_MESSAGE));
	}
	checkAnalysisDuplicates(issues, analysis);
	const year = yearIssue(texts, source);
	if (year) issues.push(year);
	return issues;
}

// --- Article ---

/** CRLF → LF, trim, strip one fence that wraps the whole answer, and hyphenate digit ranges. */
export function normalizeArticle(markdown: string): string {
	const text = markdown.replace(/\r\n?/g, "\n").trim();
	const fenced = text.match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
	return normalizeDashRanges((fenced ? fenced[1] : text).trim());
}

const RESERVED_HEADINGS = /^(hovedpointer|ofte stillede spørgsmål|faq)\b/;
const CLOSING_HEADINGS =
	/^(?:konklusion|afrund|afslutning|afsluttende|opsummering|sammenfatning|samlet set|kort sagt|alt i alt|til slut)/;
const VIDEO_REFERENCES = /\b(?:videoen|denne video)\b/gi;
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

export type ArticleContext = {
	title: string;
	seoTitle?: string;
	/** The analysis shown above the article; enables the verbatim repetition check. */
	analysis?: Pick<VideoAnalysis, "summary" | "keyTakeaways">;
	/** Enables the year check; every production caller passes it. */
	source?: PostSource;
};

export function validateArticle(markdown: string, meta: ArticleContext): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const add = (issue: ValidationIssue | undefined) => {
		if (issue && !issues.some((i) => i.code === issue.code)) issues.push(issue);
	};
	const tokens = marked.lexer(markdown);
	const blocks = tokens.filter((token) => token.type !== "space");
	const segments = textSegments(tokens);

	// Covers browser-recognized markup that Markdown renders as text, e.g. "</script/x>".
	if (MARKUP_PATTERN.test(markdown)) add(error("html", "Brug kun Markdown, aldrig HTML."));

	// The summary above the article is the intro, so the article opens with its first section.
	const first = blocks[0];
	if (first?.type !== "heading" || first.depth !== 2) {
		add(
			error(
				"starts_without_section",
				"Start artiklen direkte med en ##-overskrift. Siden viser allerede kortbeskrivelsen og hovedpointerne over artiklen.",
			),
		);
	}

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
		}
	});

	const titles = [meta.title, meta.seoTitle]
		.filter((t): t is string => Boolean(t))
		.map(normalizeHeadingText);
	let sections = 0;
	for (const segment of segments) {
		if (segment.kind !== "heading") continue;
		const text = normalizeHeadingText(segment.text);
		if (segment.depth === 1) add(error("h1", "Brug aldrig H1 (#); siden har allerede en H1."));
		if (segment.depth === 2) sections++;
		if (segment.depth === 3 && sections === 0) {
			add(error("h3_before_h2", "En ### må kun stå inde i en ##-sektion."));
		}
		if (segment.depth >= 4) add(error("heading_too_deep", "Brug kun ## og ###."));
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
		if (CLOSING_HEADINGS.test(text)) {
			add(
				error(
					"closing_heading",
					"Brug ikke en afrundende overskrift som Konklusion, Afrunding eller Opsummering. Den sidste sektion skal give ny, konkret information.",
				),
			);
		}
	}
	const { min: minSections, max: maxSections } = LIMITS.articleSections;
	if (sections < minSections) {
		add(error("too_few_sections", `Artiklen skal have mindst ${minSections} sektioner med ##.`));
	}
	if (sections > maxSections) {
		add(error("too_many_sections", `Brug ${minSections}-${maxSections} hovedsektioner med ##.`));
	}

	const texts = segments.map((segment) => segment.text);
	const text = texts.join(" ");
	if (URL_PATTERN.test(text)) {
		add(error("url", "Artiklen må ikke indeholde links, billeder eller URL'er."));
	}
	const references = texts.flatMap((t) => findSnippets(t, VIDEO_REFERENCES));
	if (references.length) add(videoReference(references));
	if (ANONYMOUS_CREATOR.test(text)) add(error("anonymous_creator", ANONYMOUS_CREATOR_MESSAGE));
	const wordCount = countWords(text);
	const { min, max } = LIMITS.articleWords;
	if (wordCount < min || wordCount > max) {
		add(
			error(
				"word_count",
				`Artiklen skal være ${min}-${max} ord (nu ${wordCount}). Brug kun kildens oplysninger; tilføj ikke fyld for at nå længden.`,
			),
		);
	}
	if (!SENTENCE_END.test(text.trimEnd())) {
		add(error("unfinished_ending", "Artiklen skal slutte med en afsluttet sætning."));
	}

	const paragraphs = segments.filter((segment) => segment.kind === "paragraph");
	const longestParagraph = Math.max(0, ...paragraphs.map((p) => countWords(p.text)));
	const { warn, max: maxParagraph, target } = LIMITS.paragraphWords;
	if (longestParagraph > maxParagraph) {
		add(
			error(
				"paragraph_too_long",
				`Et afsnit må højst have ${maxParagraph} ord (det længste har ${longestParagraph}). Del lange afsnit op; sigt efter højst ${target} ord.`,
			),
		);
	} else if (longestParagraph > warn) {
		add(
			warning(
				"paragraph_too_long",
				`Et afsnit har ${longestParagraph} ord; sigt efter højst ${target} ord.`,
			),
		);
	}
	if (paragraphs.some((p) => p.kind === "paragraph" && p.emphasisOnly)) {
		add(
			error(
				"emphasis_only_paragraph",
				"Et afsnit må ikke bestå af kun kursiv eller fed tekst, fx en slogan-linje til sidst.",
			),
		);
	}
	const prose = segments
		.filter((segment) => segment.kind === "paragraph" || segment.kind === "list_item")
		.map((segment) => segment.text);
	add(sentenceLengthIssue(prose));
	const sentenceLengths = prose.flatMap(splitSentences).map(countWords);
	const meanSentence = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceLengths.length || 1);
	if (meanSentence > LIMITS.sentenceMeanWords.warn) {
		add(
			warning(
				"sentence_avg_long",
				`Sætningerne har i gennemsnit ${Math.round(meanSentence)} ord; sigt efter højst ${LIMITS.sentenceMeanWords.warn}.`,
			),
		);
	}
	for (const issue of styleIssues(texts, OVERUSE_CAPS.article)) add(issue);
	if (meta.analysis) add(articleDuplicate(texts, meta.analysis));
	add(yearIssue(texts, meta.source));

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

/** A block that repeats eight words of the summary or a key takeaway verbatim. */
function articleDuplicate(
	texts: string[],
	analysis: Pick<VideoAnalysis, "summary" | "keyTakeaways">,
): ValidationIssue | undefined {
	const sources: Array<[string, string]> = [
		["summary", analysis.summary],
		...analysis.keyTakeaways.map((t, i): [string, string] => [`keyTakeaways.${i}`, t]),
	];
	for (const text of texts) {
		for (const [name, source] of sources) {
			const run = sharedRun(text, source);
			if (run) return duplicateText("Artiklen", name, run);
		}
	}
	return undefined;
}

// --- Channel description ---

const FIRST_PERSON = /(?<![\p{L}\p{N}])(jeg|mig|min|mit|mine|vi|os|vores|vore)(?![\p{L}\p{N}])/iu;
const MARKUP_LINE = /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>)/m;

export function normalizeChannelDescription(text: string): string {
	return normalizeDashRanges(text.replace(/\r\n?/g, "\n").trim());
}

/** Two paragraphs, split like the channel page does (blank lines). */
export function validateChannelDescription(raw: string): ValidationIssue[] {
	// No dash normalization here: publishAiDescription stores the text it validates.
	const text = raw.replace(/\r\n?/g, "\n").trim();
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
	issues.push(...styleIssues(paragraphs, OVERUSE_CAPS.channel));
	const sentence = sentenceLengthIssue(paragraphs);
	if (sentence) issues.push(sentence);
	return issues;
}
