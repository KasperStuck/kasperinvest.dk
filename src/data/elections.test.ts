import { describe, it, expect } from "vitest";
import { getElections, getElection, getElectionArticle } from "./elections";

describe("getElections", () => {
	it("returns all elections", () => {
		const elections = getElections();
		expect(elections.length).toBeGreaterThan(0);
	});

	it("each election has required fields", () => {
		for (const election of getElections()) {
			expect(election.id).toBeTruthy();
			expect(election.year).toBeGreaterThan(2000);
			expect(election.title).toBeTruthy();
			expect(election.description).toBeTruthy();
			expect(election.articles.length).toBeGreaterThan(0);
		}
	});

	it("all election IDs are unique", () => {
		const ids = getElections().map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("all article IDs are unique within each election", () => {
		for (const election of getElections()) {
			const ids = election.articles.map((a) => a.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});
});

describe("getElection", () => {
	it("finds election by year", () => {
		const election = getElection(2026);
		expect(election).not.toBeNull();
		expect(election!.title).toBe("Folketingsvalg 2026");
	});

	it("returns null for unknown year", () => {
		expect(getElection(1999)).toBeNull();
	});
});

describe("getElectionArticle", () => {
	it("finds article by year and slug", () => {
		const article = getElectionArticle(2026, "overblik");
		expect(article).not.toBeNull();
		expect(article!.title).toBe("Overblik og rammebetingelser");
	});

	it("includes parent election", () => {
		const article = getElectionArticle(2026, "overblik");
		expect(article!.election.year).toBe(2026);
	});

	it("includes next article when not last", () => {
		const article = getElectionArticle(2026, "overblik");
		expect(article!.next).not.toBeNull();
		expect(article!.next!.id).toBe("socialdemokratiet");
	});

	it("returns null next for last article", () => {
		const article = getElectionArticle(2026, "alternativet");
		expect(article!.next).toBeNull();
	});

	it("returns null for unknown year", () => {
		expect(getElectionArticle(1999, "overblik")).toBeNull();
	});

	it("returns null for unknown slug", () => {
		expect(getElectionArticle(2026, "nonexistent")).toBeNull();
	});

	it("works for 2022 election too", () => {
		const article = getElectionArticle(2022, "overblik");
		expect(article).not.toBeNull();
		expect(article!.election.year).toBe(2022);
	});
});
