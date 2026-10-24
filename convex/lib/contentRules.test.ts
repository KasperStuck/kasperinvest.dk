import { describe, expect, it } from "vitest";
import {
	analysisSchema,
	countWords,
	hasErrors,
	normalizeAnalysis,
	normalizeArticle,
	type ValidationIssue,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
	validateChannelDescription,
} from "./contentRules";

const SENTENCES = [
	"Indeksfonde giver en bred spredning af risikoen, og det gør dem til et oplagt valg for mange danske investorer.",
	"Når omkostningerne er lave, får du en større del af afkastet med hjem over tid.",
	"Det er derfor vigtigt at se på den årlige omkostning i procent, før du vælger en fond.",
	"Mange begyndere undervurderer betydningen af tid, men renters rente arbejder for dig år efter år.",
	"Skat på aktiesparekontoen er lagerbeskattet, og det betyder, at gevinster beskattes hvert år.",
];

function paragraph(sentences: number, offset = 0, pool = SENTENCES): string {
	return Array.from({ length: sentences }, (_, i) => pool[(i + offset) % pool.length]).join(" ");
}

/** Valid article: intro paragraph, then `##` sections with two paragraphs each. ~900 words. */
function makeArticle(
	options: {
		intro?: string;
		headings?: string[];
		sentencesPerParagraph?: number;
		pool?: string[];
	} = {},
): string {
	const headings = options.headings ?? [
		"Hvorfor omkostninger betyder meget",
		"Sådan vælger du den rigtige fond",
		"Skat og aktiesparekonto",
		"Tid er din bedste ven",
		"Opsummering for den nye investor",
	];
	const per = options.sentencesPerParagraph ?? 5;
	const pool = options.pool ?? SENTENCES;
	const intro = options.intro ?? paragraph(per, 0, pool);
	const sections = headings.map(
		(heading, i) => `## ${heading}\n\n${paragraph(per, i, pool)}\n\n${paragraph(per, i + 2, pool)}`,
	);
	return [intro, ...sections].join("\n\n");
}

const meta = { title: "Sådan investerer du i indeksfonde", seoTitle: "Indeksfonde for begyndere" };

function codes(issues: ValidationIssue[], severity: "error" | "warning" = "error"): string[] {
	return issues.filter((i) => i.severity === severity).map((i) => i.code);
}

