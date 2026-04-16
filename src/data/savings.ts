import { api, convex } from "@/lib/convex";

// --- Types ---

type AffiliateProgram = Awaited<
	ReturnType<typeof convex.query<typeof api.affiliatePrograms.listApproved>>
>[number];

export type Provider = {
	name: string;
	url: string;
	description: string;
	logoUrl?: string;
	tag?: string;
	network: string;
	externalId: string;
};

export type Category = {
	id: string;
	title: string;
	description: string;
	intro?: string;
	providers: Provider[];
};

// --- Category definitions ---

type CategoryDef = Omit<Category, "providers"> & {
	providerDescription: (name: string) => string;
};

function buildProvider(p: AffiliateProgram, description: string): Provider {
	return {
		name: p.name,
		url: p.trackingUrl ?? p.url,
		description,
		logoUrl: p.logoUrl,
		network: p.network,
		externalId: p.externalId,
	};
}

const categoryDefs: Record<string, CategoryDef> = {
	el: {
		id: "el",
		title: "El",
		description: "Sammenlign elselskaber og find den billigste elaftale i Danmark.",
		intro:
			"Elpriser svinger fra selskab til selskab — og du kan ofte spare flere hundrede kroner om året ved at skifte. Sammenlign aktuelle aftaler nedenfor og find den billigste el til dit forbrug. Det tager kun få minutter at skifte, og du beholder din nuværende elmåler.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				FindElpriser:
					"Sammenlign alle danske elselskaber og find den billigste elaftale til dit forbrug. Gratis og uvildig prissammenligning.",
				EWII: "Dansk energiselskab med variabel og fast el til konkurrencedygtige priser. Tilbyder også internet og ladestander.",
			};
			return descriptions[name] ?? `Sammenlign elpriser hos ${name}`;
		},
	},
	mobil: {
		id: "mobil",
		title: "Mobilabonnement",
		description: "Find det billigste mobilabonnement med data, taletid og sms.",
		intro:
			"Mobilabonnementer er en af de letteste faste udgifter at spare penge på. Priserne varierer markant mellem udbyderne, og du kan ofte få mere data og bedre dækning til en lavere pris. Sammenlign udbydere herunder og skift uden at miste dit nummer.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				Greentel:
					"Mobilabonnementer med fri tale og data fra 79 kr./md. Benytter 3's netværk med god dækning i hele Danmark.",
				"Lyca Mobile":
					"Billige mobilabonnementer fra 39 kr./md. Godt valg til dem der vil have lave priser og fri tale.",
				Oister:
					"Mobilabonnementer med op til 1000 GB data. Kendt for store datamængder til rimelige priser på 3's netværk.",
			};
			return descriptions[name] ?? `Se mobilabonnementer hos ${name}`;
		},
	},
	internet: {
		id: "internet",
		title: "Internet",
		description: "Sammenlign internetudbydere og find det hurtigste bredbånd til den bedste pris.",
		intro:
			"Hastighed og pris varierer kraftigt mellem internetudbydere — og mange betaler for mere end de har brug for. Sammenlign aktuelle aftaler og find den bedste forbindelse til din adresse, uanset om du har fiber, coax eller 5G.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				Hiper:
					"Billigt og hurtigt internet med fiber, coax og 5G. Op til 1000 Mbit uden bindingsperiode.",
				EWII: "Internet via fiber med hastigheder op til 1000 Mbit. Tilbyder også el og ladestander.",
				Greentel:
					"Bredbånd via 3's mobilnetværk. Kombiner med mobilabonnement og spar på den samlede regning.",
				Oister:
					"Trådløst internet via 5G og 4G med op til 1000 GB data. Nemt at komme i gang uden installation.",
			};
			return descriptions[name] ?? `Se internettilbud hos ${name}`;
		},
	},
	tv: {
		id: "tv",
		title: "TV",
		description: "Sammenlign TV-pakker og find det bedste tilbud til din husstand.",
		intro:
			"TV-pakker varierer i pris, kanaludvalg og fleksibilitet. Sammenlign udbydere herunder og find den løsning der passer til dit forbrug — uanset om du foretrækker parabol, antenne eller streaming.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				Allente:
					"TV-pakker via parabol og streaming med sport, film og underholdning. Fleksible pakker uden lang binding.",
			};
			return descriptions[name] ?? `Se TV-pakker hos ${name}`;
		},
	},
	streaming: {
		id: "streaming",
		title: "Streaming",
		description: "Find den billigste streamingtjeneste til film, serier og sport.",
		intro:
			"Streamingtjenester varierer i pris og indhold — og de fleste husstande har flere end de bruger. Sammenlign tjenester herunder og find den bedste kombination til din husstand.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				Allente:
					"Streaming med dansk og internationalt indhold, sport og film. Kan kombineres med TV-pakker.",
			};
			return descriptions[name] ?? `Se streamingtilbud hos ${name}`;
		},
	},
	"bank-laan": {
		id: "bank-laan",
		title: "Bank & lån",
		description: "Sammenlign banker og find det billigste lån.",
		intro:
			"Renter, gebyrer og vilkår varierer markant mellem banker. Et skifte kan spare dig tusindvis af kroner om året på boliglån, billån eller kassekredit. Sammenlign banker herunder og find den bedste aftale.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				FindBank:
					"Uvildig sammenligning af danske banker. Find den bedste bank til daglig økonomi, opsparing og lån.",
				"Saxo Bank":
					"Online bank og investeringsplatform med adgang til aktier, obligationer, ETF'er og valuta.",
			};
			return descriptions[name] ?? `Se banktilbud hos ${name}`;
		},
	},
	investering: {
		id: "investering",
		title: "Investering",
		description: "Sammenlign investeringsplatforme og kurtage.",
		intro:
			"Kurtage og platformsgebyrer spiser af dit afkast over tid. Ved at vælge den rette platform kan du spare tusindvis af kroner i omkostninger. Sammenlign investeringsplatforme herunder og find den bedste til dine behov.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				"Saxo Bank":
					"Danmarks største online investeringsplatform med handel i aktier, ETF'er, fonde og obligationer fra hele verden.",
				"Norm Invest":
					"Automatisk investering med lave omkostninger. Robo-advisor der sammensætter og rebalancerer din portefølje.",
			};
			return descriptions[name] ?? `Se investeringsmuligheder hos ${name}`;
		},
	},
	"tjen-penge": {
		id: "tjen-penge",
		title: "Tjen penge",
		description: "Tjen penge online via undersøgelser og paneler.",
		intro:
			"Betalte undersøgelser og paneler er en nem måde at tjene lidt ekstra ved siden af. Du deler din mening om produkter og tjenester og får betaling for din tid. Det kræver ingen erfaring.",
		providerDescription: (name) => {
			const descriptions: Record<string, string> = {
				"Gallup Forum":
					"Deltag i betalte markedsundersøgelser fra Kantar. Tjen gavekort og præmier ved at dele din mening.",
			};
			return descriptions[name] ?? `Tjen penge hos ${name}`;
		},
	},
};

// --- Public API ---

export async function getSavingsCategories(): Promise<Category[]> {
	const programs = await convex.query(api.affiliatePrograms.listApproved, { market: "DK" });

	const grouped = new Map<string, AffiliateProgram[]>();
	for (const p of programs) {
		for (const cat of p.savingsCategories) {
			const list = grouped.get(cat) ?? [];
			list.push(p);
			grouped.set(cat, list);
		}
	}

	return Object.entries(categoryDefs)
		.map(([id, def]) => {
			const matched = grouped.get(id) ?? [];
			const providers = matched.map((p) => buildProvider(p, def.providerDescription(p.name)));
			const { providerDescription: _, ...rest } = def;
			return { ...rest, providers };
		})
		.filter((c) => c.providers.length > 0);
}

export async function getSavingsCategory(slug: string): Promise<Category | null> {
	const categories = await getSavingsCategories();
	return categories.find((c) => c.id === slug) ?? null;
}
