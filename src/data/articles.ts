import type { AstroComponentFactory } from "astro/runtime/server/index.js";

export type ArticleSection = "guides" | "etf" | "skat";

export type RelatedLink = {
	title: string;
	description: string;
	href: string;
};

export type Article = {
	id: string;
	section: ArticleSection;
	title: string;
	seoTitle: string;
	description: string;
	publishedAt: string;
	updatedAt: string;
	related: RelatedLink[];
};

export const sectionMeta: Record<
	ArticleSection,
	{ title: string; description: string; href: string }
> = {
	guides: {
		title: "Investeringsguides",
		description:
			"Praktiske guides til kontotyper, opsparing og investeringsvalg for danske investorer.",
		href: "/guides",
	},
	etf: {
		title: "ETF'er",
		description:
			"Forstå og sammenlign ETF'er ud fra indeks, omkostninger, risiko og danske skatteregler.",
		href: "/etf",
	},
	skat: {
		title: "Skat af investering",
		description:
			"Guides til lagerbeskatning, realisationsbeskatning, aktieindkomst og fradrag for tab.",
		href: "/skat",
	},
};

const articles: Article[] = [
	{
		id: "aktiesparekonto-eller-maanedsopsparing",
		section: "guides",
		title: "Aktiesparekonto eller månedsopsparing?",
		seoTitle: "Aktiesparekonto eller månedsopsparing? Sammenligning",
		description:
			"Sammenlign aktiesparekonto og månedsopsparing på skat, automatisering, produkter og fleksibilitet — og se hvornår de kan kombineres.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Månedsopsparing",
				description: "Sådan automatiserer du dine køb.",
				href: "/maanedsopsparing",
			},
			{
				title: "Aktiesparekonto",
				description: "Forstå kontoens skat og rammer.",
				href: "/ordbog/aktiesparekonto",
			},
			{
				title: "Vælg det rette depot",
				description: "Sammenlign dine kontotyper.",
				href: "/vaelg-det-rette-depot",
			},
		],
	},
	{
		id: "bedste-maanedsopsparing",
		section: "guides",
		title: "Bedste månedsopsparing — sådan sammenligner du",
		seoTitle: "Bedste månedsopsparing: sammenlign løsninger og pris",
		description:
			"Find den månedsopsparing der passer til dit beløb og dine produkter. Sammenlign pris, udvalg, skat og hvor meget der kan automatiseres.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Nordnet vs. Saxo Bank",
				description: "Sammenlign de to platforme.",
				href: "/platforme/nordnet-vs-saxo-bank",
			},
			{
				title: "Aktiesparekonto eller månedsopsparing",
				description: "Vælg den rigtige kontoramme.",
				href: "/guides/aktiesparekonto-eller-maanedsopsparing",
			},
			{
				title: "Investeringsstrategi",
				description: "Sæt opsparingen ind i en plan.",
				href: "/hvad-er-en-investeringsstrategi",
			},
		],
	},
	{
		id: "investering-i-guld",
		section: "guides",
		title: "Investering i guld — muligheder, omkostninger og risiko",
		seoTitle: "Investering i guld: sådan kan du investere i guld",
		description:
			"Forstå forskellen på fysisk guld, guld-ETC'er, fonde og mineaktier samt de vigtigste risici og danske skatteforhold.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Aktivklasser",
				description: "Forstå investeringernes forskellige roller.",
				href: "/ordbog/aktivklasse",
			},
			{
				title: "Sammensæt din portefølje",
				description: "Vurder guld i den samlede fordeling.",
				href: "/portefoeljesammensaetning",
			},
			{ title: "ETF'er", description: "Lær at analysere børsnoterede produkter.", href: "/etf" },
		],
	},
	{
		id: "invester-50000-kr",
		section: "guides",
		title: "Sådan kan du investere 50.000 kr.",
		seoTitle: "Investere 50.000 kr.? En trin-for-trin plan",
		description:
			"En praktisk beslutningsplan til 50.000 kr.: buffer, gæld, tidshorisont, konto, produkter og valget mellem engangsbeløb og løbende køb.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Gæld eller investering",
				description: "Prioritér gæld og investering.",
				href: "/gaeld-eller-investering",
			},
			{
				title: "Begynderstrategi",
				description: "Byg din første enkle plan.",
				href: "/laeg-din-begynderstrategi",
			},
			{
				title: "Månedsopsparing",
				description: "Automatisér de efterfølgende køb.",
				href: "/maanedsopsparing",
			},
		],
	},
	{
		id: "boligopsparing",
		section: "guides",
		title: "Boligopsparing — sådan planlægger du opsparing til hus",
		seoTitle: "Boligopsparing: plan for udbetaling og boligkøb",
		description:
			"Lav en boligopsparing ud fra mål, tidshorisont, buffer og risiko. Se hvornår kontanter kan være bedre end investering.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Første boligkøb",
				description: "Få overblik over hele købsprocessen.",
				href: "/foerste-boligkoeb",
			},
			{
				title: "Boligopsparing",
				description: "Kort definition i ordbogen.",
				href: "/ordbog/boligopsparing",
			},
			{
				title: "Budget og overblik",
				description: "Find plads til opsparingen.",
				href: "/budget-og-overblik",
			},
		],
	},
	{
		id: "bedste-globale-etf",
		section: "etf",
		title: "Bedste globale ETF — sådan vælger du",
		seoTitle: "Bedste globale ETF: kriterier for danske investorer",
		description:
			"Sammenlign globale ETF'er på indeks, markedsdækning, omkostninger, størrelse, replikation og dansk beskatning.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "ETF til aktiesparekonto",
				description: "Vælg produkt til ASK.",
				href: "/etf/bedste-etf-til-aktiesparekonto",
			},
			{
				title: "Emerging markets ETF",
				description: "Vurder vækstmarkeder som supplement.",
				href: "/etf/bedste-emerging-markets-etf",
			},
			{
				title: "Skats positivliste",
				description: "Forstå listens skattemæssige betydning.",
				href: "/etf/skats-positivliste",
			},
		],
	},
	{
		id: "bedste-etf-til-aktiesparekonto",
		section: "etf",
		title: "Bedste ETF til aktiesparekonto — brug de rigtige kriterier",
		seoTitle: "Bedste ETF til aktiesparekonto: guide og kriterier",
		description:
			"Vælg ETF til aktiesparekonto ud fra spredning, omkostninger, valuta, likviditet og hvilke værdipapirer kontoen må indeholde.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Global ETF",
				description: "Sammenlign globale indeks.",
				href: "/etf/bedste-globale-etf",
			},
			{
				title: "Aktiesparekonto eller månedsopsparing",
				description: "Sammenlign rammerne.",
				href: "/guides/aktiesparekonto-eller-maanedsopsparing",
			},
			{
				title: "Skats positivliste",
				description: "Se hvornår positivlisten er relevant.",
				href: "/etf/skats-positivliste",
			},
		],
	},
	{
		id: "bedste-emerging-markets-etf",
		section: "etf",
		title: "Bedste emerging markets ETF — sådan sammenligner du",
		seoTitle: "Bedste emerging markets ETF: sammenlign indeks og risiko",
		description:
			"Sammenlign emerging markets ETF'er på lande, Kina-vægt, selskaber, omkostninger, likviditet og skat.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Emerging markets",
				description: "Forstå vækstmarkederne.",
				href: "/ordbog/emerging-markets",
			},
			{
				title: "Global ETF",
				description: "Se om emerging markets allerede er inkluderet.",
				href: "/etf/bedste-globale-etf",
			},
			{
				title: "Valutarisiko",
				description: "Forstå valuta i internationale investeringer.",
				href: "/valuta-og-international-investering",
			},
		],
	},
	{
		id: "skats-positivliste",
		section: "etf",
		title: "Skats positivliste for ETF'er — hvad betyder den?",
		seoTitle: "Skats positivliste: ETF, aktieindkomst og kontrol",
		description:
			"Forstå hvad Skattestyrelsens liste over aktiebaserede investeringsselskaber betyder, og hvornår du skal kontrollere en ETF.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Lagerbeskatning",
				description: "Forstå den årlige beskatning.",
				href: "/skat/lagerbeskatning-vs-realisationsbeskatning",
			},
			{
				title: "ETF til aktiesparekonto",
				description: "Vælg produkt på ASK.",
				href: "/etf/bedste-etf-til-aktiesparekonto",
			},
			{
				title: "Skat af aktier",
				description: "Få det samlede skatteoverblik.",
				href: "/skat-af-aktier",
			},
		],
	},
	{
		id: "lagerbeskatning-vs-realisationsbeskatning",
		section: "skat",
		title: "Lagerbeskatning vs. realisationsbeskatning",
		seoTitle: "Lagerbeskatning vs. realisationsbeskatning forklaret",
		description:
			"Se forskellen på årlig lagerbeskatning og skat ved realisation med eksempler, likviditet og betydningen af konto og produkt.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Skats positivliste",
				description: "Forstå ETF'ers skattekategori.",
				href: "/etf/skats-positivliste",
			},
			{
				title: "Fradrag for aktietab",
				description: "Se hvordan tab behandles.",
				href: "/skat/fradrag-for-aktietab",
			},
			{
				title: "Aktieindkomst",
				description: "Forstå satser og progressionsgrænse.",
				href: "/skat/aktieindkomst-og-progressionsgraense",
			},
		],
	},
	{
		id: "fradrag-for-aktietab",
		section: "skat",
		title: "Fradrag for aktietab — sådan fungerer det",
		seoTitle: "Fradrag for aktietab: regler, modregning og kontrol",
		description:
			"Forstå hvordan tab på børsnoterede aktier normalt modregnes, hvorfor kontotype og produkt betyder noget, og hvad du skal kontrollere.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Lager- eller realisationsbeskatning",
				description: "Se hvornår tab opgøres.",
				href: "/skat/lagerbeskatning-vs-realisationsbeskatning",
			},
			{
				title: "Aktieindkomst",
				description: "Forstå modregningens skattekategori.",
				href: "/skat/aktieindkomst-og-progressionsgraense",
			},
			{
				title: "Årsopgørelsen",
				description: "Kontrollér de indberettede oplysninger.",
				href: "/forskuds-og-aarsopgoerelse",
			},
		],
	},
	{
		id: "aktieindkomst-og-progressionsgraense",
		section: "skat",
		title: "Aktieindkomst og progressionsgrænsen",
		seoTitle: "Aktieindkomst og progressionsgrænse forklaret",
		description:
			"Forstå hvad der tæller som aktieindkomst, hvordan progressionsgrænsen bruges, og hvorfor årets officielle satser altid skal kontrolleres.",
		publishedAt: "2026-07-16",
		updatedAt: "2026-07-16",
		related: [
			{
				title: "Skat af aktier",
				description: "Beregn og forstå aktieskat.",
				href: "/skat-af-aktier",
			},
			{
				title: "Fradrag for aktietab",
				description: "Se hvordan tab modregnes.",
				href: "/skat/fradrag-for-aktietab",
			},
			{
				title: "Frie midler",
				description: "Forstå investering uden pensionsbinding.",
				href: "/ordbog/frie-midler",
			},
		],
	},
];

export function getArticles(section?: ArticleSection): Article[] {
	return section ? articles.filter((article) => article.section === section) : articles;
}

export function getArticle(section: ArticleSection, slug: string): Article | null {
	return articles.find((article) => article.section === section && article.id === slug) ?? null;
}

export async function getArticleContent(
	section: ArticleSection,
	slug: string,
): Promise<AstroComponentFactory> {
	const modules = import.meta.glob("@/data/articles/**/*.mdx");
	const match = Object.entries(modules).find(([path]) =>
		path.endsWith(`/articles/${section}/${slug}.mdx`),
	);
	if (!match) throw new Error(`Article content not found: ${section}/${slug}`);
	return ((await match[1]()) as { default: AstroComponentFactory }).default;
}
