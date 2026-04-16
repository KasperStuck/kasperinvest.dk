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
	price?: string;
	priceSub?: string;
	specs?: { label: string; value: string }[];
	network: string;
	externalId: string;
};

export type Category = {
	id: string;
	title: string;
	description: string;
	intro?: string;
	priceLabel?: string;
	providers: Provider[];
};

// --- Category definitions ---
// Category mapping happens during Convex sync (affiliateSync.ts).
// These definitions only control display: title, description, priceLabel,
// and how to build the provider card from the stored program data.

type CategoryDef = Omit<Category, "providers"> & {
	buildProvider: (p: AffiliateProgram) => Provider;
};

function defaultProvider(
	p: AffiliateProgram,
	description: string,
	specs?: Provider["specs"],
): Provider {
	return {
		name: p.name,
		url: p.trackingUrl ?? p.url,
		description,
		logoUrl: p.logoUrl,
		network: p.network,
		externalId: p.externalId,
		specs,
	};
}

function commissionSpec(p: AffiliateProgram): { label: string; value: string } {
	const main = p.commissions[0];
	if (!main) return { label: "Provision", value: "Variabel" };
	return {
		label: "Provision",
		value:
			main.transactionType === "lead"
				? `${main.value} ${p.currency}/lead`
				: `${main.value} ${p.currency}/salg`,
	};
}

function maxCommissionDesc(p: AffiliateProgram, fallback: string): string {
	const max = p.commissions.reduce<(typeof p.commissions)[number] | null>(
		(best, c) => (!best || c.value > best.value ? c : best),
		null,
	);
	return max ? `Op til ${max.value} ${p.currency}` : fallback;
}

const categoryDefs: Record<string, CategoryDef> = {
	el: {
		id: "el",
		title: "El",
		description: "Sammenlign elselskaber og find den billigste elaftale i Danmark.",
		intro:
			"Elpriser svinger fra selskab til selskab. Sammenlign aktuelle aftaler nedenfor og skift til en billigere udbyder på få minutter.",
		priceLabel: "Provision ved skift",
		buildProvider: (p) => ({
			...defaultProvider(p, maxCommissionDesc(p, "Sammenlign elpriser")),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
	mobil: {
		id: "mobil",
		title: "Mobilabonnement",
		description: "Find det billigste mobilabonnement med data, taletid og sms.",
		intro:
			"Mobilabonnementer er en af de letteste poster at spare penge på. Sammenlign udbydere og skift til en billigere aftale uden at skifte nummer.",
		priceLabel: "Provision pr. salg",
		buildProvider: (p) => ({
			...defaultProvider(p, maxCommissionDesc(p, "Mobilabonnement")),
			specs: [
				{ label: "Kommissioner", value: `${p.commissions.length} typer` },
				commissionSpec(p),
				{ label: "Cookie", value: `${p.cookieDuration ?? 30} dage` },
			],
		}),
	},
	internet: {
		id: "internet",
		title: "Internet",
		description: "Sammenlign internetudbydere og find det hurtigste bredbånd til den bedste pris.",
		intro:
			"Hastighed og pris varierer kraftigt mellem udbyderne. Sammenlign aktuelle aftaler og find den bedste internetforbindelse til din adresse.",
		priceLabel: "Provision pr. salg",
		buildProvider: (p) => ({
			...defaultProvider(p, maxCommissionDesc(p, "Internet")),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
	tv: {
		id: "tv",
		title: "TV",
		description: "Sammenlign TV-pakker og find det bedste tilbud til din husstand.",
		intro:
			"TV-pakker varierer i pris og kanaludvalg. Sammenlign udbydere og find den bedste løsning til dit forbrug.",
		priceLabel: "Provision pr. salg",
		buildProvider: (p) => ({
			...defaultProvider(p, maxCommissionDesc(p, "TV-pakke")),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
	streaming: {
		id: "streaming",
		title: "Streaming",
		description: "Find den billigste streamingtjeneste til film, serier og sport.",
		intro:
			"Streamingtjenester varierer i pris og indhold. Sammenlign udbydere og find den bedste løsning til din husstand.",
		priceLabel: "Provision pr. salg",
		buildProvider: (p) => ({
			...defaultProvider(p, maxCommissionDesc(p, "Streaming")),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
	"bank-laan": {
		id: "bank-laan",
		title: "Bank & lån",
		description: "Sammenlign banker og find det billigste lån.",
		intro:
			"Bank- og låneomkostninger kan variere markant. Sammenlign og find den bedste aftale for dig.",
		priceLabel: "Provision pr. lead",
		buildProvider: (p) => ({
			...defaultProvider(p, "Sammenlign banker og lån"),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
	investering: {
		id: "investering",
		title: "Investering",
		description: "Sammenlign investeringsplatforme og kurtage.",
		intro:
			"Investeringsplatforme varierer i pris, produkter og brugervenlighed. Find den bedste platform til dine behov.",
		priceLabel: "Provision pr. lead",
		buildProvider: (p) => ({
			...defaultProvider(p, maxCommissionDesc(p, "Investeringsplatform")),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
	"tjen-penge": {
		id: "tjen-penge",
		title: "Tjen penge",
		description: "Tjen penge online via undersøgelser og paneler.",
		intro:
			"Deltag i betalte undersøgelser og paneler — en nem måde at tjene lidt ekstra ved siden af.",
		buildProvider: (p) => ({
			...defaultProvider(p, "Deltag i betalte undersøgelser"),
			specs: [commissionSpec(p), { label: "Cookie", value: `${p.cookieDuration ?? 30} dage` }],
		}),
	},
};

// --- Public API ---

export async function getSavingsCategories(): Promise<Category[]> {
	const programs = await convex.query(api.affiliatePrograms.listApproved, { market: "DK" });

	// Group programs by their savingsCategories
	const grouped = new Map<string, AffiliateProgram[]>();
	for (const p of programs) {
		for (const cat of p.savingsCategories) {
			const list = grouped.get(cat) ?? [];
			list.push(p);
			grouped.set(cat, list);
		}
	}

	// Build categories in defined order, skip empty ones
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
