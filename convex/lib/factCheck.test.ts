import { describe, expect, it, vi } from "vitest";
import type { VideoAnalysis } from "./contentRules";
import {
	analysisSegments,
	articleSegments,
	type CandidateSegment,
	containsSpan,
	FACT_CHUNK_CHARS,
	FACT_CHUNK_OVERLAP,
	type FactSource,
	factCheck,
	findUncovered,
	matchKey,
	transcriptChunks,
} from "./factCheck";
import { passingFactCheck, validAnalysis, validArticle } from "./fixtures.testing";
import { type LlmConfig, LlmContentError } from "./llm";

const config: LlmConfig = { provider: "claude", apiKey: "test-key", model: "claude-checker" };

function reply(value: unknown) {
	return new Response(
		JSON.stringify({
			content: [{ type: "text", text: JSON.stringify(value) }],
			stop_reason: "end_turn",
			usage: { input_tokens: 1, output_tokens: 1 },
		}),
		{ status: 200 },
	);
}

type Claim = {
	id: string;
	segmentId: string;
	candidateQuote: string;
	kind: "number" | "year" | "name" | "quote" | "assertion";
	status: "supported" | "contradicted" | "not_found";
	evidenceQuote: string;
};

/** Extraction answer: each claim listed in its segment; segments without claims get a reason. */
function extraction(segments: CandidateSegment[], claims: Claim[]) {
	return {
		segments: segments.map((segment) => {
			const ids = claims.filter((c) => c.segmentId === segment.id).map((c) => c.id);
			return {
				segmentId: segment.id,
				claimIds: ids,
				noFactReason: ids.length ? "" : "Ingen fakta.",
			};
		}),
		claims,
	};
}

/** Stub provider: the first call answers `first`, later calls (one per extra chunk) `rechecks`. */
function stub(first: unknown, rechecks: unknown[] = []) {
	const bodies: Array<{
		model: string;
		user: string;
		system: string;
		schema: Record<string, unknown>;
	}> = [];
	const answers = [first, ...rechecks];
	const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
		const body = JSON.parse(String(init.body));
		bodies.push({
			model: body.model,
			user: String(body.messages[0].content),
			system: String(body.system),
			schema: body.output_config.format.schema,
		});
		return reply(answers[Math.min(bodies.length, answers.length) - 1]);
	});
	return { fetchImpl, bodies };
}

const SOURCE: FactSource = {
	title: "Sådan investerer du i indeksfonde",
	description: "Gæst: Lars Tvede fra Supertrends.",
	channelName: "Kasper Invest",
	transcriptText:
		"Fonden koster 0,5 procent om året. Kursen steg 5 % i 2023, men i 2022 faldt den -12 %. Med 100.000 kr. og et procentpoint i forskel mister du omkring 1.000 kr. det første år. Lave omkostninger giver højere afkast, fordi gebyret trækkes hvert år. Perioden 2020-2024 var god.",
};

function run(
	segments: CandidateSegment[],
	first: unknown,
	rechecks: unknown[] = [],
	source = SOURCE,
) {
	const provider = stub(first, rechecks);
	const result = factCheck({
		config,
		part: "article",
		segments,
		source,
		call: { fetchImpl: provider.fetchImpl, log: () => {}, deadlineAt: 10 * 60_000, now: () => 0 },
	});
	return { result, provider };
}

const codes = (issues: Array<{ code: string; severity: string }>) =>
	issues.filter((i) => i.severity === "error").map((i) => i.code);

const seg = (id: string, text: string): CandidateSegment => ({ id, text });
const claim = (fields: Partial<Claim> & Pick<Claim, "candidateQuote">): Claim => ({
	id: "c1",
	segmentId: "s1",
	kind: "number",
	status: "supported",
	evidenceQuote: "",
	...fields,
});

