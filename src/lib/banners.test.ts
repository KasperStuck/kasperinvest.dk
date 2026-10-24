import { describe, expect, it } from "vitest";
import { selectBanner } from "./banners";

const norminvest = {
	name: "norminvest",
	keywords: [],
	exclude: ["saxo", "lunar", "maj invest", "majinvest", "june", "frinans"],
};

const saxo = {
	name: "saxo",
	keywords: ["investering", "aktier", "etf", "portefølje", "kurtage", "platform", "obligationer"],
	exclude: ["norm invest", "norminvest", "lunar", "maj invest", "majinvest", "june", "frinans"],
};

const banners = [norminvest, saxo];

const page = { title: "", contentText: "", h1Text: "" };

describe("selectBanner", () => {
	it("selects a banner when the content contains a keyword", () => {
		const guld = { ...page, contentText: "Guld som en del af din investering." };
		expect(selectBanner(guld, banners)).toBe(saxo);
	});

	it("matches keywords in the document title", () => {
		expect(selectBanner({ ...page, title: "Investering i guld" }, banners)).toBe(saxo);
	});

	it("never selects a banner without keywords", () => {
		expect(selectBanner({ ...page, contentText: "saxo lunar june" }, [norminvest])).toBeUndefined();
	});

	it("ignores case and matches ø literally", () => {
		expect(selectBanner({ ...page, contentText: "Din PORTEFØLJE" }, banners)).toBe(saxo);
		expect(selectBanner({ ...page, contentText: "din portefolje" }, banners)).toBeUndefined();
	});

	it("matches substrings of longer words", () => {
		expect(selectBanner({ ...page, contentText: "Indeksinvesteringer" }, banners)).toBe(saxo);
	});

	it("excludes a banner when the title names a competitor", () => {
		const review = { ...page, title: "Norm Invest anmeldelse", contentText: "aktier" };
		expect(selectBanner(review, banners)).toBeUndefined();
	});

	it("excludes a banner when the H1 names a competitor", () => {
		const review = { ...page, h1Text: "Lunar Invest", contentText: "aktier" };
		expect(selectBanner(review, banners)).toBeUndefined();
	});

	it("ignores competitor names that only appear in the content", () => {
		const mention = {
			...page,
			title: "ETF'er",
			contentText: "Hos Norm Invest og Lunar kan du købe aktier.",
		};
		expect(selectBanner(mention, banners)).toBe(saxo);
	});

	it("returns the first match in list order", () => {
		const other = { name: "other", keywords: ["aktier"], exclude: [] };
		const text = { ...page, contentText: "aktier og investering" };
		expect(selectBanner(text, [other, saxo])).toBe(other);
		expect(selectBanner(text, [saxo, other])).toBe(saxo);
	});

	it("returns undefined when nothing matches", () => {
		expect(selectBanner({ ...page, contentText: "Pension og opsparing" }, banners)).toBeUndefined();
	});
});
