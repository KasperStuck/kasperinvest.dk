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
	faq: { question: string; answer: string }[];
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
				faq: [
					{ question: "Kan man starte med at investere med kun 500 kr.?", answer: "Ja, absolut. Mange danske platforme tilbyder løsninger som Månedsopsparing. Her kan du automatisk købe for mindre beløb hver måned uden at betale høje gebyrer hver gang." },
					{ question: "Hvad er en aktiesparekonto?", answer: "En aktiesparekonto (ASK) er en særlig konto med en lav skattesats på kun 17%. I 2026 er indskudsloftet 174.200 kr. Kontoen er lagerbeskattet. Det betyder, at skatten afregnes årligt af din værditilvækst." },
					{ question: "Er dette kursus gratis?", answer: "Indholdet her er stillet til rådighed som en del af Kasper Invests mission om at demokratisere viden. Målet er at give dig et fundament uden skjulte dagsordener." },
					{ question: "Hvilken platform anbefaler kurset?", answer: "Jeg peger ikke på en vinder. Jeg bruger ofte Nordnet og Saxo Bank som eksempler. De er de mest populære for private investorer i Danmark." },
					{ question: "Behøver jeg en revisor til min aktieskat?", answer: "For de fleste er svaret nej. Danske platforme indberetter automatisk dine handler til Skattestyrelsen. Du skal dog altid selv tjekke din årsopgørelse en ekstra gang." },
				],
			},
			{
				id: "budget-og-overblik",
				title: "Byg dit budget og skab overblik",
				description: "Lav et budget med faste og variable poster samt buffer.",
				video: null,
				faq: [
					{ question: "Kan jeg begynde at investere, hvis jeg kun kan undvære 500 kr. om måneden?", answer: "Ja. Det vigtigste i starten er vanen og regelmæssigheden, ikke et stort beløb fra dag et." },
					{ question: "Skal nødopsparingen stå på en investeringskonto?", answer: "Nej. Nødopsparingen bør stå kontant på en separat opsparingskonto, så pengene er tilgængelige med det samme." },
					{ question: "Hvor tit bør jeg opdatere mit budget?", answer: "Som minimum kvartalsvist. Og altid når din økonomi ændrer sig markant, fx ved nyt job, flytning eller ændrede faste udgifter." },
				],
			},
			{
				id: "prioritering-og-styring",
				title: "Prioritér og styr din økonomi løbende",
				description: "Implementer rutiner: månedlig status og årlig plan.",
				video: null,
				faq: [],
			},
			{
				id: "oekonomisk-frihed",
				title: "Sæt mål for økonomisk frihed",
				description: "Skelne mellem frihedsmål og investeringsmål; undgå urealistiske tal.",
				video: null,
				faq: [
					{ question: "Er 4%-reglen realistisk i Danmark?", answer: "4%-reglen er et nyttigt udgangspunkt, men den er udviklet på amerikanske markedsdata. I Danmark skal du tage højde for, at afkast beskattes løbende, og det reducerer det reelle beløb, du kan hæve. En dansk tilpasning ligger typisk på 3-3,5% som en mere konservativ SWR." },
					{ question: "Hvornår kan jeg kalde mig økonomisk fri?", answer: "Det er individuelt. En tommelfingerregel er, at du er økonomisk fri, når din portefølje kan generere nok til at dække dine leveomkostninger, uden at du behøver røre kapitalen. Det sker typisk, når din formue er 25 gange dine årlige udgifter." },
					{ question: "Skal jeg bruge aktiesparekonto eller frie midler til FIRE?", answer: "Begge dele, men i den rigtige rækkefølge. Brug aktiesparekontoen (ASK) til din 17%-beskatning, fordi den er langt mere skatteeffektiv end frie midler. ASK har dog et loft (174.200 kr. i 2026), så når du rammer det, investerer du videre i frie midler." },
					{ question: "Hvad er den største fejl, folk begår på vejen mod FIRE?", answer: "Den hyppigste fejl er at undervurdere tidshorisonten og overvurdere forventet afkast. Mange starter med urealistiske antagelser om 15-20% afkast om året. Hold dig til 7% nominelt som udgangspunkt, og byg en plan, du faktisk kan holde i 20-30 år." },
				],
			},
			{
				id: "flere-indtaegtskilder",
				title: "Forstå flere indtægtskilder",
				description: "Forskel på aktiv og passiv indkomst og administrative krav.",
				video: null,
				faq: [],
			},
			{
				id: "foerste-boligkoeb",
				title: "Planlæg dit første boligkøb",
				description: "Forstå proces, beslutningspunkter og samspil mellem økonomi og boligskat.",
				video: null,
				faq: [],
			},
			{
				id: "gaeld-eller-investering",
				title: "Vurdér gældsafvikling vs. investering",
				description: "Sammenlign sikkert afkast ved gældsafvikling med markedsrisiko.",
				video: null,
				faq: [
					{ question: "Skal jeg altid afvikle gæld, før jeg investerer?", answer: "Nej — det afhænger af den effektive rente efter skattefradrag. Billig gæld som SU-lån og realkreditlån kan sagtens køre sideløbende med investering. Dyr forbrugsgæld bør altid væk først." },
					{ question: "Hvad tæller mest — renten eller restgælden?", answer: "Renten. En lille kassekredit til 18% koster dig forholdsmæssigt langt mere end et stort realkreditlån til 3,5%." },
					{ question: "Hvad hvis min rente er variabel?", answer: "Så regn med den rente, du betaler nu, men vær opmærksom på at den kan stige. Har du et F-kort-lån og er nervøs for rentestigninger, kan det tale for at afdrage mere." },
				],
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
				faq: [
					{ question: "Er det aldrig en god ide at følge andres investeringer?", answer: "Det kan være fint at lade sig inspirere til at undersøge en aktie eller sektor nærmere. Men inspirere til at undersøge er ikke det samme som kopiere blindt. Gør altid din egen research." },
					{ question: "Hvad er forskellen på en investeringsmetode og en investeringsstrategi?", answer: "I praksis bruges ordene ofte synonymt. Det afgørende er, at du har et sæt regler, du følger konsekvent: hvad du køber, hvornår du køber, hvor meget du investerer, og hvornår du sælger." },
					{ question: "Hvordan undgår jeg FOMO, når alle taler om en bestemt aktie?", answer: "Din bedste forsikring mod FOMO er en fast investeringsplan med automatiske indbetalinger. Når planen kører, behøver du ikke reagere på hver ny bølge." },
					{ question: "Hvornår kan enkeltaktier give mening?", answer: "Enkeltaktier kan give mening, hvis de kun udgør en mindre del af din portefølje — f.eks. 5-10% — og du kan tåle store udsving uden at ændre plan. For de fleste begyndere er brede indeksfonde et bedre udgangspunkt." },
				],
			},
			{
				id: "renters-rente",
				title: "Forstå renters rente",
				description: "Beregn effekt af tid, indbetaling og afkast.",
				video: null,
				faq: [],
			},
			{
				id: "inflation-og-realafkast",
				title: "Inflation og realafkast",
				description:
					"Forstå forskellen på nominelt og reelt afkast og hvorfor inflation udhuler købekraft.",
				video: null,
				faq: [],
			},
			{
				id: "hvorfor-investering-virker",
				title: "Hvorfor investering virker over tid",
				description: "Forstå risikopræmie, diversifikation og disciplin som drivere.",
				video: null,
				faq: [],
			},
			{
				id: "valuta-og-international-investering",
				title: "Valuta og international investering",
				description: "Forstå valutarisiko ved udenlandske ETF'er og eksponering mod USD/EUR.",
				video: null,
				faq: [],
			},
			{
				id: "laeg-din-begynderstrategi",
				title: "Læg din begynderstrategi",
				description: "Vælg en simpel proces: mål, tid, risiko, produkt og rutine.",
				video: null,
				faq: [],
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
				faq: [],
			},
			{
				id: "aktiefonde-og-etfer",
				title: "Forstå aktiefonde og ETF'er",
				description: "Bred eksponering, omkostninger og dokumenter (PRIIP KID).",
				video: null,
				faq: [],
			},
			{
				id: "obligationer",
				title: "Forstå obligationer og deres rolle",
				description: "Renterisiko, kursfølsomhed og porteføljerolle.",
				video: null,
				faq: [],
			},
			{
				id: "baeredygtig-investering",
				title: "Vurdér bæredygtig investering",
				description: "Stil de rigtige spørgsmål til bæredygtighed og dokumentation.",
				video: null,
				faq: [],
			},
			{
				id: "portefoeljesammensaetning",
				title: "Sammensæt din portefølje",
				description: "Byg en policy-portefølje med udgangspunkt i aktivklasser.",
				video: null,
				faq: [],
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
				faq: [],
			},
			{
				id: "risiko-og-risikoprofil",
				title: "Kortlæg din risikoprofil",
				description: "Forstå tabstolerance, tidshorisont og kapacitet til risiko.",
				video: null,
				faq: [],
			},
			{
				id: "investorpsykologi",
				title: "Genkend psykologiske fælder",
				description: "Identificer tabsaversion og overkonfidens samt byg procesværn.",
				video: null,
				faq: [],
			},
			{
				id: "sammensaet-din-strategi",
				title: "Sammensæt din strategi",
				description: "Vælg strategi ud fra adfærd, omkostninger og dokumentation.",
				video: null,
				faq: [],
			},
			{
				id: "rebalancering",
				title: "Rebalancér din portefølje",
				description: "Forstå hvornår og hvordan du genopretter din målallokering.",
				video: null,
				faq: [
					{ question: "Hvor ofte skal man rebalancere sin portefølje?", answer: "For de fleste private investorer er det rigeligt at rebalancere en til to gange om året. Ved at gøre det halvårligt eller årligt sikrer du, at din risiko forbliver på det ønskede niveau." },
					{ question: "Hvad er fordelen ved rebalancering?", answer: "Den primære fordel er risikostyring. Rebalancering sikrer, at din portefølje ikke bliver for risikabel. Samtidig tvinger det dig til at købe billigt og sælge dyrt på en systematisk måde." },
					{ question: "Hvordan undgår man skat ved rebalancering?", answer: "I frie midler kan du benytte tilkøbsrebalancering, hvor du køber op i de undervægtede aktiver med nye indbetalinger i stedet for at sælge. På lagerbeskattede konti som aktiesparekontoen udløser selve handlen ingen ekstra skat." },
					{ question: "Hvornår er det nødvendigt at rebalancere?", answer: "En god tommelfingerregel er 5-procent-reglen. Hvis en aktivklasse afviger mere end 5 procentpoint fra din oprindelige plan, er det tid til at overveje en justering." },
					{ question: "Kan man automatisere rebalancering?", answer: "Ja, til en vis grad. Du kan bruge værktøjer som Nordnets månedsopsparing eller Saxos AutoInvest til at styre dine løbende indbetalinger ind i de rigtige fonde. Selve salget af overvægtede aktiver skal du dog typisk stadig foretage manuelt." },
				],
			},
			{
				id: "investering-i-nedture",
				title: "Investér disciplineret i nedture",
				description: "Forstå planlagt adfærd ved fald og stress-scenarier.",
				video: null,
				faq: [],
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
				faq: [],
			},
			{
				id: "fundamental-analyse",
				title: "Lav en fundamental analyse",
				description: "Strukturer analyse: forretningsmodel, moat, risici og værdi.",
				video: null,
				faq: [],
			},
			{
				id: "guidet-aktieanalyse",
				title: "Guidet aktieanalyse i praksis",
				description: "Træn hele analyseprocessen med fokus på metode og dokumentation.",
				video: null,
				faq: [],
			},
			{
				id: "teknisk-analyse",
				title: "Brug teknisk analyse med omtanke",
				description: "Forstå støtte/modstand, trend og volumen som sprog, ikke garanti.",
				video: null,
				faq: [
					{ question: "Kan man leve af teknisk analyse?", answer: "Nogle daytradere forsøger, men forskningen viser, at langt de fleste aktive tradere taber penge over tid, når man regner kurtage, spread og skat med. For privatinvestorer er teknisk analyse bedst som supplement til fundamental analyse." },
					{ question: "Hvad er forskellen på teknisk og fundamental analyse?", answer: "Fundamental analyse vurderer, hvad en virksomhed er værd baseret på økonomi og fremtidsudsigter. Teknisk analyse kigger udelukkende på kursgrafer og handelsvolumen for at vurdere timing. De to tilgange supplerer hinanden." },
					{ question: "Hvilke indikatorer skal en begynder starte med?", answer: "Start med SMA 200 og volumen. Det giver dig et overblik over den langsigtede trend og markedets overbevisning, uden at du drukner i signaler." },
					{ question: "Er teknisk analyse bedre til aktier eller indeksfonde?", answer: "Teknisk analyse bruges primært på enkeltaktier og indekser, hvor der er tilstrækkeligt handelsvolumen til at mønstrene giver mening. For passive indeksinvestorer, der køber op fast, er teknisk analyse sjældent relevant." },
				],
			},
			{
				id: "analyse-fonde-etfer",
				title: "Analysér fonde og ETF'er",
				description: "Læs KID, forstå indeks/metode, omkostninger og skattemæssig status.",
				video: null,
				faq: [],
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
				faq: [],
			},
			{
				id: "platform-onboarding",
				title: "Kom i gang med din platform",
				description: "Opret depot, forstå funktioner og find rapporter og omkostninger.",
				video: null,
				faq: [],
			},
			{
				id: "aktiehandel-og-omkostninger",
				title: "Forstå aktiehandel og omkostninger",
				description: "Identificer kurtage, spread og valutaveksling som friktion.",
				video: null,
				faq: [],
			},
			{
				id: "maanedsopsparing",
				title: "Automatisér med månedsopsparing",
				description: "Implementer regelmæssig investering og reducér timing-stress.",
				video: null,
				faq: [],
			},
			{
				id: "investering-pension",
				title: "Investér din pension selv",
				description: "Forstå pensionsafkastbeskatning (PAL) og scenarier.",
				video: null,
				faq: [],
			},
			{
				id: "investering-boern",
				title: "Investér for børn og unge",
				description: "Forstå børneopsparingens rammer og alternativ struktur.",
				video: null,
				faq: [],
			},
			{
				id: "investering-selvstaendig",
				title: "Investér som selvstændig",
				description: "Forstå virksomhedens skattemæssige rammer for investeringsmuligheder.",
				video: null,
				faq: [],
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
				faq: [],
			},
			{
				id: "fradrag",
				title: "Brug fradrag korrekt",
				description: "Brug Skattestyrelsens fradragsguide og dokumentér ændringer.",
				video: null,
				faq: [],
			},
			{
				id: "skat-af-aktier",
				title: "Beregn skat af aktier",
				description: "Forstå aktieindkomst og 2026-satser samt indberetningslogik.",
				video: null,
				faq: [],
			},
			{
				id: "skattebevidste-valg",
				title: "Træf skattebevidste valg",
				description: "Vælg kontotype og produkt med fokus på lovlighed og enkelhed.",
				video: null,
				faq: [],
			},
			{
				id: "forskuds-og-aarsopgoerelse",
				title: "Opdatér forskuds- og årsopgørelse",
				description: "Forstå forskudsopgørelsen som budget og ret ved ændringer.",
				video: null,
				faq: [],
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
				faq: [],
			},
			{
				id: "nedsparingsstrategier",
				title: "Vælg din nedsparingsstrategi",
				description: "Vælg mellem faste og fleksible regler samt buffertyper.",
				video: null,
				faq: [],
			},
			{
				id: "skat-ved-udbetaling",
				title: "Forstå skat ved udbetaling",
				description: "Samspil mellem pension og frie midler ved udbetaling og skatteoptimering.",
				video: null,
				faq: [],
			},
			{
				id: "levetidsrisiko",
				title: "Håndtér levetidsrisiko",
				description: "Planlæg for at pengene rækker hele livet og forstå longevity-risiko.",
				video: null,
				faq: [],
			},
			{
				id: "styring-i-nedsparingsfasen",
				title: "Styr rebalancering og udgifter i praksis",
				description: "Skab governance: rebalancering, skatterytme og udgiftsstyring.",
				video: null,
				faq: [],
			},
			{
				id: "skriv-din-udbetalingspolitik",
				title: "Skriv din udbetalingspolitik",
				description: "Oversæt principper og kriterier til din egen udbetalingsplan.",
				video: null,
				faq: [],
			},
		],
	},
];
