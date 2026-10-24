import { describe, expect, it } from "vitest";
import {
	AI_PHRASES,
	countOveruse,
	decodeEntities,
	findAiPhrases,
	findThoughtDashes,
	findYears,
	normalizeDashRanges,
	postSourceText,
	replaceDashes,
	sharedRun,
	sourceYears,
	splitSentences,
	textSegments,
} from "./style";

describe("textSegments", () => {
	it("preserves headings and paragraphs nested in lists without repeating their text", () => {
		expect(
			textSegments("- # En forbudt titel\n\n  Et afsnit.\n\n  - ## FAQ\n\n    Mere tekst."),
		).toEqual([
			{ kind: "heading", depth: 1, text: "En forbudt titel" },
			{ kind: "paragraph", text: "Et afsnit.", emphasisOnly: false },
			{ kind: "heading", depth: 2, text: "FAQ" },
			{ kind: "list_item", text: "Mere tekst." },
		]);
	});
	it("keeps a heading without a period apart from the next paragraph", () => {
		const segments = textSegments("## Hvad koster en fond\nDen koster lidt. Det er fint.");
		expect(segments).toEqual([
			{ kind: "heading", depth: 2, text: "Hvad koster en fond" },
			{ kind: "paragraph", text: "Den koster lidt. Det er fint.", emphasisOnly: false },
		]);
	});

	it("returns one segment per list item, also without periods", () => {
		const list = ["en", "to", "tre", "fire", "fem"].map((item) => `- punkt ${item}`).join("\n");
		const segments = textSegments(`${list}\n\nAfsnit efter listen.`);
		expect(segments.filter((s) => s.kind === "list_item").map((s) => s.text)).toEqual([
			"punkt en",
			"punkt to",
			"punkt tre",
			"punkt fire",
			"punkt fem",
		]);
		const nested = textSegments("- ydre\n  - indre *kursiv*\n- **fed** etiket: tekst");
		expect(nested.map((s) => s.text)).toEqual(["ydre", "indre kursiv", "fed etiket: tekst"]);
	});

	it("returns table header and body cells as segments", () => {
		const segments = textSegments("| Fond | Pris |\n| --- | --- |\n| Global | 0,2 % |");
		expect(segments).toEqual([
			{ kind: "table_cell", text: "Fond" },
			{ kind: "table_cell", text: "Pris" },
			{ kind: "table_cell", text: "Global" },
			{ kind: "table_cell", text: "0,2 %" },
		]);
	});

	it("decodes HTML entities and flattens inline formatting", () => {
		const [segment] = textSegments("Prisen &ndash; og **skatten** &#8211; *falder*&nbsp;nu.");
		expect(segment.text).toBe("Prisen – og skatten – falder nu.");
		expect(decodeEntities("&mdash; &#x2014; &amp; &ukendt;")).toBe("— — & &ukendt;");
	});

	it("marks a paragraph that is only one emphasis", () => {
		expect(textSegments("*Tid slår timing.*")[0]).toMatchObject({ emphasisOnly: true });
		expect(textSegments("**Tid slår timing.**")[0]).toMatchObject({ emphasisOnly: true });
		expect(textSegments("Husk: **tid slår timing.**")[0]).toMatchObject({ emphasisOnly: false });
	});
});

