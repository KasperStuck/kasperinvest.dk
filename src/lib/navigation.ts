export interface NavLink {
	href: string;
	label: string;
}

export const navLinks: readonly NavLink[] = [
	{ href: "/", label: "Kursus" },
	{ href: "/guides", label: "Guides" },
	{ href: "/etf", label: "ETF" },
	{ href: "/pension", label: "Pension" },
	{ href: "/platforme", label: "Platforme" },
	{ href: "/ordbog", label: "Ordbog" },
	{ href: "/spar-penge", label: "Spar penge" },
	{ href: "/youtube", label: "YouTube" },
];

/** Meta descriptions of the section index pages that have no data module of their own. */
export const sectionDescriptions = {
	pension:
		"Overblik over de danske pensionstyper — aldersopsparing, ratepension, folkepension, livrente og mere. Forstå forskellen og vælg den rigtige pensionsordning.",
	platforme:
		"Sammenlign de mest populære investeringsplatforme i Danmark — Saxo Bank, Nordnet, Norm Invest, eToro og flere. Find den rette platform til din investering.",
	ordbog:
		"Slå mere end 500 finansielle begreber op i KasperInvests danske ordbog om investering, aktier, skat, pension og privatøkonomi.",
	youtube: "Udvalgte videoer fra danske finans-youtubere om investering og privatøkonomi.",
	sparPenge:
		"Spar penge på el, mobil, internet, TV, bank og lån. Sammenlign udbydere og find de bedste tilbud i Danmark.",
} as const;

/** Shared keyboard focus outline for links and controls, in light and dark mode. */
export const focusRing =
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:focus-visible:outline-brand-400";

/** Colours of a primary call-to-action button (white on brand-700, dark text on brand-400 in dark mode). */
export const primaryButton =
	"bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-400 dark:text-gray-950 dark:hover:bg-brand-300";

const withoutTrailingSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/** True when `pathname` is the page `href` points to, ignoring a trailing slash. */
export function samePath(pathname: string, href: string): boolean {
	return withoutTrailingSlash(pathname) === withoutTrailingSlash(href);
}

/**
 * Returns the header link that owns `pathname`. "/" only matches itself, so
 * root-level lesson pages pass `override` ("/") to mark "Kursus" as active.
 */
export function getActiveNavHref(pathname: string, override?: string): string | undefined {
	if (override) return override;
	const path = withoutTrailingSlash(pathname);
	return navLinks.find(({ href }) => path === href || (href !== "/" && path.startsWith(`${href}/`)))
		?.href;
}

/**
 * `aria-current` for a header link: "page" on the link to this exact page,
 * "true" on the active section link of a page below it.
 */
export function getNavAriaCurrent(
	pathname: string,
	href: string,
	activeHref: string | undefined,
): "page" | "true" | undefined {
	if (href !== activeHref) return undefined;
	return samePath(pathname, href) ? "page" : "true";
}

export interface BreadcrumbItem {
	label: string;
	href?: string;
	hideOnMobile?: boolean;
}

/**
 * Separator rendered before a crumb, inside the crumb's own element so a
 * mobile-hidden crumb hides its separator too. "desktop" means no visible
 * crumb precedes it on mobile.
 */
export type BreadcrumbSeparator = "none" | "always" | "desktop";

export interface BreadcrumbEntry {
	label: string;
	href?: string;
	hideOnMobile: boolean;
	separator: BreadcrumbSeparator;
	current: boolean;
}

/**
 * `hideRootOnMobile` hides the first crumb on mobile, where the header logo
 * already links home, unless it is the only crumb.
 */
export function getBreadcrumbEntries(
	items: readonly BreadcrumbItem[],
	{ hideRootOnMobile = false }: { hideRootOnMobile?: boolean } = {},
): BreadcrumbEntry[] {
	let mobileVisibleBefore = false;
	return items.map((item, index) => {
		const hideOnMobile =
			(item.hideOnMobile ?? false) || (hideRootOnMobile && index === 0 && items.length > 1);
		const separator: BreadcrumbSeparator =
			index === 0 ? "none" : mobileVisibleBefore ? "always" : "desktop";
		if (!hideOnMobile) mobileVisibleBefore = true;
		return {
			label: item.label,
			href: item.href,
			hideOnMobile,
			separator,
			current: index === items.length - 1,
		};
	});
}

export function breadcrumbSchema(
	items: readonly BreadcrumbItem[],
	siteUrl: string,
	pathname: string,
) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.label,
			item: new URL(item.href || pathname, siteUrl).href,
		})),
	};
}

/** Single entry point for opening and closing the modal drawers. */
export function setDrawerOpen(dialog: HTMLDialogElement, open: boolean): void {
	if (open && !dialog.open) dialog.showModal();
	if (!open && dialog.open) dialog.close();
}
