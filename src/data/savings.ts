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
// Category mapping happens during Convex sync (affiliateSync.ts).
// These definitions control display: title, description,
// and how to build the provider card from the stored program data.

type CategoryDef = Omit<Category, "providers"> & {
	buildProvider: (p: AffiliateProgram) => Provider;
};

function defaultProvider(p: AffiliateProgram, description: string): Provider {
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
		intro: "Elpriser svinger fra selskab til selskab. Sammenlign aktuelle aftaler nedenfor og skift til en billigere udbyder på få minutter.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign elpriser og skift udbyder"),
	},
	mobil: {
		id: "mobil",
		title: "Mobilabonnement",
		description: "Find det billigste mobilabonnement med data, taletid og sms.",
		intro: "Mobilabonnementer er en af de letteste poster at spare penge på. Sammenlign udbydere og skift til en billigere aftale uden at skifte nummer.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign mobilabonnementer"),
	},
	internet: {
		id: "internet",
		title: "Internet",
		description: "Sammenlign internetudbydere og find det hurtigste bredbånd til den bedste pris.",
		intro: "Hastighed og pris varierer kraftigt mellem udbyderne. Sammenlign aktuelle aftaler og find den bedste internetforbindelse til din adresse.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign internetudbydere"),
	},
	tv: {
		id: "tv",
		title: "TV",
		description: "Sammenlign TV-pakker og find det bedste tilbud til din husstand.",
		intro: "TV-pakker varierer i pris og kanaludvalg. Sammenlign udbydere og find den bedste løsning til dit forbrug.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign TV-pakker"),
	},
	streaming: {
		id: "streaming",
		title: "Streaming",
		description: "Find den billigste streamingtjeneste til film, serier og sport.",
		intro: "Streamingtjenester varierer i pris og indhold. Sammenlign udbydere og find den bedste løsning til din husstand.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign streamingtjenester"),
	},
	"bank-laan": {
		id: "bank-laan",
		title: "Bank & lån",
		description: "Sammenlign banker og find det billigste lån.",
		intro: "Bank- og låneomkostninger kan variere markant. Sammenlign og find den bedste aftale for dig.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign banker og lån"),
	},
	investering: {
		id: "investering",
		title: "Investering",
		description: "Sammenlign investeringsplatforme og kurtage.",
		intro: "Investeringsplatforme varierer i pris, produkter og brugervenlighed. Find den bedste platform til dine behov.",
		buildProvider: (p) => defaultProvider(p, "Sammenlign investeringsplatforme"),
	},
	"tjen-penge": {
		id: "tjen-penge",
		title: "Tjen penge",
		description: "Tjen penge online via undersøgelser og paneler.",
		intro: "Deltag i betalte undersøgelser og paneler — en nem måde at tjene lidt ekstra ved siden af.",
		buildProvider: (p) => defaultProvider(p, "Deltag i betalte undersøgelser"),
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
			const providers = matched.map((p) => def.buildProvider(p));
			const { buildProvider: _, ...rest } = def;
			return { ...rest, providers };
		})
		.filter((c) => c.providers.length > 0);
}

export async function getSavingsCategory(slug: string): Promise<Category | null> {
	const categories = await getSavingsCategories();
	return categories.find((c) => c.id === slug) ?? null;
}
