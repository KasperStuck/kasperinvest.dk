// @vitest-environment node
import { createContext } from "astro/middleware";
import { Window } from "happy-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getModules, type Module } from "@/data/lessons";
import { api, convex } from "@/lib/convex";
import { GET } from "@/pages/sitemap.xml";

vi.mock("@/data/lessons", () => ({ getModules: vi.fn() }));
vi.mock("@/data/savings", () => ({
	getSavingsCategories: vi.fn().mockResolvedValue([{ id: "investering" }]),
}));
vi.mock("@/lib/convex", () => ({
	api: { channels: { list: "channels:list" }, videos: { listRecent: "videos:listRecent" } },
	convex: {
		query: vi.fn(async (query: unknown) =>
			query === "channels:list"
				? [{ channelId: "fixture-channel", customUrl: "@fixture" }]
				: [{ channelId: "fixture-channel", slug: "fixture-video" }],
		),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("lesson sitemap dates", () => {
	it("adds only a supplied lesson modification date and preserves other URL families", async () => {
		const modules: Module[] = [
			{
				id: "fixture-module",
				title: "Modul",
				description: "Lokal fixture",
				lessons: [
					{
						id: "dated-lesson",
						title: "Opdateret lektion",
						description: "Lokal fixture med en dokumenteret dato.",
						video: null,
						faq: [],
						updatedAt: "2025-03-12",
					},
					{
						id: "undated-lesson",
						title: "Lektion uden dato",
						description: "Lokal fixture uden opdateringsdato.",
						video: null,
						faq: [],
					},
				],
			},
		];
		vi.mocked(getModules).mockReturnValue(modules);
		const context = createContext({
			request: new Request("https://kasperinvest.dk/sitemap.xml"),
			defaultLocale: "da",
		});
		const response = await GET(context);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");
		const window = new Window();
		const parser = new window.DOMParser();
		const document = parser.parseFromString(await response.text(), "application/xml");
		const entries = Array.from(document.querySelectorAll("url"));
		const dated = entries.find(
			(entry) =>
				entry.querySelector("loc")?.textContent === "https://kasperinvest.dk/dated-lesson/",
		);
		const undated = entries.find(
			(entry) =>
				entry.querySelector("loc")?.textContent === "https://kasperinvest.dk/undated-lesson/",
		);
		expect(dated?.querySelector("lastmod")?.textContent).toBe("2025-03-12");
		expect(undated).toBeDefined();
		expect(undated?.querySelector("lastmod")).toBeNull();
		const urls = entries.map((entry) => entry.querySelector("loc")?.textContent);
		expect(urls).toEqual(
			expect.arrayContaining([
				"https://kasperinvest.dk/",
				"https://kasperinvest.dk/redaktionel-metode/",
				"https://kasperinvest.dk/spar-penge/investering/",
				"https://kasperinvest.dk/youtube/fixture/",
				"https://kasperinvest.dk/youtube/fixture/fixture-video/",
			]),
		);
		expect(convex.query).toHaveBeenCalledWith(api.channels.list, {});
		expect(convex.query).toHaveBeenCalledWith(api.videos.listRecent, { limit: 100 });
	});
});
