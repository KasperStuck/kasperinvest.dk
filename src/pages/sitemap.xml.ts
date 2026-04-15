import type { APIRoute } from "astro";
import { getElections } from "@/data/elections";
import { getGlossaryTerms } from "@/data/glossary";
import { getModules } from "@/data/lessons";
import { getPensionTypes } from "@/data/pension";
import { getPlatforms } from "@/data/platforms";
import { api, convex } from "@/lib/convex";

export const prerender = false;

const SITE_URL = "https://kasperinvest.dk";

function trail(url: string): string {
	return url.endsWith("/") ? url : `${url}/`;
}

function urlEntry(loc: string): string {
	return `  <url>\n    <loc>${trail(loc)}</loc>\n  </url>`;
}

export const GET: APIRoute = async () => {
	const urls: string[] = [];

	// Static pages
	urls.push(urlEntry(SITE_URL));
	urls.push(urlEntry(`${SITE_URL}/resources`));
	urls.push(urlEntry(`${SITE_URL}/youtube`));
	urls.push(urlEntry(`${SITE_URL}/sitemap`));

	// Lessons
	for (const mod of getModules()) {
		for (const lesson of mod.lessons) {
			urls.push(urlEntry(`${SITE_URL}/${lesson.id}`));
		}
	}

	// Elections
	for (const election of getElections()) {
		urls.push(urlEntry(`${SITE_URL}/folketingsvalg/${election.year}`));
		for (const article of election.articles) {
			urls.push(urlEntry(`${SITE_URL}/folketingsvalg/${election.year}/${article.id}`));
		}
	}

	// Pension
	for (const pension of getPensionTypes()) {
		urls.push(urlEntry(`${SITE_URL}/pension/${pension.id}`));
	}

	// Platforme
	for (const platform of getPlatforms()) {
		urls.push(urlEntry(`${SITE_URL}/platforme/${platform.id}`));
	}

	// Ordbog
	for (const term of getGlossaryTerms()) {
		urls.push(urlEntry(`${SITE_URL}/ordbog/${term.id}`));
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
				urls.push(urlEntry(`${SITE_URL}/youtube/${ch.customUrl.replace(/^@/, "")}`));
			}
		}

		for (const video of videos) {
			if (video.slug) {
				const handle = channelMap.get(video.channelId);
				if (handle) {
					urls.push(urlEntry(`${SITE_URL}/youtube/${handle}/${video.slug}`));
				}
			}
		}
	} catch (error) {
		console.error("[sitemap] Convex query failed, skipping YouTube URLs", error);
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=86400",
		},
	});
};
