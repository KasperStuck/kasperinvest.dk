import type { APIRoute } from "astro";
import { getModules } from "@/data/lessons";
import { getElections } from "@/data/elections";

export const GET: APIRoute = () => {
	const modules = getModules();
	const elections = getElections();
	const lessons = modules.flatMap(({ lessons }) => lessons);

	const lines: string[] = [
		"# KasperInvest",
		"",
		"> Gratis investeringskursus på dansk. Lær at investere ansvarligt i Danmark via en metodisk proces: privatøkonomi, strategi, produkter, handel, analyse, skat og nedsparing.",
		"",
		"## Kursus",
		"",
		`Kurset består af ${modules.length} moduler med i alt ${lessons.length} lektioner der dækker hele investeringsrejsen fra budget til nedsparing.`,
		"",
		"- [Kursusoversigt](https://kasperinvest.dk/)",
		"- [Resources](https://kasperinvest.dk/resources)",
		"",
	];

	for (const [i, mod] of modules.entries()) {
		lines.push(`### Modul ${i + 1}: ${mod.title}`);
		lines.push(mod.description);
		lines.push("");
	}

	lines.push("## YouTube", "");
	lines.push(
		"Udvalgte videoer fra danske finans-youtubere om investering og privatøkonomi.",
	);
	lines.push("");
	lines.push("- [YouTube oversigt](https://kasperinvest.dk/youtube)");
	lines.push("");

	lines.push("## Folketingsvalg", "");
	lines.push("Investerings- og skatteanalyse af partiernes valgplatforme.");
	lines.push("");
	for (const election of elections) {
		lines.push(
			`- [${election.title}](https://kasperinvest.dk/folketingsvalg/${election.year})`,
		);
	}
	lines.push("");

	lines.push("## Udvidet information", "");
	lines.push(
		"- [llms-full.txt](https://kasperinvest.dk/llms-full.txt): Komplet indhold med alle lektioner, valgartikler og resources.",
	);
	lines.push("");

	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
