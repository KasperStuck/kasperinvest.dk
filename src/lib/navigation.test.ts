import { describe, expect, it } from "vitest";
import {
	breadcrumbSchema,
	getActiveNavHref,
	getBreadcrumbEntries,
	getNavAriaCurrent,
	navLinks,
	samePath,
} from "./navigation";

describe("navLinks", () => {
	it("lists the eight main sections in header order", () => {
		expect(navLinks.map(({ href }) => href)).toEqual([
			"/",
			"/guides",
			"/etf",
			"/pension",
			"/platforme",
			"/ordbog",
			"/spar-penge",
			"/youtube",
		]);
	});
});

describe("getActiveNavHref", () => {
	it("matches the course root only on an exact /", () => {
		expect(getActiveNavHref("/")).toBe("/");
		expect(getActiveNavHref("/etf")).toBe("/etf");
	});

	it("matches a section index with and without a trailing slash", () => {
		expect(getActiveNavHref("/guides")).toBe("/guides");
		expect(getActiveNavHref("/guides/")).toBe("/guides");
	});

	it("matches nested pages to their section", () => {
		expect(getActiveNavHref("/guides/bedste-maanedsopsparing")).toBe("/guides");
		expect(getActiveNavHref("/youtube/kasper/en-video/")).toBe("/youtube");
		expect(getActiveNavHref("/spar-penge/el")).toBe("/spar-penge");
	});

	it("does not match a path that only shares a prefix", () => {
		expect(getActiveNavHref("/guidesx")).toBeUndefined();
		expect(getActiveNavHref("/etfer/")).toBeUndefined();
	});

	it("uses the override for lesson pages", () => {
		expect(getActiveNavHref("/renters-rente", "/")).toBe("/");
		expect(getActiveNavHref("/renters-rente/", "/")).toBe("/");
	});

	it("does not treat unknown root paths as course pages", () => {
		expect(getActiveNavHref("/renters-rente")).toBeUndefined();
		expect(getActiveNavHref("/om")).toBeUndefined();
		expect(getActiveNavHref("/folketingsvalg/2026")).toBeUndefined();
	});
});

describe("samePath", () => {
	it("matches a path with and without a trailing slash", () => {
		expect(samePath("/ordbog", "/ordbog")).toBe(true);
		expect(samePath("/ordbog/", "/ordbog")).toBe(true);
		expect(samePath("/", "/")).toBe(true);
	});

	it("does not match a parent, child or prefix path", () => {
		expect(samePath("/ordbog/etf", "/ordbog")).toBe(false);
		expect(samePath("/ordbog", "/ordbog/etf")).toBe(false);
		expect(samePath("/ordbogx", "/ordbog")).toBe(false);
		expect(samePath("/renters-rente", "/")).toBe(false);
	});
});

describe("getNavAriaCurrent", () => {
	it("marks the link for the current page as the page", () => {
		expect(getNavAriaCurrent("/guides", "/guides", "/guides")).toBe("page");
		expect(getNavAriaCurrent("/guides/", "/guides", "/guides")).toBe("page");
		expect(getNavAriaCurrent("/", "/", "/")).toBe("page");
	});

	it("marks the section link of a nested page as current, not as the page", () => {
		expect(getNavAriaCurrent("/guides/bedste-maanedsopsparing", "/guides", "/guides")).toBe("true");
	});

	it("marks the course link of a lesson page (override) as current, not as the page", () => {
		expect(getNavAriaCurrent("/renters-rente", "/", "/")).toBe("true");
	});

	it("leaves inactive links unmarked", () => {
		expect(getNavAriaCurrent("/guides", "/etf", "/guides")).toBeUndefined();
		expect(getNavAriaCurrent("/om", "/", undefined)).toBeUndefined();
	});
});

