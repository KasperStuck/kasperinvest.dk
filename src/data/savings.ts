import { api, convex } from "@/lib/convex";

// --- Types ---

type AffiliateProgram = Awaited<
	ReturnType<typeof convex.query<typeof api.affiliatePrograms.listApproved>>
>[number];

export type Provider = {
	name: string;
	url: string;
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

type CategoryDef = Omit<Category, "providers">;

function buildProvider(p: AffiliateProgram): Provider {
	return {
		name: p.name,
		url: p.trackingUrl ?? p.url,
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
	},
	mobil: {
		id: "mobil",
		title: "Mobilabonnement",
		description: "Find det billigste mobilabonnement med data, taletid og sms.",
		intro:
			"Mobilabonnementer er en af de letteste faste udgifter at spare penge på. Priserne varierer markant mellem udbyderne, og du kan ofte få mere data og bedre dækning til en lavere pris. Sammenlign udbydere herunder og skift uden at miste dit nummer.",
	},
	internet: {
		id: "internet",
		title: "Internet",
		description: "Sammenlign internetudbydere og find det hurtigste bredbånd til den bedste pris.",
		intro:
			"Hastighed og pris varierer kraftigt mellem internetudbydere — og mange betaler for mere end de har brug for. Sammenlign aktuelle aftaler og find den bedste forbindelse til din adresse, uanset om du har fiber, coax eller 5G.",
	},
	tv: {
		id: "tv",
		title: "TV",
		description: "Sammenlign TV-pakker og find det bedste tilbud til din husstand.",
		intro:
			"TV-pakker varierer i pris, kanaludvalg og fleksibilitet. Sammenlign udbydere herunder og find den løsning der passer til dit forbrug — uanset om du foretrækker parabol, antenne eller streaming.",
	},
	streaming: {
		id: "streaming",
		title: "Streaming",
		description: "Find den billigste streamingtjeneste til film, serier og sport.",
		intro:
			"Streamingtjenester varierer i pris og indhold — og de fleste husstande har flere end de bruger. Sammenlign tjenester herunder og find den bedste kombination til din husstand.",
	},
	"bank-laan": {
		id: "bank-laan",
		title: "Bank & lån",
		description: "Sammenlign banker og find det billigste lån.",
		intro:
			"Renter, gebyrer og vilkår varierer markant mellem banker. Et skifte kan spare dig tusindvis af kroner om året på boliglån, billån eller kassekredit. Sammenlign banker herunder og find den bedste aftale.",
	},
	investering: {
		id: "investering",
		title: "Investering",
		description: "Sammenlign investeringsplatforme og kurtage.",
		intro:
			"Kurtage og platformsgebyrer spiser af dit afkast over tid. Ved at vælge den rette platform kan du spare tusindvis af kroner i omkostninger. Sammenlign investeringsplatforme herunder og find den bedste til dine behov.",
	},
	"tjen-penge": {
		id: "tjen-penge",
		title: "Tjen penge",
		description: "Tjen penge online via undersøgelser og paneler.",
		intro:
			"Betalte undersøgelser og paneler er en nem måde at tjene lidt ekstra ved siden af. Du deler din mening om produkter og tjenester og får betaling for din tid. Det kræver ingen erfaring.",
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
		.map(([, def]) => {
			const matched = grouped.get(def.id) ?? [];
			const providers = matched
				.map(buildProvider)
				.sort((a, b) => a.name.localeCompare(b.name, "da"));
			return { ...def, providers };
		})
		.filter((c) => c.providers.length > 0);
}

export async function getSavingsCategory(slug: string): Promise<Category | null> {
	const categories = await getSavingsCategories();
	return categories.find((c) => c.id === slug) ?? null;
}
