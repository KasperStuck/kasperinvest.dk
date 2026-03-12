import { describe, expect, it } from "vitest";
import { getLesson, getModules } from "./lessons";

describe("getModules", () => {
	it("returns all modules", () => {
		const modules = getModules();
		expect(modules.length).toBeGreaterThan(0);
	});

	it("each module has required fields", () => {
		for (const mod of getModules()) {
			expect(mod.id).toBeTruthy();
			expect(mod.title).toBeTruthy();
			expect(mod.description).toBeTruthy();
			expect(mod.lessons.length).toBeGreaterThan(0);
		}
	});

	it("each lesson has required fields", () => {
		for (const mod of getModules()) {
			for (const lesson of mod.lessons) {
				expect(lesson.id).toBeTruthy();
				expect(lesson.title).toBeTruthy();
				expect(lesson.description).toBeTruthy();
			}
		}
	});

	it("all lesson IDs are unique", () => {
		const ids = getModules().flatMap((m) => m.lessons.map((l) => l.id));
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("all module IDs are unique", () => {
		const ids = getModules().map((m) => m.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("getLesson", () => {
	it("finds a lesson by slug", async () => {
		const lesson = await getLesson("velkommen-til-kurset");
		expect(lesson).not.toBeNull();
		expect(lesson?.title).toBe("Velkommen til kurset");
	});

	it("includes the parent module", async () => {
		const lesson = await getLesson("velkommen-til-kurset");
		expect(lesson?.module.id).toBe("velkommen-og-fundament");
	});

	it("includes next lesson when not last", async () => {
		const lesson = await getLesson("velkommen-til-kurset");
		expect(lesson?.next).not.toBeNull();
		expect(lesson?.next?.id).toBe("budget-og-overblik");
	});

	it("returns null next for last lesson in module", async () => {
		const lesson = await getLesson("gaeld-eller-investering");
		expect(lesson?.next).toBeNull();
	});

	it("returns null for unknown slug", async () => {
		const lesson = await getLesson("nonexistent-slug");
		expect(lesson).toBeNull();
	});
});
