import { describe, expect, it } from "vitest";
import {
	analysisSchema,
	countWords,
	hasErrors,
	normalizeAnalysis,
	normalizeArticle,
	normalizeChannelDescription,
	type ValidationIssue,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
	validateChannelDescription,
} from "./contentRules";
import {
	ARTICLE_SECTIONS,
	EXTRA_PARAGRAPH,
	validAnalysis as fixtureAnalysis,
	transcriptOfWords,
} from "./fixtures.testing";

const PARAGRAPHS = ARTICLE_SECTIONS.flatMap((section) => section.paragraphs);
/** The first two sentences (38 words) of a valid paragraph, for leads with one extra sentence. */
const LEAD_START = EXTRA_PARAGRAPH.slice(0, EXTRA_PARAGRAPH.indexOf(" Derfor"));

/**
 * Valid article from realistic Danish paragraphs: `##` sections with `paragraphsPerSection`
 * paragraphs each (default 2, about 570 words in total). `lead` is an extra first paragraph
 * of the first section.
 */
function makeArticle(
	options: {
		lead?: string;
		headings?: string[];
		paragraphsPerSection?: number;
		pool?: string[];
	} = {},
): string {
	const headings = options.headings ?? ARTICLE_SECTIONS.map((section) => section.heading);
	const per = options.paragraphsPerSection ?? 2;
	const pool = options.pool ?? PARAGRAPHS;
	const sections = headings.map((heading, i) => {
		const paragraphs = Array.from({ length: per }, (_, j) => pool[(i * 2 + j) % pool.length]);
		if (i === 0 && options.lead) paragraphs.unshift(options.lead);
		return `## ${heading}\n\n${paragraphs.join("\n\n")}`;
	});
	return sections.join("\n\n");
}

/** The valid article with one body paragraph replaced. */
function withParagraph(text: string, index = 0): string {
	return makeArticle().replace(PARAGRAPHS[index], text);
}

const meta = { title: "Sådan investerer du i indeksfonde", seoTitle: "Indeksfonde for begyndere" };

it.each([
	["- # En forbudt titel", "h1"],
	["- #### En dyb titel", "heading_too_deep"],
	["- ## FAQ", "reserved_heading"],
	["- ## Konklusion", "closing_heading"],
])("validates nested heading structure: %s", (nested, code) => {
	expect(
		validateArticle(`${makeArticle()}\n\n${nested}`, meta).map((issue) => issue.code),
	).toContain(code);
});

it("accepts a two-sentence summary with compound company initials", () => {
	const analysis = fixtureAnalysis();
	analysis.summary =
		"A.P. Møller-Mærsk har sænket forventningerne til årets indtjening, fordi fragtraterne er faldet. Det kan presse udbyttet, selv om selskabet stadig har en stor kontantbeholdning.";
	expect(validateAnalysis(analysis).map((issue) => issue.code)).not.toContain("summary_sentences");
});

function codes(issues: ValidationIssue[], severity: "error" | "warning" = "error"): string[] {
	return issues.filter((i) => i.severity === severity).map((i) => i.code);
}

function find(issues: ValidationIssue[], code: string): ValidationIssue | undefined {
	return issues.find((i) => i.code === code);
}

function words(n: number, word = "investering"): string {
	return Array.from({ length: n }, () => word).join(" ");
}

/** `n` words in sentences of at most ten words, starting with `first`. */
function sentencesOfWords(n: number, first = "Fonden"): string {
	const sentences: string[] = [];
	for (let left = n; left > 0; left -= 10) {
		sentences.push(`${first} ${words(Math.min(10, left) - 1)}.`.replace(" .", "."));
	}
	return sentences.join(" ");
}

/** One sentence of exactly `n` words. */
function sentenceOfWords(n: number): string {
	return `Fonden ${words(n - 1)}.`;
}

/** `n` words in exactly `sentences` sentences. */
function textOfWords(n: number, sentences: number): string {
	const per = Math.floor(n / sentences);
	return Array.from({ length: sentences }, (_, i) =>
		sentenceOfWords(i === sentences - 1 ? n - per * (sentences - 1) : per),
	).join(" ");
}

