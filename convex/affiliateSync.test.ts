import { describe, expect, it } from "vitest";

// --- Category mapping logic (extracted for testability) ---

const CATEGORY_KEYWORDS: Record<string, string[]> = {
	el: ["elpriser", "strøm", "energi", "ewii"],
	mobil: ["mobil", "mobile", "simkort", "mobilabonnement", "greentel", "lyca", "oister"],
	internet: ["internet", "fiber", "bredbånd", "hiper", "coax", "5g"],
	tv: ["tv", "parabol", "antenne", "allente"],
	streaming: ["streaming", "allente"],
	"bank-laan": ["bank", "lån", "kredit", "findbank"],
	investering: ["invest", "aktie", "saxo", "nordnet", "robo", "fond"],
	"tjen-penge": ["gallup", "undersøgelse", "panel", "kantar"],
};

type ProgramInput = {
	programName: string;
	programURL: string;
	commissions?: { name: string }[];
};

function mapSavingsCategories(program: ProgramInput): string[] {
	const haystack = [
		program.programName,
		program.programURL,
		...(program.commissions?.map((c) => c.name) ?? []),
	]
		.join(" ")
		.toLowerCase();

	return Object.entries(CATEGORY_KEYWORDS)
		.filter(([_, keywords]) => keywords.some((kw) => haystack.includes(kw)))
		.map(([category]) => category);
}

// --- Tests ---

describe("mapSavingsCategories", () => {
	it("maps Greentel to mobil (by name keyword)", () => {
		expect(
			mapSavingsCategories({
				programName: "Greentel DK",
				programURL: "https://www.greentel.dk",
				commissions: [{ name: "Mobil+bredbånd" }],
			}),
		).toContain("mobil");
	});

	it("maps Greentel to internet (via commission name)", () => {
		expect(
			mapSavingsCategories({
				programName: "Greentel DK",
				programURL: "https://www.greentel.dk",
				commissions: [{ name: "Mobil+bredbånd" }],
			}),
		).toContain("internet");
	});

	it("maps FindElpriser to el", () => {
		expect(
			mapSavingsCategories({
				programName: "FindElpriser DK",
				programURL: "https://findelpriser.dk",
			}),
		).toEqual(["el"]);
	});

	it("maps EWII to el and internet", () => {
		const cats = mapSavingsCategories({
			programName: "EWII DK",
			programURL: "https://www.ewii.dk/privat/internet",
			commissions: [{ name: "Internet" }, { name: "EL" }],
		});
		expect(cats).toContain("el");
		expect(cats).toContain("internet");
	});

	it("maps Hiper to internet", () => {
		expect(
			mapSavingsCategories({
				programName: "Hiper DK",
				programURL: "https://www.hiper.dk",
				commissions: [{ name: "Coax" }, { name: "Fiber" }, { name: "5G" }],
			}),
		).toContain("internet");
	});

	it("maps Allente to both tv and streaming", () => {
		const cats = mapSavingsCategories({
			programName: "Allente DK",
			programURL: "https://www.allente.dk",
			commissions: [{ name: "Streaming" }],
		});
		expect(cats).toContain("tv");
		expect(cats).toContain("streaming");
	});

	it("maps Saxo Bank to investering and bank-laan", () => {
		const cats = mapSavingsCategories({
			programName: "Saxo Bank DK",
			programURL: "https://www.home.saxo/da-dk",
			commissions: [{ name: "Lead" }],
		});
		expect(cats).toContain("bank-laan");
		expect(cats).toContain("investering");
	});

	it("maps FindBank to bank-laan", () => {
		expect(
			mapSavingsCategories({
				programName: "FindBank DK",
				programURL: "https://www.findbank.dk",
			}),
		).toContain("bank-laan");
	});

	it("maps Norm Invest to investering", () => {
		expect(
			mapSavingsCategories({
				programName: "Norm Invest DK",
				programURL: "https://www.norminvest.com/investeringsplan",
			}),
		).toContain("investering");
	});

	it("maps Gallup Forum to tjen-penge", () => {
		expect(
			mapSavingsCategories({
				programName: "Gallup Forum DK",
				programURL: "https://www.kantar.dk",
			}),
		).toContain("tjen-penge");
	});

	it("maps Lyca Mobile to mobil", () => {
		expect(
			mapSavingsCategories({
				programName: "Lyca Mobile DK",
				programURL: "https://www.lycamobile.dk/da/td",
			}),
		).toContain("mobil");
	});

	it("maps Oister to mobil and internet", () => {
		const cats = mapSavingsCategories({
			programName: "Oister DK",
			programURL: "https://www.oister.dk/mobilabonnement",
			commissions: [{ name: "Sale" }, { name: "Internet" }],
		});
		expect(cats).toContain("mobil");
		expect(cats).toContain("internet");
	});

	it("returns empty array for unrecognized program", () => {
		expect(
			mapSavingsCategories({
				programName: "Unknown Shop",
				programURL: "https://www.randomshop.dk",
			}),
		).toEqual([]);
	});

	it("matching is case-insensitive", () => {
		expect(
			mapSavingsCategories({
				programName: "GREENTEL DK",
				programURL: "HTTPS://WWW.GREENTEL.DK",
			}),
		).toContain("mobil");
	});
});
