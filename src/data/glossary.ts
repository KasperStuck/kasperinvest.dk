export type GlossaryTerm = {
	id: string;
	title: string;
	description: string;
	publishedAt: string;
	updatedAt: string;
	draft?: boolean;
};

function isPublished(t: GlossaryTerm): boolean {
	return !t.draft && new Date(t.publishedAt) <= new Date();
}

export function getGlossaryTerms(): GlossaryTerm[] {
	return glossary.filter(isPublished);
}

export function getGlossaryTerm(
	slug: string,
): (GlossaryTerm & { next: GlossaryTerm | null }) | null {
	const published = glossary.filter(isPublished);
	const index = published.findIndex((t) => t.id === slug);
	if (index === -1) return null;

	return {
		...published[index],
		next: index < published.length - 1 ? published[index + 1] : null,
	};
}

export async function getGlossaryTermContent(slug: string) {
	const modules = import.meta.glob("@/data/glossary/*.mdx");
	const match = Object.entries(modules).find(([path]) => path.endsWith(`/${slug}.mdx`));
	if (!match) {
		throw new Error(`Glossary term not found: ${slug}`);
	}
	return ((await match[1]()) as { default: unknown }).default;
}

export function getGlossaryTermsByLetter(): Record<string, GlossaryTerm[]> {
	const grouped: Record<string, GlossaryTerm[]> = {};
	for (const term of glossary.filter(isPublished)) {
		const first = term.title[0].toUpperCase();
		const letter = /\d/.test(first) ? "0-9" : first;
		if (!grouped[letter]) grouped[letter] = [];
		grouped[letter].push(term);
	}
	return grouped;
}

