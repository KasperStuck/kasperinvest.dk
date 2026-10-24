/** Test fixtures shared by Convex tests. The multi-dot name keeps it out of the Convex bundle. */
import type { VideoAnalysis } from "./contentRules";

export const VIDEO_TITLE = "Sådan investerer du i indeksfonde";

/** A valid paragraph of 56 words and 3 sentences that is not part of validArticle. */
export const EXTRA_PARAGRAPH =
	"Mange danske begyndere vælger en indeksfond, fordi den spreder pengene bredt uden at kræve daglig opfølgning. Valget af fond afgør dog, hvor meget af afkastet der ender hos investoren, og hvor meget der går til omkostninger og skat. Derfor betaler det sig at sammenligne både den årlige omkostning og kontotypen, før de første penge sættes ind.";

export const ARTICLE_SECTIONS: Array<{ heading: string; paragraphs: [string, string] }> = [
	{
		heading: "Hvad koster en indeksfond om året?",
		paragraphs: [
			"En indeksfond følger et bredt markedsindeks i stedet for at lade en forvalter vælge enkelte aktier. Det holder de løbende omkostninger nede, og mange danske fonde ligger under en halv procent om året. Forskellen virker lille, men den trækkes fra hvert eneste år og vokser derfor med formuen.",
			"Et eksempel gør det tydeligt. Med en opsparing på 100.000 kr. og en forskel i omkostninger på et procentpoint mister investoren omkring 1.000 kr. det første år. Efter tyve år er tabet langt større, fordi de sparede kroner også ville have givet afkast undervejs.",
		],
	},
	{
		heading: "Hvordan vælger du den rigtige fond?",
		paragraphs: [
			"Start med at se på, hvilket indeks fonden følger. Et globalt indeks giver spredning på tværs af lande og brancher, mens et dansk indeks samler risikoen på få store selskaber. Kig også på fondens størrelse og på, hvor tæt den har fulgt sit indeks de seneste år.",
			"Udbyttet har også betydning. En akkumulerende fond geninvesterer udbyttet automatisk, mens en udbyttebetalende fond sender pengene ud til investoren. Hvilken type der passer bedst, afhænger af, om pengene skal bruges løbende eller blive i fonden i mange år.",
		],
	},
	{
		heading: "Hvorfor betyder kontotypen noget for skatten?",
		paragraphs: [
			"Aktiesparekontoen beskattes med en lav fast sats, men gevinster og tab opgøres hvert år efter lagerprincippet. Det betyder, at investoren betaler skat af en stigning, selv om fonden ikke er solgt. Til gengæld er der et loft over, hvor meget der kan indbetales på kontoen.",
			"På et almindeligt depot afhænger skatten af, om fonden er aktiebaseret eller ej. Mange udenlandske indeksfonde står på Skattestyrelsens liste over aktiebaserede investeringsselskaber og lagerbeskattes som kapitalindkomst. Det kan give en højere skat end på aktiesparekontoen, så kontovalget bør afklares først.",
		],
	},
	{
		heading: "Hvor længe skal pengene blive i fonden?",
		paragraphs: [
			"Aktier svinger meget fra år til år, og et fald på en fjerdedel af værdien er set flere gange. Derfor egner indeksfonde sig bedst til penge, der kan blive investeret i mindst fem til syv år. Penge til en snarlig udbetaling hører hjemme på en almindelig opsparingskonto.",
			"Renters rente arbejder for den tålmodige investor. Afkastet fra de første år giver selv afkast senere, og effekten bliver tydelig efter ti år eller mere. Den største fejl er ofte at sælge i panik under et fald og dermed gå glip af den efterfølgende stigning.",
		],
	},
	{
		heading: "Hvad gør du, hvis markedet falder?",
		paragraphs: [
			"En fast månedlig indbetaling gør det lettere at holde kursen. Investoren køber automatisk flere andele, når kurserne er lave, og færre, når de er høje. Det kræver ingen vurdering af, om tidspunktet er rigtigt, og det fjerner meget af presset ved store udsving.",
			"Det hjælper også at skrive en enkel plan ned, før markedet falder. Planen kan beskrive, hvor stor en del af formuen der skal stå i aktier, og hvornår fordelingen skal justeres. Når planen findes på papir, bliver det lettere at træffe rolige beslutninger.",
		],
	},
	{
		heading: "Hvad skal du tjekke, før du køber?",
		paragraphs: [
			"Fondens faktaark viser de løbende omkostninger, indekset og hvor meget fonden har afveget fra indekset. Læs også, om fonden låner værdipapirer ud, og hvordan udbyttet behandles. De oplysninger står samme sted hos de fleste udbydere og tager kun få minutter at sammenligne.",
			"Handelsomkostningerne hos banken eller netmægleren tæller med. En lav kurtage betyder mere, når der indbetales et lille beløb hver måned. Nogle udbydere tilbyder faste månedsopsparinger uden kurtage, og det kan gøre en stor forskel for den, der starter med små beløb.",
		],
	},
];