describe("findThoughtDashes", () => {
	it("allows unspaced hyphens, negative numbers and list markers", () => {
		for (const text of [
			"Perioden 2020-2024 var god.",
			"ETF-investering er populært.",
			"Banken har privat- og erhvervskunder.",
			"Kursen faldt -5 % i går.",
			"- første punkt\n- andet punkt",
		]) {
			expect(findThoughtDashes(text), text).toMatchObject({ illegal: [], ambiguous: [] });
		}
	});

	it("flags every en dash, ranges included, and counts the digit ranges", () => {
		for (const text of [
			"Perioden 2020\u20132024 var god.",
			"Afkastet var 5\u20136 % om året.",
			"Fra Q1\u2013Q3 steg kursen.",
			"Toget København\u2013Roskilde kører.",
		]) {
			expect(findThoughtDashes(text).illegal, text).toHaveLength(1);
		}
		const hits = findThoughtDashes("2020\u20132024 og 5\u20136 % og Q1\u2013Q3");
		expect(hits.illegal).toHaveLength(3);
		expect(hits.ranges).toBe(2);
	});

	it("flags spaced en dashes, em dashes and spaced hyphens between lowercase words or digits", () => {
		for (const text of [
			"Renten steg – og kurserne faldt.",
			"Renten steg — og kurserne faldt.",
			"Renten steg―og kurserne faldt.",
			"Renten steg –og kurserne faldt.",
			"– Det er en start.",
			"Han sagde det til sidst –",
			"Renten – kurserne.",
			"handlen - både køb og salg",
			"et afkast på 5 - 6 procent",
			"handlen - både",
		]) {
			expect(findThoughtDashes(text).illegal, text).toHaveLength(1);
		}
	});

	it("reports a spaced hyphen next to a capitalized word as ambiguous", () => {
		const hits = findThoughtDashes("Fonden hedder Indeks - Alle Markeder.");
		expect(hits.illegal).toEqual([]);
		expect(hits.ambiguous).toHaveLength(1);
	});

	it("returns short snippets of the text around each hit", () => {
		const text = `${"a".repeat(60)} steg – og ${"b".repeat(60)}`;
		const [snippet] = findThoughtDashes(text).illegal;
		expect(snippet).toContain("steg – og");
		expect(snippet.length).toBeLessThanOrEqual(40);
	});

	it("detects entity-encoded dashes through textSegments", () => {
		const [segment] = textSegments("Renten steg &ndash; og kurserne faldt &#8212; igen.");
		expect(findThoughtDashes(segment.text).illegal).toHaveLength(2);
	});
});

describe("findAiPhrases", () => {
	it("flags each banned phrase", () => {
		for (const text of [
			"I en verden, hvor alt koster",
			"i en verden hvor alt koster",
			"I dagens hurtigt skiftende verden",
			"i dagens foranderlige verden",
			"Lad os dykke ned i tallene",
			"Lad os se nærmere på fonden",
			"Vi dykker dybere ned i skatten",
			"Det er værd at bemærke, at",
			"Det er vigtigt at bemærke, at",
			"Renten spiller en afgørende rolle",
			"Nøglen til succes er tid",
			"Når alt kommer til alt",
			"Alt i alt er det godt",
			"Kort sagt: køb billigt",
			"Samlet set er fonden god",
			"Afslutningsvis kan vi sige",
			"en game changer for mange",
			"en gamechanger for mange",
			"en banebrydende fond",
			"en sømløs oplevelse",
			"en holistisk tilgang",
			"din økonomiske rejse",
			"din investeringsrejse begynder",
			"at navigere gennem det komplekse landskab",
			"det finansielle landskab er stort",
		]) {
			expect(findAiPhrases(text), text).toHaveLength(1);
		}
	});

	it("does not flag normal Danish", () => {
		for (const text of [
			"De har ikke råd til at rejse i år.",
			"Det er nemt at navigere i appen.",
			"Selskabets fundamentale forhold er stærke.",
			"Dørnøglen til kontoret ligger her.",
			"Nøglen til boksen er væk.",
			"I dagens Danmark er renten lav.",
			"Landskabet omkring Silkeborg er smukt.",
			"Det er vigtigt at spare op.",
		]) {
			expect(findAiPhrases(text), text).toEqual([]);
		}
	});

	it("has a readable label per phrase", () => {
		for (const phrase of AI_PHRASES) expect(phrase.label).toMatch(/^[\p{L} ,./]+$/u);
	});
});

describe("countOveruse", () => {
	it("counts overused words and constructions per label", () => {
		const counts = countOveruse([
			"Det er afgørende at spare. Det er også afgørende at vente.",
			"Fonden er ikke kun billig, men også bred. Den er ikke kun dansk. Den er men også global.",
		]);
		expect(counts.get("afgørende")?.count).toBe(2);
		expect(counts.get("ikke kun … men også")?.count).toBe(1);
		expect(counts.has("robust")).toBe(false);
	});
});