describe("validateArticle", () => {
	it("accepts a valid Danish article without warnings", () => {
		const article = makeArticle();
		expect(countWords(article)).toBeGreaterThanOrEqual(500);
		expect(countWords(article)).toBeLessThanOrEqual(1500);
		const issues = validateArticle(article, meta);
		expect(issues).toEqual([]);
		expect(hasErrors(issues)).toBe(false);
	});

	it("accepts a valid article that names ETFs", () => {
		const article = makeArticle({
			lead: `${LEAD_START} Fonde som iShares Core MSCI World UCITS ETF og Sparinvest Index Globale Aktier er populære.`,
		});
		expect(codes(validateArticle(article, meta))).toEqual([]);
	});

	it("accepts a bold final sentence ending with a period", () => {
		const article = `${makeArticle()}\n\nHusk at tænke langsigtet og **hold fast i dit afkast.**`;
		expect(codes(validateArticle(article, meta))).toEqual([]);
	});

	it("rejects block and inline HTML", () => {
		expect(codes(validateArticle(`${makeArticle()}\n\n<div>x</div>`, meta))).toContain("html");
		expect(
			codes(validateArticle(makeArticle({ lead: `${LEAD_START} Det er <b>vigtigt</b>.` }), meta)),
		).toContain("html");
	});

	it("rejects HTML and links in table header and body cells", () => {
		const table = (header: string, cell: string) =>
			`| ${header} | Fond |\n| --- | --- |\n| ${cell} | Billig |`;
		const withTable = (header: string, cell: string) =>
			`${makeArticle()}\n\n${table(header, cell)}\n\n${PARAGRAPHS[0]}`;
		const html = "<img src=x onerror=alert(1)>";
		const link = "[klik](javascript:alert(1))";
		expect(codes(validateArticle(withTable(html, "Pris"), meta))).toContain("html");
		expect(codes(validateArticle(withTable("Pris", html), meta))).toContain("html");
		expect(codes(validateArticle(withTable(link, "Pris"), meta))).toContain("url");
		expect(codes(validateArticle(withTable("Pris", link), meta))).toContain("url");
		expect(codes(validateArticle(withTable("Pris", "Se www.example.dk"), meta))).toContain("url");
	});

	it("rejects markup that browsers parse even when Markdown does not see HTML", () => {
		for (const markup of [
			"</script/x><img/src=x onerror=alert(1)>",
			"<!-- skjult -->",
			"<?xml ?>",
			"<svg/onload=alert(1)>",
		]) {
			const article = makeArticle({ lead: `${LEAD_START} Tekst ${markup} her.` });
			expect(codes(validateArticle(article, meta))).toContain("html");
		}
		const comparison = makeArticle({ lead: `${LEAD_START} Omkostninger < 1 % og <5 år.` });
		expect(codes(validateArticle(comparison, meta))).toEqual([]);
	});

	it("rejects links, images, URLs and www addresses", () => {
		for (const extra of [
			"Læs [mere](https://example.com).",
			"Se ![graf](graf.png) her.",
			"Gå til https://example.com nu.",
			"Besøg www.example.dk i dag.",
		]) {
			const article = makeArticle({ lead: `${LEAD_START} ${extra}` });
			expect(codes(validateArticle(article, meta))).toContain("url");
		}
	});

	it("rejects ATX and Setext H1", () => {
		expect(codes(validateArticle(`# Overskrift\n\n${makeArticle()}`, meta))).toContain("h1");
		expect(codes(validateArticle(`Overskrift\n==========\n\n${makeArticle()}`, meta))).toContain(
			"h1",
		);
	});

	it("starts directly with a ## heading", () => {
		const article = makeArticle();
		expect(article.startsWith("## ")).toBe(true);
		expect(codes(validateArticle(article, meta))).toEqual([]);
	});

	it("rejects an article that starts with an intro paragraph or another block", () => {
		for (const start of [
			EXTRA_PARAGRAPH,
			textOfWords(56, 3),
			"### Underoverskrift",
			"- Et punkt",
		]) {
			const issues = validateArticle(`${start}\n\n${makeArticle()}`, meta);
			expect(codes(issues), start).toContain("starts_without_section");
			expect(find(issues, "starts_without_section")?.message).toBe(
				"Start artiklen direkte med en ##-overskrift. Siden viser allerede kortbeskrivelsen og hovedpointerne over artiklen.",
			);
		}
		expect(codes(validateArticle(makeArticle(), meta))).not.toContain("intro_missing");
	});

	it("requires 3-6 ## sections", () => {
		const few = makeArticle({
			headings: ["Første afsnit om fonde", "Andet afsnit om skat"],
			paragraphsPerSection: 6,
		});
		expect(codes(validateArticle(few, meta))).toContain("too_few_sections");
		const headings = ["Et", "To", "Tre", "Fire", "Fem", "Seks", "Syv"].map(
			(n) => `Del ${n} om indeksfonde`,
		);
		expect(codes(validateArticle(makeArticle({ headings: headings.slice(0, 6) }), meta))).toEqual(
			[],
		);
		const many = validateArticle(makeArticle({ headings }), meta);
		expect(codes(many)).toContain("too_many_sections");
		expect(find(many, "too_many_sections")?.message).toBe("Brug 3-6 hovedsektioner med ##.");
	});

	it("rejects ### before the first ## and headings deeper than ###", () => {
		const early = makeArticle().replace("## Hvad koster", "### Hvad koster");
		expect(codes(validateArticle(early, meta))).toContain("h3_before_h2");
		const deep = `${makeArticle()}\n\n#### Detalje\n\n${PARAGRAPHS[1]}`;
		expect(codes(validateArticle(deep, meta))).toContain("heading_too_deep");
	});

	it("rejects a heading that repeats the title or SEO title", () => {
		const repeatTitle = makeArticle().replace(
			"## Hvad koster en indeksfond om året?",
			"## Sådan investerer du i indeksfonde!",
		);
		expect(codes(validateArticle(repeatTitle, meta))).toContain("heading_repeats_title");
		const repeatSeo = makeArticle().replace(
			"## Hvorfor betyder kontotypen noget for skatten?",
			"## Indeksfonde for begyndere",
		);
		expect(codes(validateArticle(repeatSeo, meta))).toContain("heading_repeats_title");
	});

	it("rejects headings reserved for the page", () => {
		for (const heading of ["Hovedpointer", "Ofte stillede spørgsmål", "FAQ"]) {
			const article = makeArticle().replace("Hvor længe skal pengene blive i fonden?", heading);
			expect(codes(validateArticle(article, meta))).toContain("reserved_heading");
		}
	});

	it("rejects a closing summary heading", () => {
		for (const heading of [
			"Konklusion",
			"Afrunding på din opsparing",
			"Afrundende bemærkninger",
			"Afslutning",
			"Afsluttende tanker",
			"Opsummering for den nye investor",
			"Sammenfatning",
			"Samlet set",
			"Kort sagt",
			"Alt i alt",
			"Til slut: tid slår timing",
		]) {
			const issues = validateArticle(
				makeArticle().replace("Hvad gør du, hvis markedet falder?", heading),
				meta,
			);
			expect(codes(issues), heading).toContain("closing_heading");
		}
		const question = makeArticle().replace(
			"Hvad gør du, hvis markedet falder?",
			"Hvad gør du til sidst?",
		);
		expect(codes(validateArticle(question, meta))).toEqual([]);
	});

	it("rejects fenced and indented code", () => {
		expect(codes(validateArticle(`${makeArticle()}\n\n\`\`\`\nkode\n\`\`\``, meta))).toContain(
			"code",
		);
		expect(codes(validateArticle(`${makeArticle()}\n\n    kode her`, meta))).toContain("code");
	});

	it("rejects references to the video anywhere in the article", () => {
		for (const phrase of ["I denne video", "I videoen", "Videoen handler om"]) {
			const article = makeArticle({ lead: `${phrase} ser vi på fonde. ${LEAD_START}` });
			expect(codes(validateArticle(article, meta))).toContain("video_reference");
		}
		const inside = validateArticle(withParagraph(`${PARAGRAPHS[0]} Det viser videoen også.`), meta);
		expect(codes(inside)).toContain("video_reference");
		expect(find(inside, "video_reference")?.message).toContain("Nævn personen eller kanalen");
	});

	it("rejects an anonymous creator", () => {
		for (const word of ["skaberen", "videoskaberen", "youtuberen"]) {
			const article = withParagraph(`${PARAGRAPHS[0]} Det mener ${word} også.`);
			expect(codes(validateArticle(article, meta)), word).toContain("anonymous_creator");
		}
		const word = withParagraph(`${PARAGRAPHS[0]} Skaberens rolle er ukendt.`);
		expect(codes(validateArticle(word, meta))).not.toContain("anonymous_creator");
	});

	it("enforces 500-1500 words", () => {
		const short = makeArticle({ paragraphsPerSection: 1 });
		expect(countWords(short)).toBeLessThan(500);
		const shortIssues = validateArticle(short, meta);
		expect(codes(shortIssues)).toContain("word_count");
		expect(find(shortIssues, "word_count")?.message).toMatch(
			/^Artiklen skal være 500-1500 ord \(nu \d+\)\. Brug kun kildens oplysninger; tilføj ikke fyld for at nå længden\.$/,
		);
		const long = makeArticle({ paragraphsPerSection: 7 });
		expect(countWords(long)).toBeGreaterThan(1500);
		expect(codes(validateArticle(long, meta))).toContain("word_count");
	});

	it("rejects an unfinished ending", () => {
		const article = `${makeArticle()}\n\nOg derfor skal du altid huske at`;
		expect(codes(validateArticle(article, meta))).toContain("unfinished_ending");
		const quoted = `${makeArticle()}\n\nSom han siger: »Tid slår timing.«`;
		expect(codes(validateArticle(quoted, meta))).not.toContain("unfinished_ending");
	});

	it("rejects a paragraph over 100 words and warns over 80", () => {
		const at = (n: number) => validateArticle(withParagraph(sentencesOfWords(n)), meta);
		expect(at(80).map((i) => i.code)).not.toContain("paragraph_too_long");
		expect(codes(at(81), "warning")).toContain("paragraph_too_long");
		expect(codes(at(100))).not.toContain("paragraph_too_long");
		expect(codes(at(101))).toContain("paragraph_too_long");
		expect(find(at(101), "paragraph_too_long")?.message).toBe(
			"Et afsnit må højst have 100 ord (det længste har 101). Del lange afsnit op; sigt efter højst 70 ord.",
		);
	});

	it("rejects a sentence over 50 words and warns over 40, also in list items", () => {
		const at = (n: number) => validateArticle(withParagraph(sentenceOfWords(n)), meta);
		expect(at(40).map((i) => i.code)).not.toContain("sentence_too_long");
		expect(codes(at(41), "warning")).toContain("sentence_too_long");
		expect(codes(at(50))).not.toContain("sentence_too_long");
		expect(find(at(51), "sentence_too_long")?.message).toBe(
			"En sætning må højst have 50 ord (den længste har 51). Del lange sætninger op; sigt efter højst 30 ord.",
		);
		const list = withParagraph(`- ${sentenceOfWords(51)}\n- Kort punkt\n- Endnu et punkt`);
		expect(codes(validateArticle(list, meta))).toContain("sentence_too_long");
	});

	it("warns when the mean sentence length is over 25 words", () => {
		const long = `${sentenceOfWords(30)} ${sentenceOfWords(30)}`;
		const issues = validateArticle(makeArticle({ pool: [long] }), meta);
		expect(codes(issues, "warning")).toContain("sentence_avg_long");
		expect(codes(validateArticle(makeArticle(), meta), "warning")).toEqual([]);
	});

	it("rejects a paragraph that is only italic or bold text", () => {
		for (const slogan of ["*Tid slår timing, hver gang.*", "**Tid slår timing, hver gang.**"]) {
			const issues = validateArticle(`${makeArticle()}\n\n${slogan}`, meta);
			expect(codes(issues)).toContain("emphasis_only_paragraph");
		}
	});

	it("rejects thought dashes in paragraphs, headings, list items and table cells", () => {
		const cases = [
			withParagraph(`${PARAGRAPHS[0]} Renten steg – og kurserne faldt.`),
			withParagraph(`${PARAGRAPHS[0]} Renten steg — og kurserne faldt.`),
			withParagraph(`${PARAGRAPHS[0]} Prisen på handlen - både køb og salg - er lav.`),
			withParagraph(`${PARAGRAPHS[0]} Renten steg &ndash; og kurserne faldt.`),
			makeArticle().replace("## Hvad koster", "## Pris – hvad koster"),
			withParagraph("- Første punkt – med streg\n- Andet punkt\n- Tredje punkt"),
			`${makeArticle()}\n\n| Fond | Pris |\n| --- | --- |\n| Global – billig | Lav |\n\n${PARAGRAPHS[1]}`,
		];
		for (const article of cases) {
			expect(codes(validateArticle(article, meta)), article.slice(0, 60)).toContain("thought_dash");
		}
		const issues = validateArticle(cases[2], meta);
		expect(issues.filter((i) => i.code === "thought_dash")).toHaveLength(1);
		expect(find(issues, "thought_dash")?.message).toMatch(
			/^Brug ikke tankestreger \(2 fundet: .*handlen - både.*\)\. Skriv sætningen om med punktum, komma eller kolon\. Skriv intervaller med almindelig bindestreg uden mellemrum, fx 2020-2024 og 5-6 %\. Bindestreg i sammensatte ord er fint, fx ETF-investering\.$/i,
		);
	});

	it("rejects an en dash range, which the normalize step turns into a hyphen", () => {
		const range = withParagraph(
			`${PARAGRAPHS[0]} Fra 2020\u20132024 gav fonden 5&ndash;6 % om året.`,
		);
		expect(codes(validateArticle(range, meta))).toContain("thought_dash");
		const normalized = normalizeArticle(range);
		expect(normalized).toContain("Fra 2020-2024 gav fonden 5-6 % om året.");
		expect(codes(validateArticle(normalized, meta))).toEqual([]);
		const words = withParagraph(
			`${PARAGRAPHS[0]} Toget København\u2013Roskilde kører fra Q1\u2013Q3.`,
		);
		expect(codes(validateArticle(normalizeArticle(words), meta))).toContain("thought_dash");
	});

	it("allows ranges, compounds and negative numbers, and warns at a possible name", () => {
		const allowed = withParagraph(
			`${PARAGRAPHS[0]} Fra 2020-2024 gav ETF-investering 5-6 % om året, men kursen faldt -5 % i ét kvartal.`,
		);
		expect(codes(validateArticle(allowed, meta))).toEqual([]);
		const name = validateArticle(
			withParagraph(`${PARAGRAPHS[0]} Fonden Indeks - Alle Markeder er stor.`),
			meta,
		);
		expect(codes(name)).toEqual([]);
		expect(codes(name, "warning")).toContain("thought_dash_ambiguous");
	});

	it("rejects AI filler phrases and warns about overused words", () => {
		const phrase = validateArticle(
			withParagraph(`${PARAGRAPHS[0]} Det er værd at bemærke, at skatten ændrer sig.`),
			meta,
		);
		expect(codes(phrase)).toContain("ai_phrase");
		expect(find(phrase, "ai_phrase")?.message).toMatch(
			/^Fjern standardvendinger \(1: .*Det er værd at bemærke.*\)\. Skriv den konkrete oplysning direkte\.$/,
		);
		const twice = withParagraph(
			`${PARAGRAPHS[0]} Prisen er afgørende. Tiden er også afgørende for afkastet.`,
		);
		expect(validateArticle(twice, meta).map((i) => i.code)).not.toContain("ai_word_overuse");
		const thrice = validateArticle(`${twice}\n\nSkatten er også afgørende.`, meta);
		expect(codes(thrice)).toEqual([]);
		expect(codes(thrice, "warning")).toContain("ai_word_overuse");
	});

	it("rejects a verbatim run of eight words from the summary or a key takeaway", () => {
		const analysis = fixtureAnalysis();
		const check = (text: string) =>
			validateArticle(withParagraph(`${PARAGRAPHS[0]} ${text}`), { ...meta, analysis });
		const fromSummary = check(
			"Lave omkostninger og den rigtige kontotype afgør, hvor meget danske begyndere tjener.",
		);
		expect(codes(fromSummary)).toContain("duplicate_text");
		expect(find(fromSummary, "duplicate_text")?.message).toBe(
			"Artiklen gentager ordret en formulering fra summary ('lave omkostninger og den rigtige…'). Skriv nyt indhold i hver del.",
		);
		expect(
			codes(check("Et globalt indeks spreder risikoen bredere end et dansk indeks gør.")),
		).toContain("duplicate_text");
		expect(codes(check("Billige fonde og den rette konto giver mere afkast."))).toEqual([]);
	});

	it("checks years against title, description and transcript", () => {
		const article = withParagraph(`${PARAGRAPHS[0]} I 2019 faldt kurserne kraftigt.`);
		const source = (transcript?: Array<{ text: string; offset: number; duration: number }>) => ({
			title: meta.title,
			description: "Om indeksfonde.",
			transcript,
		});
		const unsupported = validateArticle(article, {
			...meta,
			source: source(transcriptOfWords(400)),
		});
		expect(codes(unsupported)).toContain("unsupported_year");
		expect(find(unsupported, "unsupported_year")?.message).toBe(
			"Årstallet 2019 står ikke i kilden. Brug kun årstal fra titel, beskrivelse eller transskription.",
		);
		const inTranscript = source([{ text: "i 2019 faldt alt", offset: 0, duration: 1 }]);
		expect(codes(validateArticle(article, { ...meta, source: inTranscript }))).toEqual([]);
		const noTranscript = validateArticle(article, { ...meta, source: source() });
		expect(codes(noTranscript)).toEqual([]);
		expect(codes(noTranscript, "warning")).toContain("year_unverified");
		const inDescription = { ...source(), description: "Krakket i 2019" };
		expect(validateArticle(article, { ...meta, source: inDescription })).toEqual([]);
	});

	it("warns, without blocking, when the title topic is missing (Holland case)", () => {
		const issues = validateArticle(makeArticle(), {
			title: "Ingen rejser til Holland",
			seoTitle: "Kom i gang med at investere",
		});
		expect(codes(issues)).toEqual([]);
		expect(codes(issues, "warning")).toContain("title_keywords_missing");
		expect(hasErrors(issues)).toBe(false);
	});

	it("warns, without blocking, when the text does not look Danish", () => {
		const english = [
			"Index funds offer broad diversification, which makes them a sensible choice for many investors. When costs are low, you keep a larger share of the return over time.",
		];
		const article = makeArticle({ lead: english[0], pool: english });
		expect(codes(validateArticle(article, meta), "warning")).toContain("not_danish");
	});
});

