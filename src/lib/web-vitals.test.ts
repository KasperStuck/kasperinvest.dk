import { describe, expect, it } from "vitest";
import { isWebVitalPayload } from "@/pages/api/web-vitals";

describe("web vital payload validation", () => {
	it("accepts anonymous Core Web Vitals", () => {
		expect(
			isWebVitalPayload({
				name: "LCP",
				value: 1234.5,
				rating: "good",
				navigationType: "navigate",
				path: "/guides/boligopsparing/",
			}),
		).toBe(true);
	});

	it("rejects unsupported or invalid metrics", () => {
		expect(isWebVitalPayload({ name: "FID", value: 1, rating: "good", path: "/" })).toBe(false);
		expect(isWebVitalPayload({ name: "CLS", value: -1, rating: "good", path: "/" })).toBe(false);
	});
});
