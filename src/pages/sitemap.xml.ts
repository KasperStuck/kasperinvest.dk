import type { APIRoute } from "astro";
import { getArticles } from "@/data/articles";
import { getElections } from "@/data/elections";
import { getGlossaryTerms } from "@/data/glossary";
import { getModules } from "@/data/lessons";
import { getPensionTypes } from "@/data/pension";
import { getPlatforms } from "@/data/platforms";
import { getSavingsCategories } from "@/data/savings";
import { api, convex } from "@/lib/convex";

export const prerender = false;

const SITE_URL = "https://kasperinvest.dk";

function escapeXml(unsafe: string): string {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;";
			default:
				return c;
		}
	});
}

function trail(url: string): string {
	return url.endsWith("/") ? url : `${url}/`;
}

function urlEntry(loc: string, lastmod?: string): string {
	const escapedLoc = escapeXml(trail(loc));
	if (lastmod) {
		return `  <url>\n    <loc>${escapedLoc}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </url>`;
	}
	return `  <url>\n    <loc>${escapedLoc}</loc>\n  </url>`;
}

export const GET: APIRoute = async () => {
	const urls = new Map<string, string>(); // loc -> lastmod

	const add = (loc: string, lastmod?: string) => {
		if (!urls.has(loc) || (lastmod && !urls.get(loc))) {
			urls.set(loc, lastmod || "");
		}
	};

	// Static pages & hubs
	add(SITE_URL);
	add(`${SITE_URL}/resources`);
	add(`${SITE_URL}/youtube`);
	add(`${SITE_URL}/om`);
	add(`${SITE_URL}/redaktionel-metode`);
	add(`${SITE_URL}/affiliatepolitik`);
	add(`${SITE_URL}/ordbog`);
	add(`${SITE_URL}/pension`);
	add(`${SITE_URL}/platforme`);
	add(`${SITE_URL}/spar-penge`);
	add(`${SITE_URL}/guides`);
	add(`${SITE_URL}/etf`);
	add(`${SITE_URL}/skat`);
	add(`${SITE_URL}/folketingsvalg`);

	// Lessons
	for (const mod of getModules()) {
		for (const lesson of mod.lessons) {
			add(`${SITE_URL}/${lesson.id}`);
		}
	}

	// Elections
	for (const election of getElections()) {
		add(`${SITE_URL}/folketingsvalg/${election.year}`);
		for (const article of election.articles) {
			add(`${SITE_URL}/folketingsvalg/${election.year}/${article.id}`);
		}
	}

	// Pension
	for (const pension of getPensionTypes()) {
		add(`${SITE_URL}/pension/${pension.id}`);
	}

	// Platforme
	for (const platform of getPlatforms()) {
		add(`${SITE_URL}/platforme/${platform.id}`);
	}

	// Ordbog
	for (const term of getGlossaryTerms()) {
		add(`${SITE_URL}/ordbog/${term.id}`);
	}

	// Articles (Guides, ETF, Skat)
	for (const article of getArticles()) {
		add(`${SITE_URL}/${article.section}/${article.id}`, article.updatedAt);
	}

	// Savings
	try {
		for (const cat of await getSavingsCategories()) {
			add(`${SITE_URL}/spar-penge/${cat.id}`);
		}
	} catch (error) {
		console.error("[sitemap] Failed to get savings categories", error);
	}

	// YouTube channels and videos (dynamic from Convex)
	try {
		const [channels, videos] = await Promise.all([
			convex.query(api.channels.list, {}),
			convex.query(api.videos.listRecent, { limit: 100 }),
		]);

		const channelMap = new Map(
			channels.map((ch) => [ch.channelId, ch.customUrl?.replace(/^@/, "") ?? ch.channelId]),
		);

		for (const ch of channels) {
			if (ch.customUrl) {
				add(`${SITE_URL}/youtube/${ch.customUrl.replace(/^@/, "")}`);
			}
		}

		for (const video of videos) {
			if (video.slug) {
				const handle = channelMap.get(video.channelId);
				if (handle) {
					add(`${SITE_URL}/youtube/${handle}/${video.slug}`);
				}
			}
		}
	} catch (error) {
		console.error("[sitemap] Convex query failed, skipping YouTube URLs", error);
	}

	const xmlUrls = Array.from(urls.entries()).map(([loc, lastmod]) => urlEntry(loc, lastmod));

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls.join("\n")}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=86400",
		},
	});
};