describe("normalizeArticle", () => {
	it("converts CRLF, trims and strips one wrapping fence", () => {
		expect(normalizeArticle("\r\n  Tekst\r\n\r\n## A\r\n")).toBe("Tekst\n\n## A");
		expect(normalizeArticle("```markdown\nTekst\n\n## A\n```")).toBe("Tekst\n\n## A");
		expect(normalizeArticle("```\nTekst\n```")).toBe("Tekst");
	});

	it("lets a CRLF article validate like its LF form", () => {
		const article = makeArticle().replaceAll("\n", "\r\n");
		expect(codes(validateArticle(normalizeArticle(article), meta))).toEqual([]);
	});
});

const validAnalysis: VideoAnalysis = fixtureAnalysis();

function analysisWith(fields: Partial<VideoAnalysis>): VideoAnalysis {
	return { ...validAnalysis, ...fields };
}

function withFaqAnswer(answer: string, question = validAnalysis.faq[1].question): VideoAnalysis {
	return analysisWith({
		faq: validAnalysis.faq.map((f, i) => (i === 1 ? { question, answer } : f)),
	});
}

describe("validateAnalysis", () => {
	it("accepts a valid analysis", () => {
		expect(validateAnalysis(validAnalysis)).toEqual([]);
		expect(validAnalysis.summary.length).toBeGreaterThanOrEqual(150);
	});

	it("rejects whitespace-only members", () => {
		const issues = validateAnalysis({
			...validAnalysis,
			themes: ["indeksfonde", "   "],
			faq: [...validAnalysis.faq.slice(0, 2), { question: "Hvorfor?", answer: " " }],
		});
		expect(codes(issues)).toContain("empty_value");
		expect(issues.find((i) => i.code === "empty_value")?.path).toBeDefined();
	});

	it("enforces seoTitle 30-50 chars and seoDescription 110-160 chars", () => {
		expect(codes(validateAnalysis({ ...validAnalysis, seoTitle: "x".repeat(29) }))).toContain(
			"seo_title_length",
		);
		expect(codes(validateAnalysis({ ...validAnalysis, seoTitle: "x".repeat(30) }))).toEqual([]);
		expect(codes(validateAnalysis({ ...validAnalysis, seoTitle: "x".repeat(50) }))).toEqual([]);
		expect(codes(validateAnalysis({ ...validAnalysis, seoTitle: "x".repeat(51) }))).toContain(
			"seo_title_length",
		);
		expect(
			codes(validateAnalysis({ ...validAnalysis, seoDescription: "x".repeat(109) })),
		).toContain("seo_description_length");
		expect(
			codes(validateAnalysis({ ...validAnalysis, seoDescription: "x".repeat(161) })),
		).toContain("seo_description_length");
	});

	it("rejects '|' and the site name in seoTitle", () => {
		for (const seoTitle of ["Indeksfonde for begyndere | Guide", "KasperInvest: indeksfonde nu"]) {
			const issues = validateAnalysis(analysisWith({ seoTitle }));
			expect(codes(issues), seoTitle).toContain("seo_title_separator");
		}
	});

	it("enforces a summary of 150-350 chars in 1-2 sentences", () => {
		expect(codes(validateAnalysis(analysisWith({ summary: "x".repeat(149) })))).toContain(
			"summary_length",
		);
		expect(codes(validateAnalysis(analysisWith({ summary: "x".repeat(150) })))).toEqual([]);
		expect(codes(validateAnalysis(analysisWith({ summary: "x".repeat(350) })))).toEqual([]);
		const long = validateAnalysis(analysisWith({ summary: "x".repeat(351) }));
		expect(find(long, "summary_length")?.message).toBe(
			"Kortbeskrivelsen (summary) skal være 150-350 tegn (nu 351).",
		);
		const three = validateAnalysis(
			analysisWith({
				summary: `${validAnalysis.summary} Den nævner også skat.`,
			}),
		);
		expect(find(three, "summary_sentences")?.message).toBe(
			"Kortbeskrivelsen skal være 1-2 sætninger, og første sætning skal give hovedpointen (nu 3).",
		);
	});

	it("rejects summaries, takeaways and answers that open with the video", () => {
		const summary = validAnalysis.summary.replace("Lave omkostninger", "Videoen viser, at lave");
		expect(codes(validateAnalysis(analysisWith({ summary })))).toContain("video_reference");
		const takeaways = [
			"I videoen forklares det, at omkostninger betyder meget for afkastet.",
			...validAnalysis.keyTakeaways.slice(1),
		];
		expect(codes(validateAnalysis(analysisWith({ keyTakeaways: takeaways })))).toContain(
			"video_reference",
		);
		expect(
			codes(validateAnalysis(withFaqAnswer("Denne video siger, at fonde er billige i drift."))),
		).toContain("video_reference");
		expect(
			codes(validateAnalysis(withFaqAnswer("Videoens pointe er, at fonde er billige i drift."))),
		).toContain("video_reference");
	});

	it("rejects an anonymous creator", () => {
		const summary = `${validAnalysis.summary.slice(0, -1)}, siger skaberen.`;
		expect(codes(validateAnalysis(analysisWith({ summary })))).toContain("anonymous_creator");
	});

	it("rejects thought dashes in every field", () => {
		const dash = " – ";
		const cases: Array<Partial<VideoAnalysis>> = [
			{ summary: validAnalysis.summary.replace(" og den", `${dash}og den`) },
			{ seoTitle: "Indeksfonde – kom godt i gang i dag" },
			{ seoDescription: validAnalysis.seoDescription.replace(", hvad", `${dash}hvad`) },
			{ themes: ["indeksfonde", "lave – omkostninger"] },
			{
				keyTakeaways: [
					`Et billigt indeks${dash}og en lang horisont giver afkast.`,
					"b c d e f g",
					"h i j k l m",
				],
			},
			{
				faq: validAnalysis.faq.map((f, i) =>
					i === 0 ? { ...f, answer: `Den følger et indeks${dash}og koster lidt.` } : f,
				),
			},
			{
				faq: validAnalysis.faq.map((f, i) =>
					i === 0 ? { ...f, question: "Hvad er en fond — og hvad koster den?" } : f,
				),
			},
		];
		for (const fields of cases) {
			expect(codes(validateAnalysis(analysisWith(fields))), JSON.stringify(fields)).toContain(
				"thought_dash",
			);
		}
	});

	it("rejects unspaced and entity-encoded en dashes in analysis fields", () => {
		for (const seoTitle of [
			"Indeksfonde 2020\u20132024: kom godt i gang",
			"Indeksfonde 2020&ndash;2024: kom godt i gang",
			"Indeksfonde 2020&#8211;2024: kom godt i gang",
		]) {
			expect(codes(validateAnalysis(analysisWith({ seoTitle }))), seoTitle).toContain(
				"thought_dash",
			);
		}
	});

	it("rejects AI filler phrases and warns about an overused word", () => {
		const seoDescription =
			"Kort sagt: lær hvordan du vælger en billig indeksfond, og hvad aktiesparekontoen betyder for skatten på lang sigt.";
		expect(codes(validateAnalysis(analysisWith({ seoDescription })))).toContain("ai_phrase");
		const keyTakeaways = [
			"Lave omkostninger er afgørende for afkastet over tyve år.",
			"En lang horisont er afgørende, når markedet falder kraftigt.",
			...validAnalysis.keyTakeaways.slice(2),
		];
		const issues = validateAnalysis(analysisWith({ keyTakeaways }));
		expect(codes(issues)).toEqual([]);
		expect(codes(issues, "warning")).toContain("ai_word_overuse");
	});

	it("rejects text repeated verbatim between summary, seoDescription and takeaways", () => {
		const copy = validateAnalysis(
			analysisWith({ seoDescription: `${validAnalysis.summary.slice(0, 150)}.` }),
		);
		expect(find(copy, "duplicate_text")?.message).toMatch(
			/^seoDescription gentager ordret en formulering fra summary \('.+'\)\. Skriv nyt indhold i hver del\.$/,
		);
		const keyTakeaways = [
			"Den rigtige kontotype afgør, hvor meget danske begyndere får ud af det.",
			...validAnalysis.keyTakeaways.slice(1),
		];
		const takeaway = validateAnalysis(analysisWith({ keyTakeaways }));
		expect(find(takeaway, "duplicate_text")?.message).toContain("keyTakeaways.0 gentager ordret");
	});

	it("checks years against the source", () => {
		const seoTitle = "Indeksfonde i 2024: kom godt i gang";
		const source = { title: "Indeksfonde", description: "", transcript: transcriptOfWords(400) };
		expect(codes(validateAnalysis(analysisWith({ seoTitle }), source))).toContain(
			"unsupported_year",
		);
		const withYear = { ...source, transcript: [{ text: "i 2024", offset: 0, duration: 1 }] };
		expect(validateAnalysis(analysisWith({ seoTitle }), withYear)).toEqual([]);
		const offline = validateAnalysis(analysisWith({ seoTitle }), { ...source, transcript: [] });
		expect(codes(offline, "warning")).toEqual(["year_unverified"]);
	});

	it("enforces 6-25 words per key takeaway", () => {
		const at = (n: number) =>
			validateAnalysis(
				analysisWith({
					keyTakeaways: [sentencesOfWords(n), ...validAnalysis.keyTakeaways.slice(1)],
				}),
			);
		expect(codes(at(5))).toContain("key_takeaway_length");
		expect(codes(at(6))).toEqual([]);
		expect(codes(at(25))).toEqual([]);
		expect(find(at(26), "key_takeaway_length")?.message).toBe(
			"Hver hovedpointe skal være 6-25 ord (keyTakeaways.0 har 26).",
		);
	});

	it("enforces list sizes and uniqueness", () => {
		expect(codes(validateAnalysis({ ...validAnalysis, themes: [] }))).toContain("themes_count");
		expect(codes(validateAnalysis({ ...validAnalysis, themes: ["a", "A"] }))).toContain(
			"themes_duplicate",
		);
		expect(codes(validateAnalysis({ ...validAnalysis, categories: [] }))).toContain(
			"categories_count",
		);
		expect(
			codes(
				validateAnalysis({ ...validAnalysis, categories: ["ETF", "aktier", "skat", "pension"] }),
			),
		).toContain("categories_count");
		expect(codes(validateAnalysis({ ...validAnalysis, categories: ["ETF", "ETF"] }))).toContain(
			"categories_duplicate",
		);
		expect(codes(validateAnalysis({ ...validAnalysis, keyTakeaways: ["a", "b"] }))).toContain(
			"key_takeaways_count",
		);
		expect(
			codes(
				validateAnalysis({ ...validAnalysis, keyTakeaways: ["a", "b", "c", "d", "e", "f", "g"] }),
			),
		).toContain("key_takeaways_count");
		expect(
			codes(validateAnalysis({ ...validAnalysis, faq: validAnalysis.faq.slice(0, 2) })),
		).toContain("faq_count");
	});

	it("enforces FAQ questions: one '?' at the end, at most 120 chars, unique", () => {
		const withQuestion = (question: string) =>
			codes(validateAnalysis(withFaqAnswer(validAnalysis.faq[1].answer, question)));
		expect(withQuestion("Hvad er en indeksfond")).toContain("faq_question_mark");
		expect(withQuestion("Hvad koster den? Og hvorfor?")).toContain("faq_question_mark");
		expect(withQuestion("Hvad? koster den")).toContain("faq_question_mark");
		expect(withQuestion(`Hvad ${"x".repeat(114)}?`)).toEqual([]);
		expect(withQuestion(`Hvad ${"x".repeat(115)}?`)).toContain("faq_question_mark");
		expect(withQuestion("  Hvor meget koster en indeksfond?  ")).toEqual([]);
		expect(withQuestion("hvad er en indeksfond?")).toContain("faq_duplicate");
	});

	it("enforces FAQ answers of 1-3 sentences and at most 70 words", () => {
		expect(codes(validateAnalysis(withFaqAnswer(textOfWords(70, 3))))).toEqual([]);
		const long = validateAnalysis(withFaqAnswer(textOfWords(71, 3)));
		expect(find(long, "faq_answer_length")?.message).toBe(
			"Hvert FAQ-svar skal være 1-3 sætninger og højst 70 ord (faq.1.answer har 71 ord).",
		);
		expect(codes(validateAnalysis(withFaqAnswer(textOfWords(40, 4))))).toContain(
			"faq_answer_length",
		);
		expect(codes(validateAnalysis(withFaqAnswer(textOfWords(30, 3))))).toEqual([]);
		expect(codes(validateAnalysis(withFaqAnswer(sentenceOfWords(51))))).toContain(
			"sentence_too_long",
		);
	});

	it("rejects FAQ answers that say the source does not answer", () => {
		for (const answer of [
			"Det fremgår ikke af videoen, hvad fonden koster.",
			"Prisen oplyses ikke i beskrivelsen.",
			"Ifølge videobeskrivelsen er fonden billig.",
			"Det er ikke oplyst i videoen, hvor stor fonden er.",
		]) {
			expect(codes(validateAnalysis(withFaqAnswer(answer))), answer).toContain("faq_unanswered");
		}
		expect(
			codes(validateAnalysis(withFaqAnswer("Skatten fremgår af årsopgørelsen hvert forår."))),
		).toEqual([]);
	});

	it("enforces relevanceScore range", () => {
		expect(codes(validateAnalysis({ ...validAnalysis, relevanceScore: 101 }))).toContain(
			"relevance_range",
		);
		expect(codes(validateAnalysis({ ...validAnalysis, relevanceScore: -1 }))).toContain(
			"relevance_range",
		);
		expect(codes(validateAnalysis({ ...validAnalysis, relevanceScore: Number.NaN }))).toContain(
			"relevance_range",
		);
	});

	it("rejects HTML and URLs in any field", () => {
		expect(
			codes(validateAnalysis({ ...validAnalysis, keyTakeaways: ["<b>a</b>", "b", "c"] })),
		).toContain("html");
		expect(
			codes(
				validateAnalysis({
					...validAnalysis,
					summary: `${validAnalysis.summary} Se https://example.com`,
				}),
			),
		).toContain("url");
	});

	it("rejects any tag-like markup in plain-text fields", () => {
		for (const markup of [
			"</script/x><img/src=x onerror=alert(1)>",
			"<!--",
			"<?php",
			"<svg/onload=alert(1)>",
		]) {
			expect(
				codes(
					validateAnalysis({ ...validAnalysis, summary: `${validAnalysis.summary} ${markup}` }),
				),
			).toContain("html");
			const faq = validAnalysis.faq.map((f, i) =>
				i === 1 ? { ...f, answer: `${f.answer} ${markup}` } : f,
			);
			expect(codes(validateAnalysis({ ...validAnalysis, faq }))).toContain("html");
		}
		const keyTakeaways = [
			"Vælg en fond med omkostninger under < 1 % om året.",
			"Penge med en horisont på <5 år hører ikke til i aktier.",
			validAnalysis.keyTakeaways[2],
		];
		expect(codes(validateAnalysis({ ...validAnalysis, keyTakeaways }))).toEqual([]);
	});
});