describe("segments", () => {
	it("gives every analysis field and FAQ question and answer a stable id", () => {
		const segments = analysisSegments(validAnalysis());
		expect(segments.map((s) => s.id)).toEqual([
			"summary",
			"seoTitle",
			"seoDescription",
			"themes",
			"keyTakeaways.0",
			"keyTakeaways.1",
			"keyTakeaways.2",
			"keyTakeaways.3",
			"faq.0.question",
			"faq.0.answer",
			"faq.1.question",
			"faq.1.answer",
			"faq.2.question",
			"faq.2.answer",
		]);
		expect(segments[3].text).toBe("indeksfonde, omkostninger");
	});

	it("gives every article heading, paragraph, list item and table cell an id in order", () => {
		const segments = articleSegments(
			"## Pris\n\nFonden koster 0,5 procent.\n\n- Punkt et\n- Punkt to\n\n| Fond | Pris |\n| --- | --- |\n| A | 1 kr. |",
		);
		expect(segments).toEqual([
			{ id: "s1", text: "Pris" },
			{ id: "s2", text: "Fonden koster 0,5 procent." },
			{ id: "s3", text: "Punkt et" },
			{ id: "s4", text: "Punkt to" },
			{ id: "s5", text: "Fond" },
			{ id: "s6", text: "Pris" },
			{ id: "s7", text: "A" },
			{ id: "s8", text: "1 kr." },
		]);
		expect(articleSegments(validArticle()).length).toBeGreaterThan(12);
	});
});

describe("transcriptChunks", () => {
	it("splits the full transcript in 60,000-character chunks with 1,000 characters of overlap", () => {
		expect(FACT_CHUNK_CHARS).toBe(60_000);
		expect(FACT_CHUNK_OVERLAP).toBe(1_000);
		expect(transcriptChunks("kort")).toEqual(["kort"]);
		expect(transcriptChunks("")).toEqual([""]);
		const text = "x".repeat(130_000);
		const chunks = transcriptChunks(text);
		expect(chunks.map((c) => c.length)).toEqual([60_000, 60_000, 12_000]);
		const marked = Array.from({ length: 130_000 }, (_, i) =>
			String.fromCharCode(65 + (i % 26)),
		).join("");
		const [a, b, c] = transcriptChunks(marked);
		expect(b.slice(0, 1_000)).toBe(a.slice(-1_000));
		expect(c.slice(0, 1_000)).toBe(b.slice(-1_000));
		expect(a + b.slice(1_000) + c.slice(1_000)).toBe(marked);
	});
});

describe("matchKey and containsSpan", () => {
	it("normalizes NFKC, case, whitespace and typographic quotes only", () => {
		expect(matchKey("  “Fonden”  KOSTER ’0,5’ ")).toBe("\"fonden\" koster '0,5'");
		expect(matchKey("-5 %")).toBe("-5 %");
	});

	it("keeps signs, units, decimal and grouping marks and token boundaries", () => {
		const source =
			"Kursen steg 5 % og faldt -12 %. Prisen er 1.000 kr. og 5 kr. Perioden 2020-2024.";
		expect(containsSpan(source, "steg 5 %")).toBe(true);
		expect(containsSpan(source, "-5 %")).toBe(false);
		expect(containsSpan(source, "12 %")).toBe(false);
		expect(containsSpan(source, "-12 %")).toBe(true);
		expect(containsSpan(source, "5 kr")).toBe(true);
		expect(containsSpan("Prisen er 5 kr.", "5 %")).toBe(false);
		expect(containsSpan(source, "1,000 kr")).toBe(false);
		expect(containsSpan(source, "000 kr")).toBe(false);
		expect(containsSpan(source, "2020-2024")).toBe(true);
		expect(containsSpan(source, "2020")).toBe(true);
		expect(containsSpan(source, "ursen steg")).toBe(false);
		expect(containsSpan(source, "")).toBe(false);
		expect(containsSpan(source, "   ")).toBe(false);
	});
});

