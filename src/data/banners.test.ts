import { describe, expect, it } from "vitest";
import { selectBanner } from "@/lib/banners";
import { banners } from "./banners";

describe("configured banners", () => {
	it.each(["Norm Invest", "NormInvest"])("selects Norm's banner for a %s review", (name) => {
		const banner = selectBanner(
			{
				title: `${name} anmeldelse: pris, fordele og ulemper`,
				h1Text: name,
				contentText: `${name} forvalter din investering. Saxo Bank er et alternativ.`,
			},
			banners,
		);

		expect(banner?.href).toContain("https://at.norminvest.com/");
	});

	it("selects Norm's banner for content about Norm Invest", () => {
		const banner = selectBanner(
			{
				title: "Automatisk opsparing",
				h1Text: "Automatisk opsparing",
				contentText: "Norm Invest forvalter din investering i en bred portefølje.",
			},
			banners,
		);

		expect(banner?.href).toContain("https://at.norminvest.com/");
	});

	it("keeps Saxo's banner on a Saxo review that mentions Norm Invest", () => {
		const banner = selectBanner(
			{
				title: "Saxo Bank anmeldelse: platforme, produkter og pris",
				h1Text: "Saxo Bank",
				contentText: "Saxo Bank tilbyder aktier og ETF'er. Norm Invest er et alternativ.",
			},
			banners,
		);

		expect(banner?.href).toContain("https://go.adt212.net/");
	});

	it("keeps Saxo's banner on generic investing content", () => {
		const banner = selectBanner(
			{
				title: "Investering for begyndere",
				h1Text: "Kom i gang med investering",
				contentText: "Lær om aktier, ETF'er og en bred portefølje.",
			},
			banners,
		);

		expect(banner?.href).toContain("https://go.adt212.net/");
	});

	it.each([
		"Lunar",
		"Maj Invest",
		"MajInvest",
		"June",
		"Frinans",
	])("shows neither provider's banner on a %s review", (name) => {
		expect(
			selectBanner(
				{
					title: `${name} anmeldelse`,
					h1Text: name,
					contentText: "Sammenlign investering hos Norm Invest og Saxo Bank.",
				},
				banners,
			),
		).toBeUndefined();
	});

	it("shows no banner on an unrelated article", () => {
		expect(
			selectBanner(
				{
					title: "Kontakt Kasper",
					h1Text: "Kontakt",
					contentText: "Send en besked med dine spørgsmål.",
				},
				banners,
			),
		).toBeUndefined();
	});

	it("uses matching 930 by 180 image sources for both providers", () => {
		for (const { image } of banners) {
			expect(image).toMatchObject({ width: 930, height: 180 });
		}
	});
});
