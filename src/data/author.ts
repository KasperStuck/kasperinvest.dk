/** The person behind every article. Also the author on hermanninvest.dk, hence the sameAs link. */
export const author = {
	name: "Kasper Stuck",
	path: "/om/",
	id: "#kasper-stuck",
	sameAs: [
		"https://www.linkedin.com/in/kasperstuck/",
		"https://www.youtube.com/@HermannInvest",
		"https://hermanninvest.dk/om/",
	],
	knowsAbout: ["Investering", "Privatøkonomi", "ETF", "Pension", "Skat af investering"],
};

export function authorSchema(siteUrl: string) {
	return {
		"@type": "Person",
		"@id": `${siteUrl}${author.path}${author.id}`,
		name: author.name,
		url: `${siteUrl}${author.path}`,
		sameAs: author.sameAs,
		worksFor: { "@id": `${siteUrl}/#organization` },
		knowsAbout: author.knowsAbout,
	};
}
