import { describe, expect, it } from "vitest";
import { getPlatform, getPlatforms, getPlatformsByKind } from "./platforms";

describe("getPlatformsByKind", () => {
	it("marks the Nordnet vs. Saxo Bank article as a comparison", () => {
		expect(getPlatformsByKind("comparison").map(({ id }) => id)).toEqual(["nordnet-vs-saxo-bank"]);
	});

	it("keeps the providers in their getPlatforms() order", () => {
		expect(getPlatformsByKind("provider").map(({ id }) => id)).toEqual([
			"norm-invest",
			"saxo-bank",
			"nordnet",
			"endavu",
			"lysa",
			"etoro",
		]);
	});

	it("puts every platform in exactly one group", () => {
		const grouped = [...getPlatformsByKind("provider"), ...getPlatformsByKind("comparison")];
		expect(grouped).toHaveLength(getPlatforms().length);
		expect(new Set(grouped.map(({ id }) => id))).toEqual(
			new Set(getPlatforms().map(({ id }) => id)),
		);
	});
});

describe("getPlatform", () => {
	it("keeps the next link across the provider/comparison groups", () => {
		expect(getPlatform("etoro")?.next?.id).toBe("nordnet-vs-saxo-bank");
		expect(getPlatform("nordnet-vs-saxo-bank")?.next).toBeNull();
	});
});
