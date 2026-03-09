import { defineMiddleware } from "astro:middleware";

const STATIC_ASSET = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/;

export const onRequest = defineMiddleware(async (_context, next) => {
	const response = await next();
	const url = new URL(_context.request.url);

	// Static assets: 1 year cache (matches previous nginx config)
	if (STATIC_ASSET.test(url.pathname)) {
		response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
	}

	// SSR YouTube pages: cache 5 minutes, serve stale while revalidating
	if (url.pathname.startsWith("/youtube") && !response.headers.has("Cache-Control")) {
		response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
	}

	// Security headers (matches previous nginx config)
	response.headers.set("X-Frame-Options", "SAMEORIGIN");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	return response;
});
