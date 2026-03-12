import { describe, expect, it, vi } from "vitest";
import {
	bestThumbnail,
	cleanDescription,
	extractHashtags,
	forEachSafe,
	getTranscriptText,
	parseDuration,
} from "./helpers";

// --- parseDuration ---

describe("parseDuration", () => {
	it("parses hours, minutes, and seconds", () => {
		expect(parseDuration("PT1H2M3S")).toBe(3723);
	});

	it("parses minutes and seconds only", () => {
		expect(parseDuration("PT12M30S")).toBe(750);
	});

	it("parses seconds only", () => {
		expect(parseDuration("PT45S")).toBe(45);
	});

	it("parses hours only", () => {
		expect(parseDuration("PT2H")).toBe(7200);
	});

	it("parses minutes only", () => {
		expect(parseDuration("PT5M")).toBe(300);
	});

	it("returns 0 for invalid input", () => {
		expect(parseDuration("")).toBe(0);
		expect(parseDuration("invalid")).toBe(0);
		expect(parseDuration("P1D")).toBe(0);
	});

	it("parses PT0S as 0", () => {
		expect(parseDuration("PT0S")).toBe(0);
	});
});

// --- bestThumbnail ---

describe("bestThumbnail", () => {
	it("prefers maxres", () => {
		expect(
			bestThumbnail({
				maxres: { url: "maxres.jpg" },
				high: { url: "high.jpg" },
				medium: { url: "medium.jpg" },
			}),
		).toBe("maxres.jpg");
	});

	it("falls back to high", () => {
		expect(
			bestThumbnail({
				high: { url: "high.jpg" },
				medium: { url: "medium.jpg" },
			}),
		).toBe("high.jpg");
	});

	it("falls back to medium", () => {
		expect(bestThumbnail({ medium: { url: "medium.jpg" } })).toBe("medium.jpg");
	});

	it("returns empty string when no thumbnails", () => {
		expect(bestThumbnail({})).toBe("");
	});
});

// --- extractHashtags ---

describe("extractHashtags", () => {
	it("extracts hashtags from text", () => {
		expect(extractHashtags("Check out #investing and #stocks")).toEqual(["investing", "stocks"]);
	});

	it("lowercases hashtags", () => {
		expect(extractHashtags("#Investing #STOCKS")).toEqual(["investing", "stocks"]);
	});

	it("removes trailing punctuation", () => {
		expect(extractHashtags("#tag. #tag2, #tag3!")).toEqual(["tag", "tag2", "tag3"]);
	});

	it("deduplicates hashtags", () => {
		expect(extractHashtags("#tag #TAG #Tag")).toEqual(["tag"]);
	});

	it("skips single-character hashtags", () => {
		expect(extractHashtags("#a #ab")).toEqual(["ab"]);
	});

	it("returns empty array for no hashtags", () => {
		expect(extractHashtags("no tags here")).toEqual([]);
	});
});

// --- getTranscriptText ---

describe("getTranscriptText", () => {
	it("joins segments with spaces", () => {
		const segments = [{ text: "Hello" }, { text: "world" }];
		expect(getTranscriptText(segments, 100)).toBe("Hello world");
	});

	it("truncates to maxLength", () => {
		const segments = [{ text: "Hello" }, { text: "world" }];
		expect(getTranscriptText(segments, 7)).toBe("Hello w");
	});

	it("returns empty string for undefined", () => {
		expect(getTranscriptText(undefined, 100)).toBe("");
	});

	it("returns empty string for empty array", () => {
		expect(getTranscriptText([], 100)).toBe("");
	});
});

// --- forEachSafe ---

describe("forEachSafe", () => {
	it("calls fn for each item", async () => {
		const results: number[] = [];
		await forEachSafe(
			[1, 2, 3],
			(n) => String(n),
			async (n) => {
				results.push(n);
			},
		);
		expect(results).toEqual([1, 2, 3]);
	});

	it("continues on error", async () => {
		const results: number[] = [];
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		await forEachSafe(
			[1, 2, 3],
			(n) => String(n),
			async (n) => {
				if (n === 2) throw new Error("fail");
				results.push(n);
			},
		);

		expect(results).toEqual([1, 3]);
		expect(spy).toHaveBeenCalledOnce();
		spy.mockRestore();
	});

	it("handles empty array", async () => {
		const fn = vi.fn();
		await forEachSafe([], () => "", fn);
		expect(fn).not.toHaveBeenCalled();
	});
});

// --- cleanDescription ---

describe("cleanDescription", () => {
	it("keeps regular content", () => {
		expect(cleanDescription("This is a video about investing")).toBe(
			"This is a video about investing",
		);
	});

	it("removes URL-only lines", () => {
		expect(cleanDescription("Good content\nhttps://example.com\nMore content")).toBe(
			"Good content\nMore content",
		);
	});

	it("removes inline URLs from lines", () => {
		expect(cleanDescription("Check out https://example.com for more")).toBe("Check out  for more");
	});

	it("skips sections starting with skip patterns", () => {
		const input = [
			"Real content here",
			"Følg mig på sociale medier:",
			"Instagram: @user",
			"Twitter: @user",
			"---",
			"More real content",
		].join("\n");
		expect(cleanDescription(input)).toBe("Real content here\nMore real content");
	});

	it("skips disclaimer lines", () => {
		expect(cleanDescription("Content\nHUSK: Jeg er ikke rådgiver\nMore content")).toBe(
			"Content\nMore content",
		);
	});

	it("skips hashtag-only lines", () => {
		expect(cleanDescription("Content\n#tag1 #tag2 #tag3\nMore")).toBe("Content\nMore");
	});

	it("skips affiliate sections", () => {
		const input = [
			"Good content",
			"Affiliate",
			"Some affiliate link",
			"Another link",
			"___",
			"Back to content",
		].join("\n");
		expect(cleanDescription(input)).toBe("Good content\nBack to content");
	});

	it("collapses multiple blank lines", () => {
		expect(cleanDescription("A\n\n\n\n\nB")).toBe("A\nB");
	});

	it("handles empty input", () => {
		expect(cleanDescription("")).toBe("");
	});

	it("removes leading emojis from lines", () => {
		expect(cleanDescription("🔥 Hot take on markets")).toBe("Hot take on markets");
	});
});