describe("findUncovered", () => {
	it.each([
		"Novo Nordisk",
		"Lars Tvede",
		"J. P. Morgan",
		"Den Europæiske Centralbank",
	])("requires the complete sentence-initial name %s", (name) => {
		const partial = name.slice(name.indexOf(" ") + 1);
		for (const prefix of ["", "Udbyttet stiger. ", "İ år: "]) {
			const segments = [seg("s1", `${prefix}${name} hæver udbyttet.`)];
			expect(findUncovered(segments, [], SOURCE)).toEqual([name]);
			expect(
				findUncovered(segments, [{ segmentId: "s1", candidateQuote: partial }], SOURCE),
			).toEqual([name]);
			for (const field of ["title", "channelName"] as const) {
				expect(findUncovered(segments, [], { ...SOURCE, [field]: partial })).toEqual([name]);
				expect(findUncovered(segments, [], { ...SOURCE, [field]: name })).toEqual([]);
			}
			expect(findUncovered(segments, [{ segmentId: "s1", candidateQuote: name }], SOURCE)).toEqual(
				[],
			);
		}
	});

	it("strips only the recognized sentence prefix from Ifølge Lars Tvede", () => {
		for (const prefix of ["", "İ år: "]) {
			const segments = [seg("s1", `${prefix}Ifølge Lars Tvede stiger kursen.`)];
			expect(findUncovered(segments, [], SOURCE)).toEqual(["Lars Tvede"]);
			expect(
				findUncovered(segments, [{ segmentId: "s1", candidateQuote: "Tvede" }], SOURCE),
			).toEqual(["Lars Tvede"]);
			expect(findUncovered(segments, [], { ...SOURCE, title: "Tvede" })).toEqual(["Lars Tvede"]);
			expect(findUncovered(segments, [], { ...SOURCE, title: "Lars Tvede" })).toEqual([]);
			expect(
				findUncovered(segments, [{ segmentId: "s1", candidateQuote: "Lars Tvede" }], SOURCE),
			).toEqual([]);
		}
	});

	it("does not cover 5 with 15 or a repeated occurrence outside the quoted context", () => {
		expect(
			findUncovered(
				[seg("s1", "Afkastet er 5 % eller 15 %.")],
				[{ segmentId: "s1", candidateQuote: "15 %" }],
				SOURCE,
			),
		).toEqual(["5"]);
		expect(
			findUncovered(
				[seg("s1", "Afkastet er 5 %. Gebyret er 5 %.")],
				[{ segmentId: "s1", candidateQuote: "Afkastet er 5 %" }],
				SOURCE,
			),
		).toEqual(["5"]);
		// An ambiguous short quote cannot identify which occurrence was reviewed.
		expect(
			findUncovered(
				[seg("s1", "Afkastet er 5 %. Gebyret er 5 %.")],
				[{ segmentId: "s1", candidateQuote: "5 %" }],
				SOURCE,
			),
		).toEqual(["5", "5"]);
	});

	it("covers repeated numbers when both contexts were quoted", () => {
		expect(
			findUncovered(
				[seg("s1", "Afkastet er 5 %. Gebyret er 5 %.")],
				[
					{ segmentId: "s1", candidateQuote: "Afkastet er 5 %" },
					{ segmentId: "s1", candidateQuote: "Gebyret er 5 %" },
				],
				SOURCE,
			),
		).toEqual([]);
	});

	it("keeps names within sentences and retains initialled names", () => {
		const text = "Du køber en ETF. Derfor spredes risikoen.";
		expect(findUncovered([seg("s1", text)], [], SOURCE)).toEqual([]);
		for (const name of ["A.P. Møller-Mærsk", "J.P. Morgan", "J. P. Morgan"]) {
			expect(findUncovered([seg("s1", `Prisen falder hos ${name}.`)], [], SOURCE)).toEqual([name]);
		}
	});
	const segments = [seg("s1", "Med 100.000 kr. mister Warren Buffett 1.000 kr. hos Danske Bank.")];

	it("lists digit tokens and multi-word names that no claim quote covers", () => {
		expect(findUncovered(segments, [], SOURCE)).toEqual([
			"100.000",
			"1.000",
			"Warren Buffett",
			"Danske Bank",
		]);
		const quotes = [
			{ segmentId: "s1", candidateQuote: "Med 100.000 kr." },
			{ segmentId: "s1", candidateQuote: "Warren Buffett 1.000 kr." },
			{ segmentId: "s1", candidateQuote: "hos Danske Bank" },
		];
		expect(findUncovered(segments, quotes, SOURCE)).toEqual([]);
	});

	it("only counts quotes of the same segment", () => {
		const quotes = [{ segmentId: "s2", candidateQuote: "Med 100.000 kr." }];
		expect(findUncovered(segments, quotes, SOURCE)).toContain("100.000");
	});

	it("skips names from the title or channel name and an ordinary word that starts a sentence", () => {
		const own = [seg("s1", "Kasper Invest forklarer det. Ifølge Lars Tvede stiger kursen.")];
		expect(findUncovered(own, [{ segmentId: "s1", candidateQuote: "Lars Tvede" }], SOURCE)).toEqual(
			[],
		);
	});
});

