export interface BannerRule {
	keywords: readonly string[];
	exclude: readonly string[];
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
