export interface BannerRule {
	keywords: readonly string[];
	exclude: readonly string[];
}

export interface Banner extends BannerRule {
	src: string;
	width: number;
	height: number;
	alt: string;
	href: string;
}

export interface BannerPage {
	/** `document.title`. */
	title: string;
	/** Text of the article body. */
	contentText: string;
	/** Text of the page's first H1. */
	h1Text: string;
}

/**
 * First banner with a keyword in the title or body and no exclusion in the title or H1.
 * A passing mention of a competitor is fine; only a page about that platform excludes it.
 */
export function selectBanner<T extends BannerRule>(
	page: BannerPage,
	banners: readonly T[],
): T | undefined {
	const pageText = `${page.title} ${page.contentText}`.toLowerCase();
	const pageTitle = `${page.title} ${page.h1Text}`.toLowerCase();
	return banners.find(
		(b) =>
			b.keywords.length > 0 &&
			b.keywords.some((kw) => pageText.includes(kw)) &&
			!b.exclude.some((kw) => pageTitle.includes(kw)),
	);
}

function createBanner(b: Banner, document: Document) {
	const wrapper = document.createElement("aside");
	wrapper.className = "not-prose my-10";
	wrapper.setAttribute("aria-label", "Annonce");

	const link = document.createElement("a");
	link.href = b.href;
	link.target = "_blank";
	link.rel = "sponsored noopener noreferrer";
	link.className = "block overflow-hidden rounded-lg";

	const img = document.createElement("img");
	Object.assign(img, {
		src: b.src,
		alt: b.alt,
		width: b.width,
		height: b.height,
		loading: "lazy",
	});
	img.className = "w-full";

	link.appendChild(img);
	wrapper.append(link);
	return wrapper;
}

export function placeBanners(content: HTMLElement, banner: Banner | undefined): void {
	const headings = content.querySelectorAll(":scope > h2");
	const contextualLinks = content.querySelector(":scope > [data-contextual-links]");
	const contextualAnchor = headings[1] ?? headings[0];
	if (contextualLinks && contextualAnchor) {
		content.insertBefore(contextualLinks, contextualAnchor);
	}

	if (!banner) return;

	// Repeat the same contextual banner before H2 #1 and every even-numbered H2.
	headings.forEach((heading, index) => {
		const headingNumber = index + 1;
		if (headingNumber === 1 || headingNumber % 2 === 0) {
			content.insertBefore(createBanner(banner, content.ownerDocument), heading);
		}
	});
}
