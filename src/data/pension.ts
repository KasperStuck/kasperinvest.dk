export type PensionType = {
	id: string;
	title: string;
	description: string;
};

export function getPensionTypes(): PensionType[] {
	return pensionTypes;
}

export function getPensionType(slug: string): (PensionType & { next: PensionType | null }) | null {
	const index = pensionTypes.findIndex((p) => p.id === slug);
	if (index === -1) return null;

	return {
		...pensionTypes[index],
		next: index < pensionTypes.length - 1 ? pensionTypes[index + 1] : null,
	};
}

export async function getPensionContent(slug: string) {
	const modules = import.meta.glob("@/data/pension/*.mdx");
	const match = Object.entries(modules).find(([path]) => path.endsWith(`/${slug}.mdx`));
	if (!match) {
		throw new Error(`Pension type not found: ${slug}`);
	}
	return ((await match[1]()) as { default: unknown }).default;
}

const pensionTypes: PensionType[] = [
	{
		id: "aldersopsparing",
		title: "Aldersopsparing",
		description:
			"Den skattefri pension du selv styrer — lær hvordan aldersopsparingen fungerer, og hvordan du får mest muligt ud af den.",
	},
	{
		id: "ratepension",
		title: "Ratepension",
		description:
			"Ratepension er en af de mest populære pensionsordninger i Danmark — den giver skattefradrag og udbetales i faste rater.",
	},
	{
		id: "folkepension",
		title: "Folkepension",
		description:
			"Den grundlæggende pension fra staten som alle danskere har ret til — uanset arbejdshistorik eller privat opsparing.",
	},
	{
		id: "privat-pension",
		title: "Privat pension",
		description:
			"Supplér din pensionsopsparing med en privat pensionsordning du selv opretter og indbetaler til.",
	},
	{
		id: "arbejdsmarkedspension",
		title: "Arbejdsmarkedspension",
		description:
			"Din pension gennem jobbet — for mange den største enkeltstående opsparing ved siden af boligen.",
	},
	{
		id: "livrente",
		title: "Livrente",
		description:
			"Den eneste pensionstype i Danmark der garanterer udbetaling resten af dit liv — uanset hvor gammel du bliver.",
	},
];
