import { describe, expect, it } from "vitest";
import {
	ApplicationSchema,
	CommissionSchema,
	OfferSchema,
	ProductSchema,
	ProgramCategorySchema,
	ProgramSchema,
	TrackingLinkSchema,
} from "./adtraction";

// --- CommissionSchema ---

describe("CommissionSchema", () => {
	it("accepts a valid commission", () => {
		const result = CommissionSchema.safeParse({
			id: 1667319895,
			type: "DKK",
			name: "Mobil+bredbånd",
			value: 120,
			transactionType: 3,
		});
		expect(result.success).toBe(true);
	});

	it("accepts commission with categories and thresholds", () => {
		const result = CommissionSchema.safeParse({
			id: 123,
			type: "DKK",
			name: "Test",
			value: 50,
			transactionType: 4,
			categories: [{ category: "El", type: "%", value: 5 }],
			thresholds: [{ orderValue: 1000, type: "DKK", value: 100 }],
		});
		expect(result.success).toBe(true);
	});

	it("rejects string id (API returns number)", () => {
		const result = CommissionSchema.safeParse({
			id: "123",
			type: "DKK",
			name: "Test",
			value: 50,
			transactionType: 3,
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing required fields", () => {
		expect(CommissionSchema.safeParse({ id: 1, type: "DKK" }).success).toBe(false);
		expect(CommissionSchema.safeParse({ id: 1, name: "Test" }).success).toBe(false);
	});
});

// --- ProgramSchema ---

describe("ProgramSchema", () => {
	const validProgram = {
		programId: 1667317665,
		market: "DK",
		currency: "DKK",
		approvalStatus: 1,
		programName: "Greentel DK",
		programURL: "https://www.greentel.dk",
	};

	it("accepts a minimal valid program", () => {
		expect(ProgramSchema.safeParse(validProgram).success).toBe(true);
	});

	it("accepts a full program with all optional fields", () => {
		const result = ProgramSchema.safeParse({
			...validProgram,
			ppcMarketing: 0,
			socialMarketing: 1,
			emailMarketing: 2,
			cashbackMarketing: 1,
			couponMarketing: 0,
			currentSegment: "Standard",
			pendingActive: true,
			cookieDuration: 30,
			adId: 1667317668,
			commissions: [
				{ id: 1667319895, type: "DKK", name: "Mobil+bredbånd", value: 120, transactionType: 3 },
			],
			feeds: [
				{
					feedUrl: "https://example.com/feed",
					lastUpdated: "2025-01-01",
					numberOfProducts: 100,
					feedId: 1,
					name: "Main",
				},
			],
			logoURL: "https://adtraction.com/image.htm?imgId=1667317663",
			trackingURL: "https://go.adt256.com/t/t?a=123&as=456&t=2&tk=1",
			categoryName: "Media",
			categoryId: 17,
			trackingType: 2,
			status: 0,
			brandCategoryImage: "https://adtraction.com/media/test.webp",
			epc: 1.95,
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing programName", () => {
		const { programName: _, ...incomplete } = validProgram;
		expect(ProgramSchema.safeParse(incomplete).success).toBe(false);
	});

	it("rejects non-number programId", () => {
		expect(ProgramSchema.safeParse({ ...validProgram, programId: "abc" }).success).toBe(false);
	});
});

// --- ApplicationSchema ---

describe("ApplicationSchema", () => {
	it("accepts a valid application", () => {
		const result = ApplicationSchema.safeParse({
			channelId: 123,
			channelName: "My Channel",
			status: 1,
			programId: 456,
			programName: "Test Program",
		});
		expect(result.success).toBe(true);
	});

	it("accepts optional category fields", () => {
		const result = ApplicationSchema.safeParse({
			channelId: 123,
			channelName: "My Channel",
			status: 1,
			programId: 456,
			programName: "Test Program",
			categoryName: "Finance",
			categoryId: 1,
		});
		expect(result.success).toBe(true);
	});
});

// --- OfferSchema ---

describe("OfferSchema", () => {
	it("accepts a minimal offer", () => {
		const result = OfferSchema.safeParse({
			programId: 123,
			programName: "Test",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a full offer", () => {
		const result = OfferSchema.safeParse({
			logoURL: "https://example.com/logo.png",
			market: "DK",
			offerCoupon: "SAVE10",
			offerDescription: "10% off",
			offerId: "abc-123",
			offerPage: "https://example.com",
			offerTerms: "Min 100 DKK",
			offerType: "coupon",
			programId: 123,
			programName: "Test",
			programUrl: "https://example.com",
			trackingURL: "https://go.example.com/t",
			validFrom: "2025-01-01",
			validTo: "2025-12-31",
			lastUpdated: "2025-06-01",
			createdDate: "2025-01-01",
			categoryId: 1,
		});
		expect(result.success).toBe(true);
	});
});

// --- ProductSchema ---

describe("ProductSchema", () => {
	it("accepts a valid product", () => {
		const result = ProductSchema.safeParse({
			productName: "iPhone 16",
			productPrice: "8999.00",
			productUrl: "https://example.com/product",
			programId: 123,
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing productName", () => {
		expect(
			ProductSchema.safeParse({ productPrice: "100", productUrl: "https://x.com", programId: 1 })
				.success,
		).toBe(false);
	});
});

// --- ProgramCategorySchema ---

describe("ProgramCategorySchema", () => {
	it("accepts a valid category", () => {
		const result = ProgramCategorySchema.safeParse({
			categoryName: "Finance",
			categoryId: 1,
			numberOfPrograms: 89,
		});
		expect(result.success).toBe(true);
	});
});

// --- TrackingLinkSchema ---

describe("TrackingLinkSchema", () => {
	it("accepts a valid tracking link", () => {
		const result = TrackingLinkSchema.safeParse({
			trackingUrl: "https://go.example.com/t/t?a=123",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing trackingUrl", () => {
		expect(TrackingLinkSchema.safeParse({}).success).toBe(false);
	});
});