describe("getBreadcrumbEntries", () => {
	const lessonItems = [
		{ label: "KasperInvest", href: "/" },
		{ label: "Velkommen og fundament", href: "/#velkommen-og-fundament", hideOnMobile: true },
		{ label: "Forstå renters rente" },
	];

	it("puts no separator before the first crumb and marks the last as current", () => {
		const entries = getBreadcrumbEntries(lessonItems);
		expect(entries.map(({ separator }) => separator)).toEqual(["none", "always", "always"]);
		expect(entries.map(({ current }) => current)).toEqual([false, false, true]);
	});

	it("hides a mobile-hidden crumb together with its own separator", () => {
		const [, hidden] = getBreadcrumbEntries(lessonItems);
		expect(hidden).toMatchObject({
			label: "Velkommen og fundament",
			hideOnMobile: true,
			separator: "always",
		});
	});

	it("keeps exactly one separator between the visible crumbs at each width", () => {
		const entries = getBreadcrumbEntries(lessonItems);
		const separatorsBefore = (mobile: boolean) =>
			entries
				.filter((entry) => !(mobile && entry.hideOnMobile))
				.map(({ separator }) => separator !== "none" && !(mobile && separator === "desktop"));

		expect(separatorsBefore(true)).toEqual([false, true]);
		expect(separatorsBefore(false)).toEqual([false, true, true]);
	});

	it("drops the next separator on mobile when the first crumb is hidden there", () => {
		const entries = getBreadcrumbEntries([
			{ label: "KasperInvest", href: "/", hideOnMobile: true },
			{ label: "Guides", href: "/guides" },
			{ label: "Artikel" },
		]);
		expect(entries.map(({ separator }) => separator)).toEqual(["none", "desktop", "always"]);
	});

	it("hides the root crumb and its following separator on mobile when asked", () => {
		const entries = getBreadcrumbEntries(lessonItems, { hideRootOnMobile: true });
		expect(entries.map(({ hideOnMobile }) => hideOnMobile)).toEqual([true, true, false]);
		expect(entries.map(({ separator }) => separator)).toEqual(["none", "desktop", "desktop"]);
	});

	it("keeps the root crumb on mobile when it is the only crumb", () => {
		const [entry] = getBreadcrumbEntries([{ label: "KasperInvest" }], { hideRootOnMobile: true });
		expect(entry).toMatchObject({ hideOnMobile: false, current: true });
	});

	it("handles a single crumb", () => {
		expect(getBreadcrumbEntries([{ label: "Guides" }])).toEqual([
			{ label: "Guides", href: undefined, hideOnMobile: false, separator: "none", current: true },
		]);
	});
});

describe("breadcrumbSchema", () => {
	const siteUrl = "https://kasperinvest.dk";

	it("lists every crumb, including mobile-hidden ones", () => {
		const schema = breadcrumbSchema(
			[
				{ label: "KasperInvest", href: "/" },
				{ label: "Guides", href: "/guides", hideOnMobile: true },
				{ label: "Bedste månedsopsparing" },
			],
			siteUrl,
			"/guides/bedste-maanedsopsparing/",
		);
		expect(
			schema.itemListElement.map(({ name, position, item }) => [position, name, item]),
		).toEqual([
			[1, "KasperInvest", "https://kasperinvest.dk/"],
			[2, "Guides", "https://kasperinvest.dk/guides"],
			[3, "Bedste månedsopsparing", "https://kasperinvest.dk/guides/bedste-maanedsopsparing/"],
		]);
	});

	it("serializes exactly like the previous Breadcrumbs.astro output", () => {
		const schema = breadcrumbSchema(
			[
				{ label: "KasperInvest", href: "/" },
				{ label: "Spar penge", href: "/spar-penge" },
				{ label: "El" },
			],
			siteUrl,
			"/spar-penge/el",
		);
		expect(JSON.stringify(schema)).toBe(
			'{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' +
				'{"@type":"ListItem","position":1,"name":"KasperInvest","item":"https://kasperinvest.dk/"},' +
				'{"@type":"ListItem","position":2,"name":"Spar penge","item":"https://kasperinvest.dk/spar-penge"},' +
				'{"@type":"ListItem","position":3,"name":"El","item":"https://kasperinvest.dk/spar-penge/el"}]}',
		);
	});
});
