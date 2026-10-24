import { describe, expect, it } from "vitest";
import { matchesNeedle, matchesQuery, searchHaystack, searchNeedle } from "./filter";

const term = {
	title: "Årlige omkostninger i procent (ÅOP)",
	description: "Viser de samlede løbende udgifter til en fond som procent af formuen.",
};

describe("matchesQuery", () => {
	it("matches everything for an empty or blank query", () => {
		expect(matchesQuery(term, "")).toBe(true);
		expect(matchesQuery(term, "   ")).toBe(true);
	});

	it("ignores case", () => {
		expect(matchesQuery(term, "OMKOSTNINGER")).toBe(true);
		expect(matchesQuery(term, "åop")).toBe(true);
	});

	it("trims surrounding whitespace", () => {
		expect(matchesQuery(term, "  procent  ")).toBe(true);
	});

	it("matches æ, ø and å literally", () => {
		expect(matchesQuery(term, "løbende")).toBe(true);
		expect(matchesQuery(term, "årlige")).toBe(true);
		expect(matchesQuery(term, "lobende")).toBe(false);
		expect(matchesQuery(term, "arlige")).toBe(false);
		expect(matchesQuery({ title: "Ærlig handel", description: "" }, "ær")).toBe(true);
	});

	it("matches numbers", () => {
		expect(matchesQuery({ title: "4% reglen", description: "En tommelfingerregel." }, "4%")).toBe(
			true,
		);
		expect(matchesQuery({ title: "4% reglen", description: "En tommelfingerregel." }, "5")).toBe(
			false,
		);
	});

	it("matches the title and the description", () => {
		expect(matchesQuery(term, "ÅOP")).toBe(true);
		expect(matchesQuery(term, "formuen")).toBe(true);
	});

	it("returns false when nothing matches", () => {
		expect(matchesQuery(term, "kryptovaluta")).toBe(false);
	});
});

describe("searchHaystack and searchNeedle", () => {
	it("lowercase the term once and trim the query", () => {
		expect(searchHaystack(term)).toBe(
			"årlige omkostninger i procent (åop)\nviser de samlede løbende udgifter til en fond som procent af formuen.",
		);
		expect(searchNeedle("  ÅOP  ")).toBe("åop");
		expect(searchNeedle("   ")).toBe("");
	});

	it("match exactly when matchesQuery matches", () => {
		const haystack = searchHaystack(term);
		for (const query of [
			"",
			"  ",
			"OMKOSTNINGER",
			"åop",
			"  procent  ",
			"lobende",
			"formuen",
			"kryptovaluta",
		]) {
			expect(matchesNeedle(haystack, searchNeedle(query))).toBe(matchesQuery(term, query));
		}
	});
});