describe("factCheck", () => {
	it("checks with the given config and sends title, description, channel and the chunk", async () => {
		const segments = [seg("s1", "Fonden koster 0,5 procent om året.")];
		const { result, provider } = run(
			segments,
			extraction(segments, [
				claim({ candidateQuote: "0,5 procent om året", evidenceQuote: "0,5 procent om året" }),
			]),
		);
		expect(await result).toEqual({ issues: [], verifiedClaims: ["0,5 procent om året"] });
		const [body] = provider.bodies;
		expect(body.model).toBe("claude-checker");
		expect(body.user).toContain(`Titel: ${SOURCE.title}`);
		expect(body.user).toContain("Kanal: Kasper Invest");
		expect(body.user).toContain("Lars Tvede fra Supertrends");
		expect(body.user).toContain("Transskription, del 1 af 1");
		expect(body.user).toContain(SOURCE.transcriptText);
		expect(body.user).toContain("[s1] Fonden koster 0,5 procent om året.");
		expect(Object.keys(body.schema.properties as object)).toEqual(["segments", "claims"]);
	});

	describe("labelled acceptance fixtures (stub checker)", () => {
		type Case = {
			label: string;
			segments: CandidateSegment[];
			claims: Claim[];
			rechecks?: unknown[];
			source?: FactSource;
			expected: string[];
		};
		const s1 = (text: string) => [seg("s1", text)];
		const cases: Case[] = [
			{
				label: "supported number with verbatim evidence",
				segments: s1("Med 100.000 kr. mister du omkring 1.000 kr. det første år."),
				claims: [
					claim({
						candidateQuote: "Med 100.000 kr. mister du omkring 1.000 kr. det første år",
						evidenceQuote:
							"Med 100.000 kr. og et procentpoint i forskel mister du omkring 1.000 kr. det første år",
					}),
				],
				expected: [],
			},
			{
				label: "omitted amount: a number without any claim",
				segments: s1("Fonden koster 0,5 procent om året og 1.000 kr. i gebyr."),
				claims: [
					claim({ candidateQuote: "0,5 procent om året", evidenceQuote: "0,5 procent om året" }),
				],
				expected: ["fact_uncovered"],
			},
			{
				label: "contradicted number",
				segments: s1("Kursen steg 8 % i 2023."),
				claims: [
					claim({
						candidateQuote: "Kursen steg 8 % i 2023",
						status: "contradicted",
						evidenceQuote: "Kursen steg 5 %",
					}),
				],
				expected: ["fact_contradicted"],
			},
			{
				label: "paraphrase without digits is supported",
				segments: s1("Fonden koster en halv procent om året."),
				claims: [
					claim({
						candidateQuote: "en halv procent om året",
						evidenceQuote: "0,5 procent om året",
					}),
				],
				expected: [],
			},
			{
				label: "metadata-only name from the description",
				segments: s1("Ifølge Lars Tvede er temaet langsigtet."),
				claims: [
					claim({ kind: "name", candidateQuote: "Lars Tvede", evidenceQuote: "Lars Tvede" }),
				],
				expected: [],
			},
			{
				label: "metadata-only number is not enough",
				segments: s1("Gæsten har 3 fonde."),
				claims: [claim({ candidateQuote: "3 fonde", evidenceQuote: "Supertrends" })],
				source: { ...SOURCE, description: "Gæsten har 3 fonde og Supertrends." },
				expected: ["fact_unsupported"],
			},
			{
				label: "sign flip: -5 % claimed as supported by 5 %",
				segments: s1("Kursen faldt -5 % i 2023."),
				claims: [
					claim({ candidateQuote: "Kursen faldt -5 % i 2023", evidenceQuote: "Kursen steg 5 %" }),
				],
				expected: ["fact_unsupported"],
			},
			{
				label: "fabricated evidence that is not in the source",
				segments: s1("Fonden koster 0,2 procent."),
				claims: [
					claim({ candidateQuote: "0,2 procent", evidenceQuote: "Fonden koster 0,2 procent" }),
				],
				expected: ["fact_unsupported"],
			},
			{
				label: "% against kr: evidence with the wrong unit is not in the source",
				segments: s1("Gebyret er 5 kr."),
				claims: [claim({ candidateQuote: "Gebyret er 5 kr", evidenceQuote: "5 kr" })],
				source: { ...SOURCE, transcriptText: "Gebyret er 5 % af beløbet." },
				expected: ["fact_unsupported"],
			},
			{
				label: "1.000 against 1,000",
				segments: s1("Du mister 1.000 kr."),
				claims: [claim({ candidateQuote: "1.000 kr", evidenceQuote: "1,000 kr" })],
				expected: ["fact_unsupported"],
			},
			{
				label: "range with a hyphen, supported verbatim",
				segments: s1("Perioden 2020-2024 var god."),
				claims: [
					claim({
						kind: "year",
						candidateQuote: "Perioden 2020-2024",
						evidenceQuote: "Perioden 2020-2024 var god",
					}),
				],
				expected: [],
			},
			{
				label: "real year attached to the wrong event",
				segments: s1("I 2022 steg kursen 5 %."),
				claims: [
					claim({
						kind: "year",
						candidateQuote: "I 2022 steg kursen 5 %",
						status: "contradicted",
						evidenceQuote: "i 2022 faldt den -12 %",
					}),
				],
				expected: ["fact_contradicted"],
			},
			{
				label: "qualitative tax assertion that the source does not make",
				segments: s1("Gevinsten er skattefri på en aktiesparekonto."),
				claims: [
					claim({
						kind: "assertion",
						candidateQuote: "Gevinsten er skattefri",
						status: "not_found",
					}),
				],
				expected: ["fact_unsupported"],
			},
			{
				label: "supported causation assertion",
				segments: s1("Lave omkostninger giver et højere afkast, fordi gebyret trækkes hvert år."),
				claims: [
					claim({
						kind: "assertion",
						candidateQuote:
							"Lave omkostninger giver et højere afkast, fordi gebyret trækkes hvert år",
						evidenceQuote: "Lave omkostninger giver højere afkast, fordi gebyret trækkes hvert år",
					}),
				],
				expected: [],
			},
			{
				label: "supported in one chunk and contradicted in another",
				segments: s1("Kursen steg 5 % i 2023."),
				claims: [
					claim({
						candidateQuote: "Kursen steg 5 % i 2023",
						evidenceQuote: "Kursen steg 5 % i 2023",
					}),
				],
				rechecks: [{ claims: [{ id: "c1", status: "contradicted", evidenceQuote: "faldt" }] }],
				source: {
					...SOURCE,
					transcriptText: `${SOURCE.transcriptText} ${"fyld ".repeat(12_100)}faldt`,
				},
				expected: ["fact_ambiguous"],
			},
			{
				label: "not found in the first chunk but supported in the second",
				segments: s1("Til sidst nævnes 42 fonde."),
				claims: [claim({ candidateQuote: "42 fonde", status: "not_found" })],
				rechecks: [{ claims: [{ id: "c1", status: "supported", evidenceQuote: "42 fonde" }] }],
				source: { ...SOURCE, transcriptText: `${"fyld ".repeat(12_100)}til sidst 42 fonde` },
				expected: [],
			},
		];

		it("has at least twelve labelled cases", () => {
			expect(cases.length).toBeGreaterThanOrEqual(12);
		});

		it.each(cases)("$label", async ({ segments, claims, rechecks, source, expected }) => {
			const { result, provider } = run(segments, extraction(segments, claims), rechecks, source);
			expect(codes((await result).issues)).toEqual(expected);
			expect(provider.bodies).toHaveLength(1 + (rechecks?.length ?? 0));
		});
	});

	it("checks every claim in every chunk and names the chunk in each prompt", async () => {
		const segments = [seg("s1", "Kursen steg 5 % i år."), seg("s2", "Til sidst 42 fonde.")];
		const claims = [
			claim({ candidateQuote: "Kursen steg 5 %", evidenceQuote: "Kursen steg 5 %" }),
			claim({ id: "c2", segmentId: "s2", candidateQuote: "42 fonde", status: "not_found" }),
		];
		const transcriptText = `Kursen steg 5 % ${"fyld ".repeat(24_000)}til sidst 42 fonde`;
		expect(transcriptChunks(transcriptText)).toHaveLength(3);
		const recheck = (c2: string) => ({
			claims: [
				{ id: "c1", status: "not_found", evidenceQuote: "" },
				{ id: "c2", status: c2, evidenceQuote: c2 === "supported" ? "42 fonde" : "" },
			],
		});
		const { result, provider } = run(
			segments,
			extraction(segments, claims),
			[recheck("not_found"), recheck("supported")],
			{ ...SOURCE, transcriptText },
		);
		expect(await result).toEqual({ issues: [], verifiedClaims: ["Kursen steg 5 %", "42 fonde"] });
		expect(provider.bodies.map((b) => b.user.match(/Transskription, del (\d) af 3/)?.[1])).toEqual([
			"1",
			"2",
			"3",
		]);
		for (const body of provider.bodies.slice(1)) {
			expect(body.user).toContain('[c1] (number) "Kursen steg 5 %"');
			expect(body.user).toContain('[c2] (number) "42 fonde"');
			expect(Object.keys(body.schema.properties as object)).toEqual(["claims"]);
		}
	});

	it("needs no later chunk calls when there is no claim to check", async () => {
		const segments = [seg("s1", "Tid slår timing.")];
		const { result, provider } = run(segments, extraction(segments, []), [], {
			...SOURCE,
			transcriptText: "fyld ".repeat(24_000),
		});
		expect(await result).toEqual({ issues: [], verifiedClaims: [] });
		expect(provider.bodies).toHaveLength(1);
	});

	describe("coverage (R14)", () => {
		const segments = [
			seg("s1", "Hvad koster 100.000 kr. i gebyr?"),
			seg("s2", "Fonden koster 0,5 procent om året."),
			seg("s3", "Det sidste afsnit nævner 1.000 kr. det første år."),
		];
		const all = [
			claim({ candidateQuote: "100.000 kr.", evidenceQuote: "Med 100.000 kr." }),
			claim({
				id: "c2",
				segmentId: "s2",
				candidateQuote: "0,5 procent om året",
				evidenceQuote: "0,5 procent om året",
			}),
			claim({
				id: "c3",
				segmentId: "s3",
				candidateQuote: "1.000 kr. det første år",
				evidenceQuote: "1.000 kr. det første år",
			}),
		];

		it("accepts a heading claim and a claim at the article end", async () => {
			const { result } = run(segments, extraction(segments, all));
			expect(codes((await result).issues)).toEqual([]);
		});

		it("rejects a response that leaves out the last segment", async () => {
			const answer = extraction(segments, all.slice(0, 2));
			answer.segments = answer.segments.slice(0, 2);
			const { result } = run(segments, answer);
			await expect(result).rejects.toMatchObject({ code: "fact_check_coverage" });
			await expect(result).rejects.toBeInstanceOf(LlmContentError);
		});

		it("rejects duplicate and unknown segment ids and unlisted claims", async () => {
			const duplicate = extraction(segments, all);
			duplicate.segments.push(duplicate.segments[0]);
			const unknown = extraction(segments, all);
			unknown.segments[0] = { ...unknown.segments[0], segmentId: "s9" };
			const unlisted = extraction(segments, all);
			unlisted.segments[2] = { segmentId: "s3", claimIds: [], noFactReason: "Ingen." };
			const noReason = extraction(segments, all.slice(0, 2));
			noReason.segments[2] = { segmentId: "s3", claimIds: [], noFactReason: " " };
			for (const answer of [duplicate, unknown, unlisted, noReason]) {
				const { result } = run(segments, answer);
				await expect(result).rejects.toMatchObject({ code: "fact_check_coverage" });
			}
		});

		it("rejects a candidate quote that is not in its segment", async () => {
			const wrong = [{ ...all[0], candidateQuote: "200.000 kr." }, ...all.slice(1)];
			const { result } = run(segments, extraction(segments, wrong));
			await expect(result).rejects.toMatchObject({ code: "fact_check_quote" });
		});

		it("reports an empty extraction and an omitted FAQ amount as uncovered", async () => {
			const empty = run(segments, extraction(segments, []));
			const issues = (await empty.result).issues;
			expect(codes(issues)).toEqual(["fact_uncovered"]);
			expect(issues[0].message).toContain("100.000");
			const faq = analysisSegments({
				...validAnalysis(),
				faq: [{ question: "Hvad koster fonden?", answer: "Den koster 0,5 procent om året." }],
			} as VideoAnalysis).filter((s) => s.id.startsWith("faq"));
			const omitted = run(faq, extraction(faq, []));
			expect(codes((await omitted.result).issues)).toEqual(["fact_uncovered"]);
		});

		it("rejects a later-chunk answer with missing, duplicate or unknown claim ids", async () => {
			const long = { ...SOURCE, transcriptText: "fyld ".repeat(13_000) };
			const one = [seg("s1", "Tid slår timing i 42 fonde.")];
			const claims = [claim({ candidateQuote: "42 fonde", status: "not_found" })];
			for (const recheck of [
				{ claims: [] },
				{
					claims: [
						{ id: "c1", status: "not_found", evidenceQuote: "" },
						{ id: "c1", status: "not_found", evidenceQuote: "" },
					],
				},
				{ claims: [{ id: "c9", status: "not_found", evidenceQuote: "" }] },
			]) {
				const { result } = run(one, extraction(one, claims), [recheck], long);
				await expect(result).rejects.toMatchObject({ code: "fact_check_coverage" });
			}
		});
	});

	it("feeds back generated snippets only, never source text", async () => {
		const source = { ...SOURCE, transcriptText: "SENTINEL-TRANSSKRIPT siger at kursen steg 5 %." };
		const segments = [seg("s1", "Kursen steg 9 % i år."), seg("s2", "Gevinsten er skattefri.")];
		const claims = [
			claim({
				candidateQuote: "Kursen steg 9 %",
				status: "contradicted",
				evidenceQuote: "SENTINEL-TRANSSKRIPT siger at kursen steg 5 %",
			}),
			claim({
				id: "c2",
				segmentId: "s2",
				kind: "assertion",
				candidateQuote: "Gevinsten er skattefri",
				status: "not_found",
				evidenceQuote: "SENTINEL-TRANSSKRIPT",
			}),
		];
		const lines: string[] = [];
		const provider = stub(extraction(segments, claims));
		const result = await factCheck({
			config,
			part: "article",
			segments,
			source,
			call: {
				fetchImpl: provider.fetchImpl,
				log: (line) => lines.push(line),
				deadlineAt: 10 * 60_000,
				now: () => 0,
			},
		});
		expect(codes(result.issues)).toEqual(["fact_contradicted", "fact_unsupported"]);
		expect(result.issues[0].message).toContain("Kursen steg 9 %");
		const everything = JSON.stringify({ result, lines });
		expect(everything).not.toContain("SENTINEL");
	});

	it("passes with the shared passing stub used by the job tests", async () => {
		const segments = articleSegments(validArticle());
		const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
			const body = JSON.parse(String(init.body));
			return reply(
				JSON.parse(
					passingFactCheck(String(body.messages[0].content), body.output_config.format.schema),
				),
			);
		});
		const result = await factCheck({
			config,
			part: "article",
			segments,
			source: { ...SOURCE, transcriptText: "investering ".repeat(400) },
			call: { fetchImpl, log: () => {}, deadlineAt: 10 * 60_000, now: () => 0 },
		});
		expect(result.issues).toEqual([]);
	});
});
