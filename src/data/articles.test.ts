import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getArticles, sectionMeta } from "./articles";
import { getGlossaryTerms } from "./glossary";
import { getModules } from "./lessons";
import { getPensionTypes } from "./pension";
import { getPlatforms } from "./platforms";

function knownIndexablePaths(): Set<string> {
	const paths = new Set([
		"/",
		"/guides",
		"/etf",
		"/skat",
		"/ordbog",
		"/pension",
		"/platforme",
		"/resources",
		"/om",
		"/redaktionel-metode",
		"/affiliatepolitik",
	]);
	for (const mod of getModules()) for (const lesson of mod.lessons) paths.add(`/${lesson.id}`);
	for (const term of getGlossaryTerms()) paths.add(`/ordbog/${term.id}`);
	for (const pension of getPensionTypes()) paths.add(`/pension/${pension.id}`);
	for (const platform of getPlatforms()) paths.add(`/platforme/${platform.id}`);
	for (const article of getArticles()) {
		paths.add(`${sectionMeta[article.section].href}/${article.id}`);
	}
	return paths;
}

describe("SEO article registry", () => {
	it("has unique route IDs and SEO titles", () => {
		const articles = getArticles();
		const routes = articles.map((article) => `${article.section}/${article.id}`);
		const titles = articles.map((article) => article.seoTitle);
		expect(new Set(routes).size).toBe(routes.length);
		expect(new Set(titles).size).toBe(titles.length);
	});

	it("has content and at least three contextual internal links per article", () => {
		for (const article of getArticles()) {
			const contentPath = resolve(
				process.cwd(),
				"src",
				"data",
				"articles",
				article.section,
				`${article.id}.mdx`,
			);
			expect(existsSync(contentPath), `Missing ${article.section}/${article.id}`).toBe(true);
			const content = readFileSync(contentPath, "utf8");
			const internalLinks = [...content.matchAll(/\]\((\/[^)#?]+)[^)]*\)/g)];
			expect(internalLinks.length, `${article.id} needs contextual links`).toBeGreaterThanOrEqual(
				3,
			);
		}
	});

	it("only links related cards to known indexable routes", () => {
		const known = knownIndexablePaths();
		for (const article of getArticles()) {
			for (const link of article.related) {
				expect(known.has(link.href), `${article.id} -> ${link.href}`).toBe(true);
			}
		}
	});
});