/** About 570 words in six `##` sections; starts with a heading. Passes validateArticle. */
export function validArticle(): string {
	return ARTICLE_SECTIONS.map(
		({ heading, paragraphs }) => `## ${heading}\n\n${paragraphs.join("\n\n")}`,
	).join("\n\n");
}

export function validAnalysis(): VideoAnalysis {
	return {
		summary:
			"Lave omkostninger og den rigtige kontotype afgør, hvor meget danske begyndere får ud af en indeksfond over tid. Kanalen viser, hvordan fondsvalg, skat og en fast plan hænger sammen.",
		seoTitle: "Indeksfonde for begyndere: kom godt i gang",
		seoDescription:
			"Lær hvordan du vælger en billig indeksfond, hvad aktiesparekontoen betyder for skatten, og hvorfor tid er din vigtigste allierede.",
		themes: ["indeksfonde", "omkostninger"],
		categories: ["ETF", "privatøkonomi"],
		keyTakeaways: [
			"En forskel på et procentpoint i årlige omkostninger kan koste tusindvis af kroner over tyve år.",
			"Et globalt indeks spreder risikoen bredere end et dansk indeks med få store selskaber.",
			"Aktiesparekontoen har en lav skattesats, men gevinster beskattes hvert år efter lagerprincippet.",
			"Månedlige indbetalinger fjerner behovet for at ramme det rigtige tidspunkt i markedet.",
		],
		faq: [
			{
				question: "Hvad er en indeksfond?",
				answer:
					"En indeksfond køber aktierne i et bestemt indeks, fx et globalt aktieindeks. Derfor har den lave omkostninger og en bred spredning.",
			},
			{
				question: "Hvor meget koster en indeksfond om året?",
				answer:
					"Mange danske indeksfonde koster under en halv procent om året. Den præcise pris står som årlige omkostninger i procent i fondens faktaark.",
			},
			{
				question: "Skal jeg bruge en aktiesparekonto til indeksfonde?",
				answer:
					"En aktiesparekonto giver en lav fast skattesats, men der er et loft over indskuddet. Til større beløb kan et almindeligt depot være nødvendigt ved siden af.",
			},
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

/**
 * Provider answer (JSON text) for a fact-check request that supports every candidate segment:
 * one claim per segment quoting the whole segment, with evidence from the transcript chunk (or
 * the title, as a name claim, when there is no transcript). Later-chunk requests answer
 * not_found for every listed claim, which keeps the first chunk's support.
 */
export function passingFactCheck(user: string, schema: Record<string, unknown>): string {
	const properties = (schema.properties ?? {}) as Record<string, unknown>;
	if (!properties.segments) {
		const ids = [...user.matchAll(/^\[(c\d+)\] \(/gm)].map((match) => match[1]);
		return JSON.stringify({
			claims: ids.map((id) => ({ id, status: "not_found", evidenceQuote: "" })),
		});
	}
	const candidate = user.slice(user.indexOf("<kandidat>"));
	const segments = [...candidate.matchAll(/^\[([^\]]+)\] (.*)$/gm)].map((m) => ({
		id: m[1],
		text: m[2],
	}));
	const shown = user.match(/\(hovedkilde\):\n([\s\S]*?)\n<\/kilde>/)?.[1]?.trim() ?? "";
	const chunk = shown === "(ingen transskription)" ? "" : shown;
	const title = user.match(/^Titel: (.*)$/m)?.[1] ?? "";
	const evidence = chunk ? chunk.split(/\s+/).slice(0, 3).join(" ") : title;
	return JSON.stringify({
		segments: segments.map((segment, i) => ({
			segmentId: segment.id,
			claimIds: [`c${i + 1}`],
			noFactReason: "",
		})),
		claims: segments.map((segment, i) => ({
			id: `c${i + 1}`,
			segmentId: segment.id,
			candidateQuote: segment.text,
			kind: chunk ? "assertion" : "name",
			status: "supported",
			evidenceQuote: evidence,
		})),
	});
}