describe("normalizeAnalysis", () => {
	it("fixes enum casing, trims and dedupes before the strict parse", () => {
		const raw = {
			...validAnalysis,
			summary: `  ${validAnalysis.summary}  `,
			categories: ["Etf", "PRIVATØKONOMI", "etf"],
			themes: ["indeksfonde", " Indeksfonde ", "omkostninger"],
		};
		const parsed = analysisSchema.parse(normalizeAnalysis(raw));
		expect(parsed.categories).toEqual(["ETF", "privatøkonomi"]);
		expect(parsed.themes).toEqual(["indeksfonde", "omkostninger"]);
		expect(parsed.summary).toBe(validAnalysis.summary);
	});

	it("turns en dash ranges between digits into hyphens in every string", () => {
		const raw = {
			...validAnalysis,
			seoTitle: "Indeksfonde 2020\u20132024: kom godt i gang",
			keyTakeaways: [
				...validAnalysis.keyTakeaways.slice(0, 3),
				"Fonden gav 5&ndash;6 % om året, men kursen faldt \u2013 som ventet.",
			],
			faq: [{ question: "Hvor længe 5\u20137 år?", answer: "Fem\u2013syv år." }],
		};
		const parsed = analysisSchema.parse(normalizeAnalysis(raw));
		expect(parsed.seoTitle).toBe("Indeksfonde 2020-2024: kom godt i gang");
		expect(parsed.keyTakeaways[3]).toBe(
			"Fonden gav 5-6 % om året, men kursen faldt \u2013 som ventet.",
		);
		expect(parsed.faq[0]).toEqual({ question: "Hvor længe 5-7 år?", answer: "Fem\u2013syv år." });
	});

	it("passes through values it cannot normalize", () => {
		expect(normalizeAnalysis("x")).toBe("x");
		expect(analysisSchema.safeParse(normalizeAnalysis({ categories: ["ukendt"] })).success).toBe(
			false,
		);
	});
});

