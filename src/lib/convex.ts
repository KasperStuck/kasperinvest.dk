import { CONVEX_URL } from "astro:env/server";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

const client = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const QUERY_TIMEOUT = 8_000;
const cache = new Map<string, { data: unknown; ts: number }>();

function withTimeout<T>(promise: Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error(`Convex query timed out after ${QUERY_TIMEOUT} ms`)),
			QUERY_TIMEOUT,
		);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

function cachedQuery<F extends FunctionReference<"query">>(
	fn: F,
	args: FunctionArgs<F>,
): Promise<FunctionReturnType<F>> {
	if (!client) {
		return Promise.reject(new Error("Convex is not configured"));
	}

	const key = JSON.stringify([fn, args]);
	const entry = cache.get(key);
	if (entry && Date.now() - entry.ts < CACHE_TTL) {
		return Promise.resolve(entry.data as FunctionReturnType<F>);
	}
	const promise = withTimeout(client.query(fn, args)).then((data) => {
		cache.set(key, { data, ts: Date.now() });
		return data;
	});
	return promise;
}

export const convex = {
	query: cachedQuery,
};

export { api } from "../../convex/_generated/api";
