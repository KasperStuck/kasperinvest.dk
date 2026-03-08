import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = import.meta.env.CONVEX_URL;

if (!CONVEX_URL) {
	throw new Error("Missing CONVEX_URL environment variable");
}

export const convex = new ConvexHttpClient(CONVEX_URL);

export { api } from "../../convex/_generated/api";
