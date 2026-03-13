import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

const CONVEX_URL = process.env.CONVEX_URL || import.meta.env.CONVEX_URL;

if (!CONVEX_URL) {
	throw new Error("Missing CONVEX_URL environment variable");
}

const client = new ConvexHttpClient(CONVEX_URL);

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { data: unknown; ts: number }>();

function cachedQuery<F extends FunctionReference<"query">>(
	fn: F,
	args: FunctionArgs<F>,
): Promise<FunctionReturnType<F>> {
	const key = JSON.stringify([fn, args]);
	const entry = cache.get(key);
	if (entry && Date.now() - entry.ts < CACHE_TTL) {
		return Promise.resolve(entry.data as FunctionReturnType<F>);
	}
	const promise = client.query(fn, args).then((data) => {
		cache.set(key, { data, ts: Date.now() });
		return data;
	});
	return promise;
}

export const convex = {
	query: cachedQuery,
};

export { api } from "../../convex/_generated/api";
