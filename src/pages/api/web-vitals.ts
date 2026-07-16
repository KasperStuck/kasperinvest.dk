import type { APIRoute } from "astro";

export const prerender = false;

const names = new Set(["CLS", "INP", "LCP"]);
const ratings = new Set(["good", "needs-improvement", "poor"]);

type WebVitalPayload = {
	name: string;
	value: number;
	rating: string;
	navigationType?: string;
	path: string;
};

export function isWebVitalPayload(value: unknown): value is WebVitalPayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Record<string, unknown>;
	return (
		typeof payload.name === "string" &&
		names.has(payload.name) &&
		typeof payload.value === "number" &&
		Number.isFinite(payload.value) &&
		payload.value >= 0 &&
		typeof payload.rating === "string" &&
		ratings.has(payload.rating) &&
		typeof payload.path === "string" &&
		payload.path.startsWith("/") &&
		payload.path.length <= 500 &&
		(payload.navigationType === undefined || typeof payload.navigationType === "string")
	);
}

export const POST: APIRoute = async ({ request }) => {
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	if (contentLength > 4096) {
		return new Response(null, { status: 413 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!isWebVitalPayload(payload)) {
		return Response.json({ error: "Invalid web vital" }, { status: 400 });
	}

	console.info(
		"[web-vital]",
		JSON.stringify({
			...payload,
			measuredAt: new Date().toISOString(),
		}),
	);

	return new Response(null, {
		status: 204,
		headers: { "Cache-Control": "no-store" },
	});
};
