import { z } from "zod";

// --- Config ---

const API_V2 = "https://api.adtraction.net/v2";
const API_V3 = "https://api.adtraction.net/v3";

// --- Zod Schemas ---

// Commission schema (shared between v2/v3)
const CommissionCategorySchema = z.object({
	category: z.string(),
	type: z.string(),
	value: z.number(),
});

const CommissionThresholdSchema = z.object({
	orderValue: z.number(),
	type: z.string(),
	value: z.number(),
});

export const CommissionSchema = z.object({
	id: z.number(),
	type: z.string(),
	name: z.string(),
	value: z.number(),
	transactionType: z.number(),
	categories: z.array(CommissionCategorySchema).optional(),
	thresholds: z.array(CommissionThresholdSchema).optional(),
});

// Feed schema (v3 programs)
const FeedSchema = z.object({
	feedUrl: z.string(),
	lastUpdated: z.string(),
	numberOfProducts: z.number(),
	feedId: z.number(),
	name: z.string(),
});

// Program schema (v3 POST /partner/programs)
export const ProgramSchema = z.object({
	programId: z.number(),
	market: z.string(),
	currency: z.string(),
	approvalStatus: z.number(),
	ppcMarketing: z.number().optional(),
	socialMarketing: z.number().optional(),
	emailMarketing: z.number().optional(),
	cashbackMarketing: z.number().optional(),
	couponMarketing: z.number().optional(),
	programName: z.string(),
	programURL: z.string(),
	currentSegment: z.string().optional(),
	pendingActive: z.boolean().optional(),
	cookieDuration: z.number().optional(),
	adId: z.number().optional(),
	commissions: z.array(CommissionSchema).optional(),
	feeds: z.array(FeedSchema).optional(),
	logoURL: z.string().optional(),
	trackingURL: z.string().optional(),
	categoryName: z.string().optional(),
	categoryId: z.number().optional(),
	trackingType: z.number().optional(),
	status: z.number().optional(),
	brandCategoryImage: z.string().optional(),
	epc: z.number().optional(),
});

// Application schema (v2 GET /partner/applications)
export const ApplicationSchema = z.object({
	channelId: z.number(),
	channelName: z.string(),
	status: z.number(),
	programId: z.number(),
	programName: z.string(),
	categoryName: z.string().optional(),
	categoryId: z.number().optional(),
});

// Offer/coupon schema (v2 POST /partner/offers)
export const OfferSchema = z.object({
	logoURL: z.string().optional(),
	market: z.string().optional(),
	offerCoupon: z.string().optional(),
	offerDescription: z.string().optional(),
	offerId: z.string().optional(),
	offerPage: z.string().optional(),
	offerTerms: z.string().optional(),
	offerType: z.string().optional(),
	programId: z.number(),
	programName: z.string(),
	programUrl: z.string().optional(),
	trackingURL: z.string().optional(),
	validFrom: z.string().optional(),
	validTo: z.string().optional(),
	lastUpdated: z.string().optional(),
	createdDate: z.string().optional(),
	categoryId: z.number().optional(),
});

// Product schema (v2 POST /partner/products)
export const ProductSchema = z.object({
	productName: z.string(),
	productPrice: z.string(),
	productUrl: z.string(),
	currency: z.string().optional(),
	programId: z.number(),
	ean: z.string().optional(),
	sku: z.string().optional(),
	extraInfo: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
	imageUrl: z.string().optional(),
	inStock: z.boolean().optional(),
	manufacturer: z.string().optional(),
	manufacturerArticleNumber: z.string().optional(),
	market: z.string().optional(),
	oldPrice: z.number().optional(),
	productCategory: z.string().optional(),
	productDescription: z.string().optional(),
	shipping: z.number().optional(),
});

// Tracking link schema
export const TrackingLinkSchema = z.object({
	trackingUrl: z.string(),
});

// Program category schema (v2)
export const ProgramCategorySchema = z.object({
	categoryName: z.string(),
	categoryId: z.number(),
	numberOfPrograms: z.number(),
});

// --- Derived Types ---

