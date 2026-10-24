import fallbackSvg from "@/assets/video-thumbnail-fallback.svg?raw";

// Thumbnail paths stored from the YouTube Data API (maxres, high, medium).
const YOUTUBE_THUMBNAIL_PATH =
	/^\/vi\/[A-Za-z0-9_-]{11}\/(?:maxresdefault|hqdefault|mqdefault)\.jpg$/;

function isYouTubeThumbnail(href: string | null): boolean {
	if (!href || !URL.canParse(href)) return false;
	const url = new URL(href);
	return (
		url.protocol === "https:" &&
		url.hostname === "i.ytimg.com" &&
		url.port === "" &&
		url.username === "" &&
		url.password === "" &&
		url.search === "" &&
		url.hash === "" &&
		YOUTUBE_THUMBNAIL_PATH.test(url.pathname)
	);
}

/**
 * Astro's image endpoint answers 500 when YouTube no longer serves a stored
 * thumbnail. Swap that for a neutral placeholder, cached briefly so a restored
 * thumbnail shows up again.
 */
export function thumbnailFallback(request: Request, response: Response): Response | undefined {
	if (request.method !== "GET" || response.status !== 500) return undefined;
	const url = new URL(request.url);
	if (url.pathname !== "/_image" || !isYouTubeThumbnail(url.searchParams.get("href")))
		return undefined;
	return new Response(fallbackSvg, {
		status: 200,
		headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
	});
}
