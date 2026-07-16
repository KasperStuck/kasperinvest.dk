import type { RelatedLink } from "./articles";

const relatedByPath: Record<string, RelatedLink[]> = {
	"/valuta-og-international-investering": [
		{
			title: "ETF'er for danske investorer",
			description: "Brug valutaindsigten, når du vælger ETF.",
			href: "/etf",
		},
		{
			title: "Valutakursrisiko",
			description: "Slå begrebet op i ordbogen.",
			href: "/ordbog/valutakursrisiko",
		},
		{
			title: "Globale ETF'er",
			description: "Sammenlign markedsdækning og valuta.",
			href: "/etf/bedste-globale-etf",
		},
	],
	"/fundamental-analyse": [
		{
			title: "Guidet aktieanalyse",
			description: "Brug metoden på en konkret analyse.",
			href: "/guidet-aktieanalyse",
		},
		{
			title: "Læs regnskaber",
			description: "Få styr på regnskabets byggesten.",
			href: "/intro-regnskaber",
		},
		{
			title: "Markedsværdi",
			description: "Forstå market cap og selskabsstørrelse.",
			href: "/ordbog/markedsvaerdi",
		},
	],
	"/hvad-er-en-investeringsstrategi": [
		{
			title: "Sammensæt strategien",
			description: "Omsæt principper til konkrete regler.",
			href: "/sammensaet-din-strategi",
		},
		{
			title: "Risikoprofil",
			description: "Find et risikoniveau du kan fastholde.",
			href: "/risikoprofil",
		},
		{
			title: "Månedsopsparing",
			description: "Automatisér den valgte strategi.",
			href: "/maanedsopsparing",
		},
	],
	"/maanedsopsparing": [
		{
			title: "Bedste månedsopsparing",
			description: "Sammenlign løsninger på de rigtige kriterier.",
			href: "/guides/bedste-maanedsopsparing",
		},
		{
			title: "ASK eller månedsopsparing",
			description: "Forstå konto kontra købsfunktion.",
			href: "/guides/aktiesparekonto-eller-maanedsopsparing",
		},
		{
			title: "Nordnet vs. Saxo Bank",
			description: "Sammenlign to populære platforme.",
			href: "/platforme/nordnet-vs-saxo-bank",
		},
	],
	"/ordbog/markedsvaerdi": [
		{
			title: "Fundamental analyse",
			description: "Brug markedsværdien i selskabsanalysen.",
			href: "/fundamental-analyse",
		},
		{
			title: "Enterprise value",
			description: "Sammenlign markedsværdi og virksomhedsværdi.",
			href: "/ordbog/enterprise-value",
		},
	],
	"/ordbog/paalydende-rente": [
		{
			title: "Obligationer",
			description: "Forstå renter, kurs og risiko samlet.",
			href: "/obligationer",
		},
		{
			title: "Effektiv rente",
			description: "Se forskellen på kupon og faktisk afkast.",
			href: "/ordbog/effektiv-rente",
		},
	],
	"/ordbog/boligopsparing": [
		{
			title: "Guide til boligopsparing",
			description: "Lav en konkret opsparingsplan.",
			href: "/guides/boligopsparing",
		},
		{
			title: "Første boligkøb",
			description: "Forstå hele købsprocessen.",
			href: "/foerste-boligkoeb",
		},
	],
};

const platformFallback: RelatedLink[] = [
	{
		title: "Nordnet vs. Saxo Bank",
		description: "Sammenlign pris, konti og funktioner.",
		href: "/platforme/nordnet-vs-saxo-bank",
	},
	{
		title: "Bedste månedsopsparing",
		description: "Vælg automatisk opsparing ud fra din plan.",
		href: "/guides/bedste-maanedsopsparing",
	},
	{
		title: "Vælg det rette depot",
		description: "Vælg konto før platform og produkt.",
		href: "/vaelg-det-rette-depot",
	},
];

const pensionFallback: RelatedLink[] = [
	{
		title: "Livrente vs. ratepension",
		description: "Sammenlign udbetaling og fleksibilitet.",
		href: "/pension/livrente-vs-ratepension",
	},
	{
		title: "Aldersopsparing vs. ratepension",
		description: "Sammenlign fradrag og udbetaling.",
		href: "/pension/aldersopsparing-vs-ratepension",
	},
	{
		title: "Privat pension",
		description: "Se pensionstyperne som én plan.",
		href: "/pension/privat-pension",
	},
];

export function getRelatedLinks(pathname: string): RelatedLink[] {
	const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
	if (relatedByPath[path]) return relatedByPath[path];
	if (path.startsWith("/platforme/")) return platformFallback.filter((link) => link.href !== path);
	if (path.startsWith("/pension/")) return pensionFallback.filter((link) => link.href !== path);
	return [];
}
