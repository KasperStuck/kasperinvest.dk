import { describe, expect, it } from "vitest";
import { parseCsv } from "./gsc-opportunities";

describe("GSC CSV parser", () => {
	it("handles quoted commas, escaped quotes and multiline queries", () => {
		const rows = parseCsv(
			'Forespørgsel,Side,Eksponeringer\n"bedste ETF, Danmark",https://kasperinvest.dk/etf,10\n"""lang\nforespørgsel""",https://kasperinvest.dk/guides,5',
		);
		expect(rows).toEqual([
			["Forespørgsel", "Side", "Eksponeringer"],
			["bedste ETF, Danmark", "https://kasperinvest.dk/etf", "10"],
			['"lang\nforespørgsel"', "https://kasperinvest.dk/guides", "5"],
		]);
	});
});
