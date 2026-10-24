// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { placeBanners, selectBanner } from "./banners";

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

describe("article banner placement", () => {
	const banner = {
		...saxo,
		src: "/banner.webp",
		width: 930,
		height: 180,
		alt: "Invester hos Saxo Bank",
		href: "https://example.com/partner",
	};
	const otherBanner = { ...banner, src: "/other.webp", href: "https://example.com/other" };
	const adSelector = ':scope > aside[aria-label="Annonce"]';

	afterEach(() => {
		document.body.replaceChildren();
	});

	function article(headingCount: number) {
		const content = document.createElement("div");
		content.innerHTML = `
			<p>Her er svaret om investering.</p>
			${Array.from({ length: headingCount }, (_, index) => `<h2 id="h${index + 1}">Afsnit ${index + 1}</h2><p>Tekst ${index + 1}</p>`).join("")}
			<aside data-contextual-links><a href="/guide">Læs også</a></aside>
		`;
		document.body.append(content);
		return content;
	}

	function render(content: HTMLElement, title = "Investering") {
		placeBanners(
			content,
			selectBanner({ ...page, title, contentText: content.textContent ?? "" }, [
				banner,
				otherBanner,
			]),
		);
	}

	it.each([
		{ count: 0, anchors: [] },
		{ count: 1, anchors: ["h1"] },
		{ count: 2, anchors: ["h1", "h2"] },
		{ count: 8, anchors: ["h1", "h2", "h4", "h6", "h8"] },
	])("places banners before the requested H2s in an article with $count headings", ({
		count,
		anchors,
	}) => {
		const content = article(count);

		render(content);

		const ads = Array.from(content.querySelectorAll(adSelector));
		expect(ads.map((ad) => ad.nextElementSibling?.id)).toEqual(anchors);
		expect(content.firstElementChild?.textContent).toBe("Her er svaret om investering.");
	});

	it("excludes nested H2s from both placement and heading counts", () => {
		const content = article(8);
		const nested = document.createElement("section");
		nested.innerHTML = '<h2 id="nested">Indlejret afsnit</h2>';
		content.insertBefore(nested, content.querySelector("#h2"));

		render(content);

		expect(
			Array.from(content.querySelectorAll(adSelector), (ad) => ad.nextElementSibling?.id),
		).toEqual(["h1", "h2", "h4", "h6", "h8"]);
		expect(nested.children).toHaveLength(1);
	});

	it.each([
		"Norm Invest anmeldelse",
		"Lunar anmeldelse",
	])("shows no ads on an ineligible %s page and still moves related links", (title) => {
		const content = article(8);
		const links = content.querySelector("[data-contextual-links]");

		render(content, title);

		expect(content.querySelectorAll(adSelector)).toHaveLength(0);
		expect(links?.nextElementSibling?.id).toBe("h2");
	});

	it("shows no ads for unrelated content", () => {
		const content = article(2);
		content.firstElementChild?.replaceChildren("Kontakt mig.");

		render(content, "Kontakt");

		expect(content.querySelectorAll(adSelector)).toHaveLength(0);
	});

	it.each([0, 1, 2, 8])("preserves content order and related links with %i H2s", (count) => {
		const content = article(count);
		const links = content.querySelector("[data-contextual-links]");
		const originalContent = Array.from(content.children).filter((child) => child !== links);
		const relatedMarkup = links?.outerHTML;

		render(content);

		expect(
			Array.from(content.children).filter(
				(child) => child !== links && child.getAttribute("aria-label") !== "Annonce",
			),
		).toEqual(originalContent);
		expect(content.querySelectorAll("[data-contextual-links]")).toHaveLength(1);
		expect(links?.outerHTML).toBe(relatedMarkup);
		if (count > 0) {
			const anchor = content.querySelector(count === 1 ? "#h1" : "#h2");
			expect(links?.nextElementSibling?.getAttribute("aria-label")).toBe("Annonce");
			expect(links?.nextElementSibling?.nextElementSibling).toBe(anchor);
		} else {
			expect(content.lastElementChild).toBe(links);
		}
	});

	it("reuses the selected banner with its image size, link attributes and no visible caption", () => {
		const content = article(8);

		render(content);

		const ads = content.querySelectorAll(adSelector);
		expect(ads).toHaveLength(5);
		for (const ad of ads) {
			expect(ad.className).toBe("not-prose my-10");
			expect(ad.textContent).toBe("");
			expect(ad.children).toHaveLength(1);
			const link = ad.querySelector("a");
			expect(link?.getAttribute("href")).toBe(banner.href);
			expect(link?.getAttribute("target")).toBe("_blank");
			expect(link?.getAttribute("rel")).toBe("sponsored noopener noreferrer");
			expect(link?.className).toBe("block overflow-hidden rounded-lg");
			const image = link?.querySelector("img");
			expect(image?.getAttribute("src")).toBe(banner.src);
			expect(image?.getAttribute("alt")).toBe(banner.alt);
			expect(image?.getAttribute("width")).toBe("930");
			expect(image?.getAttribute("height")).toBe("180");
			expect(image?.getAttribute("loading")).toBe("lazy");
			expect(image?.className).toBe("w-full");
		}
	});
});