describe("splitSentences", () => {
	it.each([
		"A.P. Møller-Mærsk har sænket forventningerne til årets indtjening, fordi fragtraterne er faldet. Det kan presse udbyttet, selv om selskabet stadig har en stor kontantbeholdning.",
		"J.P. Morgan venter lavere renter i USA, hvis inflationen fortsætter ned, og arbejdsmarkedet svækkes. Banken peger derfor på obligationer som et muligt supplement til aktier.",
	])("keeps compound initials in a natural Danish summary: %s", (summary) => {
		expect(splitSentences(summary)).toHaveLength(2);
	});
	it("splits on sentence ends and keeps Danish abbreviations, initials and decimals", () => {
		expect(splitSentences("Det koster ca. 5 kr. om måneden. Det er billigt.")).toHaveLength(2);
		expect(splitSentences("Han købte bl.a. Novo Nordisk. Det gik godt.")).toHaveLength(2);
		expect(splitSentences("Fonde som f.eks. Danske Invest er store. Ja!")).toHaveLength(2);
		expect(splitSentences("J. P. Morgan ejer banken. Den er stor.")).toHaveLength(2);
		expect(splitSentences("Renten er 2.5 procent. Er det lavt? Ja.")).toHaveLength(3);
		expect(splitSentences("Prisen er 100 kr. Det er billigt.")).toHaveLength(2);
		expect(splitSentences("punkt uden punktum")).toEqual(["punkt uden punktum"]);
		expect(splitSentences("  ")).toEqual([]);
	});
});

describe("sharedRun", () => {
	it("finds a shared run of eight normalized words", () => {
		const a = "Lave omkostninger giver et højere afkast over mange år for investoren.";
		const b = "Husk: lave omkostninger, giver et højere afkast over mange år og mere.";
		expect(sharedRun(a, b)).toBe("lave omkostninger giver et højere afkast over mange");
		expect(sharedRun(a, "Lave omkostninger giver et højere afkast over tid.")).toBeUndefined();
	});
});

describe("findYears and sourceYears", () => {
	it("distinguishes decimal amounts from genuine dates", () => {
		expect(findYears("Prisen er 2000,50 kr. eller 2024.75 USD.")).toEqual([]);
		expect(findYears("Opgjort 24.10.2026 og 2024. Den 2025-02-01.")).toEqual([
			"2026",
			"2024",
			"2025",
		]);
		expect(findYears("Opgjort 2024.10.24 og 2025/02/01.")).toEqual(["2024", "2025"]);
	});
	it("finds standalone years but not amounts, units or thousands", () => {
		expect(findYears("I 2024 steg kursen, og i 1990-91 faldt den.")).toEqual(["2024", "1990"]);
		expect(findYears("Perioden 2020-2024 og 2020'erne.")).toEqual(["2020", "2024", "2020"]);
		expect(
			findYears("Det koster 2000 kr. eller 2000 kroner, 1950 %, 2010 aktier og 2019.000 i alt."),
		).toEqual([]);
		expect(findYears("Under 2008 krisen faldt alt.")).toEqual(["2008"]);
		expect(findYears("Kontoen har a2024, 20245 og 0,2024.")).toEqual([]);
		expect(findYears("Opgjort 24.10.2026.")).toEqual(["2026"]);
	});

	it("reads years from title, description and transcript", () => {
		const text = postSourceText({
			title: "Aktier i 2026",
			description: "Optaget 2025",
			transcript: [{ text: "siden 2008 og" }, { text: "frem til 2030" }],
		});
		expect([...sourceYears(text)].sort()).toEqual(["2008", "2025", "2026", "2030"]);
	});
});

describe("normalizeDashRanges", () => {
	it("replaces an en dash directly between two digits with a hyphen, entities included", () => {
		expect(
			normalizeDashRanges("2020\u20132024, 5\u20136 % og 1&ndash;2 år, 3&#8211;4 og 7&#x2013;8"),
		).toBe("2020-2024, 5-6 % og 1-2 år, 3-4 og 7-8");
	});

	it("leaves every other dash for the rules", () => {
		for (const text of [
			"Renten steg \u2013 og faldt.",
			"2020 \u2013 2024",
			"Q1\u2013Q3",
			"5\u2014 6",
			"København\u2013Roskilde",
		]) {
			expect(normalizeDashRanges(text), text).toBe(text);
		}
	});
});

describe("replaceDashes", () => {
	it("removes every en and em dash from text that is fed back to the model", () => {
		const text = replaceDashes("Fin tekst \u2013 men 2020\u20132024 mangler\u2014og &ndash; mere.");
		expect(text).not.toMatch(/[\u2013\u2014]|&ndash;/);
		expect(text).toContain("2020-2024");
		expect(text).toBe("Fin tekst, men 2020-2024 mangler, og, mere.");
	});
});
