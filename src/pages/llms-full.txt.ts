import type { APIRoute } from "astro";
import { getModules } from "@/data/lessons";
import { getElections } from "@/data/elections";

export const GET: APIRoute = () => {
	const modules = getModules();
	const elections = getElections();
	const lessons = modules.flatMap(({ lessons }) => lessons);

	const lines: string[] = [
		"# KasperInvest — Komplet indhold",
		"",
		"> Gratis investeringskursus på dansk. Lær at investere ansvarligt i Danmark via en metodisk proces: privatøkonomi, strategi, produkter, handel, analyse, skat og nedsparing.",
		"",
		"---",
		"",
		"## Kursus",
		"",
		`${modules.length} moduler · ${lessons.length} lektioner`,
		"",
	];

	for (const [i, mod] of modules.entries()) {
		lines.push(`### Modul ${i + 1}: ${mod.title}`);
		lines.push("");
		lines.push(mod.description);
		lines.push("");

		for (const lesson of mod.lessons) {
			lines.push(
				`- [${lesson.title}](https://kasperinvest.dk/${lesson.id}): ${lesson.description}`,
			);
		}
		lines.push("");
	}

	lines.push("---", "");
	lines.push("## Folketingsvalg", "");
	lines.push(
		"Investerings- og skatteanalyse af partiernes valgplatforme.",
	);
	lines.push("");

	for (const election of elections) {
		lines.push(`### ${election.title}`, "");
		lines.push(election.description);
		lines.push("");

		for (const article of election.articles) {
			lines.push(
				`- [${article.title}](https://kasperinvest.dk/folketingsvalg/${election.year}/${article.id}): ${article.description}`,
			);
		}
		lines.push("");
	}

	lines.push("---", "");
	lines.push("## Resources", "");
	lines.push(
		"En samling af bøger, podcasts og gratis værktøjer til investering.",
	);
	lines.push("");
	lines.push("- [Resources](https://kasperinvest.dk/resources)");
	lines.push("");

	lines.push("### Bøger på dansk", "");
	for (const book of booksDanish) {
		lines.push(`- ${book.title} — ${book.author}`);
	}
	lines.push("");

	lines.push("### Bøger på engelsk", "");
	for (const book of booksEnglish) {
		lines.push(`- ${book.title} — ${book.author}`);
	}
	lines.push("");

	lines.push("### Podcasts", "");
	for (const pod of podcasts) {
		lines.push(`- ${pod.title}: ${pod.description}`);
	}
	lines.push("");

	lines.push("### Gratis værktøjer", "");
	for (const tool of tools) {
		lines.push(`- ${tool.title}: ${tool.description}`);
	}
	lines.push("");

	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};

const booksDanish = [
	{ title: "Den lille guide til investering", author: "Sarah Ophelia Møss" },
	{ title: "Simpel investering", author: "Sune Bjørn Andersen" },
	{ title: "Investering for nybegyndere", author: "Carsten Rasmussen" },
	{ title: "Den lille guide til fundamental analyse", author: "Martin Gottlob & Sarah Ophelia Møss" },
	{ title: "Den lille guide til teknisk analyse", author: "Nanna Fick" },
	{ title: "Den lille guide til investering i teknologiaktier", author: "Jesper Bæk & Mads Christiansen" },
	{ title: "Girls Just Wanna Have Funds", author: "Anna-Sophie Hartvigsen, Camilla Falkenberg & Emma Due Bitz" },
	{ title: "Den tålmodige investor", author: "Helge Larsen" },
	{ title: "Når hulemænd investerer", author: "Jens Balle" },
	{ title: "Bobler, bullshit og børsfest", author: "Lars Tvede" },
	{ title: "Børshandlens psykologi", author: "Lars Tvede" },
	{ title: "Warren Buffett — investor og kritiker", author: "Ole Risager" },
	{ title: "Vejen til økonomisk frihed", author: "Frederik Strange" },
	{ title: "Investér dig fri", author: "Pernille Wahlgren & Kasper Birk" },
	{ title: "Derfor elsker jeg udbytteaktier", author: "Linnéa Schmidt" },
	{ title: "Boost din opsparing med aktier", author: "Karsten Engmann Jensen" },
	{ title: "Den lille guide til børns opsparing", author: "Jacob Munk-Stander" },
];

