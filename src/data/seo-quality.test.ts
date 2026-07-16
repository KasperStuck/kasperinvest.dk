import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getArticles } from "./articles";
import { getGlossaryTerms } from "./glossary";

function content(path: string): string {
	expect(existsSync(path), `Missing indexable content: ${path}`).toBe(true);
	return readFileSync(path, "utf8");
}

function wordCount(markdown: string): number {
	return markdown
		.replace(/<[^>]+>/g, " ")
		.replace(/\[[^\]]+\]\([^)]+\)/g, " ")
		.split(/\s+/)
		.filter(Boolean).length;
}

describe("indexable content quality gates", () => {
	it("keeps published glossary pages substantive and contextually linked", () => {
		for (const term of getGlossaryTerms()) {
			const file = resolve(process.cwd(), "src", "data", "glossary", `${term.id}.mdx`);
			const markdown = content(file);
			const links = [...markdown.matchAll(/\]\((\/[^)#?]+)[^)]*\)/g)];

			expect(wordCount(markdown), `${term.id} is too thin to index`).toBeGreaterThanOrEqual(180);
			expect(links.length, `${term.id} needs contextual internal links`).toBeGreaterThanOrEqual(2);
		}
	});

	it("keeps SEO articles substantive", () => {
		for (const article of getArticles()) {
			const file = resolve(
				process.cwd(),
				"src",
				"data",
				"articles",
				article.section,
				`${article.id}.mdx`,
			);
			expect(wordCount(content(file)), `${article.id} is too thin to index`).toBeGreaterThanOrEqual(
				220,
			);
		}
	});

	it("uses unique glossary titles and descriptions", () => {
		const terms = getGlossaryTerms();
		const titles = terms.map((term) => term.seoTitle ?? term.title);
		const descriptions = terms.map((term) => term.description);

		expect(new Set(titles).size, "Duplicate glossary titles").toBe(titles.length);
		expect(new Set(descriptions).size, "Duplicate glossary descriptions").toBe(descriptions.length);
	});
});
