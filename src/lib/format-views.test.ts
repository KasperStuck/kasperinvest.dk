import { describe, expect, it } from "vitest";
import { formatViews } from "./format-views";

describe("formatViews", () => {
	it.each([
		[0, "0 visninger"],
		[1, "1 visning"],
		[999, "999 visninger"],
		[1000, "1.000 visninger"],
		[485_600, "485.600 visninger"],
		[999_999, "999.999 visninger"],
		[1_000_000, "1.000.000 visninger"],
		[12_345_678, "12.345.678 visninger"],
	])("formats %i as %s", (count, label) => {
		expect(formatViews(count)).toBe(label);
	});
});