const glossary: GlossaryTerm[] = [
	// 0-9
	{
		id: "4-procent-reglen",
		title: "4% reglen",
		description:
			"En tommelfingerregel for, hvor meget du kan hæve fra din opsparing hvert år i pension",
		publishedAt: "2026-03-16T07:41:00",
		updatedAt: "2026-03-19T11:19:00",
	},
	{
		id: "50-30-20-reglen",
		title: "50/30/20-reglen",
		description: "En enkel budgetregel, der deler din indkomst i behov, ønsker og opsparing",
		publishedAt: "2026-03-02T08:52:00",
		updatedAt: "2026-03-05T10:13:00",
	},

	// A
	{
		id: "a-aktie",
		title: "A-aktie",
		description: "En aktieklasse med ekstra stemmerettigheder på generalforsamlingen",
		publishedAt: "2026-03-26T09:51:00",
		updatedAt: "2026-04-07T08:19:00",
	},
	{
		id: "active-share",
		title: "Active Share (AS)",
		description: "Et mål for, hvor meget en fond afviger fra sit benchmark",
		publishedAt: "2026-06-30T12:22:00",
		updatedAt: "2026-07-06T09:38:00",
	},
	{
		id: "afdragsfri",
		title: "Afdragsfri",
		description: "Et lån, hvor du kun betaler renter og ikke afdrager på gælden",
		publishedAt: "2026-06-04T10:23:00",
		updatedAt: "2026-06-08T07:51:00",
	},
	{
		id: "afkast",
		title: "Afkast",
		description: "Det samlede udbytte eller gevinst, du får fra en investering",
		publishedAt: "2026-07-31T11:05:00",
		updatedAt: "2026-08-12T08:11:00",
	},
	{
		id: "afkast-og-udbytte",
		title: "Afkast og udbytte",
		description: "Forstå forskellen mellem det samlede afkast og løbende udbetalinger",
		publishedAt: "2026-05-20T08:57:00",
		updatedAt: "2026-06-03T11:45:00",
	},
	{
		id: "afkastkonto",
		title: "Afkastkonto",
		description: "En konto, hvor afkastet fra dine investeringer samles",
		publishedAt: "2026-04-06T12:10:00",
		updatedAt: "2026-04-10T09:50:00",
	},
	{
		id: "afkastningsgrad",
		title: "Afkastningsgrad (ROA)",
		description:
			"Et nøgletal der viser, hvor effektivt et selskab bruger sine aktiver til at skabe overskud",
		publishedAt: "2026-07-22T11:04:00",
		updatedAt: "2026-07-30T06:10:00",
	},
	{
		id: "afskrivning",
		title: "Afskrivning",
		description: "Den regnskabsmæssige fordeling af et aktivs værdi over dets levetid",
		publishedAt: "2026-08-14T13:19:00",
		updatedAt: "2026-08-17T11:04:00",
	},
	{
		id: "aif",
		title: "AIF",
		description:
			"Alternative investeringsfonde — en bred kategori af fonde uden for de almindelige regler",
		publishedAt: "2026-07-22T09:09:00",
		updatedAt: "2026-07-27T08:34:00",
	},
	{
		id: "aktie",
		title: "Aktie",
		description: "En ejerandel i et selskab — det mest grundlæggende investeringsbegreb",
		publishedAt: "2026-08-24T12:43:00",
		updatedAt: "2026-08-31T09:05:00",
	},
	{
		id: "aktiebog",
		title: "Aktiebog",
		description: "Et register over alle aktionærer i et selskab",
		publishedAt: "2026-08-10T11:06:00",
		updatedAt: "2026-08-18T13:30:00",
	},
	{
		id: "aktiehaendelse",
		title: "Aktiehændelse",
		description: "Begivenheder i et selskab, der påvirker dine aktier",
		publishedAt: "2026-08-27T12:14:00",
		updatedAt: "2026-09-09T07:00:00",
	},
	{
		id: "aktieindeks",
		title: "Aktieindeks",
		description: "Et samlet mål for, hvordan en gruppe aktier klarer sig",
		publishedAt: "2026-07-28T10:03:00",
		updatedAt: "2026-08-03T08:37:00",
	},
	{
		id: "aktieindkomst",
		title: "Aktieindkomst",
		description: "Den danske skattekategori for afkast fra aktier og aktiebaserede investeringer",
		publishedAt: "2026-08-20T09:01:00",
		updatedAt: "2026-08-31T06:21:00",
	},
	{
		id: "aktiekurs",
		title: "Aktiekurs",
		description: "Prisen på en aktie på et givent tidspunkt",
		publishedAt: "2026-06-04T11:22:00",
		updatedAt: "2026-06-08T08:22:00",
	},
	{
		id: "aktieplatform",
		title: "Aktieplatform",
		description: "Den tjeneste du bruger til at købe og sælge aktier og andre værdipapirer",
		publishedAt: "2026-08-06T10:19:00",
		updatedAt: "2026-08-12T06:04:00",
	},
	{
		id: "aktieportefoelje",
		title: "Aktieportefølje",
		description: "Din samling af aktier",
		publishedAt: "2026-07-22T12:40:00",
		updatedAt: "2026-08-03T13:06:00",
	},
	{
		id: "aktiepraemie",
		title: "Aktiepræmie",
		description: "Det ekstra afkast aktier giver",
		publishedAt: "2026-04-28T09:37:00",
		updatedAt: "2026-05-04T07:47:00",
	},
	{
		id: "aktiesparekonto",
		title: "Aktiesparekonto",
		description: "Skat på kun 17 %",
		publishedAt: "2026-07-31T12:37:00",
		updatedAt: "2026-08-10T06:04:00",
	},
	{
		id: "aktiesplit",
		title: "Aktiesplit",
		description: "Når én aktie bliver til flere",
		publishedAt: "2026-08-05T13:30:00",
		updatedAt: "2026-08-10T13:03:00",
	},
	{
		id: "aktietilbagekoeb",
		title: "Aktietilbagekøb",
		description: "Når virksomheden køber sine egne aktier",
		publishedAt: "2026-08-06T08:20:00",
		updatedAt: "2026-08-10T08:04:00",
	},
	{
		id: "aktionaerfordele",
		title: "Aktionærfordele",
		description: "Ekstra goder til aktieejere",
		publishedAt: "2026-05-28T11:06:00",
		updatedAt: "2026-06-01T11:01:00",
	},
	{
		id: "aktiv-forvaltning",
		title: "Aktiv forvaltning",
		description: "Professionelle vælger dine investeringer",
		publishedAt: "2026-04-28T11:17:00",
		updatedAt: "2026-05-11T08:11:00",
	},
	{
		id: "aktiv-investering",
		title: "Aktiv investering",
		description: "At tage kontrol over dine investeringer",
		publishedAt: "2026-06-30T13:23:00",
		updatedAt: "2026-07-13T06:59:00",
	},
	{
		id: "aktiv-investor",
		title: "Aktiv investor",
		description: "En investor der selv tager styringen",
		publishedAt: "2026-06-23T11:37:00",
		updatedAt: "2026-07-06T09:40:00",
	},
	{
		id: "aktiv-klasse",
		title: "Aktiv klasse",
		description: "Hvad du kan investere i",
		publishedAt: "2026-08-27T10:26:00",
		updatedAt: "2026-09-07T07:22:00",
	},
	{
		id: "aktivallokering",
		title: "Aktivallokering",
		description: "Fordelingen der bestemmer dit afkast",
		publishedAt: "2026-07-07T07:35:00",
		updatedAt: "2026-07-21T13:29:00",
	},
	{
		id: "aktive-investeringsforeninger",
		title: "Aktive investeringsforeninger",
		description: "Professionel forvaltning af din opsparing",
		publishedAt: "2026-08-14T12:27:00",
		updatedAt: "2026-08-24T12:51:00",
	},
	{
		id: "aktive-vs-passive-investeringsforeninger",
		title: "Aktive vs. passive investeringsforeninger",
		description: "Hvad er bedst for dig?",
		publishedAt: "2026-06-15T10:41:00",
		updatedAt: "2026-06-23T06:44:00",
	},
	{
		id: "aktiver",
		title: "Aktiver",
		description: "Alt hvad der har værdi",
		publishedAt: "2026-08-25T10:49:00",
		updatedAt: "2026-08-31T08:35:00",
	},
	{
		id: "aktivklasse",
		title: "Aktivklasse",
		description: "De store investeringskategorier",
		publishedAt: "2026-05-07T10:48:00",
		updatedAt: "2026-05-15T13:28:00",
	},
	{
		id: "aktivt-ejerskab",
		title: "Aktivt ejerskab",
		description: "Når investorer påvirker virksomheder",
		publishedAt: "2026-08-25T07:56:00",
		updatedAt: "2026-08-31T06:45:00",
	},
	{
		id: "aldersopsparing",
		title: "Aldersopsparing",
		description: "Skattefri pension med lavt indskud",
		publishedAt: "2026-08-26T10:15:00",
		updatedAt: "2026-09-07T09:49:00",
	},
	{
		id: "algoritmehandel",
		title: "Algoritmehandel",
		description: "Når computere handler aktier",
		publishedAt: "2026-07-14T08:13:00",
		updatedAt: "2026-07-17T13:02:00",
	},
	{
		id: "allokering",
		title: "Allokering",
		description: "Hvordan du fordeler dine penge",
		publishedAt: "2026-05-20T11:12:00",
		updatedAt: "2026-06-01T12:41:00",
	},
	{
		id: "alpha",
		title: "Alpha",
		description: "Merafkastet ud over markedet",
		publishedAt: "2026-03-03T08:49:00",
		updatedAt: "2026-03-05T10:40:00",
	},
	{
		id: "alternative-investeringer",
		title: "Alternative investeringer",
		description: "Investeringer uden for de traditionelle aktivklasser som aktier og obligationer",
		publishedAt: "2026-03-02T11:51:00",
		updatedAt: "2026-03-09T06:19:00",
	},
	{
		id: "am-bidrag",
		title: "AM-bidrag",
		description: "Den obligatoriske arbejdsmarkedsbidrag på 8%, som trækkes fra din løn",
		publishedAt: "2026-07-06T11:49:00",
		updatedAt: "2026-07-10T12:18:00",
	},
	{
		id: "andelsbolig",
		title: "Andelsbolig",
		description: "En boligform hvor du ejer en andel af en forening frem for selve boligen",
		publishedAt: "2026-04-17T07:59:00",
		updatedAt: "2026-04-29T13:59:00",
	},
	{
		id: "andelsboliglaan",
		title: "Andelsboliglån",
		description:
			"Et banklån til køb af andelsbolig — med andre vilkår end et traditionelt realkreditlån",
		publishedAt: "2026-06-15T12:47:00",
		updatedAt: "2026-06-23T06:21:00",
	},
	{
		id: "anlaegsaktiver",
		title: "Anlægsaktiver",
		description: "Langsigtede aktiver som en virksomhed ejer og bruger over flere år",
		publishedAt: "2026-05-07T11:38:00",
		updatedAt: "2026-05-18T10:07:00",
	},
	{
		id: "arv",
		title: "Arv",
		description: "Overførsel af formue og ejendele fra en afdød person til arvinger",
		publishedAt: "2026-05-28T13:21:00",
		updatedAt: "2026-06-03T11:37:00",
	},
	{
		id: "arveafgift",
		title: "Arveafgift",
		description: "Den afgift, arvinger skal betale til staten af den arv, de modtager",
		publishedAt: "2026-03-26T11:28:00",
		updatedAt: "2026-03-30T13:56:00",
	},
	{
		id: "asset-allocation",
		title: "Asset allocation",
		description: "Fordelingen af din opsparing på tværs af forskellige aktivklasser",
		publishedAt: "2026-06-15T11:39:00",
		updatedAt: "2026-06-23T11:46:00",
	},
	{
		id: "automatisk-overfoersel",
		title: "Automatisk overførsel",
		description:
			"En fast, automatisk bankoverførsel der hjælper dig med at spare og investere konsekvent",
		publishedAt: "2026-05-07T12:27:00",
		updatedAt: "2026-05-12T12:22:00",
	},

	// B
	{
		id: "b-aktie",
		title: "B-aktie",
		description:
			"En B-aktie giver typisk færre stemmerettigheder end en A-aktie, men samme ret til udbytte.",
		publishedAt: "2026-04-17T09:10:00",
		updatedAt: "2026-04-22T12:51:00",
	},
	{
		id: "balance",
		title: "Balance",
		description:
			"Balancen viser hvad en virksomhed ejer (aktiver) og skylder (passiver) på et givent tidspunkt.",
		publishedAt: "2026-07-01T08:16:00",
		updatedAt: "2026-07-03T07:17:00",
	},
	{
		id: "bankkonto",
		title: "Bankkonto",
		description:
			"En bankkonto er en grundlæggende konto i en bank til opbevaring og overførsel af penge.",
		publishedAt: "2026-06-23T12:52:00",
		updatedAt: "2026-06-29T07:20:00",
	},
	{
		id: "barista-fire",
		title: "Barista FIRE",
		description:
			"Barista FIRE betyder at opnå delvis økonomisk uafhængighed og supplere med deltidsarbejde.",
		publishedAt: "2026-08-27T13:18:00",
		updatedAt: "2026-09-07T10:05:00",
	},
	{
		id: "basispoint",
		title: "Basispoint",
		description:
			"Et basispoint er en hundrededel af et procentpoint (0,01 %) — bruges til at måle renteændringer.",
		publishedAt: "2026-07-14T09:19:00",
		updatedAt: "2026-07-24T13:17:00",
	},
	{
		id: "bear-certifikat",
		title: "Bear certifikat",
		description:
			"Et bear certifikat er et værdipapir, der stiger i værdi, når det underliggende aktiv falder.",
		publishedAt: "2026-08-21T10:00:00",
		updatedAt: "2026-08-31T09:49:00",
	},
	{
		id: "bear-market",
		title: "Bear market",
		description:
			"Et bear market er et aktiemarked, der er faldet mindst 20 % fra sit seneste højdepunkt.",
		publishedAt: "2026-08-25T08:56:00",
		updatedAt: "2026-09-02T08:00:00",
	},
	{
		id: "bear-market-rally",
		title: "Bear market rally",
		description:
			"Et bear market rally er en kortvarig kursstigning midt i et ellers faldende marked.",
		publishedAt: "2026-08-28T12:49:00",
		updatedAt: "2026-09-02T08:32:00",
	},
	{
		id: "bear-og-bull",
		title: "Bear og bull",
		description:
			"Bear og bull beskriver de to retninger på aktiemarkedet — faldende (bear) og stigende (bull).",
		publishedAt: "2026-05-29T08:11:00",
		updatedAt: "2026-06-01T12:16:00",
	},
	{
		id: "bearish",
		title: "Bearish",
		description:
			"Bearish betyder at have en negativ forventning til kursen på en aktie eller markedet generelt.",
		publishedAt: "2026-06-24T07:33:00",
		updatedAt: "2026-06-29T08:59:00",
	},
	{
		id: "benchmark",
		title: "Benchmark",
		description:
			"Et benchmark er et sammenligningsgrundlag, f.eks. et indeks, som afkast måles op imod.",
		publishedAt: "2026-05-08T08:13:00",
		updatedAt: "2026-05-20T13:39:00",
	},
	{
		id: "beskaeftigelsesfradrag",
		title: "Beskæftigelsesfradrag",
		description:
			"Beskæftigelsesfradraget er et automatisk skattefradrag, du får, når du har lønindkomst i Danmark.",
		publishedAt: "2026-08-26T12:32:00",
		updatedAt: "2026-08-31T10:07:00",
	},
	{
		id: "beta",
		title: "Beta",
		description:
			"Beta måler hvor meget en aktie svinger i forhold til det samlede marked — over 1 er mere volatil.",
		publishedAt: "2026-05-20T12:22:00",
		updatedAt: "2026-06-01T13:46:00",
	},
	{
		id: "bevilliget-overtraek",
		title: "Bevilliget overtræk",
		description:
			"Et bevilliget overtræk er en aftale med banken om at trække mere end kontosaldoen tillader.",
		publishedAt: "2026-07-29T07:44:00",
		updatedAt: "2026-08-10T10:47:00",
	},
	{
		id: "bidragssats",
		title: "Bidragssats",
		description:
			"Bidragssatsen er den procentdel af realkreditlånet du betaler til realkreditinstituttet årligt.",
		publishedAt: "2026-08-11T07:15:00",
		updatedAt: "2026-08-17T06:22:00",
	},
	{
		id: "billaan",
		title: "Billån",
		description: "Et billån er et lån, der specifikt bruges til at finansiere køb af en bil.",
		publishedAt: "2026-07-01T09:16:00",
		updatedAt: "2026-07-13T13:54:00",
	},
	{
		id: "blaa-obligation",
		title: "Blå obligation",
		description:
			"En blå obligation er en dansk realkreditobligation med en kuponrente over mindsterenten.",
		publishedAt: "2026-07-28T12:50:00",
		updatedAt: "2026-07-30T08:34:00",
	},
	{
		id: "blue-chip",
		title: "Blue chip aktier",
		description:
			"Blue chip aktier er aktier i store, veletablerede selskaber med stabil økonomi og lang historik.",
		publishedAt: "2026-08-25T12:46:00",
		updatedAt: "2026-09-03T09:18:00",
	},
	{
		id: "bnp",
		title: "BNP (bruttonationalprodukt)",
		description:
			"BNP måler den samlede værdi af alle varer og tjenester produceret i et land i en given periode.",
		publishedAt: "2026-08-31T12:35:00",
		updatedAt: "2026-09-14T12:13:00",
	},
	{
		id: "bob-best-of-breed",
		title: "BoB (Best of breed)",
		description:
			"Best of breed er en investeringsstrategi, hvor man vælger det bedste selskab inden for hver sektor.",
		publishedAt: "2026-03-26T12:37:00",
		updatedAt: "2026-03-30T11:00:00",
	},
	{
		id: "boliglaan",
		title: "Boliglån",
		description:
			"Et boliglån er et lån til køb af bolig, typisk et realkreditlån eller banklån med pant i ejendommen.",
		publishedAt: "2026-06-15T13:41:00",
		updatedAt: "2026-06-18T10:09:00",
	},
	{
		id: "boligopsparing",
		title: "Boligopsparing",
		description:
			"Boligopsparing er en opsparingsform målrettet unge, der vil spare op til deres første boligkøb.",
		publishedAt: "2026-03-16T09:55:00",
		updatedAt: "2026-03-18T10:39:00",
	},
	{
		id: "bruttoafkast",
		title: "Bruttoafkast",
		description:
			"Bruttoafkast er det samlede afkast af en investering, før omkostninger og skat er trukket fra.",
		publishedAt: "2026-08-03T08:53:00",
		updatedAt: "2026-08-11T13:04:00",
	},
	{
		id: "bruttoavance",
		title: "Bruttoavance",
		description:
			"Bruttoavancen viser forskellen mellem omsætning og vareforbrug — et mål for grundlæggende lønsomhed.",
		publishedAt: "2026-05-29T07:25:00",
		updatedAt: "2026-06-08T13:11:00",
	},
	{
		id: "bruttoindkomst",
		title: "Bruttoindkomst",
		description:
			"Bruttoindkomst er din samlede indkomst før skat og fradrag — også kaldet indkomst før AM-bidrag.",
		publishedAt: "2026-06-04T12:12:00",
		updatedAt: "2026-06-18T10:09:00",
	},
	{
		id: "bruttoresultat",
		title: "Bruttoresultat",
		description:
			"Bruttoresultatet er en virksomheds omsætning minus vareforbrug og produktionsomkostninger.",
		publishedAt: "2026-08-17T11:43:00",
		updatedAt: "2026-08-19T12:34:00",
	},
	{
		id: "budget",
		title: "Budget",
		description:
			"Et budget er en plan for dine indtægter og udgifter over en given periode, typisk en måned.",
		publishedAt: "2026-07-23T09:29:00",
		updatedAt: "2026-07-27T11:25:00",
	},
	{
		id: "budgetkonto",
		title: "Budgetkonto",
		description:
			"En budgetkonto er en bankkonto til faste udgifter som husleje, forsikring og abonnementer.",
		publishedAt: "2026-08-28T07:54:00",
		updatedAt: "2026-09-07T12:37:00",
	},
	{
		id: "buffett-indicator",
		title: "Buffett Indicator",
		description: "Buffett Indicator måler aktiemarkedets samlede værdi i forhold til landets BNP.",
		publishedAt: "2026-04-28T12:37:00",
		updatedAt: "2026-05-01T10:44:00",
	},
	{
		id: "buffett-warren",
		title: "Buffett, Warren",
		description:
			"Warren Buffett er en legendarisk amerikansk investor og CEO for Berkshire Hathaway.",
		publishedAt: "2026-08-21T09:09:00",
		updatedAt: "2026-08-31T13:04:00",
	},
	{
		id: "bull-certifikat",
		title: "Bull certifikat",
		description:
			"Et bull certifikat er et værdipapir, der stiger i værdi, når det underliggende aktiv stiger.",
		publishedAt: "2026-06-24T08:59:00",
		updatedAt: "2026-06-29T13:56:00",
	},
	{
		id: "bull-market",
		title: "Bull market",
		description:
			"Et bull market er et aktiemarked med vedvarende kursstigninger, typisk over 20 % fra bunden.",
		publishedAt: "2026-04-07T10:10:00",
		updatedAt: "2026-04-13T06:27:00",
	},
	{
		id: "bullish",
		title: "Bullish",
		description:
			"Bullish betyder at have en positiv forventning til kursen på en aktie eller markedet generelt.",
		publishedAt: "2026-08-06T12:11:00",
		updatedAt: "2026-08-17T06:38:00",
	},
	{
		id: "bundfradrag",
		title: "Bundfradrag",
		description:
			"Bundfradraget er den del af din indkomst, du ikke betaler bundskat af — fastsat af Skattestyrelsen.",
		publishedAt: "2026-05-07T13:45:00",
		updatedAt: "2026-05-18T07:50:00",
	},
	{
		id: "bundlinjen",
		title: "Bundlinjen",
		description:
			"Bundlinjen er virksomhedens endelige resultat efter alle udgifter, renter og skat er betalt.",
		publishedAt: "2026-03-26T13:41:00",
		updatedAt: "2026-03-30T07:36:00",
	},
	{
		id: "business-intelligence",
		title: "Business Intelligence",
		description:
			"Business Intelligence er brug af data og analyse til at træffe bedre forretningsbeslutninger.",
		publishedAt: "2026-07-14T10:09:00",
		updatedAt: "2026-07-20T13:24:00",
	},
	{
		id: "baeredygtig-investering",
		title: "Bæredygtig investering",
		description:
			"Bæredygtig investering tager hensyn til miljø, sociale forhold og god selskabsledelse (ESG).",
		publishedAt: "2026-08-31T07:48:00",
		updatedAt: "2026-09-07T08:57:00",
	},
	{
		id: "baeredygtige-obligationer",
		title: "Bæredygtige obligationer",
		description:
			"Bæredygtige obligationer finansierer projekter med positiv miljø- eller samfundsmæssig effekt.",
		publishedAt: "2026-08-03T07:11:00",
		updatedAt: "2026-08-11T09:43:00",
	},
	{
		id: "boerneboernskonto",
		title: "Børnebørnskonto",
		description:
			"En børnebørnskonto er en opsparingsform, hvor bedsteforældre kan spare op til børnebørn.",
		publishedAt: "2026-08-31T11:04:00",
		updatedAt: "2026-09-14T12:50:00",
	},
	{
		id: "boerneopsparing",
		title: "Børneopsparing",
		description:
			"En børneopsparing er en skattefri opsparing til børn under 21 år med et årligt indskudsloft.",
		publishedAt: "2026-08-13T08:59:00",
		updatedAt: "2026-08-25T07:06:00",
	},
	{
		id: "boers",
		title: "Børs",
		description:
			"En børs er en reguleret markedsplads, hvor aktier, obligationer og andre værdipapirer handles.",
		publishedAt: "2026-04-07T12:13:00",
		updatedAt: "2026-04-13T06:49:00",
	},
	{
		id: "boersen",
		title: "Børsen",
		description:
			"Børsen er Danmarks ældste erhvervsavis med fokus på finans, aktier og dansk erhvervsliv.",
		publishedAt: "2026-08-21T07:56:00",
		updatedAt: "2026-08-26T07:08:00",
	},
	{
		id: "boersnotering",
		title: "Børsnotering",
		description:
			"En børsnotering (IPO) er når et selskab for første gang sælger aktier til offentligheden.",
		publishedAt: "2026-07-23T07:15:00",
		updatedAt: "2026-07-28T13:24:00",
	},
	{
		id: "boersnoterede-selskaber",
		title: "Børsnoterede selskaber",
		description:
			"Børsnoterede selskaber er virksomheder, hvis aktier kan købes og sælges frit på en fondsbørs.",
		publishedAt: "2026-07-07T11:20:00",
		updatedAt: "2026-07-17T09:50:00",
	},

	// C
	{
		id: "c25",
		title: "C25-indeks",
		description: "Det danske eliteindeks med landets 25 mest handlede aktier",
		publishedAt: "2026-04-17T11:12:00",
		updatedAt: "2026-04-27T12:54:00",
	},
	{
		id: "cagr",
		title: "CAGR",
		description: "Compound Annual Growth Rate — det gennemsnitlige årlige afkast over en periode",
		publishedAt: "2026-07-29T09:29:00",
		updatedAt: "2026-08-10T06:03:00",
	},
	{
		id: "call-option",
		title: "Call option",
		description: "En ret — men ikke en pligt — til at købe et aktiv til en fastsat pris",
		publishedAt: "2026-04-17T12:26:00",
		updatedAt: "2026-04-27T12:41:00",
	},
	{
		id: "candlestickcharts",
		title: "Candlestickcharts",
		description: "En visuel metode til at aflæse kursudvikling og markedsstemning",
		publishedAt: "2026-06-04T13:26:00",
		updatedAt: "2026-06-15T10:37:00",
	},
	{
		id: "capped-floater-obligation",
		title: "Capped Floater-obligation",
		description: "En variabelt forrentet obligation med et loft over renten",
		publishedAt: "2026-04-17T10:17:00",
		updatedAt: "2026-04-30T13:52:00",
	},
	{
		id: "cash-flow",
		title: "Cash flow",
		description: "Pengestrømmene ind og ud af en virksomhed",
		publishedAt: "2026-08-03T10:09:00",
		updatedAt: "2026-08-12T11:42:00",
	},
	{
		id: "cash-flow-fra-driften",
		title: "Cash flow fra driften",
		description: "Pengestrømme fra virksomhedens kerneforretning",
		publishedAt: "2026-05-21T09:01:00",
		updatedAt: "2026-06-02T12:14:00",
	},
	{
		id: "cash-flow-fra-finansiering",
		title: "Cash flow fra finansiering",
		description: "Pengestrømme fra lån, aktieudstedelser og udbyttebetalinger",
		publishedAt: "2026-07-14T11:14:00",
		updatedAt: "2026-07-27T06:12:00",
	},
	{
		id: "cash-flow-fra-investering",
		title: "Cash flow fra investering",
		description: "Pengestrømme fra køb og salg af langsigtede aktiver",
		publishedAt: "2026-05-20T13:17:00",
		updatedAt: "2026-05-26T08:25:00",
	},
	{
		id: "central-information-faktaark",
		title: "Central information-faktaark",
		description: "Det lovpligtige faktaark, der gør investeringsprodukter sammenlignelige",
		publishedAt: "2026-07-14T13:23:00",
		updatedAt: "2026-07-20T12:22:00",
	},
	{
		id: "certified-adviser",
		title: "Certified Adviser",
		description: "Den obligatoriske rådgiver for selskaber på Nasdaq First North",
		publishedAt: "2026-07-01T10:28:00",
		updatedAt: "2026-07-13T06:09:00",
	},
	{
		id: "chart",
		title: "Chart",
		description: "En grafisk fremstilling af et aktivs kursudvikling over tid",
		publishedAt: "2026-03-04T09:14:00",
		updatedAt: "2026-03-09T06:17:00",
	},
	{
		id: "chartist",
		title: "Chartist",
		description:
			"En investor der bruger kursdiagrammer og tekniske mønstre til at træffe beslutninger",
		publishedAt: "2026-05-21T11:34:00",
		updatedAt: "2026-05-25T08:35:00",
	},
	{
		id: "cibor",
		title: "CIBOR",
		description: "Copenhagen Interbank Offered Rate — den danske pengemarkedsrente",
		publishedAt: "2026-03-16T11:32:00",
		updatedAt: "2026-03-26T10:25:00",
	},
	{
		id: "cleantech",
		title: "Cleantech",
		description: "Investering i teknologier der fremmer bæredygtig energi og ressourceforbrug",
		publishedAt: "2026-03-16T10:31:00",
		updatedAt: "2026-03-20T08:09:00",
	},
	{
		id: "clo",
		title: "Collateralized Loan Obligation (CLO)",
		description: "Et struktureret produkt der samler virksomhedslån i en investérbar pakke",
		publishedAt: "2026-03-04T08:07:00",
		updatedAt: "2026-03-16T10:33:00",
	},
	{
		id: "co2-aftryk",
		title: "CO2-aftryk",
		description: "Den samlede mængde drivhusgasser forbundet med en investering",
		publishedAt: "2026-04-08T06:53:00",
		updatedAt: "2026-04-13T13:21:00",
	},
	{
		id: "co2-neutral",
		title: "CO2-neutral",
		description: "Når nettoudledningen af CO2 er nul — enten ved reduktion eller kompensation",
		publishedAt: "2026-04-29T07:21:00",
		updatedAt: "2026-05-05T12:47:00",
	},
	{
		id: "coco-obligation",
		title: "CoCo-obligation",
		description:
			"Contingent Convertible — en hybrid obligation der automatisk konverteres til aktier ved finansiel stress",
		publishedAt: "2026-08-07T07:04:00",
		updatedAt: "2026-08-20T09:58:00",
	},
	{
		id: "combined-ratio",
		title: "Combined ratio",
		description:
			"Et nøgletal der viser, om et forsikringsselskab tjener penge på sin forsikringsdrift",
		publishedAt: "2026-05-08T10:19:00",
		updatedAt: "2026-05-12T13:59:00",
	},
	{
		id: "commitment",
		title: "Commitment",
		description: "Det beløb en investor forpligter sig til at investere i en private equity-fond",
		publishedAt: "2026-08-03T11:46:00",
		updatedAt: "2026-08-13T13:07:00",
	},
	{
		id: "compounder-aktie",
		title: "Compounder aktie",
		description:
			"En aktie i en virksomhed der konsekvent øger sin indtjening og dermed skaber eksponentiel værdiskabelse over tid",
		publishedAt: "2026-05-29T09:38:00",
		updatedAt: "2026-06-08T13:54:00",
	},
	{
		id: "copytrading",
		title: "Copytrading",
		description: "Kopiér andre investorers handler automatisk",
		publishedAt: "2026-07-01T11:34:00",
		updatedAt: "2026-07-13T13:56:00",
	},
	{
		id: "corporate-social-responsibility",
		title: "Corporate Social Responsibility (CSR)",
		description: "Virksomheders samfundsansvar",
		publishedAt: "2026-07-14T12:15:00",
		updatedAt: "2026-07-20T08:59:00",
	},
	{
		id: "credit-default-swap",
		title: "Credit default swap",
		description: "Forsikring mod at en udsteder misligholder sin gæld",
		publishedAt: "2026-07-07T13:00:00",
		updatedAt: "2026-07-14T13:24:00",
	},
	{
		id: "crowdlending",
		title: "Crowdlending",
		description: "Udlån af penge til virksomheder og privatpersoner via platforme",
		publishedAt: "2026-03-27T07:20:00",
		updatedAt: "2026-03-30T09:49:00",
	},
	{
		id: "csrd",
		title: "CSRD",
		description: "EU's direktiv om virksomheders bæredygtighedsrapportering",
		publishedAt: "2026-03-16T12:37:00",
		updatedAt: "2026-03-20T12:30:00",
	},
	{
		id: "cykliske-aktier",
		title: "Cykliske aktier",
		description: "Aktier der følger konjunkturerne op og ned",
		publishedAt: "2026-07-29T11:03:00",
		updatedAt: "2026-08-10T13:59:00",
	},

	// D
	{
		id: "dax",
		title: "DAX",
		description: "Tysklands vigtigste aktieindeks",
		publishedAt: "2026-07-08T08:24:00",
		updatedAt: "2026-07-13T06:34:00",
	},
	{
		id: "day-trading",
		title: "Day trading",
		description: "aktiv handel inden for samme dag",
		publishedAt: "2026-07-02T07:10:00",
		updatedAt: "2026-07-14T09:18:00",
	},
	{
		id: "debitkort",
		title: "Debitkort",
		description: "betalingskort knyttet til din bankkonto",
		publishedAt: "2026-07-08T07:11:00",
		updatedAt: "2026-07-22T08:49:00",
	},
	{
		id: "defensive-aktier",
		title: "Defensive aktier",
		description: "stabilitet i usikre tider",
		publishedAt: "2026-04-08T10:08:00",
		updatedAt: "2026-04-20T07:29:00",
	},
	{
		id: "delmarked",
		title: "Delmarked",
		description: "et segment af det samlede marked",
		publishedAt: "2026-04-17T13:26:00",
		updatedAt: "2026-04-30T11:02:00",
	},
	{
		id: "depot",
		title: "Depot",
		description: "din konto til værdipapirer",
		publishedAt: "2026-07-01T13:23:00",
		updatedAt: "2026-07-13T07:25:00",
	},
	{
		id: "depot-og-depotgebyr",
		title: "Depot og depotgebyr",
		description: "opbevaring af værdipapirer og hvad det koster",
		publishedAt: "2026-03-17T09:04:00",
		updatedAt: "2026-03-25T08:31:00",
	},
	{
		id: "depotgebyr",
		title: "Depotgebyr",
		description: "gebyr for opbevaring af dine værdipapirer",
		publishedAt: "2026-06-05T13:01:00",
		updatedAt: "2026-06-17T06:21:00",
	},
	{
		id: "derivater",
		title: "Derivater",
		description: "Finansielle instrumenter, hvis værdi er afledt af et underliggende aktiv",
		publishedAt: "2026-06-24T11:47:00",
		updatedAt: "2026-06-26T13:00:00",
	},
	{
		id: "detailfond",
		title: "Detailfond",
		description: "En investeringsfond, der er rettet mod private investorer",
		publishedAt: "2026-04-29T08:51:00",
		updatedAt: "2026-05-11T11:52:00",
	},
	{
		id: "direkte-laan",
		title: "Direkte lån",
		description: "Lån direkte mellem långiver og låntager uden en bank som mellemmand",
		publishedAt: "2026-03-16T13:28:00",
		updatedAt: "2026-03-19T06:48:00",
	},
	{
		id: "diskonteringsrente",
		title: "Diskonteringsrente",
		description: "Den rente, der bruges til at beregne nutidsværdien af fremtidige pengestrømme",
		publishedAt: "2026-07-01T12:17:00",
		updatedAt: "2026-07-06T12:19:00",
	},
	{
		id: "distributed-to-paid-in",
		title: "Distributed to Paid In (DPI)",
		description:
			"Nøgletal der måler, hvor meget kapital en private equity-fond har tilbagebetalt i forhold til den indbetalte kapital",
		publishedAt: "2026-06-25T08:13:00",
		updatedAt: "2026-06-29T06:36:00",
	},
	{
		id: "diversificering",
		title: "Diversificering",
		description: "Risikospredning gennem investering i forskellige aktiver, markeder og sektorer",
		publishedAt: "2026-07-08T09:49:00",
		updatedAt: "2026-07-13T13:31:00",
	},
	{
		id: "dividende",
		title: "Dividende",
		description: "Udbetaling af overskud fra et selskab til dets aktionærer",
		publishedAt: "2026-04-08T09:11:00",
		updatedAt: "2026-04-15T10:52:00",
	},
	{
		id: "dollar-cost-averaging",
		title: "Dollar Cost Averaging (DCA)",
		description:
			"En investeringsstrategi hvor du investerer et fast beløb med faste intervaller — uanset markedets kurs",
		publishedAt: "2026-05-11T07:01:00",
		updatedAt: "2026-05-21T12:53:00",
	},
	{
		id: "dow-jones-indekset",
		title: "Dow Jones-indekset",
		description:
			"Et af verdens ældste og mest kendte aktieindekser — bestående af 30 store amerikanske selskaber",
		publishedAt: "2026-06-05T09:25:00",
		updatedAt: "2026-06-15T07:10:00",
	},
	{
		id: "driftsomkostninger",
		title: "Driftsomkostninger",
		description: "De løbende omkostninger ved at drive en investeringsfond",
		publishedAt: "2026-03-17T07:18:00",
		updatedAt: "2026-03-20T12:28:00",
	},
	{
		id: "driftsperiode",
		title: "Driftsperiode",
		description: "Den tidsperiode en virksomhed eller fond aflægger regnskab for",
		publishedAt: "2026-05-22T06:58:00",
		updatedAt: "2026-05-26T08:56:00",
	},
	{
		id: "driftsresultat",
		title: "Driftsresultat",
		description: "Resultatet af virksomhedens primære drift — også kaldet EBIT",
		publishedAt: "2026-05-29T11:03:00",
		updatedAt: "2026-06-09T09:47:00",
	},
	{
		id: "due-diligence",
		title: "Due diligence",
		description: "Grundig undersøgelse før en investering",
		publishedAt: "2026-05-08T12:36:00",
		updatedAt: "2026-05-21T09:21:00",
	},

	// E
	{
		id: "ebit-margin",
		title: "EBIT-margin",
		description:
			"En nøgletal der viser, hvor stor en andel af omsætningen der bliver til driftsresultat",
		publishedAt: "2026-07-02T08:58:00",
		updatedAt: "2026-07-15T13:09:00",
	},
	{
		id: "ecb",
		title: "ECB",
		description:
			"Den Europæiske Centralbank, som styrer pengepolitikken i eurozonen og dermed påvirker danske investorer",
		publishedAt: "2026-03-27T09:27:00",
		updatedAt: "2026-04-03T07:03:00",
	},
	{
		id: "effektiv-rente",
		title: "Effektiv rente",
		description:
			"Den reelle rente du betaler eller modtager, når alle omkostninger og gebyrer er medregnet",
		publishedAt: "2026-03-27T12:13:00",
		updatedAt: "2026-04-07T06:14:00",
	},
	{
		id: "egenkapital",
		title: "Egenkapital",
		description:
			"Den del af en virksomheds værdi, der tilhører aktionærerne efter alle forpligtelser er trukket fra",
		publishedAt: "2026-07-08T13:17:00",
		updatedAt: "2026-07-17T10:19:00",
	},
	{
		id: "egenkapitalafkast",
		title: "Egenkapitalafkast",
		description:
			"Et nøgletal der måler, hvor godt en virksomhed forrenter aktionærernes investerede kapital",
		publishedAt: "2026-03-17T11:32:00",
		updatedAt: "2026-03-23T08:26:00",
	},
	{
		id: "egenkapitalforrentning",
		title: "Egenkapitalforrentning",
		description:
			"Et mål for, hvor effektivt en virksomhed skaber værdi for sine aktionærer ud fra den investerede kapital",
		publishedAt: "2026-04-08T11:28:00",
		updatedAt: "2026-04-13T13:45:00",
	},
	{
		id: "eftermarked",
		title: "Eftermarked",
		description:
			"Det marked hvor værdipapirer handles mellem investorer efter den første udstedelse",
		publishedAt: "2026-03-27T11:02:00",
		updatedAt: "2026-04-07T11:06:00",
	},
	{
		id: "eksklusionsliste",
		title: "Eksklusionsliste",
		description:
			"En liste over virksomheder eller sektorer, som en fond eller pensionskasse vælger ikke at investere i",
		publishedAt: "2026-05-11T07:55:00",
		updatedAt: "2026-05-22T09:46:00",
	},
	{
		id: "emerging-markets",
		title: "Emerging markets",
		description:
			"Vækstmarkeder i udviklingslande, der tilbyder højere vækstpotentiale — men også højere risiko",
		publishedAt: "2026-04-20T07:13:00",
		updatedAt: "2026-04-23T13:01:00",
	},
	{
		id: "emission",
		title: "Emission",
		description:
			"Udstedelse af nye værdipapirer, som når en virksomhed sælger aktier eller obligationer for første gang eller ved en kapitalforhøjelse",
		publishedAt: "2026-07-08T10:37:00",
		updatedAt: "2026-07-17T08:51:00",
	},
	{
		id: "emissionstillaeg-og-indloesningsfradrag",
		title: "Emissionstillæg og indløsningsfradrag",
		description:
			"De gebyrer du betaler, når du køber eller sælger andele i en dansk investeringsforening",
		publishedAt: "2026-06-17T06:59:00",
		updatedAt: "2026-06-22T10:55:00",
	},
	{
		id: "engrosfond",
		title: "Engrosfond",
		description:
			"En investeringsfond forbeholdt professionelle investorer med højere minimumsinvesteringer og lavere omkostninger",
		publishedAt: "2026-04-08T13:31:00",
		updatedAt: "2026-04-17T13:20:00",
	},
	{
		id: "enterprise-value",
		title: "Enterprise value",
		description:
			"Et nøgletal der viser en virksomheds samlede værdi inklusiv gæld og fratrukket kontanter",
		publishedAt: "2026-06-25T12:20:00",
		updatedAt: "2026-07-09T06:14:00",
	},
	{
		id: "eps",
		title: "Earnings per Share (EPS)",
		description: "Et nøgletal der viser en virksomheds overskud pr. aktie",
		publishedAt: "2026-03-17T10:23:00",
		updatedAt: "2026-03-30T12:34:00",
	},
	{
		id: "esg",
		title: "ESG",
		description:
			"En investeringstilgang der vurderer virksomheder ud fra miljø, sociale forhold og god selskabsledelse",
		publishedAt: "2026-06-25T10:12:00",
		updatedAt: "2026-06-29T08:27:00",
	},
	{
		id: "esg-kriterierne",
		title: "ESG-kriterierne",
		description:
			"De specifikke kriterier der bruges til at vurdere virksomheders miljømæssige, sociale og ledelsesmæssige ansvarlighed",
		publishedAt: "2026-06-08T07:16:00",
		updatedAt: "2026-06-12T08:30:00",
	},
	{
		id: "etf",
		title: "ETF",
		description: "En børshandlet fond der følger et indeks og handles som en aktie på børsen",
		publishedAt: "2026-06-26T06:54:00",
		updatedAt: "2026-06-30T09:29:00",
	},
	{
		id: "etp",
		title: "ETP",
		description: "En samlebetegnelse for børshandlede produkter som ETF'er, ETN'er og ETC'er",
		publishedAt: "2026-04-08T12:25:00",
		updatedAt: "2026-04-16T12:07:00",
	},
	{
		id: "europaeiske-aktier",
		title: "Europæiske aktier",
		description:
			"Aktier i virksomheder noteret på de europæiske børser — en vigtig aktivklasse for danske investorer",
		publishedAt: "2026-07-08T11:54:00",
		updatedAt: "2026-07-13T09:05:00",
	},
	{
		id: "exit",
		title: "Exit",
		description:
			"At sælge eller afhænde en investering for at realisere gevinst eller begrænse tab",
		publishedAt: "2026-05-22T09:45:00",
		updatedAt: "2026-06-05T10:31:00",
	},
	{
		id: "expected-shortfall",
		title: "Expected Shortfall",
		description:
			"Et risikomål der estimerer det forventede tab i de værste scenarier ud over Value at Risk",
		publishedAt: "2026-05-11T09:24:00",
		updatedAt: "2026-05-22T13:20:00",
	},

	// F
	{
		id: "faif",
		title: "FAIF",
		description: "Forvaltere af alternative investeringsfonde",
		publishedAt: "2026-08-04T11:37:00",
		updatedAt: "2026-08-13T11:58:00",
	},
	{
		id: "fang-plus",
		title: "FANG+",
		description: "De store tech-aktier samlet i ét indeks",
		publishedAt: "2026-05-11T11:17:00",
		updatedAt: "2026-05-25T06:10:00",
	},
	{
		id: "fastforrentet-obligation",
		title: "Fastforrentet obligation",
		description: "Obligation med fast rente i hele løbetiden",
		publishedAt: "2026-06-17T09:04:00",
		updatedAt: "2026-06-23T12:22:00",
	},
	{
		id: "fed",
		title: "FED",
		description: "Den amerikanske centralbank",
		publishedAt: "2026-03-17T13:10:00",
		updatedAt: "2026-03-24T12:38:00",
	},
	{
		id: "fill-and-kill",
		title: "Fill and Kill",
		description: "Udfyld hvad du kan, annullér resten",
		publishedAt: "2026-08-21T11:19:00",
		updatedAt: "2026-08-31T10:34:00",
	},
	{
		id: "fill-or-kill",
		title: "Fill or Kill",
		description: "Alt eller intet",
		publishedAt: "2026-04-09T12:35:00",
		updatedAt: "2026-04-20T08:51:00",
	},
	{
		id: "fire",
		title: "FIRE",
		description: "Økonomisk uafhængighed og tidlig pension",
		publishedAt: "2026-07-29T12:51:00",
		updatedAt: "2026-08-10T11:53:00",
	},
	{
		id: "first-north",
		title: "First North",
		description: "Vækstmarkedet for mindre selskaber",
		publishedAt: "2026-05-29T13:11:00",
		updatedAt: "2026-06-02T10:04:00",
	},
	{
		id: "flamengo-fire",
		title: "Flamengo-FIRE",
		description: "FIRE med fokus på livsnydelse",
		publishedAt: "2026-03-04T12:20:00",
		updatedAt: "2026-03-17T13:32:00",
	},
	{
		id: "flash-trading",
		title: "Flash-trading",
		description: "Lynhurtig handel i millisekunder",
		publishedAt: "2026-07-23T13:03:00",
		updatedAt: "2026-07-30T13:21:00",
	},
	{
		id: "fn-17-verdensmaal",
		title: "FN's 17 verdensmål",
		description: "Bæredygtig investering med globalt perspektiv",
		publishedAt: "2026-08-18T12:13:00",
		updatedAt: "2026-09-01T13:11:00",
	},
	{
		id: "fodboldaktier",
		title: "Fodboldaktier",
		description: "Når du investerer i din yndlingsklub",
		publishedAt: "2026-06-01T07:05:00",
		updatedAt: "2026-06-15T11:15:00",
	},
	{
		id: "fomo",
		title: "FOMO",
		description: "Frygten for at gå glip af noget",
		publishedAt: "2026-04-09T10:04:00",
		updatedAt: "2026-04-17T06:34:00",
	},
	{
		id: "fond",
		title: "Fond",
		description: "Investér bredt uden at vælge enkeltaktier",
		publishedAt: "2026-07-09T06:56:00",
		updatedAt: "2026-07-13T06:53:00",
	},
	{
		id: "fondsboers",
		title: "Fondsbørs",
		description: "Markedspladsen for værdipapirer",
		publishedAt: "2026-08-04T08:57:00",
		updatedAt: "2026-08-06T13:07:00",
	},
	{
		id: "forbrugerprisindekset",
		title: "Forbrugerprisindekset",
		description: "Sådan måles inflation",
		publishedAt: "2026-06-17T09:58:00",
		updatedAt: "2026-06-22T13:14:00",
	},
	{
		id: "formidlingsprovision",
		title: "Formidlingsprovision",
		description: "Skjulte omkostninger ved investeringsfonde",
		publishedAt: "2026-06-08T09:52:00",
		updatedAt: "2026-06-15T08:46:00",
	},
	{
		id: "forrentede-penge",
		title: "Forrentede penge",
		description: "Når dine penge arbejder for dig",
		publishedAt: "2026-04-20T11:44:00",
		updatedAt: "2026-05-01T10:46:00",
	},
	{
		id: "forskudsopgoerelse",
		title: "Forskudsopgørelse",
		description: "Din forventede skat for næste år",
		publishedAt: "2026-04-09T08:08:00",
		updatedAt: "2026-04-20T07:10:00",
	},
	{
		id: "fortegningsret",
		title: "Fortegningsret",
		description: "Din ret til at deltage i en aktieudvidelse",
		publishedAt: "2026-06-08T10:57:00",
		updatedAt: "2026-06-15T09:00:00",
	},
	{
		id: "forward",
		title: "Forward",
		description: "En aftale om fremtidig handel",
		publishedAt: "2026-05-11T12:23:00",
		updatedAt: "2026-05-15T13:47:00",
	},
	{
		id: "forventninger",
		title: "Forventninger",
		description: "Det markedet allerede har prissat ind",
		publishedAt: "2026-03-27T13:20:00",
		updatedAt: "2026-04-06T12:06:00",
	},
	{
		id: "fri-pengestroem",
		title: "Fri pengestrøm",
		description: "De penge, virksomheden reelt har til rådighed",
		publishedAt: "2026-07-02T09:50:00",
		updatedAt: "2026-07-16T09:37:00",
	},
	{
		id: "frie-midler",
		title: "Frie midler",
		description: "Opsparede penge der ikke er bundet i pensions- eller rateopsparing",
		publishedAt: "2026-04-29T13:15:00",
		updatedAt: "2026-05-08T10:43:00",
	},
	{
		id: "frit-cash-flow",
		title: "Frit cash flow",
		description: "Den engelske betegnelse for den frie pengestrøm en virksomhed genererer",
		publishedAt: "2026-08-11T08:04:00",
		updatedAt: "2026-08-25T06:42:00",
	},
	{
		id: "frygtens-indeks",
		title: "Frygtens indeks",
		description:
			"Et populært mål for markedets nervøsitet baseret på forventet volatilitet i aktiemarkedet",
		publishedAt: "2026-08-03T13:19:00",
		updatedAt: "2026-08-07T12:56:00",
	},
	{
		id: "fuldmagt",
		title: "Fuldmagt",
		description:
			"En juridisk bemyndigelse til at handle eller stemme på en anden persons vegne i investeringssammenhæng",
		publishedAt: "2026-08-18T10:05:00",
		updatedAt: "2026-08-24T10:39:00",
	},
	{
		id: "fundamental-analyse",
		title: "Fundamental analyse",
		description:
			"En metode til at vurdere en virksomheds reelle værdi baseret på regnskaber, nøgletal og fremtidsudsigter",
		publishedAt: "2026-08-11T10:22:00",
		updatedAt: "2026-08-14T08:30:00",
	},
	{
		id: "futures",
		title: "Futures",
		description:
			"Standardiserede kontrakter om køb eller salg af et aktiv til en fastsat pris på en fremtidig dato",
		publishedAt: "2026-08-07T08:10:00",
		updatedAt: "2026-08-18T07:33:00",
	},
	{
		id: "foermarkedet",
		title: "Førmarkedet",
		description: "Handel med værdipapirer der foregår før børsens officielle åbningstid",
		publishedAt: "2026-06-26T07:45:00",
		updatedAt: "2026-06-30T10:11:00",
	},

	// G
	{
		id: "gak",
		title: "GAK",
		description:
			"Den gennemsnitlige anskaffelseskurs, der bruges til at beregne din skat ved salg af værdipapirer",
		publishedAt: "2026-05-22T13:39:00",
		updatedAt: "2026-06-01T09:29:00",
	},
	{
		id: "gap",
		title: "Gap",
		description:
			"Et prisgab i et værdipapirs kurs, hvor handlen springer over et kursinterval uden nogen handler imellem",
		publishedAt: "2026-04-30T08:17:00",
		updatedAt: "2026-05-14T09:41:00",
	},
	{
		id: "gearing",
		title: "Gearing",
		description: "At investere med lånte penge for at forstørre både potentielle gevinster og tab",
		publishedAt: "2026-04-21T07:03:00",
		updatedAt: "2026-04-30T10:50:00",
	},
	{
		id: "general-partner",
		title: "General Partner",
		description:
			"Den ansvarlige forvalter i en kapitalfond, der træffer investeringsbeslutningerne og hæfter personligt",
		publishedAt: "2026-04-20T13:08:00",
		updatedAt: "2026-05-04T13:32:00",
	},
	{
		id: "gevinst",
		title: "Gevinst",
		description:
			"Fortjenesten du opnår, når du sælger en investering til en højere pris, end du købte den for",
		publishedAt: "2026-04-21T08:11:00",
		updatedAt: "2026-04-24T07:53:00",
	},
	{
		id: "global-aktie",
		title: "Global aktie",
		description:
			"Aktier fra virksomheder over hele verden, der giver bred geografisk spredning i din portefølje",
		publishedAt: "2026-03-18T09:22:00",
		updatedAt: "2026-03-30T10:14:00",
	},
	{
		id: "global-compact",
		title: "Global Compact",
		description:
			"FN's initiativ med ti principper for virksomheders ansvar inden for menneskerettigheder, arbejdstagerrettigheder, miljø og antikorruption",
		publishedAt: "2026-04-10T07:28:00",
		updatedAt: "2026-04-22T08:17:00",
	},
	{
		id: "greedflation",
		title: "Greedflation",
		description:
			"Inflation drevet af virksomheders udnyttelse af prisforventninger til at øge deres profitmarginer",
		publishedAt: "2026-03-18T12:58:00",
		updatedAt: "2026-03-30T13:33:00",
	},
	{
		id: "green-house-gas-protocol",
		title: "Green House Gas (GHG) Protocol",
		description:
			"Den internationale standard for måling og rapportering af virksomheders drivhusgasudledninger",
		publishedAt: "2026-05-12T09:28:00",
		updatedAt: "2026-05-25T09:04:00",
	},
	{
		id: "groen-obligation",
		title: "Grøn obligation",
		description: "En obligation hvor provenuet er øremærket til miljø- og klimavenlige projekter",
		publishedAt: "2026-03-30T09:19:00",
		updatedAt: "2026-04-06T06:01:00",
	},
	{
		id: "grundskyld",
		title: "Grundskyld",
		description:
			"Den kommunale skat på jordværdien af din ejendom, som betales uanset om grunden er bebygget eller ej",
		publishedAt: "2026-03-30T07:55:00",
		updatedAt: "2026-04-06T06:32:00",
	},
	{
		id: "gaeldsgrad",
		title: "Gældsgrad",
		description:
			"Forholdet mellem en virksomheds gæld og egenkapital, der viser graden af finansiel gearing",
		publishedAt: "2026-05-12T07:33:00",
		updatedAt: "2026-05-20T10:45:00",
	},
	{
		id: "greenwashing",
		title: "Greenwashing",
		description:
			"Når virksomheder eller fonde markedsfører sig som mere bæredygtige, end de reelt er",
		publishedAt: "2026-03-18T11:19:00",
		updatedAt: "2026-03-27T07:07:00",
	},

	// H
	{
		id: "handelsplatforme",
		title: "Handelsplatforme",
		description:
			"Digitale platforme hvor investorer kan købe og sælge værdipapirer som aktier, obligationer og ETF'er.",
		publishedAt: "2026-05-25T07:03:00",
		updatedAt: "2026-06-04T06:40:00",
	},
	{
		id: "handelsvolumen",
		title: "Handelsvolumen",
		description:
			"Antallet af værdipapirer der handles i en given periode, og en vigtig indikator for markedets likviditet.",
		publishedAt: "2026-03-05T07:12:00",
		updatedAt: "2026-03-17T11:35:00",
	},
	{
		id: "hedgefond",
		title: "Hedgefond",
		description:
			"Alternative investeringsfonde der bruger avancerede strategier til at skabe afkast uanset markedsretningen.",
		publishedAt: "2026-04-21T10:41:00",
		updatedAt: "2026-04-27T13:23:00",
	},
	{
		id: "high-yield-obligation",
		title: "High Yield obligation",
		description:
			"Virksomhedsobligationer med højere rente og kreditrisiko end investment grade obligationer.",
		publishedAt: "2026-03-19T08:41:00",
		updatedAt: "2026-04-02T06:17:00",
	},
	{
		id: "hoejrenteobligation",
		title: "Højrenteobligation",
		description:
			"Obligationer med højere rente end traditionelle stats- og realkreditobligationer, ofte udstedt i emerging markets.",
		publishedAt: "2026-04-30T09:38:00",
		updatedAt: "2026-05-11T13:57:00",
	},
	{
		id: "hoejrisiko-aktie",
		title: "Højrisiko aktie",
		description:
			"Aktier med høj volatilitet og usikkerhed, der kan give store gevinster men også betydelige tab.",
		publishedAt: "2026-03-19T07:33:00",
		updatedAt: "2026-03-23T08:53:00",
	},
	{
		id: "hybrid-obligation",
		title: "Hybrid-obligation",
		description:
			"En obligation der kombinerer egenskaber fra både gæld og egenkapital, ofte med lang løbetid og efterstillet prioritet.",
		publishedAt: "2026-04-10T11:31:00",
		updatedAt: "2026-04-24T07:36:00",
	},

	// I
	{
		id: "icahn-carl",
		title: "Icahn, Carl",
		description:
			"Legendarisk amerikansk aktivistinvestor kendt for aggressive opkøb og ledelsesændringer",
		publishedAt: "2026-07-30T08:12:00",
		updatedAt: "2026-08-11T11:52:00",
	},
	{
		id: "illikvidt-papir",
		title: "Illikvidt papir",
		description: "Et værdipapir med lav handelsaktivitet, der kan være svært at købe eller sælge",
		publishedAt: "2026-06-01T10:45:00",
		updatedAt: "2026-06-03T13:43:00",
	},
	{
		id: "impact-investering",
		title: "Impact-investering",
		description:
			"Investering med fokus på at skabe målbar positiv social eller miljømæssig effekt ved siden af økonomisk afkast",
		publishedAt: "2026-04-21T13:06:00",
		updatedAt: "2026-04-27T06:11:00",
	},
	{
		id: "indeks",
		title: "Indeks",
		description:
			"Et mål for udviklingen i en gruppe af værdipapirer, der bruges som benchmark for markedet",
		publishedAt: "2026-04-10T12:54:00",
		updatedAt: "2026-04-22T12:33:00",
	},
	{
		id: "indeksfond-etf",
		title: "Indeksfond / ETF",
		description:
			"Passivt forvaltede fonde der følger et markedsindeks og tilbyder bred spredning til lave omkostninger",
		publishedAt: "2026-03-30T12:41:00",
		updatedAt: "2026-04-01T12:52:00",
	},
	{
		id: "indenlandske-aktier",
		title: "Indenlandske aktier",
		description: "Aktier i selskaber noteret på den danske børs, Nasdaq Copenhagen",
		publishedAt: "2026-08-24T07:49:00",
		updatedAt: "2026-08-31T10:42:00",
	},
	{
		id: "indirekte-handelsomkostning",
		title: "Indirekte handelsomkostning",
		description:
			"Skjulte omkostninger ved handel med værdipapirer, herunder spread og markedspåvirkning",
		publishedAt: "2026-04-30T11:00:00",
		updatedAt: "2026-05-11T13:00:00",
	},
	{
		id: "indirekte-omkostning",
		title: "Indirekte omkostning",
		description:
			"Omkostninger i investeringsfonde der ikke opkræves direkte, men som reducerer fondens afkast",
		publishedAt: "2026-03-19T10:19:00",
		updatedAt: "2026-04-02T13:38:00",
	},
	{
		id: "indloesningsfradrag",
		title: "Indløsningsfradrag",
		description:
			"Et gebyr der fratrækkes, når du sælger (indløser) andele i en investeringsforening",
		publishedAt: "2026-03-19T13:09:00",
		updatedAt: "2026-03-23T08:34:00",
	},
	{
		id: "indre-vaerdi",
		title: "Indre værdi",
		description:
			"Den beregnede værdi af et selskabs aktiver minus gæld, også kaldet bogført værdi eller NAV",
		publishedAt: "2026-05-13T09:01:00",
		updatedAt: "2026-05-26T09:09:00",
	},
	{
		id: "indtjening-pr-aktie",
		title: "Indtjening pr. aktie",
		description:
			"Selskabets overskud fordelt på hver udestående aktie — et centralt nøgletal for aktieanalyse",
		publishedAt: "2026-06-26T08:41:00",
		updatedAt: "2026-07-06T12:17:00",
	},
	{
		id: "inflation",
		title: "Inflation",
		description:
			"Den generelle stigning i prisniveauet, der udhuler dine penges købekraft over tid",
		publishedAt: "2026-06-08T12:08:00",
		updatedAt: "2026-06-12T06:12:00",
	},
	{
		id: "insiderhandel",
		title: "Insiderhandel",
		description: "Ulovlig handel med værdipapirer baseret på fortrolig, kursfølsom information",
		publishedAt: "2026-06-17T10:29:00",
		updatedAt: "2026-06-19T12:54:00",
	},
	{
		id: "internal-rate-of-return",
		title: "Internal Rate of Return (IRR)",
		description:
			"Den interne rente — et mål for en investerings faktiske afkast, der tager højde for tidspunktet for alle pengestrømme",
		publishedAt: "2026-05-25T10:48:00",
		updatedAt: "2026-06-01T09:38:00",
	},
	{
		id: "investeringsdepot",
		title: "Investeringsdepot",
		description:
			"En konto hvor dine værdipapirer opbevares digitalt, så du kan købe og sælge aktier, obligationer og fonde",
		publishedAt: "2026-08-07T09:09:00",
		updatedAt: "2026-08-17T10:07:00",
	},
	{
		id: "investeringsfond",
		title: "Investeringsfond",
		description:
			"En fælles pulje af penge fra mange investorer, der investeres professionelt i værdipapirer",
		publishedAt: "2026-06-09T08:58:00",
		updatedAt: "2026-06-15T07:17:00",
	},
	{
		id: "investeringsforening",
		title: "Investeringsforening",
		description:
			"En særlig dansk fondsstruktur, hvor medlemmerne ejer foreningen i fællesskab og investerer kollektivt",
		publishedAt: "2026-08-19T07:34:00",
		updatedAt: "2026-08-31T06:03:00",
	},
	{
		id: "investeringskredit",
		title: "Investeringskredit",
		description:
			"Lån optaget med det formål at investere i værdipapirer, også kendt som gearing eller marginlån",
		publishedAt: "2026-04-30T12:18:00",
		updatedAt: "2026-05-12T06:37:00",
	},
	{
		id: "investeringsplan",
		title: "Investeringsplan",
		description: "En struktureret plan for hvordan du investerer dine penge systematisk over tid",
		publishedAt: "2026-03-05T10:10:00",
		updatedAt: "2026-03-09T13:04:00",
	},
	{
		id: "investeringsproces",
		title: "Investeringsproces",
		description:
			"Den systematiske fremgangsmåde en investor eller fond bruger til at træffe investeringsbeslutninger",
		publishedAt: "2026-03-19T11:40:00",
		updatedAt: "2026-03-25T06:20:00",
	},
	{
		id: "investeringsprofil",
		title: "Investeringsprofil",
		description:
			"En vurdering af din risikotolerance, tidshorisont og økonomiske situation, der danner grundlag for din investeringsstrategi",
		publishedAt: "2026-08-05T06:53:00",
		updatedAt: "2026-08-17T07:48:00",
	},
	{
		id: "investeringsrobot",
		title: "Investeringsrobot",
		description:
			"En digital platform der automatisk sammensætter og rebalancerer din portefølje baseret på din risikoprofil",
		publishedAt: "2026-07-09T08:15:00",
		updatedAt: "2026-07-23T13:43:00",
	},
	{
		id: "investeringsselskab",
		title: "Investeringsselskab",
		description: "Et selskab, hvis primære formål er at investere i andre aktiver",
		publishedAt: "2026-08-21T12:30:00",
		updatedAt: "2026-08-28T10:32:00",
	},
	{
		id: "investment-grade-obligation",
		title: "Investment Grade obligation",
		description: "En obligation udstedt af en låntager med høj kreditværdighed",
		publishedAt: "2026-07-02T10:56:00",
		updatedAt: "2026-07-10T12:34:00",
	},
	{
		id: "investor-aktionaer",
		title: "Investor / Aktionær",
		description: "Den person eller enhed, der ejer aktier eller andre værdipapirer",
		publishedAt: "2026-07-24T10:18:00",
		updatedAt: "2026-07-27T10:02:00",
	},
	{
		id: "ipo",
		title: "IPO",
		description: "Når et selskab for første gang sælger aktier til offentligheden",
		publishedAt: "2026-05-25T09:51:00",
		updatedAt: "2026-05-29T09:17:00",
	},
	{
		id: "isin-kode",
		title: "ISIN-kode",
		description: "Et unikt identifikationsnummer for hvert værdipapir i verden",
		publishedAt: "2026-08-13T12:14:00",
		updatedAt: "2026-08-24T06:01:00",
	},

	// J
	{
		id: "junk-bond",
		title: "Junk Bond",
		description:
			"Obligationer med spekulativ kreditvurdering der tilbyder høj rente som kompensation for betydelig risiko for misligholdelse.",
		publishedAt: "2026-03-05T11:39:00",
		updatedAt: "2026-03-16T13:42:00",
	},

	// K
	{
		id: "kapital",
		title: "Kapital",
		description: "Grundstenen i enhver investering",
		publishedAt: "2026-07-24T12:20:00",
		updatedAt: "2026-07-31T11:33:00",
	},
	{
		id: "kapitalfond",
		title: "Kapitalfond",
		description: "Når professionelle investorer køber virksomheder",
		publishedAt: "2026-08-07T12:18:00",
		updatedAt: "2026-08-17T10:11:00",
	},
	{
		id: "kapitalindkomst",
		title: "Kapitalindkomst",
		description: "Skat på renter, kursgevinster og udlejning",
		publishedAt: "2026-05-25T13:03:00",
		updatedAt: "2026-05-29T12:09:00",
	},
	{
		id: "kapitalmarkedsdag",
		title: "Kapitalmarkedsdag",
		description: "Virksomheden åbner dørene for investorer",
		publishedAt: "2026-05-25T12:04:00",
		updatedAt: "2026-06-04T10:51:00",
	},
	{
		id: "kapitaludvidelse",
		title: "Kapitaludvidelse",
		description: "Når virksomheder udsteder nye aktier",
		publishedAt: "2026-06-01T13:23:00",
		updatedAt: "2026-06-15T09:34:00",
	},
	{
		id: "kirkeskat",
		title: "Kirkeskat",
		description: "Den skjulte skat på dit investeringsafkast",
		publishedAt: "2026-04-13T08:22:00",
		updatedAt: "2026-04-20T12:59:00",
	},
	{
		id: "klatpensioner",
		title: "Klatpensioner",
		description: "Små pensionsopsparinger der æder dit afkast",
		publishedAt: "2026-07-16T09:35:00",
		updatedAt: "2026-07-27T06:32:00",
	},
	{
		id: "klinisk-studie",
		title: "Klinisk studie",
		description: "Nøglen til biotech-investering",
		publishedAt: "2026-06-17T11:41:00",
		updatedAt: "2026-06-23T07:51:00",
	},
	{
		id: "kongetallet",
		title: "Kongetallet",
		description: "Den danske nøgle til aktievurdering",
		publishedAt: "2026-07-02T11:43:00",
		updatedAt: "2026-07-07T13:57:00",
	},
	{
		id: "konsensus",
		title: "Konsensus",
		description: "Analytikernes samlede forventninger",
		publishedAt: "2026-06-02T07:45:00",
		updatedAt: "2026-06-15T09:13:00",
	},
	{
		id: "konto",
		title: "Konto",
		description: "Din indgang til investeringsverdenen",
		publishedAt: "2026-07-16T08:20:00",
		updatedAt: "2026-07-30T07:32:00",
	},
	{
		id: "kontogebyr",
		title: "Kontogebyr",
		description: "De skjulte omkostninger ved investering",
		publishedAt: "2026-03-31T08:51:00",
		updatedAt: "2026-04-08T06:31:00",
	},
	{
		id: "kontoudtog",
		title: "Kontoudtog",
		description: "Overblik over dine investeringstransaktioner",
		publishedAt: "2026-06-17T13:47:00",
		updatedAt: "2026-06-29T06:38:00",
	},
	{
		id: "konventionelle-investeringer",
		title: "Konventionelle investeringer",
		description: "De klassiske aktivklasser",
		publishedAt: "2026-07-09T08:56:00",
		updatedAt: "2026-07-17T11:51:00",
	},
	{
		id: "konverterbar-obligation",
		title: "Konverterbar obligation",
		description: "Kan indfries før tid",
		publishedAt: "2026-03-06T08:21:00",
		updatedAt: "2026-03-09T06:25:00",
	},
	{
		id: "konvertibel-obligation",
		title: "Konvertibel obligation",
		description: "Halvt obligation, halvt aktie",
		publishedAt: "2026-06-17T12:29:00",
		updatedAt: "2026-06-22T11:31:00",
	},
	{
		id: "korrektion",
		title: "Korrektion",
		description: "Når markedet tager en puster",
		publishedAt: "2026-03-31T07:46:00",
		updatedAt: "2026-04-10T11:42:00",
	},
	{
		id: "korrelation",
		title: "Korrelation",
		description: "Målet for sammenhæng i din portefølje",
		publishedAt: "2026-08-07T11:09:00",
		updatedAt: "2026-08-20T06:03:00",
	},
	{
		id: "kort-position",
		title: "Kort position",
		description: "At tjene på faldende kurser",
		publishedAt: "2026-03-05T12:51:00",
		updatedAt: "2026-03-09T07:33:00",
	},
	{
		id: "kortfristet-gaeld",
		title: "Kortfristet gæld",
		description: "Forpligtelser der forfalder inden for et år",
		publishedAt: "2026-03-31T09:40:00",
		updatedAt: "2026-04-14T11:37:00",
	},
	{
		id: "kurs",
		title: "Kurs",
		description: "Prisen på dit værdipapir",
		publishedAt: "2026-04-30T13:22:00",
		updatedAt: "2026-05-13T13:50:00",
	},
	{
		id: "kurs-indre-vaerdi",
		title: "Kurs/indre værdi",
		description:
			"Et nøgletal der sammenligner aktiekursen med selskabets bogførte egenkapital pr. aktie",
		publishedAt: "2026-07-30T10:02:00",
		updatedAt: "2026-08-03T09:09:00",
	},
	{
		id: "kursgevinst",
		title: "Kursgevinst",
		description: "Fortjeneste opnået når et værdipapir sælges til en højere pris end købsprisen",
		publishedAt: "2026-07-09T10:12:00",
		updatedAt: "2026-07-23T06:01:00",
	},
	{
		id: "kursmaal",
		title: "Kursmål",
		description:
			"En analysts estimat for en akties forventede kurs inden for en given tidshorisont",
		publishedAt: "2026-06-26T09:47:00",
		updatedAt: "2026-07-08T07:11:00",
	},
	{
		id: "kursraket",
		title: "Kursraket",
		description: "En aktie der oplever en ekstraordinært hurtig og kraftig kursstigning",
		publishedAt: "2026-08-14T07:54:00",
		updatedAt: "2026-08-26T06:09:00",
	},
	{
		id: "kursvaern",
		title: "Kursværn",
		description:
			"En mekanisme i investeringsforeninger der beskytter eksisterende investorer mod handelsomkostninger",
		publishedAt: "2026-05-01T08:45:00",
		updatedAt: "2026-05-08T13:43:00",
	},
	{
		id: "kurtage",
		title: "Kurtage",
		description:
			"Det handelsgebyr du betaler til din bank eller børsmægler ved køb og salg af værdipapirer",
		publishedAt: "2026-06-09T11:33:00",
		updatedAt: "2026-06-22T12:56:00",
	},
	{
		id: "kvalitetsaktier",
		title: "Kvalitetsaktier",
		description:
			"Aktier i veldrevne selskaber med stabil indtjening, stærk markedsposition og lav gæld",
		publishedAt: "2026-08-11T13:38:00",
		updatedAt: "2026-08-17T13:40:00",
	},
	{
		id: "koebenhavns-fondsboers",
		title: "Københavns fondsbørs",
		description:
			"Danmarks historiske børs og hjemsted for handel med danske aktier og obligationer",
		publishedAt: "2026-05-01T07:37:00",
		updatedAt: "2026-05-11T08:36:00",
	},

	// L
	{
		id: "lagerbeskatning",
		title: "Lagerbeskatning",
		description: "Beskatning af urealiserede kursgevinster og -tab hvert år",
		publishedAt: "2026-04-14T07:15:00",
		updatedAt: "2026-04-23T07:08:00",
	},
	{
		id: "lang-tidshorisont",
		title: "Lang tidshorisont",
		description: "At investere med mange år til målet — typisk 10 år eller mere",
		publishedAt: "2026-05-13T12:56:00",
		updatedAt: "2026-05-27T13:20:00",
	},
	{
		id: "langfristet-gaeld",
		title: "Langfristet gæld",
		description: "Gæld med en løbetid på over ét år, der fremgår af balancen",
		publishedAt: "2026-05-13T11:36:00",
		updatedAt: "2026-05-26T13:20:00",
	},
	{
		id: "large-cap-aktie",
		title: "Large Cap-aktie",
		description: "Store, veletablerede selskaber med høj markedsværdi",
		publishedAt: "2026-04-14T08:50:00",
		updatedAt: "2026-04-28T08:11:00",
	},
	{
		id: "lean-fire",
		title: "Lean FIRE",
		description: "Økonomisk uafhængighed med et lavt og sparsommeligt budget",
		publishedAt: "2026-05-01T10:01:00",
		updatedAt: "2026-05-04T10:07:00",
	},
	{
		id: "ledelse-og-bestyrelse",
		title: "Ledelse og bestyrelse",
		description: "Selskabets øverste organer, der styrer strategi og daglig drift",
		publishedAt: "2026-03-31T12:50:00",
		updatedAt: "2026-04-13T07:59:00",
	},
	{
		id: "leveraged-loan",
		title: "Leveraged Loan",
		description: "Lån til højt gearede virksomheder med kreditkvalitet under investment grade",
		publishedAt: "2026-06-18T07:35:00",
		updatedAt: "2026-06-22T07:14:00",
	},
	{
		id: "ligevaegt",
		title: "Ligevægt",
		description: "En indeksmetode, hvor alle aktier vægtes ens uanset størrelse",
		publishedAt: "2026-03-31T11:30:00",
		updatedAt: "2026-04-08T06:42:00",
	},
	{
		id: "likvidation",
		title: "Likvidation",
		description: "Processen, hvor et selskab afvikles og dets aktiver fordeles",
		publishedAt: "2026-04-22T09:08:00",
		updatedAt: "2026-05-04T06:24:00",
	},
	{
		id: "likviditet",
		title: "Likviditet",
		description: "Hvor nemt og hurtigt du kan købe eller sælge en investering",
		publishedAt: "2026-03-06T09:07:00",
		updatedAt: "2026-03-16T07:29:00",
	},
	{
		id: "likviditetsgrad",
		title: "Likviditetsgrad",
		description: "Nøgletal der viser, om et selskab kan betale sine kortfristede forpligtelser",
		publishedAt: "2026-06-18T09:12:00",
		updatedAt: "2026-06-22T08:50:00",
	},
	{
		id: "likvidt-papir",
		title: "Likvidt papir",
		description: "Et værdipapir med høj handelsvolumen, der let kan købes og sælges",
		publishedAt: "2026-05-01T11:44:00",
		updatedAt: "2026-05-15T07:07:00",
	},
	{
		id: "limited-partners",
		title: "Limited Partners",
		description: "Passive investorer i en kapitalfond med begrænset ansvar",
		publishedAt: "2026-04-22T10:10:00",
		updatedAt: "2026-05-01T06:49:00",
	},
	{
		id: "livrente",
		title: "Livrente",
		description: "En pensionsordning, der udbetaler et fast beløb resten af livet",
		publishedAt: "2026-06-10T07:14:00",
		updatedAt: "2026-06-15T11:12:00",
	},
	{
		id: "lukkeauktion",
		title: "Lukkeauktion",
		description: "Den afsluttende auktion på børsen, hvor dagens lukkekurs fastsættes",
		publishedAt: "2026-04-13T12:12:00",
		updatedAt: "2026-04-20T06:41:00",
	},
	{
		id: "lukkepris",
		title: "Lukkepris",
		description: "Den officielle slutkurs for et værdipapir ved handelsdagens afslutning",
		publishedAt: "2026-05-26T06:46:00",
		updatedAt: "2026-06-01T06:08:00",
	},
	{
		id: "lukket-kredsloeb",
		title: "Lukket kredsløb",
		description: "En investeringsfond med et fast antal andele, der handles på børsen",
		publishedAt: "2026-03-06T10:28:00",
		updatedAt: "2026-03-11T07:12:00",
	},
	{
		id: "lump-sum",
		title: "Lump sum",
		description: "At investere et stort beløb på én gang frem for at sprede det over tid",
		publishedAt: "2026-05-01T13:13:00",
		updatedAt: "2026-05-08T10:32:00",
	},
	{
		id: "loebende-konto",
		title: "Løbende konto",
		description: "En bankkonto til daglige transaktioner og likviditetsstyring",
		publishedAt: "2026-03-06T11:08:00",
		updatedAt: "2026-03-16T11:38:00",
	},

	// M
	{
		id: "makro-oekonomi",
		title: "Makro-økonomi",
		description:
			"Den overordnede økonomiske udvikling i samfundet og dens indflydelse på dine investeringer",
		publishedAt: "2026-04-01T07:33:00",
		updatedAt: "2026-04-08T07:52:00",
	},
	{
		id: "management-fee",
		title: "Management fee",
		description: "Det årlige gebyr du betaler for at få din fond forvaltet professionelt",
		publishedAt: "2026-07-09T12:11:00",
		updatedAt: "2026-07-20T07:48:00",
	},
	{
		id: "marginkonto",
		title: "Marginkonto",
		description: "En konto der lader dig handle for flere penge, end du selv har indskudt",
		publishedAt: "2026-05-04T10:14:00",
		updatedAt: "2026-05-11T07:21:00",
	},
	{
		id: "markedsvaerdi",
		title: "Markedsværdi (Market Cap)",
		description:
			"Den samlede børsværdi af et selskabs aktier — og et centralt mål for selskabets størrelse",
		publishedAt: "2026-04-14T10:12:00",
		updatedAt: "2026-04-16T09:59:00",
	},
	{
		id: "market-maker",
		title: "Market maker",
		description: "En aktør der sikrer, at du altid kan købe og sælge værdipapirer på børsen",
		publishedAt: "2026-06-18T11:16:00",
		updatedAt: "2026-06-29T06:00:00",
	},
	{
		id: "max-draw-down",
		title: "Max Draw-Down",
		description: "Det størst mulige tab fra top til bund i en investeringsperiode",
		publishedAt: "2026-03-31T13:46:00",
		updatedAt: "2026-04-13T08:08:00",
	},
	{
		id: "meme-aktie",
		title: "Meme-aktie",
		description: "Aktier der drives af viral hype på sociale medier frem for fundamental værdi",
		publishedAt: "2026-04-22T11:27:00",
		updatedAt: "2026-05-05T06:49:00",
	},
	{
		id: "mid-cap-aktie",
		title: "Mid Cap-aktie",
		description:
			"Mellemstore selskaber der kombinerer vækstpotentiale med en vis etableret stabilitet",
		publishedAt: "2026-05-14T10:07:00",
		updatedAt: "2026-05-26T09:03:00",
	},
	{
		id: "miniboers",
		title: "Minibørs",
		description: "En alternativ handelsplads for aktier i mindre og nystartede selskaber",
		publishedAt: "2026-07-10T07:27:00",
		updatedAt: "2026-07-20T07:44:00",
	},
	{
		id: "modpartsrisiko",
		title: "Modpartsrisiko",
		description:
			"Risikoen for at den anden part i en finansiel aftale ikke kan opfylde sine forpligtelser",
		publishedAt: "2026-05-26T08:38:00",
		updatedAt: "2026-06-01T07:23:00",
	},
	{
		id: "momentum-aktier",
		title: "Momentum aktier",
		description:
			"Aktier der fortsætter med at stige, fordi de allerede er steget — en velkendt investeringsstrategi",
		publishedAt: "2026-07-02T13:35:00",
		updatedAt: "2026-07-10T12:17:00",
	},
	{
		id: "msci",
		title: "MSCI",
		description:
			"Verdens mest brugte indeksudbyder og grundlaget for tusindvis af investeringsfonde",
		publishedAt: "2026-07-27T07:24:00",
		updatedAt: "2026-08-03T10:59:00",
	},
	{
		id: "multipler",
		title: "Multipler",
		description:
			"Nøgletal der bruges til at vurdere, om en aktie er billig eller dyr sammenlignet med andre",
		publishedAt: "2026-04-01T09:22:00",
		updatedAt: "2026-04-07T11:24:00",
	},
	{
		id: "myopic-loss-aversion",
		title: "Myopic Loss Aversion",
		description:
			"Kortsigtet tabsaversion der får investorer til at træffe dårlige langsigtede beslutninger",
		publishedAt: "2026-07-16T10:38:00",
		updatedAt: "2026-07-21T11:45:00",
	},
	{
		id: "maanedsopsparing",
		title: "Månedsopsparing",
		description: "En automatisk investeringsordning der gør det nemt at investere fast hver måned",
		publishedAt: "2026-06-26T10:32:00",
		updatedAt: "2026-07-03T09:07:00",
	},

	// N
	{
		id: "nasdaq",
		title: "Nasdaq",
		description: "En af verdens største børser med fokus på teknologi og vækstselskaber",
		publishedAt: "2026-04-14T11:40:00",
		updatedAt: "2026-04-20T11:46:00",
	},
	{
		id: "navnenotering",
		title: "Navnenotering",
		description: "Registrering af værdipapirer i ejerens navn hos udstederen",
		publishedAt: "2026-04-22T13:20:00",
		updatedAt: "2026-05-06T07:08:00",
	},
	{
		id: "nedjustering",
		title: "Nedjustering",
		description: "Når et selskab sænker sine forventninger til fremtidigt resultat",
		publishedAt: "2026-04-01T12:35:00",
		updatedAt: "2026-04-06T11:31:00",
	},
	{
		id: "nedsparing",
		title: "Nedsparing",
		description: "Den fase hvor du lever af din opsparing i stedet for at bygge den op",
		publishedAt: "2026-05-15T07:08:00",
		updatedAt: "2026-05-18T09:08:00",
	},
	{
		id: "negative-renter",
		title: "Negative renter",
		description: "Når du betaler for at have penge stående i banken",
		publishedAt: "2026-05-05T07:30:00",
		updatedAt: "2026-05-11T09:43:00",
	},
	{
		id: "net-asset-value",
		title: "Net Asset Value (NAV)",
		description: "Den samlede værdi af en fonds aktiver minus gæld, fordelt pr. andel",
		publishedAt: "2026-04-14T13:05:00",
		updatedAt: "2026-04-22T09:57:00",
	},
	{
		id: "nettoafkast",
		title: "Nettoafkast",
		description: "Det afkast du reelt sidder tilbage med efter alle omkostninger er trukket fra",
		publishedAt: "2026-05-05T08:37:00",
		updatedAt: "2026-05-11T10:22:00",
	},
	{
		id: "nikkei",
		title: "Nikkei",
		description: "Japans mest kendte aktieindeks med 225 af landets største selskaber",
		publishedAt: "2026-03-09T07:16:00",
		updatedAt: "2026-03-23T06:29:00",
	},
	{
		id: "nominel-rente",
		title: "Nominel rente",
		description: "Den rente du ser på papiret — uden korrektion for inflation",
		publishedAt: "2026-05-04T12:12:00",
		updatedAt: "2026-05-15T07:04:00",
	},
	{
		id: "noteret-aktie",
		title: "Noteret aktie",
		description: "En aktie der er optaget til handel på en reguleret børs",
		publishedAt: "2026-03-06T13:35:00",
		updatedAt: "2026-03-13T13:40:00",
	},
	{
		id: "noteret-papir",
		title: "Noteret papir",
		description: "Et værdipapir der handles på en officiel markedsplads",
		publishedAt: "2026-04-22T12:14:00",
		updatedAt: "2026-04-30T10:03:00",
	},
	{
		id: "noteringssted",
		title: "Noteringssted",
		description: "Den børs eller markedsplads, hvor et værdipapir handles",
		publishedAt: "2026-03-20T12:48:00",
		updatedAt: "2026-03-26T10:16:00",
	},
	{
		id: "noegletal",
		title: "Nøgletal",
		description: "Talmæssige indikatorer der afslører en virksomheds finansielle sundhed",
		publishedAt: "2026-04-01T10:52:00",
		updatedAt: "2026-04-03T07:21:00",
	},

	// O
	{
		id: "obligation",
		title: "Obligation",
		description: "Et lån du giver videre",
		publishedAt: "2026-06-19T09:18:00",
		updatedAt: "2026-06-24T07:25:00",
	},
	{
		id: "obligationer",
		title: "Obligationer",
		description: "Overblik over obligationsmarkedet",
		publishedAt: "2026-05-05T10:26:00",
		updatedAt: "2026-05-07T10:47:00",
	},
	{
		id: "omkostninger",
		title: "Omkostninger",
		description: "Prisen du betaler for at investere",
		publishedAt: "2026-04-02T07:55:00",
		updatedAt: "2026-04-16T12:07:00",
	},
	{
		id: "omsaetningen",
		title: "Omsætningen",
		description: "Virksomhedens samlede salg",
		publishedAt: "2026-06-02T12:56:00",
		updatedAt: "2026-06-05T11:12:00",
	},
	{
		id: "omsaetningsaktiver",
		title: "Omsætningsaktiver",
		description: "Virksomhedens kortsigtede ressourcer",
		publishedAt: "2026-05-05T11:37:00",
		updatedAt: "2026-05-14T09:07:00",
	},
	{
		id: "omsaettelighed",
		title: "Omsættelighed",
		description: "Hvor let kan du handle et værdipapir?",
		publishedAt: "2026-03-23T07:18:00",
		updatedAt: "2026-04-06T07:14:00",
	},
	{
		id: "omvendt-aktiesplit",
		title: "Omvendt aktiesplit",
		description: "Når flere aktier bliver til færre",
		publishedAt: "2026-04-15T06:42:00",
		updatedAt: "2026-04-20T13:42:00",
	},
	{
		id: "omxc25",
		title: "OMXC25",
		description: "Danmarks vigtigste aktieindeks",
		publishedAt: "2026-03-09T09:40:00",
		updatedAt: "2026-03-16T08:54:00",
	},
	{
		id: "opjustering",
		title: "Opjustering",
		description: "Når virksomheden overgår sine egne forventninger",
		publishedAt: "2026-06-10T10:13:00",
		updatedAt: "2026-06-23T09:27:00",
	},
	{
		id: "option",
		title: "Option",
		description: "Retten til at købe eller sælge til en aftalt pris",
		publishedAt: "2026-04-23T12:27:00",
		updatedAt: "2026-04-29T12:55:00",
	},
	{
		id: "organisk-vaekst",
		title: "Organisk vækst",
		description: "Vækst fra virksomhedens egen kraft",
		publishedAt: "2026-05-26T09:47:00",
		updatedAt: "2026-05-28T11:02:00",
	},
	{
		id: "overskudsgrad",
		title: "Overskudsgrad",
		description: "Hvor meget tjener virksomheden pr. omsætningskrone?",
		publishedAt: "2026-05-15T08:33:00",
		updatedAt: "2026-05-29T09:41:00",
	},
	{
		id: "overvaegt",
		title: "Overvægt",
		description: "At satse mere på en bestemt investering",
		publishedAt: "2026-06-19T11:06:00",
		updatedAt: "2026-06-29T07:20:00",
	},

	// P
	{
		id: "pal-skat",
		title: "PAL-skat",
		description: "Skatten på din pensionsopsparing",
		publishedAt: "2026-06-03T07:40:00",
		updatedAt: "2026-06-12T13:31:00",
	},
	{
		id: "pantebrev",
		title: "Pantebrev",
		description: "Sikkerhed i fast ejendom",
		publishedAt: "2026-07-03T06:56:00",
		updatedAt: "2026-07-17T11:05:00",
	},
	{
		id: "passiv-forvaltning",
		title: "Passiv forvaltning",
		description: "Lad markedet arbejde for dig",
		publishedAt: "2026-03-23T10:06:00",
		updatedAt: "2026-04-06T06:19:00",
	},
	{
		id: "passiv-investering",
		title: "Passiv investering",
		description: "En enkel og billig investeringsstrategi",
		publishedAt: "2026-06-22T07:58:00",
		updatedAt: "2026-07-06T07:12:00",
	},
	{
		id: "passiv-investor",
		title: "Passiv investor",
		description: "Investering uden daglig indsats",
		publishedAt: "2026-06-22T06:54:00",
		updatedAt: "2026-06-29T13:46:00",
	},
	{
		id: "passivt-eller-aktivt-forvaltet",
		title: "Passivt eller aktivt forvaltet investeringsforening",
		description: "Hvad passer bedst til dig?",
		publishedAt: "2026-06-03T06:47:00",
		updatedAt: "2026-06-11T06:42:00",
	},
	{
		id: "pe-tallet",
		title: "P/E-tallet",
		description: "Forholdet mellem en akties kurs og selskabets indtjening pr. aktie",
		publishedAt: "2026-08-05T11:18:00",
		updatedAt: "2026-08-18T11:04:00",
	},
	{
		id: "peg-ratio",
		title: "PEG-ratio",
		description: "Pris i forhold til vækst",
		publishedAt: "2026-03-23T11:53:00",
		updatedAt: "2026-04-06T06:39:00",
	},
	{
		id: "pengestrøm",
		title: "Pengestrøm",
		description:
			"De faktiske penge, der strømmer ind og ud af en virksomhed — også kaldet cash flow",
		publishedAt: "2026-06-10T11:45:00",
		updatedAt: "2026-06-18T13:19:00",
	},
	{
		id: "pengemarked",
		title: "Pengemarked",
		description: "Markedet for kortfristet lån og likviditet",
		publishedAt: "2026-07-03T07:41:00",
		updatedAt: "2026-07-07T13:43:00",
	},
	{
		id: "pengevaegtet-afkast",
		title: "Pengevægtet afkast (MWR)",
		description: "Dit faktiske afkast",
		publishedAt: "2026-08-05T10:22:00",
		updatedAt: "2026-08-12T11:36:00",
	},
	{
		id: "pension",
		title: "Pension",
		description: "Din økonomiske fremtid efter arbejdslivet",
		publishedAt: "2026-04-24T08:20:00",
		updatedAt: "2026-04-30T11:11:00",
	},
	{
		id: "pensionsmidler",
		title: "Pensionsmidler",
		description: "Dine opsparede penge til pension",
		publishedAt: "2026-05-06T07:11:00",
		updatedAt: "2026-05-14T08:01:00",
	},
	{
		id: "performance-fee",
		title: "Performance fee",
		description: "Resultatbaseret honorar til forvalteren",
		publishedAt: "2026-07-30T11:22:00",
		updatedAt: "2026-08-03T12:01:00",
	},
	{
		id: "personfradrag",
		title: "Personfradrag",
		description: "Dit skattefrie bundfradrag",
		publishedAt: "2026-04-15T09:45:00",
		updatedAt: "2026-04-17T06:04:00",
	},
	{
		id: "pmi-tallet",
		title: "PMI-tallet",
		description: "Indkøbschefernes temperaturmåling på økonomien",
		publishedAt: "2026-07-16T13:29:00",
		updatedAt: "2026-07-27T06:27:00",
	},
	{
		id: "portefoelje",
		title: "Portefølje",
		description: "Din samlede beholdning af investeringer",
		publishedAt: "2026-06-26T11:38:00",
		updatedAt: "2026-07-10T09:05:00",
	},
	{
		id: "portefoeljepleje",
		title: "Porteføljepleje",
		description: "Professionel styring af dine investeringer",
		publishedAt: "2026-04-02T10:17:00",
		updatedAt: "2026-04-06T08:59:00",
	},
	{
		id: "pre-market",
		title: "Pre market",
		description:
			"Handel med aktier før det officielle marked åbner, typisk mellem kl. 4:00 og 9:30 østlig tid i USA.",
		publishedAt: "2026-05-26T11:36:00",
		updatedAt: "2026-06-01T09:27:00",
	},
	{
		id: "price-sales",
		title: "Price/Sales",
		description:
			"Et værdiansættelsesnøgletal, der sammenligner en virksomheds markedsværdi med dens omsætning.",
		publishedAt: "2026-08-05T09:17:00",
		updatedAt: "2026-08-13T08:50:00",
	},
	{
		id: "pricing-power",
		title: "Pricing power",
		description:
			"En virksomheds evne til at hæve priserne uden at miste kunder i væsentligt omfang.",
		publishedAt: "2026-03-23T08:54:00",
		updatedAt: "2026-03-31T07:22:00",
	},
	{
		id: "private-equity",
		title: "Private Equity",
		description:
			"Investering i virksomheder, der ikke er børsnoterede, typisk med henblik på aktiv ejerskab og værdiskabelse.",
		publishedAt: "2026-04-02T12:08:00",
		updatedAt: "2026-04-06T10:39:00",
	},
	{
		id: "progressionsgraensen",
		title: "Progressionsgrænsen",
		description:
			"Den grænse i dansk skattelovgivning, hvor skattesatsen på aktieindkomst stiger fra 27% til 42%.",
		publishedAt: "2026-04-15T08:59:00",
		updatedAt: "2026-04-29T11:08:00",
	},
	{
		id: "prospekt",
		title: "Prospekt",
		description:
			"Et juridisk dokument, der beskriver en investering i detaljer, inden den udbydes til offentligheden.",
		publishedAt: "2026-05-26T10:32:00",
		updatedAt: "2026-06-04T08:02:00",
	},
	{
		id: "puljeordning",
		title: "Puljeordning",
		description:
			"En pensionsordning, hvor banken investerer din opsparing i en fælles pulje sammen med andre kunders midler.",
		publishedAt: "2026-07-17T08:52:00",
		updatedAt: "2026-07-23T09:27:00",
	},
	{
		id: "put-option",
		title: "Put option",
		description: "Retten til at sælge til en fastsat pris",
		publishedAt: "2026-08-07T13:11:00",
		updatedAt: "2026-08-13T12:03:00",
	},

	// Q
	{
		id: "quiet-quitting",
		title: "Quiet quitting",
		description:
			"Når du gør det nødvendige på jobbet — og investerer din energi i økonomisk frihed",
		publishedAt: "2026-03-10T07:14:00",
		updatedAt: "2026-03-18T13:08:00",
	},

	// R
	{
		id: "ratepension",
		title: "Ratepension",
		description: "En af de mest populære pensionsordninger i Danmark",
		publishedAt: "2026-03-24T07:40:00",
		updatedAt: "2026-03-30T12:55:00",
	},
	{
		id: "realkreditobligation",
		title: "Realkreditobligation",
		description: "En unik dansk obligationstype med sikkerhed i fast ejendom",
		publishedAt: "2026-04-24T10:07:00",
		updatedAt: "2026-05-01T13:33:00",
	},
	{
		id: "realisationsbeskatning",
		title: "Realisationsbeskatning",
		description: "Du betaler først skat, når du faktisk sælger",
		publishedAt: "2026-06-26T13:45:00",
		updatedAt: "2026-07-06T08:53:00",
	},
	{
		id: "rebalancering",
		title: "Rebalancering",
		description: "At bringe din portefølje tilbage i balance",
		publishedAt: "2026-06-26T12:25:00",
		updatedAt: "2026-07-02T11:09:00",
	},
	{
		id: "recession",
		title: "Recession",
		description: "Når økonomien skrumper — og hvad det betyder for dine investeringer",
		publishedAt: "2026-05-06T08:27:00",
		updatedAt: "2026-05-11T06:42:00",
	},
	{
		id: "refusion",
		title: "Refusion",
		description: "Når du får skattepenge eller omkostninger tilbage",
		publishedAt: "2026-04-03T07:07:00",
		updatedAt: "2026-04-07T12:52:00",
	},
	{
		id: "regnskaber",
		title: "Regnskaber",
		description: "Virksomhedens økonomiske helbredstjek",
		publishedAt: "2026-05-06T09:45:00",
		updatedAt: "2026-05-08T10:02:00",
	},
	{
		id: "reguleret-marked",
		title: "Reguleret marked",
		description: "Den officielle markedsplads for værdipapirer",
		publishedAt: "2026-07-10T11:54:00",
		updatedAt: "2026-07-23T12:00:00",
	},
	{
		id: "reit",
		title: "REIT",
		description: "Investér i ejendomme uden at eje dem selv",
		publishedAt: "2026-05-18T07:38:00",
		updatedAt: "2026-05-25T13:45:00",
	},
	{
		id: "rente",
		title: "Rente",
		description: "Prisen på at låne penge — og belønningen for at spare op",
		publishedAt: "2026-05-15T12:17:00",
		updatedAt: "2026-05-19T08:00:00",
	},
	{
		id: "rentes-rente-effekten",
		title: "Rentes rente-effekten",
		description: "Den mest kraftfulde mekanisme i langsigtet investering",
		publishedAt: "2026-07-27T11:37:00",
		updatedAt: "2026-08-03T06:40:00",
	},
	{
		id: "residual-value-to-paid-in",
		title: "Residual Value to Paid In (RVPI)",
		description: "Et nøgletal for værdien af det, der stadig er investeret",
		publishedAt: "2026-05-26T12:41:00",
		updatedAt: "2026-06-01T12:54:00",
	},
	{
		id: "resultat-efter-skat",
		title: "Resultat efter skat",
		description: "Bundlinjen — det virksomheden reelt tjener",
		publishedAt: "2026-06-22T09:41:00",
		updatedAt: "2026-06-29T07:09:00",
	},
	{
		id: "resultat-foer-skat",
		title: "Resultat før skat",
		description: "Virksomhedens indtjening inden skatten betales",
		publishedAt: "2026-04-15T10:32:00",
		updatedAt: "2026-04-20T13:00:00",
	},
	{
		id: "rigdomsformlen",
		title: "Rigdomsformlen",
		description: "Den simple formel bag økonomisk frihed",
		publishedAt: "2026-05-26T13:42:00",
		updatedAt: "2026-06-04T09:00:00",
	},
	{
		id: "risiko",
		title: "Risiko",
		description: "Sandsynligheden for at tingene ikke går som planlagt",
		publishedAt: "2026-05-15T13:23:00",
		updatedAt: "2026-05-25T11:49:00",
	},
	{
		id: "risikofri-rente",
		title: "Risikofri rente",
		description: "Det afkast, du kan få helt uden risiko",
		publishedAt: "2026-07-03T08:40:00",
		updatedAt: "2026-07-13T13:03:00",
	},
	{
		id: "risikojusteret-afkast",
		title: "Risikojusteret afkast (Sharpe ratio)",
		description: "At måle afkast i forhold til den risiko, du tager",
		publishedAt: "2026-06-11T10:11:00",
		updatedAt: "2026-06-23T08:16:00",
	},
	{
		id: "risikoprofil",
		title: "Risikoprofil",
		description: "Din personlige appetit på risiko",
		publishedAt: "2026-06-29T07:28:00",
		updatedAt: "2026-07-06T12:33:00",
	},
	{
		id: "risikospredning",
		title: "Risikospredning",
		description: "Læg ikke alle dine æg i én kurv",
		publishedAt: "2026-03-10T09:40:00",
		updatedAt: "2026-03-17T10:49:00",
	},
	{
		id: "roi",
		title: "ROI",
		description: "Hvor meget fik du igen for din investering?",
		publishedAt: "2026-07-10T10:19:00",
		updatedAt: "2026-07-20T10:45:00",
	},

	// S
	{
		id: "saldo",
		title: "Saldo",
		description: "Din saldo er det beløb, der står på din konto på et givet tidspunkt",
		publishedAt: "2026-08-13T06:53:00",
		updatedAt: "2026-08-18T10:59:00",
	},
	{
		id: "samfundsansvar",
		title: "Samfundsansvar",
		description:
			"Virksomheders ansvar for at bidrage positivt til samfundet ud over at skabe profit",
		publishedAt: "2026-07-27T13:09:00",
		updatedAt: "2026-07-30T09:39:00",
	},
	{
		id: "screening",
		title: "Screening",
		description: "En systematisk metode til at filtrere investeringer ud fra bestemte kriterier",
		publishedAt: "2026-08-12T08:44:00",
		updatedAt: "2026-08-19T13:00:00",
	},
	{
		id: "sektor",
		title: "Sektor",
		description:
			"En gruppering af virksomheder, der opererer inden for samme branche eller forretningsområde",
		publishedAt: "2026-05-27T08:16:00",
		updatedAt: "2026-06-08T12:03:00",
	},
	{
		id: "sektorer",
		title: "Sektorer",
		description: "De 11 overordnede brancher, som alle børsnoterede virksomheder klassificeres i",
		publishedAt: "2026-03-10T13:10:00",
		updatedAt: "2026-03-17T10:34:00",
	},
	{
		id: "selskabskapital",
		title: "Selskabskapital",
		description:
			"Den kapital ejerne har indskudt i et selskab, også kaldet aktiekapital eller egenkapital",
		publishedAt: "2026-07-20T10:18:00",
		updatedAt: "2026-07-27T08:26:00",
	},
	{
		id: "selskabsmidler",
		title: "Selskabsmidler",
		description: "De samlede aktiver og ressourcer, som et selskab råder over",
		publishedAt: "2026-06-29T10:53:00",
		updatedAt: "2026-07-03T07:11:00",
	},
	{
		id: "sfdr",
		title: "SFDR",
		description:
			"EU-forordning der stiller krav til finansielle virksomheders bæredygtighedsoplysninger",
		publishedAt: "2026-04-03T08:03:00",
		updatedAt: "2026-04-13T11:33:00",
	},
	{
		id: "sharpe-ratio",
		title: "Sharpe Ratio",
		description:
			"Et nøgletal der måler, hvor godt en investering belønner dig i forhold til den risiko, du tager",
		publishedAt: "2026-08-14T09:23:00",
		updatedAt: "2026-08-18T07:31:00",
	},
	{
		id: "shorting",
		title: "Shorting",
		description: "En investeringsstrategi, hvor du tjener penge på, at en aktie falder i kurs",
		publishedAt: "2026-05-18T08:43:00",
		updatedAt: "2026-05-22T12:39:00",
	},
	{
		id: "short-squeeze",
		title: "Short squeeze",
		description:
			"En pludselig kursstigning drevet af shortsellere, der tvinges til at lukke deres positioner",
		publishedAt: "2026-08-10T07:37:00",
		updatedAt: "2026-08-17T12:51:00",
	},
	{
		id: "shrinkflation",
		title: "Shrinkflation",
		description:
			"Når produkter bliver mindre, men prisen forbliver den samme — en skjult form for inflation",
		publishedAt: "2026-08-31T09:18:00",
		updatedAt: "2026-09-08T13:44:00",
	},
	{
		id: "skat-investering",
		title: "Skat (investering)",
		description: "Overblik over hvordan investeringer beskattes i Danmark",
		publishedAt: "2026-07-13T07:17:00",
		updatedAt: "2026-07-16T08:58:00",
	},
	{
		id: "skat-af-aktiegevinst-og-udbytte",
		title: "Skat af aktiegevinst og udbytte",
		description: "Hvad du skal betale i skat, når du tjener penge på aktier",
		publishedAt: "2026-07-20T12:32:00",
		updatedAt: "2026-07-28T10:47:00",
	},
	{
		id: "skattesatser",
		title: "Skattesatser",
		description: "De vigtigste skattesatser for danske investorer",
		publishedAt: "2026-08-28T10:54:00",
		updatedAt: "2026-09-09T11:20:00",
	},
	{
		id: "skats-positivliste",
		title: "Skats positivliste",
		description: "Listen over ETF'er, der beskattes som aktieindkomst i Danmark",
		publishedAt: "2026-08-14T11:18:00",
		updatedAt: "2026-08-28T08:18:00",
	},
	{
		id: "skulder-hoved-skulder",
		title: "Skulder-hoved-skulder",
		description: "Et klassisk teknisk chartmønster, der signalerer trendvending",
		publishedAt: "2026-08-26T08:03:00",
		updatedAt: "2026-08-31T13:05:00",
	},
	{
		id: "skyggebank",
		title: "Skyggebank",
		description: "Finansielle institutioner, der fungerer som banker — uden at være det",
		publishedAt: "2026-08-14T10:15:00",
		updatedAt: "2026-08-19T13:53:00",
	},
	{
		id: "small-cap-aktie",
		title: "Small Cap-aktie",
		description: "Aktier i mindre børsnoterede virksomheder",
		publishedAt: "2026-06-22T10:30:00",
		updatedAt: "2026-06-29T08:34:00",
	},
	{
		id: "small-mid-large-cap",
		title: "Small-, mid- og large cap-aktier",
		description: "De tre størrelseskategorier for børsnoterede virksomheder",
		publishedAt: "2026-08-24T09:10:00",
		updatedAt: "2026-09-07T11:36:00",
	},
	{
		id: "social-responsible-investment",
		title: "Social Responsible Investment (SRI)",
		description: "Investering med fokus på etik, miljø og samfundsansvar",
		publishedAt: "2026-08-26T07:12:00",
		updatedAt: "2026-08-31T08:52:00",
	},
	{
		id: "soliditetsgrad",
		title: "Soliditetsgrad",
		description: "Et mål for virksomhedens finansielle styrke",
		publishedAt: "2026-08-10T09:15:00",
		updatedAt: "2026-08-18T12:20:00",
	},
	{
		id: "sortino-ratio",
		title: "Sortino Ratio",
		description: "Et mål for afkast i forhold til nedadgående risiko",
		publishedAt: "2026-07-03T10:00:00",
		updatedAt: "2026-07-07T12:43:00",
	},
	{
		id: "spac",
		title: "SPAC",
		description: "Et tomt børsnoteret selskab, der køber en privat virksomhed",
		publishedAt: "2026-08-19T09:25:00",
		updatedAt: "2026-08-31T11:41:00",
	},
	{
		id: "sp500-indekset",
		title: "S&P 500-indekset",
		description: "Det vigtigste aktieindeks i verden",
		publishedAt: "2026-05-18T10:17:00",
		updatedAt: "2026-06-01T08:31:00",
	},
	{
		id: "spread",
		title: "Spread",
		description: "Forskellen mellem købs- og salgspris",
		publishedAt: "2026-08-25T13:40:00",
		updatedAt: "2026-09-07T10:36:00",
	},
	{
		id: "spredning",
		title: "Spredning",
		description: "Diversificering af dine investeringer",
		publishedAt: "2026-06-12T07:25:00",
		updatedAt: "2026-06-24T10:25:00",
	},
	{
		id: "spredningsgevinst",
		title: "Spredningsgevinst",
		description: "Gevinsten ved at diversificere",
		publishedAt: "2026-03-24T08:38:00",
		updatedAt: "2026-04-01T10:22:00",
	},
	{
		id: "spv",
		title: "SPV",
		description: "Special Purpose Vehicle",
		publishedAt: "2026-08-05T12:16:00",
		updatedAt: "2026-08-17T12:03:00",
	},
	{
		id: "standardafvigelse",
		title: "Standardafvigelse",
		description: "Et mål for risiko",
		publishedAt: "2026-08-12T11:53:00",
		updatedAt: "2026-08-14T09:38:00",
	},
	{
		id: "statsobligation",
		title: "Statsobligation",
		description: "Lån til staten",
		publishedAt: "2026-08-25T09:43:00",
		updatedAt: "2026-09-07T10:15:00",
	},
	{
		id: "stemmeret-som-aktionaer",
		title: "Stemmeret som aktionær",
		description: "Din indflydelse på selskabet",
		publishedAt: "2026-06-29T09:24:00",
		updatedAt: "2026-07-02T11:07:00",
	},
	{
		id: "stempelafgift",
		title: "Stempelafgift",
		description: "Skat på værdipapirhandel",
		publishedAt: "2026-08-19T10:57:00",
		updatedAt: "2026-08-31T13:27:00",
	},
	{
		id: "stop-loss",
		title: "Stop loss",
		description: "Automatisk beskyttelse mod store tab",
		publishedAt: "2026-08-27T08:21:00",
		updatedAt: "2026-09-03T07:47:00",
	},
	{
		id: "stoxx-50",
		title: "Stoxx 50",
		description: "Europas 50 største blue-chip aktier",
		publishedAt: "2026-05-06T12:16:00",
		updatedAt: "2026-05-13T11:46:00",
	},
	{
		id: "stoxx-600",
		title: "Stoxx 600",
		description: "Det brede europæiske aktieindeks",
		publishedAt: "2026-04-15T12:43:00",
		updatedAt: "2026-04-21T06:56:00",
	},
	{
		id: "strategisk-aktivallokering",
		title: "Strategisk aktivallokering",
		description: "Den langsigtede fordeling af dine investeringer",
		publishedAt: "2026-08-27T09:15:00",
		updatedAt: "2026-09-10T13:25:00",
	},
	{
		id: "stoettemidler-til-virksomheder",
		title: "Støttemidler til virksomheder",
		description: "Offentlig finansiering af erhvervslivet",
		publishedAt: "2026-08-27T07:04:00",
		updatedAt: "2026-09-08T06:36:00",
	},
	{
		id: "sustainable-development-goals",
		title: "Sustainable Development Goals (SDG)",
		description: "FN's verdensmål for bæredygtig udvikling",
		publishedAt: "2026-03-10T12:14:00",
		updatedAt: "2026-03-19T12:32:00",
	},
	{
		id: "svanemarket-investeringsfond",
		title: "Svanemærket investeringsfond",
		description: "Nordisk miljømærkning af fonde",
		publishedAt: "2026-08-24T10:52:00",
		updatedAt: "2026-09-07T09:05:00",
	},
	{
		id: "swing-trading",
		title: "Swing trading",
		description: "Handel med kortsigtede kursudsving",
		publishedAt: "2026-04-15T11:27:00",
		updatedAt: "2026-04-24T08:22:00",
	},
	{
		id: "systematisk-risiko",
		title: "Systematisk risiko",
		description: "Markedsrisiko du ikke kan diversificere væk",
		publishedAt: "2026-06-11T11:54:00",
		updatedAt: "2026-06-22T12:53:00",
	},

	// T
	{
		id: "taktisk-aktivallokering",
		title: "Taktisk aktivallokering",
		description:
			"Kortsigtet justering af porteføljens aktivfordeling for at udnytte markedsmuligheder",
		publishedAt: "2026-07-28T07:11:00",
		updatedAt: "2026-08-05T12:12:00",
	},
	{
		id: "taper-tantrum",
		title: "Taper tantrum",
		description:
			"Markedets voldsomme reaktion, når centralbanker signalerer stramning af pengepolitikken",
		publishedAt: "2026-06-30T07:08:00",
		updatedAt: "2026-07-06T09:54:00",
	},
	{
		id: "tegning",
		title: "Tegning",
		description:
			"Køb af nyudstedte værdipapirer direkte fra udstederen, typisk ved en kapitalforhøjelse eller børsintroduktion",
		publishedAt: "2026-05-18T13:15:00",
		updatedAt: "2026-06-01T06:28:00",
	},
	{
		id: "tegningskurs",
		title: "Tegningskurs",
		description: "Den fastsatte pris, som investorer betaler for at tegne nyudstedte værdipapirer",
		publishedAt: "2026-05-27T10:05:00",
		updatedAt: "2026-06-05T09:21:00",
	},
	{
		id: "tegningsperiode",
		title: "Tegningsperiode",
		description: "Det tidsrum, hvor investorer kan tegne sig for nyudstedte værdipapirer",
		publishedAt: "2026-07-03T11:37:00",
		updatedAt: "2026-07-13T10:05:00",
	},
	{
		id: "tegningsret",
		title: "Tegningsret",
		description:
			"En ret, der giver eksisterende aktionærer fortrinsret til at købe nyudstedte aktier i et selskab",
		publishedAt: "2026-04-16T07:25:00",
		updatedAt: "2026-04-22T10:48:00",
	},
	{
		id: "teknisk-analyse",
		title: "Teknisk analyse",
		description:
			"Metode til at forudsige kursbevægelser ved at analysere historiske pris- og volumenmønstre i grafer",
		publishedAt: "2026-03-11T12:32:00",
		updatedAt: "2026-03-18T12:47:00",
	},
	{
		id: "tematisk-investering",
		title: "Tematisk investering",
		description:
			"Investeringsstrategi, der fokuserer på langsigtede megatrends som grøn omstilling, AI eller demografiske forandringer",
		publishedAt: "2026-03-24T12:57:00",
		updatedAt: "2026-03-30T12:26:00",
	},
	{
		id: "terminsdato",
		title: "Terminsdato",
		description:
			"Den dato, hvor et finansielt instrument udløber, eller en forpligtelse forfalder til betaling",
		publishedAt: "2026-07-21T07:32:00",
		updatedAt: "2026-07-23T11:29:00",
	},
	{
		id: "terminsforretning",
		title: "Terminsforretning",
		description:
			"En aftale om at købe eller sælge et aktiv til en fastsat pris på en fremtidig dato",
		publishedAt: "2026-06-12T08:50:00",
		updatedAt: "2026-06-23T06:56:00",
	},
	{
		id: "tidshorisont",
		title: "Tidshorisont",
		description: "Den tidsperiode, du forventer at have dine penge investeret",
		publishedAt: "2026-06-22T11:50:00",
		updatedAt: "2026-07-01T07:31:00",
	},
	{
		id: "tidsvaegtet-afkast",
		title: "Tidsvægtede afkast (TWR)",
		description:
			"En metode til at måle investeringsafkast, der eliminerer effekten af ind- og udbetalinger",
		publishedAt: "2026-05-27T12:22:00",
		updatedAt: "2026-06-01T08:53:00",
	},
	{
		id: "tina",
		title: "TINA",
		description: '"There Is No Alternative" — når investorer føler sig tvunget ud i aktier',
		publishedAt: "2026-07-21T11:20:00",
		updatedAt: "2026-07-27T13:35:00",
	},
	{
		id: "tolerancegrad",
		title: "Tolerancegrad",
		description:
			"Din personlige evne og vilje til at acceptere udsving og tab i dine investeringer",
		publishedAt: "2026-07-21T09:32:00",
		updatedAt: "2026-07-27T12:39:00",
	},
	{
		id: "toplinjen",
		title: "Toplinjen",
		description: "Et selskabs samlede omsætning — den øverste linje i resultatopgørelsen",
		publishedAt: "2026-06-12T10:23:00",
		updatedAt: "2026-06-16T08:36:00",
	},
	{
		id: "topskat",
		title: "Topskat",
		description:
			"Den ekstra skat, der betales af personlig indkomst over topskattegrænsen i Danmark",
		publishedAt: "2026-06-03T10:36:00",
		updatedAt: "2026-06-08T06:59:00",
	},
	{
		id: "total-cost-of-ownership",
		title: "Total Cost of Ownership (TCO)",
		description: "De samlede omkostninger ved en investering — ikke kun de umiddelbart synlige",
		publishedAt: "2026-07-03T10:32:00",
		updatedAt: "2026-07-07T12:23:00",
	},
	{
		id: "total-expense-ratio",
		title: "Total Expense Ratio (TER)",
		description:
			"Et nøgletal, der viser en fonds samlede løbende omkostninger i procent af formuen",
		publishedAt: "2026-03-11T10:02:00",
		updatedAt: "2026-03-25T12:50:00",
	},
	{
		id: "total-value-to-paid-in",
		title: "Total Value to Paid In (TVPI)",
		description:
			"Et nøgletal, der måler den samlede værdi af en kapitalfondsinvestering i forhold til det indskudte beløb",
		publishedAt: "2026-04-15T13:43:00",
		updatedAt: "2026-04-27T06:23:00",
	},
	{
		id: "tracking-error",
		title: "Tracking Error (TE)",
		description: "Et mål for, hvor meget en fonds afkast afviger fra sit benchmark over tid",
		publishedAt: "2026-05-07T07:09:00",
		updatedAt: "2026-05-18T06:29:00",
	},
	{
		id: "tredjepartsomkostning",
		title: "Tredjepartsomkostning",
		description: "Omkostninger betalt til eksterne parter i forbindelse med din investering",
		publishedAt: "2026-04-27T08:55:00",
		updatedAt: "2026-05-04T10:49:00",
	},

	// U
	{
		id: "ucits",
		title: "UCITS",
		description: "EU-regulerede investeringsfonde med høj investorbeskyttelse",
		publishedAt: "2026-06-03T11:36:00",
		updatedAt: "2026-06-16T10:37:00",
	},
	{
		id: "udbytte",
		title: "Udbytte",
		description: "Den del af et selskabs overskud, der udbetales til aktionærerne",
		publishedAt: "2026-03-25T06:50:00",
		updatedAt: "2026-04-06T10:48:00",
	},
	{
		id: "udbytteafkast",
		title: "Udbytteafkast",
		description: "Et nøgletal der viser udbyttet i forhold til aktiekursen",
		publishedAt: "2026-04-16T10:53:00",
		updatedAt: "2026-04-28T12:05:00",
	},
	{
		id: "udbytteaktie",
		title: "Udbytteaktie",
		description: "En aktie i et selskab, der regelmæssigt udbetaler udbytte til aktionærerne",
		publishedAt: "2026-04-16T09:51:00",
		updatedAt: "2026-04-29T08:19:00",
	},
	{
		id: "udbytteskat",
		title: "Udbytteskat",
		description: "Den skat, du betaler, når du modtager udbytte fra aktier",
		publishedAt: "2026-04-16T11:58:00",
		updatedAt: "2026-04-24T12:05:00",
	},
	{
		id: "udloeb",
		title: "Udløb",
		description: "Den dato, hvor en option, future eller obligation ophører med at eksistere",
		publishedAt: "2026-06-03T12:50:00",
		updatedAt: "2026-06-11T11:01:00",
	},
	{
		id: "udtraekning",
		title: "Udtrækning",
		description: "Når en obligation indfries før tid ved lodtrækning",
		publishedAt: "2026-06-22T12:30:00",
		updatedAt: "2026-07-06T07:10:00",
	},
	{
		id: "udvanding",
		title: "Udvanding",
		description: "Når din ejerandel i et selskab mindskes, fordi der udstedes nye aktier",
		publishedAt: "2026-05-28T08:24:00",
		updatedAt: "2026-06-08T09:16:00",
	},
	{
		id: "un-principles-for-responsible-investments",
		title: "UN Principles for Responsible Investments",
		description: "FN's principper for ansvarlige investeringer (UNPRI)",
		publishedAt: "2026-06-12T11:48:00",
		updatedAt: "2026-06-16T13:58:00",
	},
	{
		id: "underliggende-aktie",
		title: "Underliggende aktie",
		description: "Den aktie, som en option eller et andet derivat er baseret på",
		publishedAt: "2026-06-30T09:07:00",
		updatedAt: "2026-07-03T07:22:00",
	},
	{
		id: "undervaegt",
		title: "Undervægt",
		description: "Når en aktie eller sektor fylder mindre i din portefølje end i benchmark",
		publishedAt: "2026-05-19T08:07:00",
		updatedAt: "2026-06-01T07:48:00",
	},
	{
		id: "unfunded-commitment",
		title: "Unfunded commitment",
		description: "Kapital, du har lovet at investere, men endnu ikke har indbetalt",
		publishedAt: "2026-05-28T07:20:00",
		updatedAt: "2026-06-11T11:50:00",
	},
	{
		id: "unoterede-aktier",
		title: "Unoterede aktier",
		description: "Aktier i selskaber, der ikke er noteret på en børs",
		publishedAt: "2026-04-03T10:11:00",
		updatedAt: "2026-04-06T09:58:00",
	},
	{
		id: "unoteret-papir",
		title: "Unoteret papir",
		description: "Et værdipapir, der ikke er optaget til handel på en reguleret børs",
		publishedAt: "2026-03-12T07:46:00",
		updatedAt: "2026-03-19T10:08:00",
	},
	{
		id: "ure-investering",
		title: "Ure (investering)",
		description: "Luksusure som alternativ investering og værdibevarelse",
		publishedAt: "2026-03-12T09:39:00",
		updatedAt: "2026-03-23T08:47:00",
	},
	{
		id: "usystematisk-risiko",
		title: "Usystematisk risiko",
		description:
			"Risiko, der er knyttet til et enkelt selskab eller en branche — og som kan diversificeres væk",
		publishedAt: "2026-06-03T13:47:00",
		updatedAt: "2026-06-15T07:24:00",
	},

	// V
	{
		id: "valuta",
		title: "Valuta",
		description:
			"Penge i en bestemt national eller international møntfod — grundlaget for al valutahandel",
		publishedAt: "2026-03-12T11:11:00",
		updatedAt: "2026-03-23T06:52:00",
	},
	{
		id: "valuta-kryds",
		title: "Valuta-kryds",
		description:
			"En vekselkurs mellem to valutaer, der ikke involverer den amerikanske dollar direkte",
		publishedAt: "2026-07-03T13:43:00",
		updatedAt: "2026-07-17T12:43:00",
	},
	{
		id: "valutakonto",
		title: "Valutakonto",
		description: "En bankkonto i en anden valuta end danske kroner",
		publishedAt: "2026-04-27T11:43:00",
		updatedAt: "2026-05-04T06:15:00",
	},
	{
		id: "valutakurs",
		title: "Valutakurs",
		description:
			"Prisen på én valuta udtrykt i en anden — f.eks. hvor mange kroner én dollar koster",
		publishedAt: "2026-07-13T13:29:00",
		updatedAt: "2026-07-24T08:44:00",
	},
	{
		id: "valutakursrisiko",
		title: "Valutakursrisiko",
		description:
			"Risikoen for at valutakursændringer påvirker værdien af dine udenlandske investeringer",
		publishedAt: "2026-07-13T11:55:00",
		updatedAt: "2026-07-27T09:54:00",
	},
	{
		id: "valutakurstillaeg",
		title: "Valutakurstillæg",
		description: "Det ekstra gebyr din bank lægger oven i valutakursen ved veksling",
		publishedAt: "2026-05-20T07:08:00",
		updatedAt: "2026-06-02T06:31:00",
	},
	{
		id: "valutaterminsforretning",
		title: "Valutaterminsforretning",
		description:
			"En aftale om at veksle valuta på et fremtidigt tidspunkt til en kurs aftalt i dag",
		publishedAt: "2026-04-03T13:17:00",
		updatedAt: "2026-04-13T13:27:00",
	},
	{
		id: "value-aktier",
		title: "Value aktie / værdiaktier",
		description: "Aktier der handles under deres reelle værdi — jagten på undervurderede selskaber",
		publishedAt: "2026-05-07T09:38:00",
		updatedAt: "2026-05-18T09:27:00",
	},
	{
		id: "value-at-risk",
		title: "Value at Risk (VaR)",
		description:
			"Et mål for det maksimale forventede tab inden for en given periode og sandsynlighed",
		publishedAt: "2026-04-27T12:54:00",
		updatedAt: "2026-05-06T07:14:00",
	},
	{
		id: "value-trap",
		title: "Value trap",
		description:
			"Når en billig aktie er billig af gode grunde — fælden der narrer value-investorer",
		publishedAt: "2026-07-21T12:37:00",
		updatedAt: "2026-08-04T12:15:00",
	},
	{
		id: "valoerdag",
		title: "Valørdag",
		description: "Den dag en handel reelt afvikles — når pengene og værdipapirerne skifter hænder",
		publishedAt: "2026-05-28T09:34:00",
		updatedAt: "2026-06-01T06:40:00",
	},
	{
		id: "variabelt-forrentet-obligation",
		title: "Variabelt forrentet obligation",
		description:
			"En obligation med en rente der ændrer sig løbende — beskyttelse mod rentestigninger",
		publishedAt: "2026-05-19T12:34:00",
		updatedAt: "2026-05-28T06:11:00",
	},
	{
		id: "vareforbrug-og-produktionsomkostninger",
		title: "Vareforbrug og produktionsomkostninger",
		description: "De direkte omkostninger ved at producere eller levere det, en virksomhed sælger",
		publishedAt: "2026-07-30T13:12:00",
		updatedAt: "2026-08-10T07:36:00",
	},
	{
		id: "varelager",
		title: "Varelager",
		description: "Virksomhedens beholdning af varer — en vigtig post på balancen",
		publishedAt: "2026-04-03T12:32:00",
		updatedAt: "2026-04-15T11:06:00",
	},
	{
		id: "varighed",
		title: "Varighed",
		description:
			"Et mål for en obligations følsomhed over for renteændringer — vigtigere end løbetid",
		publishedAt: "2026-06-15T09:44:00",
		updatedAt: "2026-06-18T07:07:00",
	},
	{
		id: "vedhaengende-rente",
		title: "Vedhængende rente",
		description:
			"Den rente der er løbet på siden sidste kuponbetaling — og som du betaler ved køb af en obligation",
		publishedAt: "2026-04-16T13:23:00",
		updatedAt: "2026-04-30T08:08:00",
	},
	{
		id: "venturekapital",
		title: "Venturekapital",
		description: "Risikovillig kapital til unge virksomheder med stort vækstpotentiale",
		publishedAt: "2026-06-04T07:58:00",
		updatedAt: "2026-06-15T09:59:00",
	},
	{
		id: "venturefond",
		title: "Venturefond",
		description: "En fond der samler kapital fra investorer og investerer i unge vækstvirksomheder",
		publishedAt: "2026-05-20T08:05:00",
		updatedAt: "2026-06-02T10:05:00",
	},
	{
		id: "verdensoekonomi",
		title: "Verdensøkonomien",
		description: "Det globale økonomiske system — og hvorfor det påvirker dine investeringer",
		publishedAt: "2026-04-03T11:13:00",
		updatedAt: "2026-04-14T10:34:00",
	},
	{
		id: "vin-investering",
		title: "Vin (investering)",
		description: "En alternativ investering i fine vine — eksotisk, men med reelle risici",
		publishedAt: "2026-03-12T12:37:00",
		updatedAt: "2026-03-25T06:37:00",
	},
	{
		id: "virksomhedsobligation",
		title: "Virksomhedsobligation",
		description:
			"Et lån til en virksomhed — højere rente, men også højere risiko end statsobligationer",
		publishedAt: "2026-07-28T08:53:00",
		updatedAt: "2026-08-10T12:38:00",
	},
	{
		id: "volatilitet",
		title: "Volatilitet",
		description: "Et mål for hvor meget en investering svinger i værdi — risiko sat på tal",
		publishedAt: "2026-06-30T11:07:00",
		updatedAt: "2026-07-06T09:32:00",
	},
	{
		id: "voldgrav-moat",
		title: "Voldgrav / moat",
		description:
			"En virksomheds varige konkurrencefordel — det der holder konkurrenterne på afstand",
		publishedAt: "2026-06-15T08:57:00",
		updatedAt: "2026-06-29T08:42:00",
	},
	{
		id: "vaekstaktier",
		title: "Vækstaktier",
		description:
			"Aktier i virksomheder med høj forventet vækst — potentiale for store gevinster, men også høj risiko",
		publishedAt: "2026-06-23T07:28:00",
		updatedAt: "2026-07-06T13:39:00",
	},
	{
		id: "vaekstpotentiale",
		title: "Vækstpotentiale",
		description: "En virksomheds eller investerings mulighed for at stige i værdi over tid",
		publishedAt: "2026-07-03T12:51:00",
		updatedAt: "2026-07-09T07:02:00",
	},
	{
		id: "vaerdiansaettelse",
		title: "Værdiansættelse",
		description: "Kunsten at bestemme, hvad en virksomhed eller investering reelt er værd",
		publishedAt: "2026-06-04T09:10:00",
		updatedAt: "2026-06-08T09:56:00",
	},
	{
		id: "vaerdipapir",
		title: "Værdipapir",
		description: "Et omsætteligt finansielt dokument der repræsenterer en økonomisk værdi",
		publishedAt: "2026-04-17T07:06:00",
		updatedAt: "2026-04-23T13:12:00",
	},
	{
		id: "vaerdipapircentral",
		title: "Værdipapircentral",
		description: "Den institution der registrerer ejerskab af værdipapirer elektronisk",
		publishedAt: "2026-07-06T08:43:00",
		updatedAt: "2026-07-13T09:03:00",
	},
	{
		id: "vaerdipapirer",
		title: "Værdipapirer",
		description: "Et overblik over de finansielle instrumenter, du kan investere i",
		publishedAt: "2026-07-22T07:35:00",
		updatedAt: "2026-08-03T10:43:00",
	},
	{
		id: "vix",
		title: "VIX",
		description:
			"Markedets frygtbarometer — et indeks der måler den forventede volatilitet på det amerikanske aktiemarked",
		publishedAt: "2026-06-30T10:24:00",
		updatedAt: "2026-07-06T12:21:00",
	},

	// W
	{
		id: "watchlist",
		title: "Watchlist",
		description: "Hold styr på de aktier, du følger",
		publishedAt: "2026-03-25T12:34:00",
		updatedAt: "2026-04-08T12:00:00",
	},
	{
		id: "whisky-investering",
		title: "Whisky (investering)",
		description: "Alternativ investering i flydende guld",
		publishedAt: "2026-03-13T07:12:00",
		updatedAt: "2026-03-16T10:21:00",
	},

	// Y
	{
		id: "yield",
		title: "Yield",
		description: "Det løbende afkast på din investering",
		publishedAt: "2026-03-13T10:05:00",
		updatedAt: "2026-03-23T08:08:00",
	},

	// Z

	// Æ
	{
		id: "aegtepagt",
		title: "Ægtepagt",
		description: "Beskyt din formue i ægteskabet",
		publishedAt: "2026-03-13T13:01:00",
		updatedAt: "2026-03-16T08:52:00",
	},

	// Ø
	{
		id: "oekonomisk-frihed",
		title: "Økonomisk frihed",
		description: "Når dine penge arbejder for dig",
		publishedAt: "2026-03-16T06:58:00",
		updatedAt: "2026-03-23T10:29:00",
	},
	{
		id: "oekonomisk-helbred",
		title: "Økonomisk helbred",
		description: "Et tjek på din privatøkonomi",
		publishedAt: "2026-04-06T10:11:00",
		updatedAt: "2026-04-17T09:13:00",
	},
	{
		id: "oekonomisk-uafhaengig",
		title: "Økonomisk uafhængig",
		description: "Friheden til at leve på dine egne betingelser",
		publishedAt: "2026-03-26T08:49:00",
		updatedAt: "2026-04-06T07:28:00",
	},

	// Å
	{
		id: "aop",
		title: "ÅOP",
		description: "Hvad din investering reelt koster dig",
		publishedAt: "2026-03-13T11:27:00",
		updatedAt: "2026-03-16T12:45:00",
	},
	{
		id: "aarsrapport",
		title: "Årsrapport",
		description: "Virksomhedens årlige helbredstjek",
		publishedAt: "2026-03-26T07:11:00",
		updatedAt: "2026-04-07T13:01:00",
	},

	// Nye termer
	{
		id: "aabningskurs",
		title: "Åbningskurs",
		description: "Den første kurs, når markedet åbner",
		publishedAt: "2026-03-26T08:04:00",
		updatedAt: "2026-04-02T07:47:00",
	},
	{
		id: "aarsregnskab",
		title: "Årsregnskab",
		description: "Virksomhedens økonomiske facit",
		publishedAt: "2026-03-25T13:33:00",
		updatedAt: "2026-03-27T06:23:00",
	},
	{
		id: "acontoskat",
		title: "Acontoskat",
		description: "Skat betalt på forskud",
		publishedAt: "2026-08-13T08:08:00",
		updatedAt: "2026-08-24T09:00:00",
	},
	{
		id: "administrationsomkostninger",
		title: "Administrationsomkostninger",
		description: "Prisen for at drive en fond",
		publishedAt: "2026-08-25T11:27:00",
		updatedAt: "2026-08-31T08:27:00",
	},
	{
		id: "afdelinger",
		title: "Afdelinger",
		description: "Fondene inden for en investeringsforening",
		publishedAt: "2026-08-21T07:09:00",
		updatedAt: "2026-08-27T11:49:00",
	},
	{
		id: "afdelingsdirekte-omkostninger",
		title: "Afdelingsdirekte omkostninger",
		description: "Udgifter knyttet direkte til fonden",
		publishedAt: "2026-03-26T10:40:00",
		updatedAt: "2026-04-09T06:44:00",
	},
	{
		id: "afkastindeks",
		title: "Afkastindeks",
		description: "Mål for det samlede afkast",
		publishedAt: "2026-08-10T12:43:00",
		updatedAt: "2026-08-17T08:04:00",
	},
	{
		id: "afledte-finansielle-instrumenter",
		title: "Afledte finansielle instrumenter",
		description: "Investeringer baseret på andre aktiver",
		publishedAt: "2026-03-16T08:53:00",
		updatedAt: "2026-03-23T12:53:00",
	},
	{
		id: "aftale-om-administration",
		title: "Aftale om administration",
		description: "Kontrakten bag fondens drift",
		publishedAt: "2026-05-28T12:03:00",
		updatedAt: "2026-06-08T11:47:00",
	},
	{
		id: "afviklingsdage",
		title: "Afviklingsdage",
		description: "Tiden fra handel til levering",
		publishedAt: "2026-07-01T06:57:00",
		updatedAt: "2026-07-08T07:22:00",
	},
	{
		id: "akkumulerende-afdelinger",
		title: "Akkumulerende afdelinger",
		description: "Geninvestér dit afkast automatisk",
		publishedAt: "2026-05-20T10:09:00",
		updatedAt: "2026-05-26T08:25:00",
	},
	{
		id: "aktieafdelinger",
		title: "Aktieafdelinger",
		description: "Fonde der investerer i aktier",
		publishedAt: "2026-08-25T06:55:00",
		updatedAt: "2026-08-28T13:58:00",
	},
	{
		id: "aktieavancebeskatning",
		title: "Aktieavancebeskatning",
		description: "Skat på gevinster ved aktiehandel",
		publishedAt: "2026-08-26T09:17:00",
		updatedAt: "2026-08-31T11:15:00",
	},
	{
		id: "aktieemission",
		title: "Aktieemission",
		description: "Når virksomheder udsteder nye aktier",
		publishedAt: "2026-06-23T10:25:00",
		updatedAt: "2026-07-07T11:17:00",
	},
	{
		id: "aktiekapital",
		title: "Aktiekapital",
		description: "Virksomhedens egenkapitalgrundlag",
		publishedAt: "2026-08-17T08:36:00",
		updatedAt: "2026-08-24T10:39:00",
	},
	{
		id: "aktieudlaan",
		title: "Aktieudlån",
		description: "Når fonde låner aktier ud mod betaling",
		publishedAt: "2026-04-28T07:42:00",
		updatedAt: "2026-05-04T10:32:00",
	},
	{
		id: "aktivt-styrede-afdelinger",
		title: "Aktivt styrede afdelinger",
		description: "Fonde med en forvalter bag rattet",
		publishedAt: "2026-08-27T11:05:00",
		updatedAt: "2026-08-31T13:00:00",
	},
	{
		id: "aktuel-rente",
		title: "Aktuel rente",
		description: "Den rente, der gælder lige nu",
		publishedAt: "2026-07-31T09:19:00",
		updatedAt: "2026-08-12T10:04:00",
	},
	{
		id: "almindelig-fri-opsparing",
		title: "Almindelig, fri opsparing",
		description: "Investér uden bindinger",
		publishedAt: "2026-07-14T07:14:00",
		updatedAt: "2026-07-27T11:19:00",
	},
	{
		id: "andel",
		title: "Andel",
		description: "Din bid af investeringsforeningen",
		publishedAt: "2026-07-07T09:37:00",
		updatedAt: "2026-07-09T07:55:00",
	},
	{
		id: "ansvarlige-investeringer",
		title: "Ansvarlige investeringer",
		description: "Invester med omtanke for verden",
		publishedAt: "2026-08-20T11:52:00",
		updatedAt: "2026-08-24T12:32:00",
	},
	{
		id: "baeredygtighedsfaktorer",
		title: "Bæredygtighedsfaktorer",
		description: "De forhold der definerer ansvarlig investering",
		publishedAt: "2026-04-07T08:12:00",
		updatedAt: "2026-04-13T12:03:00",
	},
	{
		id: "beholdningslister",
		title: "Beholdningslister",
		description: "Se hvad din fond faktisk ejer",
		publishedAt: "2026-08-13T10:14:00",
		updatedAt: "2026-08-27T12:19:00",
	},
	{
		id: "bevisudstedende",
		title: "Bevisudstedende",
		description: "En fondtype uden børsnotering",
		publishedAt: "2026-08-26T11:33:00",
		updatedAt: "2026-09-07T07:32:00",
	},
	{
		id: "blandede-afdelinger",
		title: "Blandede afdelinger",
		description: "Aktier og obligationer i én fond",
		publishedAt: "2026-08-26T13:26:00",
		updatedAt: "2026-08-31T12:52:00",
	},
	{
		id: "boerskode",
		title: "Børskode",
		description: "Et værdipapirs unikke identifikation",
		publishedAt: "2026-07-23T08:39:00",
		updatedAt: "2026-08-04T09:09:00",
	},
	{
		id: "boerskurs",
		title: "Børskurs",
		description: "Den pris markedet sætter",
		publishedAt: "2026-03-03T11:31:00",
		updatedAt: "2026-03-10T07:19:00",
	},
	{
		id: "boerspause",
		title: "Børspause",
		description: "Når handlen med en aktie eller et helt marked midlertidigt stoppes",
		publishedAt: "2026-07-28T11:34:00",
		updatedAt: "2026-08-03T06:12:00",
	},
	{
		id: "branchebaseret",
		title: "Branchebaseret",
		description: "En investeringsfond, der fokuserer på en bestemt branche eller sektor",
		publishedAt: "2026-03-04T07:00:00",
		updatedAt: "2026-03-09T09:45:00",
	},
	{
		id: "central-information",
		title: "Central information",
		description: "Nøgledokumentet for investeringsfonde",
		publishedAt: "2026-06-16T08:02:00",
		updatedAt: "2026-06-22T08:07:00",
	},
	{
		id: "certifikat",
		title: "Certifikat",
		description: "Struktureret produkt der følger et underliggende aktiv",
		publishedAt: "2026-06-24T10:07:00",
		updatedAt: "2026-06-30T12:40:00",
	},
	{
		id: "certifikatudstedende",
		title: "Certifikatudstedende",
		description: "Den enhed der udsteder investeringsbeviser",
		publishedAt: "2026-07-23T12:08:00",
		updatedAt: "2026-08-03T07:21:00",
	},
	{
		id: "cirkulerende-beviser",
		title: "Cirkulerende beviser",
		description: "Antallet af udestående andele i en investeringsfond",
		publishedAt: "2026-07-23T11:05:00",
		updatedAt: "2026-08-03T06:40:00",
	},
	{
		id: "co2e-intensitet",
		title: "CO2e-intensitet",
		description: "Mål for klimaaftryk pr. enhed omsætning eller investering",
		publishedAt: "2026-06-05T07:32:00",
		updatedAt: "2026-06-11T10:30:00",
	},
	{
		id: "denomineret",
		title: "Denomineret",
		description: "Den valuta, som et værdipapir eller en fond er prissat og handlet i",
		publishedAt: "2026-06-05T11:06:00",
		updatedAt: "2026-06-08T11:56:00",
	},
	{
		id: "depotselskab",
		title: "Depotselskab/-bank",
		description: "Den institution, der opbevarer og beskytter en investeringsforenings aktiver",
		publishedAt: "2026-06-16T12:12:00",
		updatedAt: "2026-06-30T11:38:00",
	},
	{
		id: "direkte-rente",
		title: "Direkte rente",
		description: "Den løbende renteindtægt på en obligation i forhold til dens aktuelle kurs",
		publishedAt: "2026-06-24T13:13:00",
		updatedAt: "2026-07-03T10:47:00",
	},
	{
		id: "disclosureforordningen",
		title: "Disclosureforordningen",
		description: "EU-reglerne der kræver, at finansielle produkter oplyser om bæredygtighed",
		publishedAt: "2026-06-16T10:17:00",
		updatedAt: "2026-06-30T11:44:00",
	},
	{
		id: "dividend-yield",
		title: "Dividend yield",
		description: "Udbytteafkastet — hvor meget udbytte du får i forhold til aktiekursen",
		publishedAt: "2026-04-08T07:53:00",
		updatedAt: "2026-04-10T07:51:00",
	},
	{
		id: "dobbeltprismetode",
		title: "Dobbeltprismetode",
		description: "En prisfastsættelsesmodel med separate kurser for køb og salg af fondsandele",
		publishedAt: "2026-03-27T08:32:00",
		updatedAt: "2026-04-03T12:17:00",
	},
	{
		id: "drivhusgasemissioner",
		title: "Drivhusgasemissioner",
		description: "Udledning af klimagasser og deres betydning som investeringsfaktor",
		publishedAt: "2026-03-04T10:04:00",
		updatedAt: "2026-03-09T08:24:00",
	},
	{
		id: "efama",
		title: "EFAMA",
		description:
			"Den europæiske brancheorganisation for investeringsforeninger og kapitalforvaltning",
		publishedAt: "2026-04-20T10:06:00",
		updatedAt: "2026-05-04T13:54:00",
	},
	{
		id: "efficient-rand",
		title: "Efficient rand",
		description: "Den optimale kombination af risiko og afkast i en portefølje",
		publishedAt: "2026-05-22T08:04:00",
		updatedAt: "2026-05-26T11:05:00",
	},
	{
		id: "eksklusion",
		title: "Eksklusion",
		description:
			"En ansvarlig investeringsstrategi, hvor bestemte selskaber eller sektorer udelukkes fra porteføljen",
		publishedAt: "2026-05-29T11:56:00",
		updatedAt: "2026-06-10T06:00:00",
	},
	{
		id: "emissionskurs",
		title: "Emissionskurs",
		description: "Den kurs, som nye værdipapirer udstedes til ved en emission",
		publishedAt: "2026-07-15T09:27:00",
		updatedAt: "2026-07-29T06:30:00",
	},
	{
		id: "emissionstillaeg",
		title: "Emissionstillæg",
		description:
			"Det gebyr, du betaler oven i den indre værdi, når du køber andele i en investeringsforening",
		publishedAt: "2026-05-22T08:41:00",
		updatedAt: "2026-06-05T07:36:00",
	},
	{
		id: "erhvervsobligationer",
		title: "Erhvervsobligationer",
		description: "Obligationer udstedt af virksomheder som alternativ til banklån",
		publishedAt: "2026-07-02T07:52:00",
		updatedAt: "2026-07-07T13:59:00",
	},
	{
		id: "esg-inside",
		title: "ESG Inside",
		description: "Fonde der inddrager ESG-faktorer uden at det er den primære strategi",
		publishedAt: "2026-04-20T09:00:00",
		updatedAt: "2026-04-29T12:58:00",
	},
	{
		id: "esg-integrated",
		title: "ESG Integrated",
		description:
			"En investeringstilgang, hvor ESG-faktorer systematisk indgår i den finansielle analyse",
		publishedAt: "2026-03-04T11:25:00",
		updatedAt: "2026-03-06T10:37:00",
	},
	{
		id: "esg-restricted",
		title: "ESG Restricted",
		description: "Fonde der udelukker bestemte sektorer eller selskaber baseret på ESG-kriterier",
		publishedAt: "2026-07-15T07:49:00",
		updatedAt: "2026-07-29T09:35:00",
	},
	{
		id: "esg-thematic",
		title: "ESG Thematic",
		description: "Fonde der investerer målrettet i specifikke bæredygtighedstemaer",
		publishedAt: "2026-06-17T07:48:00",
		updatedAt: "2026-06-25T11:24:00",
	},
	{
		id: "etablerede-markeder",
		title: "Etablerede markeder",
		description: "Udviklede økonomier med stabile finansielle markeder og høj velstand",
		publishedAt: "2026-04-29T10:18:00",
		updatedAt: "2026-05-11T11:13:00",
	},
	{
		id: "ex-kupon",
		title: "Ex kupon",
		description: "Når en obligation handles uden ret til den næste kuponbetaling",
		publishedAt: "2026-06-08T08:36:00",
		updatedAt: "2026-06-10T13:48:00",
	},
	{
		id: "fed-funds",
		title: "Fed Funds",
		description: "Den amerikanske styringsrente",
		publishedAt: "2026-03-18T07:30:00",
		updatedAt: "2026-04-01T07:07:00",
	},
	{
		id: "feederinstitut",
		title: "Feederinstitut",
		description: "En fond der investerer i én anden fond",
		publishedAt: "2026-07-15T11:12:00",
		updatedAt: "2026-07-22T06:57:00",
	},
	{
		id: "finanstilsynet",
		title: "Finanstilsynet",
		description: "Danmarks finansielle vagthund",
		publishedAt: "2026-08-13T11:13:00",
		updatedAt: "2026-08-17T06:03:00",
	},
	{
		id: "fondsaktieemission",
		title: "Fondsaktieemission",
		description: "Gratis aktier til eksisterende aktionærer",
		publishedAt: "2026-08-18T08:01:00",
		updatedAt: "2026-08-31T10:47:00",
	},
	{
		id: "fondskode",
		title: "Fondskode",
		description: "Det unikke ID for et værdipapir",
		publishedAt: "2026-05-11T10:04:00",
		updatedAt: "2026-05-25T13:53:00",
	},
	{
		id: "formidlingshonorar",
		title: "Formidlingshonorar",
		description: "Betaling til den, der sælger fonden",
		publishedAt: "2026-06-01T08:00:00",
		updatedAt: "2026-06-04T12:59:00",
	},
	{
		id: "forvaltningsafdeling",
		title: "Forvaltningsafdeling",
		description: "En separat portefølje inden for en investeringsforening",
		publishedAt: "2026-05-22T10:52:00",
		updatedAt: "2026-06-01T11:58:00",
	},
	{
		id: "franko-kurtage",
		title: "Franko kurtage",
		description: "Handel uden handelsomkostninger",
		publishedAt: "2026-04-29T11:27:00",
		updatedAt: "2026-05-08T11:44:00",
	},
	{
		id: "funds-of-funds",
		title: "Funds of funds",
		description: "En fond der investerer i andre fonde",
		publishedAt: "2026-08-11T09:25:00",
		updatedAt: "2026-08-24T10:50:00",
	},
	{
		id: "gabv",
		title: "GABV",
		description:
			"Global Alliance for Banking on Values — et netværk af banker, der prioriterer social og miljømæssig bæredygtighed",
		publishedAt: "2026-04-30T07:15:00",
		updatedAt: "2026-05-08T08:31:00",
	},
	{
		id: "generalforsamling",
		title: "Generalforsamling",
		description:
			"Aktionærernes årlige møde, hvor de kan stemme om vigtige beslutninger i selskabet",
		publishedAt: "2026-05-22T11:46:00",
		updatedAt: "2026-06-01T06:44:00",
	},
	{
		id: "geninvestering-af-udbytter",
		title: "Geninvestering af udbytter",
		description:
			"At bruge udbetalte udbytter til at købe flere aktier og dermed udnytte renters rente-effekten",
		publishedAt: "2026-05-22T12:43:00",
		updatedAt: "2026-05-26T10:51:00",
	},
	{
		id: "gennemsnitsmetoden",
		title: "Gennemsnitsmetoden",
		description:
			"Skattemæssig metode, hvor gevinst og tab beregnes ud fra den gennemsnitlige anskaffelseskurs",
		publishedAt: "2026-03-04T13:29:00",
		updatedAt: "2026-03-09T10:22:00",
	},
	{
		id: "geografisk-baseret",
		title: "Geografisk baseret",
		description:
			"Investeringsstrategi, hvor porteføljen sammensættes ud fra geografisk fordeling på tværs af regioner og lande",
		publishedAt: "2026-06-01T08:38:00",
		updatedAt: "2026-06-04T07:27:00",
	},
	{
		id: "giin",
		title: "GIIN",
		description:
			"Global Impact Investing Network — det førende netværk for investorer, der vil skabe målbar positiv forandring",
		publishedAt: "2026-05-11T13:39:00",
		updatedAt: "2026-05-13T13:23:00",
	},
	{
		id: "handelsomkostninger",
		title: "Handelsomkostninger",
		description:
			"De samlede udgifter forbundet med at købe og sælge værdipapirer, herunder kurtage, spread og valutagebyrer.",
		publishedAt: "2026-03-30T10:56:00",
		updatedAt: "2026-04-13T07:58:00",
	},
	{
		id: "high-yield",
		title: "High Yield",
		description:
			"En aktivklasse bestående af obligationer med høj rente og forhøjet kreditrisiko, vurderet under investment grade.",
		publishedAt: "2026-05-25T08:34:00",
		updatedAt: "2026-06-04T06:55:00",
	},
	{
		id: "hoejrentelande",
		title: "Højrentelande",
		description:
			"Lande med højere renteniveauer end de udviklede økonomier, typisk emerging markets med større økonomisk usikkerhed.",
		publishedAt: "2026-04-10T10:28:00",
		updatedAt: "2026-04-17T06:27:00",
	},
	{
		id: "hoejrenteobligationer",
		title: "Højrenteobligationer",
		description:
			"Obligationer med højere rente end investment grade, der kan bidrage med diversificering og løbende afkast i en portefølje.",
		publishedAt: "2026-05-12T11:18:00",
		updatedAt: "2026-05-21T06:49:00",
	},
	{
		id: "honorar-for-portefoeljeraadgivning",
		title: "Honorar for porteføljerådgivning",
		description:
			"Den betaling du yder for professionel rådgivning om sammensætning og vedligeholdelse af din investeringsportefølje.",
		publishedAt: "2026-04-10T09:00:00",
		updatedAt: "2026-04-15T10:45:00",
	},
	{
		id: "horisontafkast",
		title: "Horisontafkast",
		description:
			"Det samlede afkast en investering genererer over en bestemt holdeperiode, inklusiv kursgevinster og løbende udbetalinger.",
		publishedAt: "2026-04-21T09:25:00",
		updatedAt: "2026-04-29T13:56:00",
	},
	{
		id: "impact",
		title: "Impact",
		description: "Den målbare sociale eller miljømæssige effekt af en investering",
		publishedAt: "2026-06-01T09:58:00",
		updatedAt: "2026-06-04T06:14:00",
	},
	{
		id: "impact-first",
		title: "Impact First",
		description:
			"En investeringstilgang hvor den positive samfundseffekt prioriteres over det finansielle afkast",
		publishedAt: "2026-03-05T08:55:00",
		updatedAt: "2026-03-13T13:31:00",
	},
	{
		id: "indeksbaseret",
		title: "Indeksbaseret",
		description:
			"En passiv investeringsstrategi der følger et markedsindeks frem for at forsøge at slå det",
		publishedAt: "2026-07-24T08:09:00",
		updatedAt: "2026-08-06T11:42:00",
	},
	{
		id: "indeksobligationer",
		title: "Indeksobligationer",
		description: "Obligationer hvis hovedstol og rente reguleres med inflationen",
		publishedAt: "2026-05-12T12:43:00",
		updatedAt: "2026-05-18T12:56:00",
	},
	{
		id: "indirekte-omkostninger",
		title: "Indirekte omkostninger",
		description: "De skjulte udgifter ved investering som ikke fremgår direkte af fondens pris",
		publishedAt: "2026-08-11T11:23:00",
		updatedAt: "2026-08-17T06:40:00",
	},
	{
		id: "indloesningsgaranti",
		title: "Indløsningsgaranti",
		description:
			"En garanti for at du altid kan sælge dine andele i en fond tilbage til foreningen",
		publishedAt: "2026-04-21T12:05:00",
		updatedAt: "2026-04-29T06:37:00",
	},
	{
		id: "indloesningskurs",
		title: "Indløsningskurs",
		description: "Den pris du får, når du sælger dine andele tilbage til en investeringsforening",
		publishedAt: "2026-07-15T12:56:00",
		updatedAt: "2026-07-29T07:56:00",
	},
	{
		id: "indtraedelsesomkostning",
		title: "Indtrædelsesomkostning",
		description: "Det gebyr du betaler, når du køber andele i en investeringsforening",
		publishedAt: "2026-06-01T11:47:00",
		updatedAt: "2026-06-08T07:42:00",
	},
	{
		id: "information-ratio",
		title: "Information ratio",
		description:
			"Et nøgletal der måler en fondsmanagers evne til at skabe merafkast i forhold til risikoen",
		publishedAt: "2026-03-31T07:10:00",
		updatedAt: "2026-04-06T12:18:00",
	},
	{
		id: "institutionelle-investorer",
		title: "Institutionelle investorer",
		description:
			"Store professionelle investorer som pensionskasser, forsikringsselskaber og fonde",
		publishedAt: "2026-07-30T09:22:00",
		updatedAt: "2026-08-12T08:14:00",
	},
	{
		id: "intraday-graf",
		title: "Intraday-graf",
		description:
			"Et diagram der viser et værdipapirs kursudvikling i løbet af en enkelt handelsdag",
		publishedAt: "2026-08-13T13:35:00",
		updatedAt: "2026-08-17T13:37:00",
	},
	{
		id: "investeringsbevis",
		title: "Investeringsbevis",
		description: "Et bevis for ejerskab af andele i en investeringsforening",
		publishedAt: "2026-07-30T07:18:00",
		updatedAt: "2026-08-05T12:44:00",
	},
	{
		id: "investeringsforvaltningsselskab",
		title: "Investeringsforvaltningsselskab",
		description:
			"Et selskab der varetager den daglige administration og forvaltning af investeringsforeninger",
		publishedAt: "2026-08-21T13:26:00",
		updatedAt: "2026-09-04T11:34:00",
	},
	{
		id: "investeringshorisont",
		title: "Investeringshorisont",
		description:
			"Den tidsperiode du planlægger at holde din investering, før du har brug for pengene",
		publishedAt: "2026-04-22T06:54:00",
		updatedAt: "2026-04-29T08:53:00",
	},
	{
		id: "investeringspolitik",
		title: "Investeringspolitik",
		description:
			"De rammer og retningslinjer der definerer, hvordan en fond investerer sine midler",
		publishedAt: "2026-06-08T13:03:00",
		updatedAt: "2026-06-15T09:52:00",
	},
	{
		id: "investeringsstil",
		title: "Investeringsstil",
		description:
			"Den overordnede tilgang en fond eller investor bruger til at udvælge investeringer",
		publishedAt: "2026-05-13T07:29:00",
		updatedAt: "2026-05-25T11:59:00",
	},
	{
		id: "kid",
		title: "KID",
		description:
			"Et standardiseret informationsdokument der giver investorer overblik over en investeringsprodukts risiko og omkostninger",
		publishedAt: "2026-08-05T07:56:00",
		updatedAt: "2026-08-10T13:33:00",
	},
	{
		id: "klasser",
		title: "Klasser",
		description:
			"Forskellige varianter af aktier eller fondsandele i samme selskab eller fond med forskellige rettigheder",
		publishedAt: "2026-08-11T12:23:00",
		updatedAt: "2026-08-25T13:33:00",
	},
	{
		id: "kontofoerende-investeringsforening",
		title: "Kontoførende investeringsforening",
		description:
			"En investeringsforening hvor dine andele registreres på en konto i stedet for som omsættelige beviser",
		publishedAt: "2026-08-07T10:24:00",
		updatedAt: "2026-08-10T07:56:00",
	},
	{
		id: "kontroversielle-vaaben",
		title: "Kontroversielle våben",
		description:
			"Våbentyper som klyngebomber og landminer der er udelukket fra de fleste investeringsporteføljer",
		publishedAt: "2026-07-16T07:15:00",
		updatedAt: "2026-07-29T13:02:00",
	},
	{
		id: "korrelationskoefficient",
		title: "Korrelationskoefficient",
		description:
			"Et statistisk mål der viser, hvor tæt to investeringer bevæger sig i forhold til hinanden",
		publishedAt: "2026-06-01T12:29:00",
		updatedAt: "2026-06-09T08:29:00",
	},
	{
		id: "korte-obligationer",
		title: "Korte obligationer",
		description:
			"Obligationer med kort løbetid og lav varighed, der giver stabilitet og begrænset renterisiko",
		publishedAt: "2026-03-06T07:16:00",
		updatedAt: "2026-03-12T13:02:00",
	},
	{
		id: "kreditobligation",
		title: "Kreditobligation",
		description:
			"En obligation udstedt af virksomheder eller stater med kreditrisiko, der giver højere rente end statsobligationer",
		publishedAt: "2026-08-14T06:55:00",
		updatedAt: "2026-08-28T11:36:00",
	},
	{
		id: "kreditpraemie",
		title: "Kreditpræmie",
		description:
			"Den ekstra rente investorer kræver for at påtage sig risikoen ved en kreditobligation frem for en statsobligation",
		publishedAt: "2026-03-20T07:33:00",
		updatedAt: "2026-04-01T06:55:00",
	},
	{
		id: "kreditrisiko",
		title: "Kreditrisiko",
		description:
			"Risikoen for at en udsteder af et værdipapir ikke kan overholde sine betalingsforpligtelser",
		publishedAt: "2026-04-22T08:01:00",
		updatedAt: "2026-04-27T10:26:00",
	},
	{
		id: "kreditspraend",
		title: "Kreditspænd",
		description:
			"Renteforskellen mellem en kreditobligation og en risikofri statsobligation med samme løbetid",
		publishedAt: "2026-07-09T11:29:00",
		updatedAt: "2026-07-13T06:44:00",
	},
	{
		id: "kreditvurdering",
		title: "Kreditvurdering",
		description:
			"En vurdering af en udsteders evne til at overholde sine finansielle forpligtelser, foretaget af et ratingbureau",
		publishedAt: "2026-04-13T10:10:00",
		updatedAt: "2026-04-20T06:47:00",
	},
	{
		id: "kursrisiko",
		title: "Kursrisiko",
		description: "Risikoen for at et værdipapirs markedsværdi falder på grund af markedsbevægelser",
		publishedAt: "2026-05-13T10:18:00",
		updatedAt: "2026-05-25T10:13:00",
	},
	{
		id: "lagerprincippet",
		title: "Lagerprincippet",
		description: "Det skattemæssige princip, hvor gevinst og tab opgøres årligt",
		publishedAt: "2026-05-26T07:46:00",
		updatedAt: "2026-06-01T12:05:00",
	},
	{
		id: "landerisiko",
		title: "Landerisiko",
		description:
			"Risikoen ved at investere i et specifikt land pga. politiske eller økonomiske forhold",
		publishedAt: "2026-03-31T10:54:00",
		updatedAt: "2026-04-10T12:33:00",
	},
	{
		id: "likvide-midler",
		title: "Likvide midler",
		description: "Kontanter og aktiver, der hurtigt kan omsættes til kontanter",
		publishedAt: "2026-05-14T07:54:00",
		updatedAt: "2026-05-26T10:27:00",
	},
	{
		id: "loebende-administrationsomkostninger",
		title: "Løbende administrationsomkostninger",
		description:
			"De årlige omkostninger ved at eje en investeringsfond, ofte opgivet som del af ÅOP",
		publishedAt: "2026-06-02T09:22:00",
		updatedAt: "2026-06-08T08:00:00",
	},
	{
		id: "loebetid",
		title: "Løbetid",
		description: "Den periode, der er tilbage, til en obligation udløber og indfries",
		publishedAt: "2026-03-20T09:25:00",
		updatedAt: "2026-03-23T13:30:00",
	},
	{
		id: "management-honorar",
		title: "Management-honorar",
		description: "Det danske udtryk for det løbende gebyr du betaler til din fondsforvalter",
		publishedAt: "2026-07-09T13:28:00",
		updatedAt: "2026-07-13T12:14:00",
	},
	{
		id: "markedsindeks",
		title: "Markedsindeks",
		description:
			"Et nøgletal der måler udviklingen i en gruppe af aktier og fungerer som benchmark for dine investeringer",
		publishedAt: "2026-06-18T12:41:00",
		updatedAt: "2026-07-01T10:16:00",
	},
	{
		id: "markedsrisiko",
		title: "Markedsrisiko",
		description: "Den risiko der rammer hele markedet og ikke kan diversificeres væk",
		publishedAt: "2026-03-20T11:13:00",
		updatedAt: "2026-03-27T09:48:00",
	},
	{
		id: "master-feeder-fund",
		title: "Master feeder fund",
		description: "En fondsstruktur hvor flere feederfonde samler kapitalen i én central masterfond",
		publishedAt: "2026-07-02T12:34:00",
		updatedAt: "2026-07-07T12:33:00",
	},
	{
		id: "masterinstitut",
		title: "Masterinstitut",
		description: "En central investeringsenhed der samler kapital fra flere afdelinger eller fonde",
		publishedAt: "2026-05-14T12:14:00",
		updatedAt: "2026-05-28T09:36:00",
	},
	{
		id: "merafkast",
		title: "Merafkast",
		description: "Det ekstra afkast du opnår ud over et benchmark eller den risikofrie rente",
		publishedAt: "2026-06-19T07:39:00",
		updatedAt: "2026-06-22T12:57:00",
	},
	{
		id: "mifid",
		title: "MiFID",
		description: "EU-direktivet der regulerer investeringsservice og beskytter dig som investor",
		publishedAt: "2026-03-06T12:22:00",
		updatedAt: "2026-03-16T07:58:00",
	},
	{
		id: "mindsterente",
		title: "Mindsterente",
		description: "En dansk skatteregel der bestemmer, hvordan afkast på obligationer beskattes",
		publishedAt: "2026-06-02T11:01:00",
		updatedAt: "2026-06-04T12:16:00",
	},
	{
		id: "money-market-funds",
		title: "Money market funds",
		description:
			"Fonde der investerer i kortfristede gældsinstrumenter og tilbyder høj sikkerhed med lavt afkast",
		publishedAt: "2026-07-16T11:50:00",
		updatedAt: "2026-07-24T10:50:00",
	},
	{
		id: "morningstar",
		title: "Morningstar",
		description:
			"Verdens førende udbyder af fondsvurderinger og et uvurderligt værktøj for danske investorer",
		publishedAt: "2026-05-04T07:55:00",
		updatedAt: "2026-05-15T12:04:00",
	},
	{
		id: "morningstar-sustainability-rating",
		title: "Morningstar Sustainability Rating",
		description: "En vurdering af hvor bæredygtige fondenes underliggende investeringer er",
		publishedAt: "2026-06-10T08:54:00",
		updatedAt: "2026-06-22T07:31:00",
	},
	{
		id: "normbaseret-screening",
		title: "Normbaseret screening",
		description: "Investering efter internationale standarder",
		publishedAt: "2026-04-23T08:12:00",
		updatedAt: "2026-05-07T08:31:00",
	},
	{
		id: "obligationsindeks",
		title: "Obligationsindeks",
		description: "En målestok for obligationsmarkedet",
		publishedAt: "2026-05-05T12:51:00",
		updatedAt: "2026-05-11T10:58:00",
	},
	{
		id: "observationsliste",
		title: "Observationsliste",
		description: "Selskaber under skærpet opsyn",
		publishedAt: "2026-05-15T09:47:00",
		updatedAt: "2026-05-29T08:12:00",
	},
	{
		id: "officiel-afkaststatistik",
		title: "Officiel afkaststatistik",
		description: "Standardiseret afkastrapportering for danske fonde",
		publishedAt: "2026-03-09T08:20:00",
		updatedAt: "2026-03-19T09:40:00",
	},
	{
		id: "omsaetningshastighed",
		title: "Omsætningshastighed",
		description: "Hvor ofte en fond handler sine værdipapirer",
		publishedAt: "2026-04-15T07:57:00",
		updatedAt: "2026-04-27T10:50:00",
	},
	{
		id: "omxc20",
		title: "OMXC20",
		description: "Danmarks vigtigste aktieindeks",
		publishedAt: "2026-04-23T10:19:00",
		updatedAt: "2026-05-01T10:10:00",
	},
	{
		id: "paalydende-rente",
		title: "Pålydende rente",
		description: "Den rente, obligationen lover at betale",
		publishedAt: "2026-03-09T12:06:00",
		updatedAt: "2026-03-17T08:40:00",
	},
	{
		id: "pai",
		title: "PAI",
		description: "Principal Adverse Impacts på bæredygtighed",
		publishedAt: "2026-07-10T08:49:00",
		updatedAt: "2026-07-20T09:57:00",
	},
	{
		id: "passivt-styrede-afdelinger",
		title: "Passivt styrede afdelinger",
		description: "Fonde der følger et indeks",
		publishedAt: "2026-03-09T13:17:00",
		updatedAt: "2026-03-16T11:41:00",
	},
	{
		id: "pensionsopsparing",
		title: "Pensionsopsparing",
		description: "Din langtidsopsparing til livet efter arbejdslivet",
		publishedAt: "2026-03-09T10:51:00",
		updatedAt: "2026-03-23T10:58:00",
	},
	{
		id: "performance",
		title: "Performance",
		description: "Hvordan en investering har klaret sig over tid",
		publishedAt: "2026-06-10T13:14:00",
		updatedAt: "2026-06-15T06:02:00",
	},
	{
		id: "portefoeljeraadgiver",
		title: "Porteføljerådgiver",
		description: "En professionel, der hjælper dig med at sammensætte og styre dine investeringer",
		publishedAt: "2026-05-15T11:01:00",
		updatedAt: "2026-05-20T06:11:00",
	},
	{
		id: "positiv-screening",
		title: "Positiv screening",
		description: "At vælge investeringer ud fra positive ESG-kriterier",
		publishedAt: "2026-06-19T13:02:00",
		updatedAt: "2026-06-26T08:22:00",
	},
	{
		id: "pris-metode",
		title: "Pris-metode",
		description: "Måden en investeringsforenings andelspris beregnes på",
		publishedAt: "2026-07-27T10:20:00",
		updatedAt: "2026-08-03T09:14:00",
	},
	{
		id: "pulje",
		title: "Pulje",
		description: "En fælles investeringspulje, hvor mange investorers penge samles",
		publishedAt: "2026-07-27T08:55:00",
		updatedAt: "2026-08-03T11:26:00",
	},
	{
		id: "rating",
		title: "Rating",
		description: "En vurdering af kreditværdighed eller investeringskvalitet",
		publishedAt: "2026-06-11T07:31:00",
		updatedAt: "2026-06-19T12:39:00",
	},
	{
		id: "ratingbureau",
		title: "Ratingbureau",
		description:
			"Virksomheder, der vurderer kreditværdigheden af stater, selskaber og værdipapirer",
		publishedAt: "2026-06-22T08:38:00",
		updatedAt: "2026-06-30T06:19:00",
	},
	{
		id: "realafkast",
		title: "Realafkast",
		description: "Dit afkast justeret for inflation — den reelle købekraftsforøgelse",
		publishedAt: "2026-07-17T11:36:00",
		updatedAt: "2026-07-20T06:56:00",
	},
	{
		id: "realiseret-gevinst-tab",
		title: "Realiseret gevinst/tab",
		description:
			"Den faktiske gevinst eller det faktiske tab, du opnår, når du sælger en investering",
		publishedAt: "2026-03-10T10:40:00",
		updatedAt: "2026-03-16T10:06:00",
	},
	{
		id: "realkreditinstitut",
		title: "Realkreditinstitut",
		description:
			"Et finansielt institut der yder lån mod pant i fast ejendom og finansierer dem via obligationsudstedelse",
		publishedAt: "2026-03-10T08:16:00",
		updatedAt: "2026-03-24T08:12:00",
	},
	{
		id: "rekyl",
		title: "Rekyl",
		description: "Et kortvarigt prisbounce i modsat retning af den overordnede trend",
		publishedAt: "2026-06-11T08:51:00",
		updatedAt: "2026-06-15T13:14:00",
	},
	{
		id: "rentefoelsomhed",
		title: "Rentefølsomhed",
		description: "Et mål for hvor meget en obligations kurs ændrer sig, når renten bevæger sig",
		publishedAt: "2026-03-23T12:57:00",
		updatedAt: "2026-04-01T13:46:00",
	},
	{
		id: "renterisiko",
		title: "Renterisiko",
		description: "Risikoen for at ændringer i renteniveauet påvirker værdien af dine investeringer",
		publishedAt: "2026-07-10T12:53:00",
		updatedAt: "2026-07-15T08:50:00",
	},
	{
		id: "reporente",
		title: "Reporente",
		description:
			"Den rente som centralbanker bruger til kortfristede udlån til kommercielle banker",
		publishedAt: "2026-05-06T10:40:00",
		updatedAt: "2026-05-11T06:28:00",
	},
	{
		id: "risikopraemie",
		title: "Risikopræmie",
		description:
			"Det merafkast en investor kræver for at påtage sig risiko ud over den risikofrie rente",
		publishedAt: "2026-06-03T08:40:00",
		updatedAt: "2026-06-12T13:05:00",
	},
	{
		id: "samlet-gevinst-tab",
		title: "Samlet gevinst/tab",
		description:
			"Det totale urealiserede eller realiserede resultat på en investering, opgjort som forskellen mellem købs- og salgspris inklusive omkostninger.",
		publishedAt: "2026-03-24T10:23:00",
		updatedAt: "2026-03-30T07:46:00",
	},
	{
		id: "science-based-targets",
		title: "Science-Based Targets (SBT)",
		description:
			"Videnskabeligt funderede klimamål, som virksomheder sætter for at reducere deres CO2-udledning i tråd med Parisaftalen.",
		publishedAt: "2026-04-27T07:22:00",
		updatedAt: "2026-05-05T12:45:00",
	},
	{
		id: "sektorrisiko",
		title: "Sektorrisiko",
		description:
			"Risikoen for tab som følge af negative udviklinger, der rammer en bestemt branche eller sektor.",
		publishedAt: "2026-03-24T11:42:00",
		updatedAt: "2026-04-06T07:48:00",
	},
	{
		id: "selskabsrisiko",
		title: "Selskabsrisiko",
		description:
			"Den risiko der er knyttet til et enkelt selskab, herunder dårlig ledelse, regnskabsproblemer eller tab af markedsandele.",
		publishedAt: "2026-08-28T09:29:00",
		updatedAt: "2026-09-11T13:45:00",
	},
	{
		id: "short",
		title: "Short",
		description:
			"En investeringsposition, hvor man tjener penge på kursfald ved at sælge lånte værdipapirer med henblik på at købe dem billigere tilbage.",
		publishedAt: "2026-07-30T12:12:00",
		updatedAt: "2026-08-03T11:16:00",
	},
	{
		id: "skattefri-indkomst",
		title: "Skattefri indkomst",
		description:
			"Indkomst der ikke skal beskattes, herunder afkast inden for visse fribeløb og på særlige kontotyper som aktiesparekontoen.",
		publishedAt: "2026-04-24T12:11:00",
		updatedAt: "2026-04-27T11:34:00",
	},
	{
		id: "skattekurs",
		title: "Skattekurs",
		description:
			"Den kursværdi som SKAT bruger til at fastsætte værdien af unoterede aktier og anparter ved arv, gave eller overdragelse.",
		publishedAt: "2026-05-06T13:08:00",
		updatedAt: "2026-05-14T07:01:00",
	},
	{
		id: "speculative-grade",
		title: "Speculative Grade",
		description:
			"Obligationer med lav kreditvurdering, der ligger under investment grade og indebærer højere risiko for misligholdelse.",
		publishedAt: "2026-08-19T12:53:00",
		updatedAt: "2026-08-31T08:15:00",
	},
	{
		id: "spread-produkter",
		title: "Spread-produkter",
		description:
			"Strukturerede investeringsprodukter, hvor afkastet afhænger af forskellen (spreadet) mellem to priser eller renter.",
		publishedAt: "2026-03-11T07:59:00",
		updatedAt: "2026-03-25T10:41:00",
	},
	{
		id: "staaende-laan",
		title: "Stående lån",
		description: "Et lån, hvor du kun betaler renter — og først indfrier hele gælden til sidst",
		publishedAt: "2026-06-29T12:55:00",
		updatedAt: "2026-07-07T07:52:00",
	},
	{
		id: "stockpicking",
		title: "Stockpicking",
		description: "Kunsten at vælge enkeltaktier — og hvorfor det er sværere, end det lyder",
		publishedAt: "2026-06-11T13:18:00",
		updatedAt: "2026-06-16T09:24:00",
	},
	{
		id: "stop-profit",
		title: "Stop profit",
		description:
			"En ordre, der automatisk sælger din investering, når den rammer et bestemt kursmål",
		publishedAt: "2026-05-18T11:49:00",
		updatedAt: "2026-05-28T09:50:00",
	},
	{
		id: "stykstoerelse",
		title: "Stykstørrelse",
		description: "Den mindste enhed, du kan handle et værdipapir i",
		publishedAt: "2026-07-20T07:59:00",
		updatedAt: "2026-07-30T08:26:00",
	},
	{
		id: "suspension",
		title: "Suspension",
		description: "Når handlen med et værdipapir midlertidigt stoppes",
		publishedAt: "2026-06-03T09:55:00",
		updatedAt: "2026-06-05T10:49:00",
	},
	{
		id: "target",
		title: "Target",
		description: "Et kursmål — analytikernes bud på, hvad en aktie bør være værd",
		publishedAt: "2026-04-03T09:13:00",
		updatedAt: "2026-04-13T13:54:00",
	},
	{
		id: "tegningsprospekt",
		title: "Tegningsprospekt",
		description: "Det officielle dokument, der beskriver en ny udstedelse af værdipapirer",
		publishedAt: "2026-07-13T10:58:00",
		updatedAt: "2026-07-20T08:17:00",
	},
	{
		id: "tegningsprovision",
		title: "Tegningsprovision",
		description: "Det gebyr, du betaler, når du køber andele i en investeringsfond",
		publishedAt: "2026-07-13T09:46:00",
		updatedAt: "2026-07-27T06:41:00",
	},
	{
		id: "totalindeks",
		title: "Totalindeks",
		description: "Et indeks, der viser det samlede afkast — inklusive geninvesteret udbytte",
		publishedAt: "2026-05-07T08:08:00",
		updatedAt: "2026-05-11T07:12:00",
	},
	{
		id: "trading-range",
		title: "Trading range",
		description: "Det interval, en aktiekurs bevæger sig inden for over en periode",
		publishedAt: "2026-07-13T08:39:00",
		updatedAt: "2026-07-16T08:19:00",
	},
	{
		id: "transaktionsomkostninger",
		title: "Transaktionsomkostninger",
		description: "De udgifter, der følger med, hver gang du handler værdipapirer",
		publishedAt: "2026-04-16T08:31:00",
		updatedAt: "2026-04-28T07:56:00",
	},
	{
		id: "udbyttebetalende",
		title: "Udbyttebetalende",
		description: "En fond eller aktie, der løbende udbetaler udbytte til investorerne",
		publishedAt: "2026-06-30T08:02:00",
		updatedAt: "2026-07-03T07:05:00",
	},
	{
		id: "udbytteprocent",
		title: "Udbytteprocent",
		description: "Forholdet mellem udbyttet og aktiekursen — et mål for dit løbende afkast",
		publishedAt: "2026-05-19T10:30:00",
		updatedAt: "2026-05-26T07:22:00",
	},
	{
		id: "uden-udbytte",
		title: "Uden udbytte",
		description: "Når en aktie handles uden ret til det kommende udbytte",
		publishedAt: "2026-03-25T08:18:00",
		updatedAt: "2026-03-30T09:38:00",
	},
	{
		id: "udloddende",
		title: "Udloddende",
		description:
			"En fondstype, der udbetaler sit afkast til investorerne i stedet for at geninvestere det",
		publishedAt: "2026-06-15T06:47:00",
		updatedAt: "2026-06-18T12:01:00",
	},
	{
		id: "udtraedelsesomkostning",
		title: "Udtrædelsesomkostning",
		description: "Det gebyr, du betaler, når du sælger dine andele i en investeringsfond",
		publishedAt: "2026-05-07T08:37:00",
		updatedAt: "2026-05-12T11:42:00",
	},
	{
		id: "unoteret",
		title: "Unoteret",
		description: "Et selskab eller værdipapir, der ikke er optaget til handel på en børs",
		publishedAt: "2026-04-27T10:22:00",
		updatedAt: "2026-05-06T13:48:00",
	},
	{
		id: "unpri",
		title: "UNPRI",
		description:
			"FN's principper for ansvarlig investering — en global standard for bæredygtig investering",
		publishedAt: "2026-06-22T13:34:00",
		updatedAt: "2026-07-01T07:48:00",
	},
	{
		id: "upside",
		title: "Upside",
		description: "Det potentielle kursstigning i en investering",
		publishedAt: "2026-06-12T13:04:00",
		updatedAt: "2026-06-15T11:01:00",
	},
	{
		id: "vaerdipapiromsaetning",
		title: "Værdipapiromsætning",
		description: "Den samlede værdi af handlede værdipapirer over en given periode",
		publishedAt: "2026-07-31T07:46:00",
		updatedAt: "2026-08-13T06:55:00",
	},
	{
		id: "valutasikring",
		title: "Valutasikring",
		description: "Beskyttelse mod udsving i valutakurser, når du investerer i udlandet",
		publishedAt: "2026-03-25T09:04:00",
		updatedAt: "2026-04-07T11:04:00",
	},
	{
		id: "variabel-rente",
		title: "Variabel rente",
		description: "En rente, der ændrer sig løbende i takt med markedsrenten",
		publishedAt: "2026-03-25T10:28:00",
		updatedAt: "2026-03-31T08:30:00",
	},
	{
		id: "vedtaegter",
		title: "Vedtægter",
		description: 'Et selskabs grundlæggende regler og rammer — dets "grundlov"',
		publishedAt: "2026-06-15T07:48:00",
		updatedAt: "2026-06-22T09:08:00",
	},
	{
		id: "virksomhedsobligationer",
		title: "Virksomhedsobligationer",
		description: "Obligationer udstedt af virksomheder — højere rente, men også højere risiko",
		publishedAt: "2026-06-23T09:04:00",
		updatedAt: "2026-06-29T06:45:00",
	},
	{
		id: "vp-konto",
		title: "VP-konto",
		description: "Din elektroniske konto for opbevaring af danske værdipapirer",
		publishedAt: "2026-06-04T07:17:00",
		updatedAt: "2026-06-15T12:52:00",
	},
	{
		id: "wacc",
		title: "WACC",
		description: "Virksomhedens samlede kapitalomkostning",
		publishedAt: "2026-04-06T07:54:00",
		updatedAt: "2026-04-08T06:57:00",
	},
	{
		id: "warrant",
		title: "Warrant",
		description: "Retten til at købe aktier til en fastsat pris",
		publishedAt: "2026-03-25T11:17:00",
		updatedAt: "2026-04-06T10:49:00",
	},
	{
		id: "x-dag",
		title: "X-dag",
		description: "Dagen, der afgør om du får udbytte",
		publishedAt: "2026-03-13T08:36:00",
		updatedAt: "2026-03-16T13:36:00",
	},
];
