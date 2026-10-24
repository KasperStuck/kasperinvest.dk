// @vitest-environment node
import mdxRenderer from "@astrojs/mdx/server.js";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { Window } from "happy-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthorBox from "@/components/AuthorBox.astro";
import { getLesson, getModules, type Lesson } from "@/data/lessons";
import LessonPage from "@/pages/[slug].astro";

vi.mock("@/data/lessons", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/data/lessons")>();
	return { ...actual, getLesson: vi.fn(actual.getLesson) };
});

const module = getModules()[0];
const lesson: Lesson = {
	id: "velkommen-til-kurset",
	title: "Lokal lektionsfixture",
	description: "Lokale testdata til den faktiske lektionsrute.",
	video: null,
	faq: [],
};
const window = new Window();
const parser = new window.DOMParser();
const faq = [
	{
		question: "Hvordan læser jeg <vilkår> & priser?",
		answer: 'Læs <strong>vilkårene</strong> & kontrollér "prisen".',
		sources: [
			{ label: "Vilkår & priser", url: "https://example.com/vilkaar?aar=2026&konto=fri" },
			{ label: "Kontotype", url: "https://example.com/kontotype" },
		],
	},
	{
		question: "Hvad betyder <risiko>?",
		answer: 'Tekst med </script><img src=x onerror="alert(1)"> skal være tekst.',
		sources: [],
	},
	{ question: "Hvad gør jeg nu?", answer: "Læs næste lektion." },
];

async function renderLesson(fields: Partial<Lesson> = {}) {
	const data = { ...lesson, ...fields, module, next: null };
	vi.mocked(getLesson).mockResolvedValue(data);
	const container = await AstroContainer.create({
		astroConfig: { site: "https://kasperinvest.dk" },
	});
	container.addServerRenderer({ renderer: mdxRenderer });
	const response = await container.renderToResponse(LessonPage, {
		params: { slug: data.id },
		request: new Request(`https://kasperinvest.dk/${data.id}/`),
		partial: false,
	});
	expect(response.status).toBe(200);
	return parser.parseFromString(await response.text(), "text/html");
}

function schemas(document: ReturnType<typeof parser.parseFromString>): unknown[] {
	return Array.from(document.querySelectorAll('script[type="application/ld+json"]'), (script) =>
		JSON.parse(script.textContent ?? "null"),
	);
}

beforeEach(() => {
	vi.mocked(getLesson).mockReset();
});

describe("editorial responsibility", () => {
	it("states responsibility and preserves the author and method links without inventing a date", async () => {
		const container = await AstroContainer.create();
		const document = parser.parseFromString(await container.renderToString(AuthorBox), "text/html");
		expect(document.body.textContent).toContain("Redaktionelt ansvar: Kasper Stuck");
		expect(document.body.textContent).not.toMatch(/Skrevet|redigeret|kontrolleret/);
		expect(document.querySelector('a[href="/om"]')?.textContent).toBe("Kasper Stuck");
		expect(document.querySelector('a[href="/redaktionel-metode"]')?.textContent).toBe(
			"redaktionelle metode",
		);
		expect(document.querySelector("time")).toBeNull();
	});

	it("describes the supplied modification date as an update", async () => {
		const container = await AstroContainer.create();
		const document = parser.parseFromString(
			await container.renderToString(AuthorBox, { props: { updatedAt: "2025-03-12" } }),
			"text/html",
		);
		expect(document.body.textContent).toContain("Senest opdateret");
		expect(document.body.textContent).not.toContain("kontrolleret");
		expect(document.querySelector("time")?.getAttribute("datetime")).toBe("2025-03-12");
		expect(document.querySelector("time")?.textContent).toBe("12. marts 2025");
	});
});

describe("lesson editorial rendering", () => {
	it("renders every FAQ question, escaped answer and associated source alongside matching schema", async () => {
		const document = await renderLesson({ faq });
		const section = document.querySelector(
			'#content section[aria-labelledby="lesson-faq-heading"]',
		);
		expect(section).not.toBeNull();
		expect(section?.querySelector("h2")?.textContent).toBe("Spørgsmål og svar");
		expect(Array.from(section?.querySelectorAll("h3") ?? [], (h) => h.textContent)).toEqual(
			faq.map((item) => item.question),
		);
		const questions = section?.querySelectorAll("h3") ?? [];
		for (const [index, item] of faq.entries()) {
			const answer = questions[index]?.nextElementSibling;
			expect(answer?.tagName).toBe("P");
			expect(answer?.textContent).toBe(item.answer);
			const links = Array.from(questions[index]?.parentElement?.querySelectorAll("a") ?? []);
			expect(
				links.map((link) => ({ label: link.textContent, url: link.getAttribute("href") })),
			).toEqual(item.sources ?? []);
		}
		expect(section?.querySelector("strong, img, script")).toBeNull();
		expect(document.querySelector('img[src="x"]')).toBeNull();
		expect(document.querySelectorAll("#content h1")).toHaveLength(1);
		const headings = Array.from(document.querySelectorAll("#content h2, #content h3"));
		const faqHeadings = headings.filter((heading) => section?.contains(heading));
		expect(faqHeadings).toHaveLength(faq.length + 1);
		expect(new Set(faqHeadings.map((heading) => heading.id)).size).toBe(faqHeadings.length);
		expect(faqHeadings.every((heading) => heading.id.length > 0)).toBe(true);
		expect(schemas(document)).toContainEqual({
			"@context": "https://schema.org",
			"@type": "FAQPage",
			mainEntity: faq.map((item) => ({
				"@type": "Question",
				name: item.question,
				acceptedAnswer: { "@type": "Answer", text: item.answer },
			})),
		});
	});

	it("omits the FAQ section and schema for an empty FAQ", async () => {
		const document = await renderLesson({ faq: [] });
		expect(document.querySelector('[aria-labelledby="lesson-faq-heading"]')).toBeNull();
		expect(schemas(document)).not.toContainEqual(expect.objectContaining({ "@type": "FAQPage" }));
	});

	it("omits FAQ schema when the missing body prevents its answers from rendering", async () => {
		const document = await renderLesson({ id: "fixture-missing-body", faq });
		expect(document.querySelector("#content")?.textContent).toContain(
			"Denne lektion er under udarbejdelse.",
		);
		expect(document.querySelector('[aria-labelledby="lesson-faq-heading"]')).toBeNull();
		expect(schemas(document)).not.toContainEqual(expect.objectContaining({ "@type": "FAQPage" }));
	});

	it("uses the same optional modification date in the byline and Article schema", async () => {
		const document = await renderLesson({ updatedAt: "2025-03-12", faq: [] });
		expect(document.querySelector("main time")?.getAttribute("datetime")).toBe("2025-03-12");
		expect(document.querySelector("main time")?.textContent).toBe("12. marts 2025");
		expect(schemas(document)).toContainEqual(
			expect.objectContaining({ "@type": "Article", dateModified: "2025-03-12" }),
		);
		for (const schema of schemas(document)) expect(schema).not.toHaveProperty("datePublished");
	});

	it("keeps modification and publication dates absent when no date was supplied", async () => {
		const document = await renderLesson({ faq: [] });
		expect(document.querySelector("main time")).toBeNull();
		expect(schemas(document)).toContainEqual(expect.objectContaining({ "@type": "Article" }));
		for (const schema of schemas(document)) {
			expect(schema).not.toHaveProperty("dateModified");
			expect(schema).not.toHaveProperty("datePublished");
		}
	});
});