describe("validateChannelDescription", () => {
	const p = (n: number) => sentencesOfWords(n, "Kanalen");

	it("accepts two paragraphs of 50-100 words", () => {
		expect(validateChannelDescription(`${p(25)}\n\n${p(25)}`)).toEqual([]);
		expect(validateChannelDescription(`${p(50)}\n\n${p(50)}`)).toEqual([]);
	});

	it("rejects 49 and 101 words", () => {
		expect(codes(validateChannelDescription(`${p(25)}\n\n${p(24)}`))).toContain("word_count");
		expect(codes(validateChannelDescription(`${p(51)}\n\n${p(50)}`))).toContain("word_count");
	});

	it("requires exactly two paragraphs of at least 15 words each", () => {
		expect(codes(validateChannelDescription(p(60)))).toContain("paragraph_count");
		expect(codes(validateChannelDescription(`${p(20)}\n\n${p(20)}\n\n${p(20)}`))).toContain(
			"paragraph_count",
		);
		expect(codes(validateChannelDescription(`${p(14)}\n\n${p(50)}`))).toContain(
			"paragraph_too_short",
		);
	});

	it("rejects headings, lists, HTML and URLs", () => {
		expect(codes(validateChannelDescription(`## Om kanalen\n${p(30)}\n\n${p(30)}`))).toContain(
			"markup",
		);
		expect(codes(validateChannelDescription(`- ${p(30)}\n\n${p(30)}`))).toContain("markup");
		expect(codes(validateChannelDescription(`<p>${p(30)}</p>\n\n${p(30)}`))).toContain("html");
		expect(codes(validateChannelDescription(`${p(30)} www.x.dk\n\n${p(30)}`))).toContain("url");
		expect(
			codes(validateChannelDescription(`${p(30)} </script/x><svg/onload=1>\n\n${p(30)}`)),
		).toContain("html");
	});

	it("rejects first person singular and plural as whole words", () => {
		for (const pronoun of ["jeg", "Vi", "vores", "os", "mine"]) {
			expect(
				codes(validateChannelDescription(`${p(30)} ${pronoun} ved det.\n\n${p(30)}`)),
			).toContain("first_person");
		}
		// "vind" and "visning" contain "vi" but are not the pronoun.
		expect(validateChannelDescription(`${p(30)} vind visning.\n\n${p(30)}`)).toEqual([]);
	});

	it("rejects thought dashes, AI phrases and long sentences", () => {
		expect(
			codes(validateChannelDescription(`${p(30)} Renten steg – og faldt.\n\n${p(30)}`)),
		).toContain("thought_dash");
		expect(
			codes(validateChannelDescription(`${p(30)} Fra 2020\u20132024 steg den.\n\n${p(30)}`)),
		).toContain("thought_dash");
		expect(
			normalizeChannelDescription(`${p(30)} Fra 2020\u20132024 steg den.\n\n${p(30)}`),
		).toContain("Fra 2020-2024 steg den.");
		expect(
			codes(validateChannelDescription(`${p(30)} Kort sagt er den god.\n\n${p(30)}`)),
		).toContain("ai_phrase");
		const long = validateChannelDescription(`${p(20)} ${sentenceOfWords(51)}\n\n${p(20)}`);
		expect(codes(long)).toContain("sentence_too_long");
		const overused = validateChannelDescription(
			`${p(30)} Det er afgørende.\n\n${p(30)} Det er også afgørende.`,
		);
		expect(codes(overused)).toEqual([]);
		expect(codes(overused, "warning")).toContain("ai_word_overuse");
	});

	it("handles CRLF paragraph breaks", () => {
		expect(validateChannelDescription(`${p(30)}\r\n\r\n${p(30)}`)).toEqual([]);
	});
});
