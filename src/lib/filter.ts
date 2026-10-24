export interface SearchableTerm {
	title: string;
	description: string;
}

/** Lowercased title and description; compute once per term and reuse for every query. */
export function searchHaystack(term: SearchableTerm): string {
	return `${term.title}\n${term.description}`.toLocaleLowerCase("da");
}

/** Trimmed, lowercased query; compute once per query. */
export function searchNeedle(query: string): string {
	return query.trim().toLocaleLowerCase("da");
}

/** Substring match of a prepared needle; an empty needle matches everything. */
export function matchesNeedle(haystack: string, needle: string): boolean {
	return !needle || haystack.includes(needle);
}

/** Case-insensitive substring match of a trimmed query against title and description. */
export function matchesQuery(term: SearchableTerm, query: string): boolean {
	return matchesNeedle(searchHaystack(term), searchNeedle(query));
}