describe("validateArticle", () => {
	it("accepts a valid Danish article", () => {
		const article = makeArticle();
		expect(countWords(article)).toBeGreaterThanOrEqual(800);
		expect(countWords(article)).toBeLessThanOrEqual(1500);
		const issues = validateArticle(article, meta);
		expect(issues).toEqual([]);
		expect(hasErrors(issues)).toBe(false);
	});

	it("accepts a valid article that names ETFs", () => {
		const article = makeArticle({
			intro: `${paragraph(3)} Fonde som iShares Core MSCI World UCITS ETF og Sparinvest Index Globale Aktier er populære.`,
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
			codes(
				validateArticle(makeArticle({ intro: `${paragraph(4)} Det er <b>vigtigt</b>.` }), meta),
			),
		).toContain("html");
	});

	it("rejects HTML and links in table header and body cells", () => {
		const table = (header: string, cell: string) =>
			`| ${header} | Fond |\n| --- | --- |\n| ${cell} | Billig |`;
		const withTable = (header: string, cell: string) =>
			`${makeArticle()}\n\n${table(header, cell)}\n\n${paragraph(1)}`;
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
			const article = makeArticle({ intro: `${paragraph(4)} Tekst ${markup} her.` });
			expect(codes(validateArticle(article, meta))).toContain("html");
		}
		const comparison = makeArticle({ intro: `${paragraph(4)} Omkostninger < 1 % og <5 år.` });
		expect(codes(validateArticle(comparison, meta))).toEqual([]);
	});

	it("rejects links, images, URLs and www addresses", () => {
		for (const extra of [
			"Læs [mere](https://example.com).",
			"Se ![graf](graf.png) her.",
			"Gå til https://example.com nu.",
			"Besøg www.example.dk i dag.",
		]) {
			const article = makeArticle({ intro: `${paragraph(4)} ${extra}` });
			expect(codes(validateArticle(article, meta))).toContain("url");
		}
	});

	it("rejects ATX and Setext H1", () => {
		expect(codes(validateArticle(`# Overskrift\n\n${makeArticle()}`, meta))).toContain("h1");
		expect(codes(validateArticle(`Overskrift\n==========\n\n${makeArticle()}`, meta))).toContain(
			"h1",
		);
	});

	it("rejects an article that does not start with an intro paragraph", () => {
		const article = makeArticle().replace(/^[^\n]+\n\n/, "");
		expect(article.startsWith("## ")).toBe(true);
		expect(codes(validateArticle(article, meta))).toContain("intro_missing");
	});

	it("requires at least three ## sections", () => {
		const article = makeArticle({
			headings: ["Første afsnit om fonde", "Andet afsnit om skat"],
			sentencesPerParagraph: 9,
		});
		expect(codes(validateArticle(article, meta))).toContain("too_few_sections");
	});

	it("rejects ### before the first ## and headings deeper than ###", () => {
		const early = makeArticle().replace("## Hvorfor", "### Hvorfor");
		expect(codes(validateArticle(early, meta))).toContain("h3_before_h2");
		const deep = `${makeArticle()}\n\n#### Detalje\n\n${paragraph(1)}`;
		expect(codes(validateArticle(deep, meta))).toContain("heading_too_deep");
	});

	it("rejects a heading that repeats the title or SEO title", () => {
		const repeatTitle = makeArticle().replace(
			"## Hvorfor omkostninger betyder meget",
			"## Sådan investerer du i indeksfonde!",
		);
		expect(codes(validateArticle(repeatTitle, meta))).toContain("heading_repeats_title");
		const repeatSeo = makeArticle().replace(
			"## Skat og aktiesparekonto",
			"## Indeksfonde for begyndere",
		);
		expect(codes(validateArticle(repeatSeo, meta))).toContain("heading_repeats_title");
	});

	it("rejects headings reserved for the page", () => {
		for (const heading of ["Hovedpointer", "Ofte stillede spørgsmål", "FAQ"]) {
			const article = makeArticle().replace("Tid er din bedste ven", heading);
			expect(codes(validateArticle(article, meta))).toContain("reserved_heading");
		}
	});

	it("rejects fenced and indented code", () => {
		expect(codes(validateArticle(`${makeArticle()}\n\n\`\`\`\nkode\n\`\`\``, meta))).toContain(
			"code",
		);
		expect(codes(validateArticle(`${makeArticle()}\n\n    kode her`, meta))).toContain("code");
	});

	it("rejects references to the video", () => {
		for (const phrase of ["I denne video", "i videoen", "Videoen handler om"]) {
			const article = makeArticle({ intro: `${phrase} ser vi på fonde. ${paragraph(4)}` });
			expect(codes(validateArticle(article, meta))).toContain("video_reference");
		}
	});

	it("enforces 800-1500 words", () => {
		const short = makeArticle({ sentencesPerParagraph: 2 });
		expect(countWords(short)).toBeLessThan(800);
		expect(codes(validateArticle(short, meta))).toContain("word_count");
		const long = makeArticle({ sentencesPerParagraph: 9 });
		expect(countWords(long)).toBeGreaterThan(1500);
		expect(codes(validateArticle(long, meta))).toContain("word_count");
	});

	it("rejects an unfinished ending", () => {
		const article = `${makeArticle()}\n\nOg derfor skal du altid huske at`;
		expect(codes(validateArticle(article, meta))).toContain("unfinished_ending");
		const quoted = `${makeArticle()}\n\nSom han siger: »Tid slår timing.«`;
		expect(codes(validateArticle(quoted, meta))).not.toContain("unfinished_ending");
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
		const article = makeArticle({
			pool: [
				"Index funds offer broad diversification, which makes them a sensible choice for many investors.",
				"When costs are low, you keep a larger share of the return over time and the effect compounds.",
			],
		});
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

const validAnalysis: VideoAnalysis = {
	summary:
		"Videoen gennemgår, hvordan danske begyndere kan komme i gang med indeksfonde, og hvorfor lave omkostninger betyder meget.",
	seoTitle: "Indeksfonde for begyndere: kom godt i gang",
	seoDescription:
		"Lær hvordan du vælger en billig indeksfond, hvad aktiesparekontoen betyder for skatten, og hvorfor tid er din vigtigste allierede.",
	themes: ["indeksfonde", "omkostninger"],
	categories: ["ETF", "privatøkonomi"],
	keyTakeaways: ["Vælg lave omkostninger", "Spred risikoen bredt", "Tænk langsigtet"],
	faq: [
		{ question: "Hvad er en indeksfond?", answer: "En fond der følger et indeks." },
		{ question: "Hvor meget koster en indeksfond?", answer: "Typisk under en halv procent." },
		{ question: "Skal jeg bruge aktiesparekonto?", answer: "Det kan give lavere skat." },
	],
	relevanceScore: 80,
};

describe("validateAnalysis", () => {
	it("accepts a valid analysis", () => {
		expect(validateAnalysis(validAnalysis)).toEqual([]);
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

	it("enforces summary 80-600 chars", () => {
		expect(codes(validateAnalysis({ ...validAnalysis, summary: "x".repeat(79) }))).toContain(
			"summary_length",
		);
		expect(codes(validateAnalysis({ ...validAnalysis, summary: "x".repeat(601) }))).toContain(
			"summary_length",
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

	it("enforces FAQ questions", () => {
		const noMark = validAnalysis.faq.map((f, i) =>
			i === 0 ? { ...f, question: "Hvad er en indeksfond" } : f,
		);
		expect(codes(validateAnalysis({ ...validAnalysis, faq: noMark }))).toContain(
			"faq_question_mark",
		);
		const dup = [...validAnalysis.faq.slice(0, 2), validAnalysis.faq[0]];
		expect(codes(validateAnalysis({ ...validAnalysis, faq: dup }))).toContain("faq_duplicate");
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
		expect(
			codes(validateAnalysis({ ...validAnalysis, keyTakeaways: ["Under < 1 %", "<5 år", "c"] })),
		).toEqual([]);
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

	it("passes through values it cannot normalize", () => {
		expect(normalizeAnalysis("x")).toBe("x");
		expect(analysisSchema.safeParse(normalizeAnalysis({ categories: ["ukendt"] })).success).toBe(
			false,
		);
	});
});

function words(n: number, word = "investering"): string {
	return Array.from({ length: n }, () => word).join(" ");
}

describe("validateChannelDescription", () => {
	const p = (n: number) => `Kanalen ${words(n - 1)}.`;

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

	it("handles CRLF paragraph breaks", () => {
		expect(validateChannelDescription(`${p(30)}\r\n\r\n${p(30)}`)).toEqual([]);
	});
});