export type Program = z.infer<typeof ProgramSchema>;
export type Commission = z.infer<typeof CommissionSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProgramCategory = z.infer<typeof ProgramCategorySchema>;

// --- API Client ---

export class AdtractionClient {
	private token: string;
	private channelId: number;

	constructor(token: string, channelId: number) {
		this.token = token;
		this.channelId = channelId;
	}

	private async get<T>(url: string, schema: z.ZodType<T>): Promise<T> {
		const res = await fetch(url, {
			headers: {
				"X-Token": this.token,
				Accept: "application/json",
			},
		});
		if (!res.ok) {
			throw new Error(`Adtraction API error: ${res.status} ${res.statusText} (${url})`);
		}
		const data = await res.json();
		return schema.parse(data);
	}

	private async post<T>(
		url: string,
		body: Record<string, unknown>,
		schema: z.ZodType<T>,
	): Promise<T> {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"X-Token": this.token,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(`Adtraction API error: ${res.status} ${res.statusText} (${url})`);
		}
		const data = await res.json();
		return schema.parse(data);
	}

	/** Get approved programs for a market (v3) */
	async getApprovedPrograms(market = "DK"): Promise<Program[]> {
		return this.post(
			`${API_V3}/partner/programs`,
			{ market, channelId: this.channelId, approvalStatus: 1 },
			z.array(ProgramSchema),
		);
	}

	/** Get all programs for a market (v3) */
	async getPrograms(market = "DK", approvalStatus?: number): Promise<Program[]> {
		const body: Record<string, unknown> = { market, channelId: this.channelId };
		if (approvalStatus !== undefined) body.approvalStatus = approvalStatus;
		return this.post(`${API_V3}/partner/programs`, body, z.array(ProgramSchema));
	}

	/** Get commission types for a program (v3) */
	async getCommissions(programId: number): Promise<Commission[]> {
		return this.get(
			`${API_V3}/partner/programs/commissions/${programId}/${this.channelId}`,
			z.array(CommissionSchema),
		);
	}

	/** Get applications with status (v2) */
	async getApplications(programId?: number): Promise<Application[]> {
		let url = `${API_V2}/partner/applications/?channelId=${this.channelId}`;
		if (programId) url += `&programId=${programId}`;
		return this.get(url, z.array(ApplicationSchema));
	}

	/** Get coupons and offers (v2) */
	async getOffers(market = "DK", programId?: number): Promise<Offer[]> {
		const body: Record<string, unknown> = { market, channelId: this.channelId };
		if (programId) body.programId = programId;
		const res = await fetch(`${API_V2}/partner/offers/`, {
			method: "POST",
			headers: {
				"X-Token": this.token,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(`Adtraction API error: ${res.status} ${res.statusText}`);
		}
		const data = await res.json();
		if (!Array.isArray(data)) return [];
		return z.array(OfferSchema).parse(data);
	}

	/** Search products (v2) */
	async searchProducts(
		keyword: string,
		opts?: {
			programId?: string;
			market?: string;
			page?: number;
			pageSize?: number;
			inStock?: boolean;
		},
	): Promise<Product[]> {
		return this.post(
			`${API_V2}/partner/products/`,
			{
				keyword,
				page: opts?.page ?? 0,
				pageSize: opts?.pageSize ?? 20,
				programId: opts?.programId,
				market: opts?.market ?? "DK",
				inStock: opts?.inStock,
			},
			z.array(ProductSchema),
		);
	}

	/** Get program categories for a market (v2) */
	async getProgramCategories(marketId: number): Promise<ProgramCategory[]> {
		return this.get(
			`${API_V2}/partner/programs/categories/${marketId}`,
			z.array(ProgramCategorySchema),
		);
	}

	/** Generate tracking link (v2) */
	async generateTrackingLink(url: string, programId: number, epi?: string): Promise<string> {
		const body: Record<string, unknown> = {
			channelId: this.channelId,
			programId,
			url,
		};
		if (epi) body.epi = epi;
		const result = await this.post(`${API_V2}/partner/tracking/link/`, body, TrackingLinkSchema);
		return result.trackingUrl;
	}
}
