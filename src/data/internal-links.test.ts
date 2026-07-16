import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getArticles } from "./articles";
import { getGlossaryTerms } from "./glossary";
import { getModules } from "./lessons";
import { getPensionTypes } from "./pension";
import { getPlatforms } from "./platforms";

const staticRoutes = [
	"/",
	"/affiliatepolitik",
	"/etf",
	"/folketingsvalg",
	"/guides",
	"/om",
	"/ordbog",
	"/pension",
	"/platforme",
	"/redaktionel-metode",
	"/resources",
	"/sitemap",
	"/skat",
	"/spar-penge",
	"/youtube",
];

function normalized(path: string): string {
	const withoutQuery = path.split(/[?#]/, 1)[0] || "/";
	return withoutQuery !== "/" ? withoutQuery.replace(/\/$/, "") : "/";
}

function routeInventory(): Set<string> {
	const routes = new Set(staticRoutes);
	for (const module of getModules()) {
		for (const lesson of module.lessons) routes.add(`/${lesson.id}`);
	}
	for (const term of getGlossaryTerms()) routes.add(`/ordbog/${term.id}`);
	for (const type of getPensionTypes()) routes.add(`/pension/${type.id}`);
	for (const platform of getPlatforms()) routes.add(`/platforme/${platform.id}`);
	for (const article of getArticles()) routes.add(`/${article.section}/${article.id}`);
	return routes;
}

function indexableContentFiles(): string[] {
	const files: string[] = [];
	for (const module of getModules()) {
		for (const lesson of module.lessons) {
			files.push(resolve("src/data/lessons", module.id, `${lesson.id}.mdx`));
		}
	}
	for (const term of getGlossaryTerms()) files.push(resolve("src/data/glossary", `${term.id}.mdx`));
	for (const type of getPensionTypes()) files.push(resolve("src/data/pension", `${type.id}.mdx`));
	for (const platform of getPlatforms()) {
		files.push(resolve("src/data/platforms", `${platform.id}.mdx`));
	}
	for (const article of getArticles()) {
		files.push(resolve("src/data/articles", article.section, `${article.id}.mdx`));
	}
	return files;
}

describe("content internal links", () => {
	it("point from indexable MDX content to known indexable routes", () => {
		const routes = routeInventory();
		const broken: string[] = [];

		for (const file of indexableContentFiles()) {
			const content = readFileSync(file, "utf8");
			for (const match of content.matchAll(/\]\((\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
				const target = normalized(match[1]);
				if (!routes.has(target))
					broken.push(`${file.replace(`${process.cwd()}/`, "")} -> ${target}`);
			}
		}

		expect(broken, broken.join("\n")).toEqual([]);
	});
});
