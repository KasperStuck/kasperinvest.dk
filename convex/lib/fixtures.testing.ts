/** Test fixtures shared by Convex tests. The multi-dot name keeps it out of the Convex bundle. */
import type { VideoAnalysis } from "./contentRules";

const SENTENCES = [
	"Indeksfonde giver en bred spredning af risikoen, og det gør dem til et oplagt valg for mange danske investorer.",
	"Når omkostningerne er lave, får du en større del af afkastet med hjem over tid.",
	"Det er derfor vigtigt at se på den årlige omkostning i procent, før du vælger en fond.",
	"Mange begyndere undervurderer betydningen af tid, men renters rente arbejder for dig år efter år.",
	"Skat på aktiesparekontoen er lagerbeskattet, og det betyder, at gevinster beskattes hvert år.",
];

function paragraph(sentences: number, offset: number): string {
	return Array.from(
		{ length: sentences },
		(_, i) => SENTENCES[(i + offset) % SENTENCES.length],
	).join(" ");
}

export const VIDEO_TITLE = "Sådan investerer du i indeksfonde";

/** About 900 words: intro paragraph and five `##` sections. Passes validateArticle. */
export function validArticle(): string {
	const headings = [
		"Hvorfor omkostninger betyder meget",
		"Sådan vælger du den rigtige fond",
		"Skat og aktiesparekonto",
		"Tid er din bedste ven",
		"Opsummering for den nye investor",
	];
	const sections = headings.map(
		(heading, i) => `## ${heading}\n\n${paragraph(5, i)}\n\n${paragraph(5, i + 2)}`,
	);
	return [paragraph(5, 0), ...sections].join("\n\n");
}

export function validAnalysis(): VideoAnalysis {
	return {
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
}

/** 60 words in two paragraphs, third person. Passes validateChannelDescription. */
export function validChannelDescription(): string {
	const first =
		"Kanalen handler om privatøkonomi og investering for almindelige danskere, der gerne vil forstå aktier, fonde og pension uden fagsprog og uden at bruge mange timer på det hver eneste uge.";
	const second =
		"Udsendelserne følger aktuelle renter, skatteregler og markeder tæt og forklarer konkrete valg med rolige eksempler, så seerne kan træffe bedre beslutninger om deres egen opsparing og fremtid.";
	return `${first}\n\n${second}`;
}

/** Transcript with the given number of words, split in segments of ten words. */
export function transcriptOfWords(words: number) {
	return Array.from({ length: Math.ceil(words / 10) }, (_, i) => ({
		text: Array.from({ length: Math.min(10, words - i * 10) }, () => "investering").join(" "),
		offset: i * 1000,
		duration: 1000,
	}));
}
