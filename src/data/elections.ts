export type ElectionArticle = {
  id: string;
  title: string;
  description: string;
};

export type Election = {
  id: string;
  year: number;
  title: string;
  description: string;
  articles: ElectionArticle[];
};

export function getElections(): Election[] {
  return elections;
}

export function getElection(year: number): Election | null {
  return elections.find((e) => e.year === year) ?? null;
}

export function getElectionArticle(
  year: number,
  slug: string,
): (ElectionArticle & { election: Election; next: ElectionArticle | null }) | null {
  const election = getElection(year);
  if (!election) return null;

  const index = election.articles.findIndex((a) => a.id === slug);
  if (index === -1) return null;

  return {
    ...election.articles[index],
    election,
    next: index < election.articles.length - 1 ? election.articles[index + 1] : null,
  };
}

export async function getElectionArticleContent(year: number, slug: string) {
  const modules = import.meta.glob("@/data/elections/**/*.mdx");
  const match = Object.entries(modules).find(([path]) =>
    path.includes(`folketingsvalg-${year}/`) && path.endsWith(`/${slug}.mdx`),
  );
  if (!match) {
    throw new Error(`Election article not found: ${year}/${slug}`);
  }
  return ((await match[1]()) as { default: unknown }).default;
}

const elections: Election[] = [
  {
    id: "folketingsvalg-2026",
    year: 2026,
    title: "Folketingsvalg 2026",
    description:
      "Investerings- og skatteanalyse af partiernes valgplatforme ved folketingsvalget 24. marts 2026.",
    articles: [
      {
        id: "overblik",
        title: "Overblik og rammebetingelser",
        description:
          "Executive summary, rammebetingelser for investorer og meningsmålinger før valget.",
      },
      {
        id: "socialdemokratiet",
        title: "Socialdemokratiet (A)",
        description:
          "Formueskat på 0,5% over høje grænser og konsekvenser for investorer.",
      },
      {
        id: "radikale-venstre",
        title: "Radikale Venstre (B)",
        description:
          "Imod finanssektor-særskat, afskaffelse af tonnageskat og strammere generationsskifte.",
      },
      {
        id: "konservative",
        title: "Det Konservative Folkeparti (C)",
        description:
          "Lavere skattetryk, forenkling og boligskattestop.",
      },
      {
        id: "sf",
        title: "SF – Socialistisk Folkeparti (F)",
        description:
          "Formueskat og højere skat på aktieindkomst for topskatteydere.",
      },
      {
        id: "borgernes-parti",
        title: "Borgernes Parti (H)",
        description:
          "Afskaffelse af topskat og top-topskat; lavere skatter og bureaukrati.",
      },
      {
        id: "liberal-alliance",
        title: "Liberal Alliance (I)",
        description:
          "Lavere aktie- og kapitalskat mod 27%/34%, lavere selskabsskat og kritik af kryptoskat.",
      },
      {
        id: "moderaterne",
        title: "Moderaterne (M)",
        description:
          "Lavere skat på investeringer mod skat på større boliggevinster ved salg.",
      },
      {
        id: "dansk-folkeparti",
        title: "Dansk Folkeparti (O)",
        description:
          "Lavere skat for almindelige indkomster og lavere afgifter/moms på fødevarer.",
      },
      {
        id: "venstre",
        title: "Venstre (V)",
        description:
          "Skattestop, gradvise lettelser og markant modstand mod formueskat.",
      },
      {
        id: "danmarksdemokraterne",
        title: "Danmarksdemokraterne (Æ)",
        description:
          "Skatteforenkling og ønske om et simplere skattesystem.",
      },
      {
        id: "enhedslisten",
        title: "Enhedslisten (Ø)",
        description:
          "Aktie- og kapitalindkomst beskattes som løn; stærk omfordeling og formuebeskatning.",
      },
      {
        id: "alternativet",
        title: "Alternativet (Å)",
        description:
          "Grøn skatteomlægning med højere afgifter på forurening og overforbrug.",
      },
    ],
  },
  {
    id: "folketingsvalg-2022",
    year: 2022,
    title: "Folketingsvalg 2022",
    description:
      "Samlet analyse af folketingsvalget 1. november 2022 med fokus på alle 14 partier og deres betydning for private investorer.",
    articles: [
      {
        id: "overblik",
        title: "Overblik og investorrangering",
        description:
          "Det overordnede billede, valgresultat og samlet rangering set fra en privat investor.",
      },
      {
        id: "socialdemokratiet",
        title: "Socialdemokratiet (A)",
        description:
          "Valgets store vinder med 27,5 pct. – stabilitet og regulering frem for aggressive skattelettelser.",
      },
      {
        id: "radikale-venstre",
        title: "Radikale Venstre (B)",
        description:
          "Socialliberalt reformparti med fokus på iværksætteri, grøn vækst og innovation.",
      },
      {
        id: "konservative",
        title: "Det Konservative Folkeparti (C)",
        description:
          "Klassisk borgerlig økonomi med lavere skat, ejerskabsbeskyttelse og boligskattefokus.",
      },
      {
        id: "nye-borgerlige",
        title: "Nye Borgerlige (D)",
        description:
          "Økonomisk liberalisme med lavere skat, færre regler og stærk ejendomsret.",
      },
      {
        id: "sf",
        title: "SF – Socialistisk Folkeparti (F)",
        description:
          "Grøn omstilling, velfærd og regulerende kapitalstrategi med fokus på inkluderende iværksætteri.",
      },
      {
        id: "liberal-alliance",
        title: "Liberal Alliance (I)",
        description:
          "Lavere aktie- og kapitalskat, enklere skattesystem og bedre vilkår for iværksætteri.",
      },
      {
        id: "kristendemokraterne",
        title: "Kristendemokraterne (K)",
        description:
          "Familiepolitik, ansvarlig økonomi og afskaffelse af generationsskiftebeskatning.",
      },
      {
        id: "moderaterne",
        title: "Moderaterne (M)",
        description:
          "Pragmatisk midterparti med lavere skat på aktier, iværksætteri og investeringer.",
      },
      {
        id: "dansk-folkeparti",
        title: "Dansk Folkeparti (O)",
        description:
          "National velfærd, lavere afgifter og enklere skat med fokus på familieøkonomi.",
      },
      {
        id: "frie-groenne",
        title: "Frie Grønne (Q)",
        description:
          "Systemkritisk grønt parti med fokus på dyb omstilling af forbrug, produktion og ejerskab.",
      },
      {
        id: "venstre",
        title: "Venstre (V)",
        description:
          "Lavere skatter, skattestop og bedre vilkår for opsparing, investering og iværksætteri.",
      },
      {
        id: "danmarksdemokraterne",
        title: "Danmarksdemokraterne (Æ)",
        description:
          "Overraskende investorvenligt parti med fokus på småsparere, crowdfunding og unoterede investeringer.",
      },
      {
        id: "enhedslisten",
        title: "Enhedslisten (Ø)",
        description:
          "Stærkere beskatning af formuer og kapitalgevinster med fokus på lighed og omfordeling.",
      },
      {
        id: "alternativet",
        title: "Alternativet (Å)",
        description:
          "Grøn systemforandring med fokus på bæredygtige investeringer via pensionskasser og ændrede incitamenter.",
      },
    ],
  },
];
