// @vitest-environment node
import { createContext } from "astro/middleware";
import { describe, expect, it } from "vitest";
import { onRequest } from "@/middleware";

const VIDEO_ID = "Fuboif92ElA";
const MISSING_THUMBNAIL = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

function imageUrl(href: string): string {
	return `https://kasperinvest.dk/_image?href=${encodeURIComponent(href)}&w=640&h=360&f=webp`;
}

async function run(url: string, upstream: Response, method = "GET"): Promise<Response> {
	const context = createContext({ request: new Request(url, { method }), defaultLocale: "da" });
	const response = await onRequest(context, async () => upstream);
	if (!(response instanceof Response)) throw new Error("middleware returned no response");
	return response;
}

const failed = () => new Response("Internal Server Error", { status: 500 });

describe("image endpoint thumbnail fallback", () => {
	it.each([
		"maxresdefault.jpg",
		"hqdefault.jpg",
		"mqdefault.jpg",
	])("replaces a failed YouTube %s with a short-lived placeholder", async (file) => {
		const response = await run(imageUrl(`https://i.ytimg.com/vi/${VIDEO_ID}/${file}`), failed());

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
		expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
		expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
		const body = await response.text();
		expect(body).toMatch(/^<svg[^>]+viewBox="0 0 640 360"/);
		expect(body).not.toContain(VIDEO_ID);
		expect(body).not.toMatch(/<script|href=|on\w+=/i);
	});

	it("keeps a healthy image response unchanged", async () => {
		const healthy = new Response(new Uint8Array([1, 2, 3]), {
			status: 200,
			headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000" },
		});
		const response = await run(imageUrl(MISSING_THUMBNAIL), healthy);

		expect(response).toBe(healthy);
		expect(response.headers.get("Content-Type")).toBe("image/webp");
		expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
	});

	it.each([
		["plain http", `http://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`],
		["suffix host", `https://i.ytimg.com.example.com/vi/${VIDEO_ID}/maxresdefault.jpg`],
		["other host", `https://example.com/vi/${VIDEO_ID}/maxresdefault.jpg`],
		["credentials", `https://user:pass@i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`],
		["custom port", `https://i.ytimg.com:8443/vi/${VIDEO_ID}/maxresdefault.jpg`],
		["short video id", "https://i.ytimg.com/vi/abc/maxresdefault.jpg"],
		["unknown variant", `https://i.ytimg.com/vi/${VIDEO_ID}/sddefault.jpg`],
		["extra path", `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg/x`],
		["encoded traversal", `https://i.ytimg.com/vi/${VIDEO_ID}/..%2Fmaxresdefault.jpg`],
		["query string", `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg?x=1`],
		["local image", "/_astro/photo.jpg"],
		["malformed", "https://"],
	])("leaves a failed %s source untouched", async (_label, href) => {
		const upstream = failed();
		expect(await run(imageUrl(href), upstream)).toBe(upstream);
	});

	it("leaves image requests without a source untouched", async () => {
		const upstream = failed();
		expect(await run("https://kasperinvest.dk/_image?w=640", upstream)).toBe(upstream);
	});

	it.each([400, 403, 404])("leaves a %i image response untouched", async (status) => {
		const upstream = new Response("No", { status });
		expect(await run(imageUrl(MISSING_THUMBNAIL), upstream)).toBe(upstream);
	});

	it.each(["HEAD", "POST"])("leaves a failed %s request untouched", async (method) => {
		const upstream = failed();
		expect(await run(imageUrl(MISSING_THUMBNAIL), upstream, method)).toBe(upstream);
	});

	it("leaves a failed page with a thumbnail query untouched", async () => {
		const upstream = failed();
		const url = `https://kasperinvest.dk/youtube/?href=${encodeURIComponent(MISSING_THUMBNAIL)}`;
		expect(await run(url, upstream)).toBe(upstream);
		expect(upstream.headers.get("X-Content-Type-Options")).toBe("nosniff");
	});
});
