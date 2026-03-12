export type Module = {
	id: string;
	title: string;
	description: string;
	lessons: Lesson[];
};

export type Lesson = {
	id: string;
	title: string;
	description: string;
	video: {
		thumbnail: string;
		duration: number;
		url: string;
	} | null;
};

export function getModules(): Module[] {
	return lessons;
}

export async function getLesson(
	slug: string,
): Promise<(Lesson & { module: Module; next: Lesson | null }) | null> {
	const module = lessons.find(({ lessons }) => lessons.some(({ id }) => id === slug));

	if (!module) {
		return null;
	}

	const index = module.lessons.findIndex(({ id }) => id === slug);

	return {
		...module.lessons[index],
		module,
		next: index < module.lessons.length - 1 ? module.lessons[index + 1] : null,
	};
}

export async function getLessonContent(slug: string) {
	const module = lessons.find(({ lessons }) => lessons.some(({ id }) => id === slug));

	if (!module) {
		return null;
	}

	return (await import(`@/data/lessons/${module.id}/${slug}.mdx`)).default;
}

const lessons = [
	{
		id: "velkommen-og-fundament",
		title: "Velkommen og fundament",
		description:
			"Sæt rammer for kurset og skab økonomisk overblik, buffer og beslutningsgrundlag før du investerer.",
		lessons: [
			{
				id: "velkommen-til-kurset",
				title: "Velkommen til kurset",
				description: "Sæt rammer, forventninger og risikodisclaimer.",
				video: null,
			},
			{
				id: "budget-og-overblik",
				title: "Byg dit budget og skab overblik",
				description: "Lav et budget med faste og variable poster samt buffer.",
				video: null,
			},
			{
				id: "prioritering-og-styring",
				title: "Prioritér og styr din økonomi løbende",
				description: "Implementer rutiner: månedlig status og årlig plan.",
				video: null,
			},
			{
				id: "oekonomisk-frihed",
				title: "Sæt mål for økonomisk frihed",
				description: "Skelne mellem frihedsmål og investeringsmål; undgå urealistiske tal.",
				video: null,
			},
			{
				id: "flere-indtaegtskilder",
				title: "Forstå flere indtægtskilder",
				description: "Forskel på aktiv og passiv indkomst og administrative krav.",
				video: null,
			},
			{
				id: "foerste-boligkoeb",
				title: "Planlæg dit første boligkøb",
				description: "Forstå proces, beslutningspunkter og samspil mellem økonomi og boligskat.",
				video: null,
			},
			{
				id: "gaeld-eller-investering",
				title: "Vurdér gældsafvikling vs. investering",
				description: "Sammenlign sikkert afkast ved gældsafvikling med markedsrisiko.",
				video: null,
			},
		],
	},
	{
		id: "investeringens-grundprincipper",
		title: "Investeringens grundprincipper",
		description:
			"Forstå hvorfor og hvordan investering virker, inkl. renters rente, inflation, valuta og din første beslutningsramme.",
		lessons: [
			{
				id: "fra-inspiration-til-metode",
				title: "Fra inspiration til metode",
				description: "Lær at skelne inspiration fra metode og undgå survivorship bias.",
				video: null,
			},
			{
				id: "renters-rente",
				title: "Forstå renters rente",
				description: "Beregn effekt af tid, indbetaling og afkast.",
				video: null,
			},
			{
				id: "inflation-og-realafkast",
				title: "Inflation og realafkast",
				description:
					"Forstå forskellen på nominelt og reelt afkast og hvorfor inflation udhuler købekraft.",
				video: null,
			},
			{
				id: "hvorfor-investering-virker",
				title: "Hvorfor investering virker over tid",
				description: "Forstå risikopræmie, diversifikation og disciplin som drivere.",
				video: null,
			},
			{
				id: "valuta-og-international-investering",
				title: "Valuta og international investering",
				description: "Forstå valutarisiko ved udenlandske ETF'er og eksponering mod USD/EUR.",
				video: null,
			},
			{
				id: "laeg-din-begynderstrategi",
				title: "Læg din begynderstrategi",
				description: "Vælg en simpel proces: mål, tid, risiko, produkt og rutine.",
				video: null,
			},
		],
	},
	{
		id: "aktivklasser",
		title: "Aktivklasser",
		description:
			"Forstå de vigtigste aktivklasser, deres rolle og centrale risici i dansk kontekst.",
		lessons: [
			{
				id: "hvad-er-aktier",
				title: "Forstå aktier og afkast",
				description: "Udbytte vs. kursgevinst; risiko og diversifikation.",
				video: null,
			},
			{
				id: "aktiefonde-og-etfer",
				title: "Forstå aktiefonde og ETF'er",
				description: "Bred eksponering, omkostninger og dokumenter (PRIIP KID).",
				video: null,
			},
			{
				id: "obligationer",
				title: "Forstå obligationer og deres rolle",
				description: "Renterisiko, kursfølsomhed og porteføljerolle.",
				video: null,
			},
			{
				id: "baeredygtig-investering",
				title: "Vurdér bæredygtig investering",
				description: "Stil de rigtige spørgsmål til bæredygtighed og dokumentation.",
				video: null,
			},
			{
				id: "portefoeljesammensaetning",
				title: "Sammensæt din portefølje",
				description: "Byg en policy-portefølje med udgangspunkt i aktivklasser.",
				video: null,
			},
		],
	},
	{
		id: "strategi-og-adfaerd",
		title: "Strategi og adfærd",
		description: "Byg en strategi der passer til din risikoprofil og kan fastholdes i nedture.",
		lessons: [
			{
				id: "hvad-er-en-investeringsstrategi",
				title: "Definér din investeringsstrategi",
				description: "Skelne mellem strategi, taktik og spekulation.",
				video: null,
			},
			{
				id: "risiko-og-risikoprofil",
				title: "Kortlæg din risikoprofil",
				description: "Forstå tabstolerance, tidshorisont og kapacitet til risiko.",
				video: null,
			},
			{
				id: "investorpsykologi",
				title: "Genkend psykologiske fælder",
				description: "Identificer tabsaversion og overkonfidens samt byg procesværn.",
				video: null,
			},
			{
				id: "sammensaet-din-strategi",
				title: "Sammensæt din strategi",
				description: "Vælg strategi ud fra adfærd, omkostninger og dokumentation.",
				video: null,
			},
			{
				id: "rebalancering",
				title: "Rebalancér din portefølje",
				description: "Forstå hvornår og hvordan du genopretter din målallokering.",
				video: null,
			},
			{
				id: "investering-i-nedture",
				title: "Investér disciplineret i nedture",
				description: "Forstå planlagt adfærd ved fald og stress-scenarier.",
				video: null,
			},
		],
	},
	{
		id: "analyse",
		title: "Analyse",
		description: "Læs regnskab, lav fundamental analyse og forstå teknisk analyse som værktøj.",
		lessons: [
			{
				id: "intro-regnskaber",
				title: "Læs regnskaber og nøgletal",
				description: "Forstå resultat, balance, cash flow og nøgleindikatorer.",
				video: null,
			},
			{
				id: "fundamental-analyse",
				title: "Lav en fundamental analyse",
				description: "Strukturer analyse: forretningsmodel, moat, risici og værdi.",
				video: null,
			},
			{
				id: "guidet-aktieanalyse",
				title: "Guidet aktieanalyse i praksis",
				description: "Træn hele analyseprocessen med fokus på metode og dokumentation.",
				video: null,
			},
			{
				id: "teknisk-analyse",
				title: "Brug teknisk analyse med omtanke",
				description: "Forstå støtte/modstand, trend og volumen som sprog, ikke garanti.",
				video: null,
			},
			{
				id: "analyse-fonde-etfer",
				title: "Analysér fonde og ETF'er",
				description: "Læs KID, forstå indeks/metode, omkostninger og skattemæssig status.",
				video: null,
			},
		],
	},
	{
		id: "handel-og-platform",
		title: "Handel og platform",
		description:
			"Vælg depot, handl disciplineret, forstå omkostninger og automatisér dine investeringer.",
		lessons: [
			{
				id: "vaelg-det-rette-depot",
				title: "Vælg det rette depot",
				description: "Forstå kontorammer: aktiedepot vs. aktiesparekonto vs. pension.",
				video: null,
			},
			{
				id: "platform-onboarding",
				title: "Kom i gang med din platform",
				description: "Opret depot, forstå funktioner og find rapporter og omkostninger.",
				video: null,
			},
			{
				id: "aktiehandel-og-omkostninger",
				title: "Forstå aktiehandel og omkostninger",
				description: "Identificer kurtage, spread og valutaveksling som friktion.",
				video: null,
			},
			{
				id: "maanedsopsparing",
				title: "Automatisér med månedsopsparing",
				description: "Implementer regelmæssig investering og reducér timing-stress.",
				video: null,
			},
			{
				id: "investering-pension",
				title: "Investér din pension selv",
				description: "Forstå pensionsafkastbeskatning (PAL) og scenarier.",
				video: null,
			},
			{
				id: "investering-boern",
				title: "Investér for børn og unge",
				description: "Forstå børneopsparingens rammer og alternativ struktur.",
				video: null,
			},
			{
				id: "investering-selvstaendig",
				title: "Investér som selvstændig",
				description: "Forstå virksomhedens skattemæssige rammer for investeringsmuligheder.",
				video: null,
			},
		],
	},
	{
		id: "skat-fradrag-og-indberetning",
		title: "Skat, fradrag og indberetning",
		description: "Forstå skat som del af nettoafkast og opdater forskud/årsopgørelse korrekt.",
		lessons: [
			{
				id: "skat-fra-bunden",
				title: "Forstå skat fra bunden",
				description: "Skelne mellem brutto- og nettoafkast; forstå lager vs. realisation.",
				video: null,
			},
			{
				id: "fradrag",
				title: "Brug fradrag korrekt",
				description: "Brug Skattestyrelsens fradragsguide og dokumentér ændringer.",
				video: null,
			},
			{
				id: "skat-af-aktier",
				title: "Beregn skat af aktier",
				description: "Forstå aktieindkomst og 2026-satser samt indberetningslogik.",
				video: null,
			},
			{
				id: "skattebevidste-valg",
				title: "Træf skattebevidste valg",
				description: "Vælg kontotype og produkt med fokus på lovlighed og enkelhed.",
				video: null,
			},
			{
				id: "forskuds-og-aarsopgoerelse",
				title: "Opdatér forskuds- og årsopgørelse",
				description: "Forstå forskudsopgørelsen som budget og ret ved ændringer.",
				video: null,
			},
		],
	},
	{
		id: "nedsparing-og-udbetalingsstrategi",
		title: "Nedsparing og udbetalingsstrategi",
		description: "Planlæg udbetalinger, håndter sekvensrisiko og kobl frie midler med pension.",
		lessons: [
			{
				id: "generelt-om-nedsparing",
				title: "Forstå nedsparing og sekvensrisiko",
				description: "Forstå forskellen på opsparing og udbetaling samt sekvensrisiko.",
				video: null,
			},
			{
				id: "nedsparingsstrategier",
				title: "Vælg din nedsparingsstrategi",
				description: "Vælg mellem faste og fleksible regler samt buffertyper.",
				video: null,
			},
			{
				id: "skat-ved-udbetaling",
				title: "Forstå skat ved udbetaling",
				description: "Samspil mellem pension og frie midler ved udbetaling og skatteoptimering.",
				video: null,
			},
			{
				id: "levetidsrisiko",
				title: "Håndtér levetidsrisiko",
				description: "Planlæg for at pengene rækker hele livet og forstå longevity-risiko.",
				video: null,
			},
			{
				id: "styring-i-nedsparingsfasen",
				title: "Styr rebalancering og udgifter i praksis",
				description: "Skab governance: rebalancering, skatterytme og udgiftsstyring.",
				video: null,
			},
			{
				id: "skriv-din-udbetalingspolitik",
				title: "Skriv din udbetalingspolitik",
				description: "Oversæt principper og kriterier til din egen udbetalingsplan.",
				video: null,
			},
		],
	},
];
