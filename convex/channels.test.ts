/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { validChannelDescription } from "./lib/fixtures.testing";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");
const newTest = () => convexTest(schema, modules);
type TestConvex = ReturnType<typeof newTest>;

const baseChannel = {
	channelId: "ch1",
	name: "Kanal",
	uploadsPlaylistId: "UU1",
};

async function seed(t: TestConvex, fields: Record<string, unknown> = {}) {
	await t.run((ctx) => ctx.db.insert("channels", { ...baseChannel, ...fields }));
}

async function stored(t: TestConvex) {
	return t.run(async (ctx) => {
		const channel = await ctx.db
			.query("channels")
			.withIndex("by_channelId", (q) => q.eq("channelId", "ch1"))
			.unique();
		return channel?.aiDescription;
	});
}

describe("publishAiDescription", () => {
	it("publishes a valid description when the stored one is unchanged", async () => {
		const t = newTest();
		await seed(t, { aiDescription: "gammel" });
		const result = await t.mutation(internal.channels.publishAiDescription, {
			deadlineAt: Date.now() + 60_000,
			channelId: "ch1",
			aiDescription: validChannelDescription(),
			expectedAiDescription: "gammel",
		});
		expect(result).toEqual({ status: "published" });
		expect(await stored(t)).toBe(validChannelDescription());
	});

	it("publishes the first description for a channel without one", async () => {
		const t = newTest();
		await seed(t);
		const result = await t.mutation(internal.channels.publishAiDescription, {
			deadlineAt: Date.now() + 60_000,
			channelId: "ch1",
			aiDescription: validChannelDescription(),
		});
		expect(result).toEqual({ status: "published" });
	});

	it("rejects a stale write", async () => {
		const t = newTest();
		await seed(t, { aiDescription: "nyere" });
		const result = await t.mutation(internal.channels.publishAiDescription, {
			deadlineAt: Date.now() + 60_000,
			channelId: "ch1",
			aiDescription: validChannelDescription(),
			expectedAiDescription: "gammel",
		});
		expect(result).toEqual({ status: "stale" });
		expect(await stored(t)).toBe("nyere");
	});

	it("re-validates and rejects an invalid description", async () => {
		const t = newTest();
		await seed(t, { aiDescription: "gammel" });
		const result = await t.mutation(internal.channels.publishAiDescription, {
			deadlineAt: Date.now() + 60_000,
			channelId: "ch1",
			aiDescription: "Vi laver videoer.",
			expectedAiDescription: "gammel",
		});
		expect(result).toMatchObject({ status: "invalid" });
		expect(await stored(t)).toBe("gammel");
	});
});

describe("publishAiDescription deadline", () => {
	it("rejects a publish after the job deadline", async () => {
		const t = newTest();
		await seed(t, { aiDescription: "gammel" });
		const result = await t.mutation(internal.channels.publishAiDescription, {
			deadlineAt: Date.now() - 1,
			channelId: "ch1",
			aiDescription: validChannelDescription(),
			expectedAiDescription: "gammel",
		});
		expect(result).toEqual({ status: "deadline" });
		expect(await stored(t)).toBe("gammel");
	});
});

describe("auditPage", () => {
	it("reports failing and missing descriptions without provider calls", async () => {
		const t = newTest();
		await seed(t);
		await t.run((ctx) =>
			ctx.db.insert("channels", { ...baseChannel, channelId: "ch2", aiDescription: "Vi er her." }),
		);
		await t.run((ctx) =>
			ctx.db.insert("channels", {
				...baseChannel,
				channelId: "ch3",
				aiDescription: validChannelDescription(),
			}),
		);
		const page = await t.query(internal.channels.auditPage, {
			paginationOpts: { numItems: 10, cursor: null },
		});
		expect(page).toMatchObject({ checked: 3, missing: ["ch1"], isDone: true });
		expect(page.failing).toEqual([
			{
				id: "ch2",
				part: "channel",
				issues: ["paragraph_count", "paragraph_too_short", "word_count", "first_person"],
			},
		]);
	});
});
