export type PlatformKind = "provider" | "comparison";

export type Platform = {
	id: string;
	title: string;
	seoTitle?: string;
	description: string;
	kind: PlatformKind;
};

export function getPlatforms(): Platform[] {
	return platforms;
}

/** Platforms of one kind, in their getPlatforms() order. */
export function getPlatformsByKind(kind: PlatformKind): Platform[] {
	return platforms.filter((platform) => platform.kind === kind);
}

export function getPlatform(slug: string): (Platform & { next: Platform | null }) | null {
	const index = platforms.findIndex((p) => p.id === slug);
	if (index === -1) return null;

	return {
		...platforms[index],
		next: index < platforms.length - 1 ? platforms[index + 1] : null,
	};
}

export async function getPlatformContent(slug: string) {
	const modules = import.meta.glob("@/data/platforms/*.mdx");
	const match = Object.entries(modules).find(([path]) => path.endsWith(`/${slug}.mdx`));
	if (!match) {
		throw new Error(`Platform not found: ${slug}`);
	}
	return ((await match[1]()) as { default: unknown }).default;
}

const platforms: Platform[] = [
	{
		id: "norm-invest",
		title: "Norm Invest",
		seoTitle: "Norm Invest anmeldelse: pris, fordele og ulemper",
		description:
			"Norm Invest er en dansk robo-advisor, der tilbyder automatiseret investering med lave omkostninger og en simpel tilgang til langsigtet opsparing.",
		kind: "provider",
	},
	{
		id: "saxo-bank",
		title: "Saxo Bank",
		seoTitle: "Saxo Bank anmeldelse: platforme, produkter og pris",
		description:
			"Saxo Bank er en dansk investeringsbank, der tilbyder handel med aktier, ETF'er, obligationer, optioner og mange andre finansielle produkter på globale markeder.",
		kind: "provider",
	},
	{
		id: "nordnet",
		title: "Nordnet",
		seoTitle: "Nordnet anmeldelse: konti, månedsopsparing og pris",
		description:
			"Nordnet er en nordisk investeringsplatform, der tilbyder handel med aktier, fonde, ETF'er og andre værdipapirer samt pensionsopsparing.",
		kind: "provider",
	},
	{
		id: "endavu",
		title: "Endavu",
		description:
			"Endavu er en dansk digital investeringsplatform, der tilbyder automatiseret porteføljestyring og rådgivning til private investorer.",
		kind: "provider",
	},
	{
		id: "lysa",
		title: "Lysa",
		seoTitle: "Lysa anmeldelse: pris, investering og alternativer",
		description:
			"Lysa er en nordisk robo-advisor, der tilbyder automatiseret investering baseret på din risikoprofil med globalt diversificerede porteføljer.",
		kind: "provider",
	},
	{
		id: "etoro",
		title: "eToro",
		description:
			"eToro er en global investeringsplatform kendt for social trading, hvor du kan handle aktier, kryptovaluta og kopiere andre investorers strategier.",
		kind: "provider",
	},
	{
		id: "nordnet-vs-saxo-bank",
		title: "Nordnet vs. Saxo Bank",
		seoTitle: "Nordnet vs. Saxo Bank: pris, ASK og månedsopsparing",
		description:
			"Sammenlign Nordnet og Saxo Bank på månedsopsparing, aktiesparekonto, priser, produktudvalg, valuta og brugeroplevelse.",
		kind: "comparison",
	},
];
