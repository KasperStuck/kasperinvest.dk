import { readFileSync } from "node:fs";

export function parseCsv(input: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;

	for (let index = 0; index < input.length; index++) {
		const char = input[index];
		if (char === '"') {
			if (quoted && input[index + 1] === '"') {
				field += '"';
				index++;
			} else {
				quoted = !quoted;
			}
		} else if (char === "," && !quoted) {
			row.push(field.trim());
			field = "";
		} else if ((char === "\n" || char === "\r") && !quoted) {
			if (char === "\r" && input[index + 1] === "\n") index++;
			row.push(field.trim());
			if (row.some(Boolean)) rows.push(row);
			row = [];
			field = "";
		} else {
			field += char;
		}
	}

	if (field || row.length > 0) {
		row.push(field.trim());
		if (row.some(Boolean)) rows.push(row);
	}
	return rows;
}

function number(value: string): number {
	const normalized = value.replace(/%/g, "").replace(/\s/g, "").replace(",", ".");
	return Number(normalized) || 0;
}

function column(headers: string[], patterns: RegExp[]): number {
	return headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
}

if (import.meta.main) {
	const file = process.argv[2];
	if (!file) {
		console.error("Brug: bun run seo:gsc <gsc-side-forespoergsel.csv>");
		process.exit(1);
	}

	const [rawHeaders, ...rows] = parseCsv(readFileSync(file, "utf8"));
	const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, "").toLowerCase());
	const queryIndex = column(headers, [/forespørg/, /query/]);
	const pageIndex = column(headers, [/^side$/, /^sider$/, /^page$/, /landing page/]);
	const impressionsIndex = column(headers, [
		/sidste.*eksponering/,
		/^eksponeringer$/,
		/impressions/,
	]);
	const clicksIndex = column(headers, [/sidste.*klik/, /^klik$/, /^clicks$/]);
	const ctrIndex = column(headers, [/sidste.*ctr/, /^ctr$/]);
	const positionIndex = column(headers, [/sidste.*placering/, /^placering$/, /position/]);

	if (
		[queryIndex, pageIndex, impressionsIndex, clicksIndex, ctrIndex, positionIndex].some(
			(i) => i < 0,
		)
	) {
		console.error(
			"CSV-filen skal eksporteres fra Search Console med både Side og Forespørgsel samt klik, eksponeringer, CTR og placering.",
		);
		process.exit(1);
	}

	const opportunities = rows
		.map((row) => {
			const impressions = number(row[impressionsIndex] ?? "0");
			const clicks = number(row[clicksIndex] ?? "0");
			const ctr = number(row[ctrIndex] ?? "0");
			const position = number(row[positionIndex] ?? "0");
			const score = impressions * (1 - Math.min(ctr, 100) / 100) * Math.max(1, 31 - position);
			return {
				query: row[queryIndex] ?? "",
				page: row[pageIndex] ?? "",
				impressions,
				clicks,
				ctr,
				position,
				score,
			};
		})
		.filter(
			(item) =>
				item.query &&
				item.page &&
				item.impressions >= 5 &&
				item.position >= 4 &&
				item.position <= 30,
		)
		.sort((a, b) => b.score - a.score)
		.slice(0, 50);

	console.log("| Prioritet | Forespørgsel | Side | Klik | Eksponeringer | CTR | Placering |");
	console.log("|---:|---|---|---:|---:|---:|---:|");
	for (const [index, item] of opportunities.entries()) {
		console.log(
			`| ${index + 1} | ${item.query.replace(/\|/g, "\\|")} | ${item.page.replace(/\|/g, "\\|")} | ${item.clicks} | ${item.impressions} | ${item.ctr.toFixed(2)}% | ${item.position.toFixed(2)} |`,
		);
	}
}