const booksEnglish = [
	{ title: "The Psychology of Money", author: "Morgan Housel" },
	{ title: "The Intelligent Investor", author: "Benjamin Graham" },
	{ title: "One Up On Wall Street", author: "Peter Lynch" },
	{ title: "The Little Book of Common Sense Investing", author: "John C. Bogle" },
	{ title: "The Simple Path to Wealth", author: "J.L. Collins" },
	{ title: "Just Keep Buying", author: "Nick Maggiulli" },
	{ title: "The Most Important Thing", author: "Howard Marks" },
	{ title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
	{ title: "A Random Walk Down Wall Street", author: "Burton G. Malkiel" },
	{ title: "Principles: Life and Work", author: "Ray Dalio" },
	{ title: "Mastering the Market Cycle", author: "Howard Marks" },
	{ title: "Die With Zero", author: "Bill Perkins" },
	{ title: "Fooled by Randomness", author: "Nassim Nicholas Taleb" },
	{ title: "The Warren Buffett Way", author: "Robert G. Hagstrom" },
	{ title: "Your Money or Your Life", author: "Vicki Robin & Joe Dominguez" },
];

const podcasts = [
	{ title: "Millionærklubben", description: "Euroinvestors daglige podcast om aktieanalyse, markedstendenser og makroøkonomi." },
	{ title: "Børssnak", description: "Saxo Banks ugentlige 10-minutters podcast der klæder dig på til ugen på børsen." },
	{ title: "Saxo Market Call", description: "Saxo Banks daglige markedsanalyse med global finansoverblik." },
	{ title: "Investeringspodcasten", description: "Nordnets ugentlige podcast med Per Hansen og Helge Larsen om markedstrends og aktier." },
	{ title: "Store Penge", description: "Ekstra Bladets finanspodcast om makroøkonomi og geopolitik, 3x ugentligt." },
	{ title: "Børsen Investor", description: "Børsens ugentlige podcast med professionelle investorer der analyserer aktier." },
	{ title: "Ophelias Invest Talk", description: "Sarah Ophelia Møss' ugentlige podcast om investering, opsparing og privatøkonomi." },
	{ title: "Kurs mod ugen", description: "Dansk Aktionærforenings ugentlige lørdag-overblik over globale finansmarkeder." },
	{ title: "Kvinde, kend din kurs", description: "Female Invests ugentlige podcast med aktie-updates og investering for kvinder." },
	{ title: "Aktieuniverset", description: "Mads Christiansens podcast for både nye og erfarne investorer." },
	{ title: "Investering på hjernen", description: "Jens Balles podcast om investorpsykologi og de mentale fælder ved investering." },
	{ title: "Ejendomsinvestoren", description: "Podcast udelukkende om ejendomsinvestering — handler, strategier og lån." },
	{ title: "PengePulsen", description: "Nordeas podcast om privatøkonomi, investeringer, boligmarked og pension." },
	{ title: "Pengestærk", description: "Arbejdernes Landsbanks podcast om investering for begyndere og erfarne." },
];

const tools = [
	{ title: "justETF", description: "Søg, sammenlign og analyser ETF'er for europæiske investorer." },
	{ title: "Yahoo Finance", description: "Watchlists, porteføljesporing og aktiescreener." },
	{ title: "TradingView", description: "Aktiescreener med fundamentale nøgletal og tekniske indikatorer." },
	{ title: "Koyfin", description: "Research, dashboards og porteføljeoverblik for aktier, ETF'er og fonde." },
	{ title: "CompaniesMarketCap", description: "Hurtig sammenligning af selskabers størrelse og markedsværdi." },
	{ title: "Morningstar", description: "Screener med ratings og analyser for aktier, fonde og ETF'er." },
	{ title: "Finviz", description: "Gratis aktiescreener med 60+ filtre, heatmaps og tekniske mønstre." },
	{ title: "TIKR", description: "Aktieanalyse med screener og finansielle data 10+ år tilbage." },
	{ title: "Curvo Backtest", description: "Test historisk performance af ETF-porteføljer for europæiske investorer." },
	{ title: "FRED", description: "840.000+ økonomiske dataserier fra hele verden til makroanalyse." },
	{ title: "Sharesight", description: "Portefølje-tracker med automatisk udbyttesporing og Nordnet-integration." },
	{ title: "SEC EDGAR", description: "Gratis adgang til amerikanske selskabers årsrapporter og regnskaber." },
];
