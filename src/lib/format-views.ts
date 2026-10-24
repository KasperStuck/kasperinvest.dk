const viewCountFormat = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 });

/** Full Danish view-count label for a video card, e.g. "485.600 visninger". */
export function formatViews(count: number): string {
	return `${viewCountFormat.format(count)} ${count === 1 ? "visning" : "visninger"}`;
}
