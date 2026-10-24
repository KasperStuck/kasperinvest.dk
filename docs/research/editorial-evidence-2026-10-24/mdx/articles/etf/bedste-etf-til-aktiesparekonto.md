# Evidens: ETF til aktiesparekonto

## Opgave og afgrænsning

- Stabilt side-ID: `mdx:articles/etf/bedste-etf-til-aktiesparekonto`.
- Implementeringsrunde: `pilot-ask-etf-implement-r1`, efter den fuldt læste `MERGED_PLAN.md` og kvalitetsstandarden af 2026-10-24. T3-task-ID er ikke oplyst i opgavefilen eller denne implementeringssession. Ingen yderligere agenter er startet.
- Ejet brødtekst: `src/data/articles/etf/bedste-etf-til-aktiesparekonto.mdx`.
- Ejet evidensnote: denne fil. `src/data/articles.ts` er kun læst.
- URL: <https://kasperinvest.dk/etf/bedste-etf-til-aktiesparekonto/>.
- Læser: privat investor i Danmark, som vil vælge en ETF til sin ASK. Opgaven er at kontrollere kontoadgang, forstå indeks og overlap samt sammenligne omkostninger ved eget beløb.
- Regelår: 2026. Det eksisterende indhold var en generel, løbende guide; der var ingen særskilt historisk skæringsdato at bevare. Den oprindelige publiceringsdato bevares.
- Formen er en valgvejledning. Ingen konkrete ETF'er anbefales eller erklæres ASK-berettigede. Der foretages derfor ingen produktplacering, sammenligning af faktiske andelsklasser eller navngiven brokerkontrol. ISIN-opslag i selve positivlistefilen er **ikke** udført. Det er ikke nødvendigt for guidens afgrænsede generelle udsagn, men ville være nødvendigt før en senere produktanbefaling.
- Ingen SERP-, søgevolumen-, trafik- eller rankingdata er indhentet. Læseropgaven er en redaktionel vurdering af den tildelte side, ikke en målt søgeordsanalyse.

## Udgangspunkt og hashes

Checkoutet stod på `main`, HEAD `6656523e02010c9a1546075f5803dd12e349a3bb`. Der var allerede ændringer i README, package.json, Convex og scripts samt en ikke-sporet docs-mappe. De tilhører andre opgaver og er ikke redigeret her. Den ejede brødtekst havde ingen lokal Git-diff ved start og matchede inventarets SHA-256. Der blev ikke oprettet sikkerhedskopier, commits eller nye branches.

| Genstand | SHA-256 |
| --- | --- |
| Oprindelig brødtekst ved start | `44845436a6dbdca988247bc91ec65bceabe893e470b7e836539105b946f73e91` |
| Brødtekst efter denne implementering | `901f1341468455de89c0d8bac5e54b559e35f9f75e69ba5f2444a60a14f1635b` |
| Hele `src/data/articles.ts`, før og efter implementering | `0a015a72fcaa026e8b0346768dbeb6a11e5cb2ba36cd12b9c84764cb2923b3d2` |
| Oprindelig metadatarecords TS-literal | `16c09f0ad41e88b59cfeda1e441a826d10a7c44e842b69de4d05d79a56f96e66` |
| Oprindelig metadatarecord som kompakt JSON | `194a1ce6faf78b46747fc19a574ac3de8bb376a9618b76c81a1ce3b91dd27c28` |
| `src/components/ArticlePage.astro` | `7e21a6c4928ce00929d77cb949cdd80043b4be0c075bacdc9b488cd92650c3c6` |
| `src/components/Prose.astro` | `14ff971310e58bed7ed3f313e362542be8df006f7360a0a9d03f33be6613017b` |
| `src/components/TableOfContents.astro` | `f5b4f017b466e59912129e7364d475ebf0a3e83925c9e179b45ae48b4efd04ab` |
| `src/components/AuthorBox.astro` | `cd1bc8c11f89ea73c39dc114a4659afd220bca78dbc373be9782ab66c7a1a355` |
| `src/pages/sitemap.xml.ts` | `a3d0ba8800201b7fde954bc8f1d009a6fe2f519fdd91c42800b1e70255f9645b` |

Metadatarecorden blev afgrænset med den installerede TypeScript-parser, ikke med en tekstsøgning hen over naborecords. Literalhashen dækker `ObjectLiteralExpression.getText(sourceFile)`, fra `{` til `}` uden efterfølgende komma. JSON-hashen dækker UTF-8 af `JSON.stringify(record)` uden afsluttende linjeskift og med feltordenen nedenfor.

Installeret kontrolmiljø: Node `v24.22.1`, Astro `7.3.3`, `@astrojs/mdx` `8.0.1`, Vitest `4.1.11`. Ingen pakker er installeret.

## Nøjagtigt oprindeligt metadatasnapshot

Registry: `src/data/articles.ts`, variabel `articles`, nøgle `{ "section": "etf", "id": "bedste-etf-til-aktiesparekonto" }`. Selector: `articles.find(record => record.section === "etf" && record.id === "bedste-etf-til-aktiesparekonto")`.

```json
{
  "id": "bedste-etf-til-aktiesparekonto",
  "section": "etf",
  "title": "Bedste ETF til aktiesparekonto — brug de rigtige kriterier",
  "seoTitle": "Bedste ETF til aktiesparekonto: guide og kriterier",
  "description": "Vælg ETF til aktiesparekonto ud fra spredning, omkostninger, valuta, likviditet og hvilke værdipapirer kontoen må indeholde.",
  "publishedAt": "2026-07-16",
  "updatedAt": "2026-07-16",
  "related": [
    {
      "title": "Global ETF",
      "description": "Sammenlign globale indeks.",
      "href": "/etf/bedste-globale-etf"
    },
    {
      "title": "Aktiesparekonto eller månedsopsparing",
      "description": "Sammenlign rammerne.",
      "href": "/guides/aktiesparekonto-eller-maanedsopsparing"
    },
    {
      "title": "Skats positivliste",
      "description": "Se hvornår positivlisten er relevant.",
      "href": "/etf/skats-positivliste"
    }
  ]
}
```

Inventaret angiver `loader_exposed`, ingen draft-værdi, ingen tidlig frigivelse og både effektiv `publishedAt` og `updatedAt` som `2026-07-16`. Ingen af disse publiceringsregler eller datoer er ændret i registreret kilde. `Article`-typen har intet FAQ-felt, den aktuelle record har ingen FAQ, og `ArticlePage.astro` fremstiller Article-markup uden FAQ. Der er heller ingen FAQ-blok i den oprindelige eller reviderede MDX.

## Læste primærkilder

Alle kilder nedenfor er åbnet, og de angivne afsnit er læst **2026-10-24**. Forskningsnotens henvisninger blev brugt som spor, ikke som erstatning for læsning. `S1`–`S9` i påstandsloggen henviser til de præcise URL'er, afsnit og versionsoplysninger her.

| ID | Præcis kilde og læst afsnit | Kildedato/version og anvendelsesår |
| --- | --- | --- |
| S1 | [Skattestyrelsen: Aktiesparekonto](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto), “Hvilke værdipapirer må indgå på aktiesparekontoen” og “Beskatning”. | Aktuel vejledning uden synlig revisionsdato; kontrolleret for 2026. Bekræfter tilladte kategorier, listeforbindelsen, 17 % og lagerprincippet. |
| S2 | [Aktiesparekontoloven, officiel PDF](https://www.retsinformation.dk/api/pdf/248332), § 5, stk. 1, nr. 2–3, samt §§ 13–14. [Officiel XML til statuskontrol](https://www.retsinformation.dk/eli/lta/2025/281/xml). | LBK nr. 281 af 13/03/2025. PDF: “Gældende”; XML: `Status=Valid`. Anvendt som gældende regelgrundlag i 2026. |
| S3 | [Aktieavancebeskatningsloven, aktuel Lovtidende-PDF](https://www.retsinformation.dk/eli/lta/2026/849/pdf), § 19 B, stk. 1–6, og § 19 C, stk. 2. [Officiel status-XML](https://www.retsinformation.dk/eli/lta/2026/849/xml) og [PDF med statusforside](https://www.retsinformation.dk/api/pdf/256872) er også læst. | LBK nr. 849 af 21/09/2026. PDF-forside: “Gældende”; XML: `Status=Valid`. Lovtidende-PDF angiver udgivet 03/10/2026; XML angiver registreringsdato 02/10/2026. Den forskel bruges ikke til en ikrafttrædelsespåstand. |
| S4 | [Skattestyrelsen: IFPA](https://skat.dk/erhverv/ekapital/vaerdipapirer/beviser-og-aktier-i-investeringsforeninger-og-selskaber-ifpa), “Liste over aktiebaserede investeringsselskaber”. | Websiden angiver offentliggjort 28/09/2026 og gyldighed for hele indkomståret 2026. Ingen enkelt ISIN-række i regnearket er kontrolleret. |
| S5 | [MSCI World Index](https://www.msci.com/indexes/index/990100/msci-world-index), indledende indeksdefinition og Profile. | Aktuel indeksdefinition læst 24/10/2026. Sidens viste profildata er pr. 30/09/2026; ingen aktuelle vægte, antal selskaber eller afkast kopieres. |
| S6 | [MSCI ACWI Index](https://www.msci.com/indexes/index/892400/msci-acwi-index), indledende indeksdefinition og Profile. | Aktuel indeksdefinition læst 24/10/2026. Profildata pr. 30/09/2026; kun udviklede markeder/emerging markets og large/mid cap anvendes. |
| S7 | [BlackRock: KID for iShares Core MSCI World UCITS ETF, USD Accu, ISIN IE00B4L5Y983](https://www.blackrock.com/gls-download/literature/kiid/eu_priips-ishares-core-msci-world-ucits-etf-ch-ie00b4l5y983-en.pdf), “Product”, “Objectives”, “What are the risks” og “What are the costs / Composition of Costs”. | KID dateret 03/09/2026. Bruges som konkret dokumentationskontrol af KID/ISIN/andelsklasse, risici og opdeling af omkostninger. Produktets tal, anbefalede ejerperiode og afkastscenarier overføres ikke til guiden. Produktet anbefales ikke, og dansk ASK-adgang er ikke undersøgt. |
| S8 | [SEC: Updated Investor Bulletin: Exchange-Traded Funds](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24), “How are ETFs different from mutual funds”, især “Bid-ask spread”, samt “Before you invest”. [SEC: Mutual Fund and ETF Fees and Expenses](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/mutual-fund-and-etf-fees-and-expenses-investor-bulletin), “ETF Transaction Costs Not Shown in the Fee Table”. | Henholdsvis 23/02/2023 og 23/07/2025. Generelle handelsmekanismer. Amerikanske registrerings-, skatte- og oplysningsregler anvendes ikke som danske regler. |
| S9 | [MoneySense: How do I choose between ETFs that track the same index?](https://www.moneysense.gov.sg/investments/choose-etfs-same-index/), “The key dimensions to compare”, “Distributing vs accumulating” og “Do you need multiple ETFs tracking the same index?”. | Artikel markeret opdateret 21/09/2026; generel sidefooter angiver 22/10/2026. Offentlig singaporeansk investorlæring. Kun produktmekanik og overlap anvendes; ingen singaporeanske konto-, skatte- eller egnethedsregler overføres til ASK. |

### Fund om lovversion og modstridende evidens

En søgning viste den gamle LBK nr. 1098 af 27/08/2025 som gældende. Direkte læsning af [dens officielle XML](https://www.retsinformation.dk/eli/lta/2025/1098/xml) viste derimod `Status=Historic` og historisk markering 02/10/2026. Den er derfor erstattet som artikelkilde af S3. Dette er en faktisk versionsrettelse, ikke en antagelse ud fra årstallet.

De oplyste ændringslove blev også kontrolleret i officielle dokumenter: [lov 1755/2025, § 2](https://www.retsinformation.dk/eli/lta/2025/1755/pdf) indsætter §§ 35 G–K; [lov 615/2026, § 4](https://www.retsinformation.dk/eli/lta/2026/615/xml) ændrer § 34; [lov 729/2026, § 10](https://www.retsinformation.dk/eli/lta/2026/729/xml) ændrer § 35 B. S3 samler disse ændringer. § 19 B's krav blev læst direkte i den aktuelle udgave.

En fundet SKAT-indberetningsvejledning med `vid=219460` viste sig ved åbning at være **2023**-udgaven. Den bruges ikke som selvstændigt bevis for 2026. [Den aktuelle ASK-indberetningsside](https://skat.dk/erhverv/ekapital/vaerdipapirer/indberetning-af-aktiesparekonto), afsnittet “På aktiesparekontoen kan der investeres i”, blev læst særskilt og bekræfter koblingen til § 19 B og kravene om handel/omsættelighed.

## Påstandslog

Placeringerne nedenfor er linjer i den reviderede MDX, medmindre de har en registry-nøgle. Kildedato, læsedato og anvendelsesår i kildeoversigten er en del af hver post. Beregningsposter har ingen ekstern kilde; deres antagelser og kontrol står særskilt. Redaktionelle råd er markeret som praksis og gøres ikke til lovkrav eller afkastløfter.

| ID / sted og præcis påstand | Kilde og afsnit | År/data | Vurdering, forbehold og handling |
| --- | --- | --- | --- |
| C01 · H1, linje 1: “ETF til aktiesparekonto: sådan vælger du”; linje 5 lover en metode frem for en produktvinder. Oprindelig H1: “Bedste ETF til aktiesparekonto”. | Redaktionel praksis; opgavebrief og faktisk indhold. Ingen ekstern produktmåling. | Guide i 2026. | **Rettet.** En bestevinder var ikke dokumenteret. URL bevares; samme afgrænsning foreslås i metadata. |
| C02 · Linje 3: Kontoadgang kontrolleres før indeks og omkostninger; positivlisten indgår for aktiebaserede investeringsselskaber. | S1, værdipapirafsnit; S2, § 5; S3, § 19 B; S4, listeafsnit. | 2026. | **Bekræftet**, med afgrænsning til kategorien. Rækkefølgen er praktisk vejledning, ikke en lovbestemt procedure. |
| C03 · Linje 9: “I 2026 beskattes kontoens afkast med 17 % efter lagerprincippet”; også urealiserede værdistigninger medregnes. | S1, “Beskatning”; S2, §§ 13–14. | ASK, 2026. | **Bekræftet.** Udsagnet gælder kontoen; der gives ingen skattesats for frie midler og ingen forenklet påstand om direkte fradrag ved tab. |
| C04 · Linje 11: “§ 5, stk. 1, nr. 3” tillader “omsættelige investeringsbeviser” under § 19 B. | S2, præcis § 5, stk. 1, nr. 3; S3, § 19 B. | Gældende udgaver, 2026. | **Bekræftet.** Omsættelighed bevares som særskilt betingelse. Ingen slutning fra udenlandsk ISA/SIPP-status. |
| C05 · Linje 11: § 19 B kræver meddelelse til Skattestyrelsen og bestemte investeringer. | S3, § 19 B, stk. 2–6. | 2026. | **Bekræftet.** Den fulde 50 %-test og indberetningsbetingelser er læst, men ikke reduceret til en ufuldstændig talregel i brødteksten. Et fondsnavn eller mange aktier i porteføljen er ikke alene bevis for status. |
| C06 · Linje 13: Positivlisten viser anmeldte aktiebaserede investeringsselskaber og har betydning for ASK-adgangen. Oprindelig overskrift adskilte listen og ASK som “to forskellige spørgsmål”. | S1, værdipapirer; S2, § 5; S3, § 19 B; S4, listeafsnit. | 2026. | **Rettet.** Kontoens egen skat ophæver ikke kravene til instrumenterne. Det tidligere udsagn om aktieindkomst i frie midler er ikke videreført som forklaring på listens hovedbetydning her. |
| C07 · Linje 13: “positivlisten er ikke en samlet liste over alt, en ASK må indeholde”. | S2, § 5, stk. 1, nr. 1–3: også kontanter, tilladte aktier og bestemte andre investeringsbeviser. | 2026. | **Bekræftet.** Forebygger den modsatte fejl, at listen alene skulle afgøre samtlige instrumenttyper. Ingen konkret ikke-listet ETF godkendes. |
| C08 · Linje 17: Match ISIN i KID og hos udbyder for samme andelsklasse. | S7, “Product”, identificerer både ISIN og USD Accu-andelsklasse. | KID 03/09/2026; generel kontrolmetode. | **Bekræftet som dokumentkontrol; praksis som købstjek.** ISIN fra et eksempel omsættes ikke til en ASK-påstand. |
| C09 · Linje 18: Kontrollér relevant indkomstår; versionen offentliggjort 28/09/2026 gælder hele 2026. | S4, “Liste over aktiebaserede investeringsselskaber”. | 2026. | **Bekræftet på SKAT-websiden.** Der påstås intet opslag i filen eller medlemskab for en navngiven ETF. Der gættes ikke på filens kolonnenavne. |
| C10 · Linje 19–21: Udbyderens almindelige produktsøgning dokumenterer ikke i sig selv ASK-adgang; afklar tvivl før køb. | S1/S2, særlige krav til kontoaktiver; S7, sekundærmarked/broker i “Objectives”. | Generel guide, 2026. | **Praksis.** Lovlig instrumentkategori og udbyderens konkrete tilbud holdes adskilt. Ingen navngiven udbyder eller produktfunktion påstås verificeret. |
| C11 · Linje 25: MSCI World omfatter store/mellemstore selskaber i udviklede markeder; ACWI omfatter også emerging markets; standardindeksene omfatter ikke small cap. | S5/S6, præcise indeksdefinitioner: large/mid cap og markedsdækning. | Definitioner læst 24/10/2026. | **Bekræftet.** Gælder de nævnte standardindeks, ikke alle fonde med “World”, “All World” eller “ACWI” i navnet. Ingen ETF-egnethed udledes af et indeks. |
| C12 · Linje 27: Geografisk bredde betyder ikke lige vægte; læs lande, sektorer, beholdninger, KID-risiko og horisont. | S7, “Objectives”, beskriver fri markedsvægtning; “What are the risks” beskriver tabsrisiko. S5/S6, indeksbeskrivelser. | KID 03/09/2026; generelt råd. | **Bekræftet/praksis.** Ingen ubekræftede USA-vægte, selskabsantal, universel ejerperiode eller risikoklasse indsættes. |
| C13 · Linje 27: “Spredning fjerner ikke risikoen for tab.” | S7, “What are the risks”, herunder manglende beskyttelse mod markedsfald for den brede aktiefond. | KID 03/09/2026. | **Bekræftet.** Ingen påstand om garanteret sikkerhed eller fremtidigt afkast. |
| C14 · Linje 31–33: Samme indeks tilføjer ikke nye markeder ved ny udsteder; flere fonde kan kræve flere handler. | S9, “Do you need multiple ETFs tracking the same index?”. | Artikel 21/09/2026. | **Bekræftet som markedseksponering/praksis.** Udsagnet benægter ikke mulige forskelle i udsteder- eller konstruktionsrisiko. Der loves ikke identiske faktiske beholdninger eller afkast. |
| C15 · Linje 31: Emerging markets kan supplere developed-only; oven på ACWI øges en eksisterende markedsvægt. | S5/S6, indeksdækning; logisk følge af at lægge EM til en portefølje, som allerede indeholder EM. | Aktuelle indeksdefinitioner. | **Bekræftet, betinget.** Der sættes ingen bestemt vægt eller anbefaling om overvægt. |
| C16 · Linje 37–39: TER er ikke hele handelsprisen; KID opdeler løbende drift og underliggende transaktionsomkostninger. | S7, “Composition of Costs”; S8, handelsomkostninger uden for fondens gebyrtabel; S9, TER-afsnit. | KID 03/09/2026; øvrige kildedatoer ovenfor. | **Bekræftet.** Ingen konkret TER eller omkostningsfrihed påstås for et faktisk produkt. |
| C17 · Linje 40: Kurtage ved køb/salg; minimumsbeløb fylder mere ved små handler. | S8, 2025-bulletin, “ETF Transaction Costs Not Shown in the Fee Table”, brokerage commissions. | Generel mekanik; ingen brokerpris. | **Bekræftet.** Betinget af at en sådan kurtage faktisk opkræves; priser skal læses hos egen udbyder. |
| C18 · Linje 41/44: Spread er forskel mellem købs-/salgskurs og en omkostning; likviditet har betydning. | S8, 2023-bulletin, “Bid-ask spread”. | Generel handelsmekanik. | **Bekræftet.** Ingen aktuelle spreadtal eller garanti for bestemt udførelseskurs. |
| C19 · Linje 42/44: Undersøg valuta/depot, børsnotering og valutarisiko særskilt. | S7, “Objectives” og valutaadvarsel under “What are the risks”; S9, børser/valuta og currency hedging. | 2026-kilder; ingen prisdata. | **Praksis.** Der påstås ikke, at alle konti har alle gebyrer, eller at handelsvaluta bestemmer hele valutarisikoen. |
| C20 · Linje 48 og tabel 50–55: 50.000 kr.; 0,15/0,25 %; 75/125 kr.; kurtage 80/20 kr.; sum 155/145 kr. | Egen aritmetik, kontrolleret med Node nedenfor. | Fiktivt første år, 2026. | **Bekræftet regneeksempel.** Samme indeks/adgang er eksplicit antaget. Tallene er ingen produkt- eller brokerobservation. Alle tabelceller med beløb har enhed, og år står i overskriften. |
| C21 · Linje 57/59: Andre udgifter antages nul; intet salg; B koster 10 kr. mindre første år og 50 kr. mere i årlig produktomkostning ved samme værdi. | Egen aritmetik; S8 dokumenterer, hvorfor køb/salg skal holdes adskilt fra løbende omkostninger. | Fiktivt scenario, 2026. | **Bekræftet under synlige antagelser.** Ingen afkast-, skatte- eller flerårsprognose. Fremtidigt salg skal indgå i læserens virkelige sammenligning. |
| C22 · Linje 63: Akkumulerende geninvesterer; udloddende udbetaler indtægter. | S9, “Distributing vs accumulating”; S7, “Objectives”, bekræfter akkumulering for den præcise andelsklasse. | 2026-kilder. | **Bekræftet.** Egenskaben knyttes til andelsklassen; der erklæres ingen konkret klasse ASK-tilladt. |
| C23 · Linje 63–65: Udlodningsform ændrer ikke ASK-lagerbeskatning; akkumulering kan spare manuel geninvestering, udlodning kan passe til kontantbehov. | S1, “Beskatning”; S9, udbytteafsnit. | ASK, 2026. | **Bekræftet/praksis.** Ingen generel skattefordel, billigst-påstand eller universel anbefaling af akkumulering. |
| C24 · Linje 67 samt related-kort: investeringsstrategi, global ETF, positivliste og kontotype/købsautomatik er relevante næste læseopgaver. | Faktiske records og MDX-mål i `articles.ts` og `lessons.ts`; automatisk målkontrol nedenfor. | Aktuel kilde i checkoutet. | **Bekræftet på kildeniveau.** Ingen bestemt brokers automatik på ASK påstås. HTTP-status og fragmenter er ikke kontrolleret. |
| C25 · Registry `articles[section=etf,id=bedste-etf-til-aktiesparekonto].title` og `.seoTitle`: de gamle værdier starter med “Bedste ETF”. | Egen sideinspektion; C01. | Aktuelt snapshot. | **Skal rettes ved integration.** Eksakte forslag nedenfor fjerner et ikke-dokumenteret rangeringsløfte. Ingen implementering i registry i denne fase. |
| C26 · Samme record `.description`: den gamle værdi lover valg ud fra spredning, pris, valuta, likviditet og tilladte værdipapirer. | C02–C23; S1–S9. | 2026. | **Indholdet er dækket.** Ny beskrivelse foreslås for at fremhæve den nu dokumenterede listekontrol, overlap og regneeksempel. |
| C27 · Samme record `.related`: “Sammenlign globale indeks”, “Sammenlign rammerne”, “Se hvornår positivlisten er relevant”. | De aktuelle linked records; C24. | Aktuel kilde. | **Bevares.** Navigationstekst, ikke produktpriser eller et dokumenteret praktisk testresultat. |
| C28 · `.publishedAt`, `.updatedAt`, byline og FAQ. | Præcist metadatasnapshot, `Article`-type og `ArticlePage.astro`. | Oprindeligt 16/07/2026; substantiel revision 24/10/2026. | **Publiceringsdato bevares.** Ændringsdato foreslås kun for rettet økonomisk indhold. Ingen personlig Kasper-godkendelse er dokumenteret. FAQ findes ikke; tomt forslag nedenfor. |

## Kontrolleret regnestykke

Input er bevidst fiktive. Hver fond har antaget gennemsnitlig investeret værdi 50.000 kr. over ét år i 2026. Der købes én gang; kurtagen betales af særskilte kontanter. Begge fonde antages lovlige og tilgængelige på ASK samt at dække samme indeks. Alle andre omkostninger sættes til nul, og der sælges ikke. Intet afkast eller skattebeløb beregnes. Der er ingen kurs-, gebyr- eller afkastprognose.

- A: `50.000 × 0,0015 = 75 kr.`; `75 + 80 = 155 kr.`.
- B: `50.000 × 0,0025 = 125 kr.`; `125 + 20 = 145 kr.`.
- Første år: `155 − 145 = 10 kr.` til B's fordel.
- Årlig produktforskel ved samme gennemsnitsværdi: `125 − 75 = 50 kr.` til A's fordel.
- Ingen afrunding kræves. Et løbende produktgebyr på en varierende værdi kan ikke fremskrives til disse beløb uden den viste værdiantagelse.

Følgende script blev kørt med exit 0 og kontrollerer hver værdi:

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
const value=50000;
const a=value*0.0015;
const b=value*0.0025;
const firstA=a+80;
const firstB=b+20;
assert.equal(a,75);
assert.equal(b,125);
assert.equal(firstA,155);
assert.equal(firstB,145);
assert.equal(firstA-firstB,10);
assert.equal(b-a,50);
console.log(JSON.stringify({average_value_dkk:value,annual_product_cost_A:a,annual_product_cost_B:b,first_year_A:firstA,first_year_B:firstB,first_year_difference_dkk:firstA-firstB,annual_product_difference_dkk:b-a}));
NODE
```

## Ændringer og bevidst bevaret indhold

- H1 er afgrænset til en valgvejledning. Der er ingen navngivne kandidater, opfundet test, personlige erfaringer eller afkastløfter.
- Den misvisende adskillelse af positivlisten og ASK er erstattet af den faktiske § 5/§ 19 B-forbindelse. Satsen er tydeligt kontoens sats, og andre tilladte fondskategorier er ikke udelukket ved en blanketregel.
- Den seneste, direkte verificerede lovbekendtgørelse er brugt frem for søgeresultatets forældede lovstatus.
- De eksisterende emner om spredning, indeks, likviditet, valuta, omkostninger, udlodning og antal ETF'er er bevaret og konkretiseret. Det udokumenterede generelle antal “tusindvis af selskaber” er erstattet af præcise indeksafgrænsninger.
- Et omkostningseksempel gør forskellen mellem løbende pris og kurtage brugbar uden at udgive antagelser for faktiske priser. Tabellen har tre udfyldte kolonneoverskrifter, år og relevante enheder.
- Alle fire oprindelige interne linkmål er bevaret. Linkteksten til global ETF er gjort til en guidehenvisning uden nyt “bedste”-løfte.
- Der er ingen ændring af ID, URL, udgivelseslogik, publiceringstidspunkt, skema, fælles UI, scripts eller gates. Ingen byline-godkendelse tilføjes.

## Præcist metadata- og FAQ-forslag til senere integration

Dette er **kun et forslag**, ikke udførte ændringer. Integratoren skal genlæse den aktuelle record og kontrollere gamle værdier før feltvis anvendelse. En ændring i en anden registryrecord giver ikke grundlag for at overskrive denne record.

```json
{
  "registry": "src/data/articles.ts",
  "variable": "articles",
  "record_key": {
    "section": "etf",
    "id": "bedste-etf-til-aktiesparekonto"
  },
  "base_registry_sha256": "0a015a72fcaa026e8b0346768dbeb6a11e5cb2ba36cd12b9c84764cb2923b3d2",
  "base_record_literal_sha256": "16c09f0ad41e88b59cfeda1e441a826d10a7c44e842b69de4d05d79a56f96e66",
  "changes": {
    "title": {
      "old": "Bedste ETF til aktiesparekonto — brug de rigtige kriterier",
      "new": "ETF til aktiesparekonto: sådan vælger du"
    },
    "seoTitle": {
      "old": "Bedste ETF til aktiesparekonto: guide og kriterier",
      "new": "ETF til aktiesparekonto: regler, valg og omkostninger"
    },
    "description": {
      "old": "Vælg ETF til aktiesparekonto ud fra spredning, omkostninger, valuta, likviditet og hvilke værdipapirer kontoen må indeholde.",
      "new": "Sådan vælger du ETF til aktiesparekonto: kontrollér ISIN og positivliste, vurder indeks og overlap, og sammenlign omkostninger med et regneeksempel."
    },
    "updatedAt": {
      "old": "2026-07-16",
      "new": "2026-10-24"
    }
  },
  "preserve": {
    "id": "bedste-etf-til-aktiesparekonto",
    "section": "etf",
    "publishedAt": "2026-07-16",
    "related": "Alle tre records bevares nøjagtigt som i originalsnapshot ovenfor",
    "url": "/etf/bedste-etf-til-aktiesparekonto/",
    "publication_logic": "Uændret"
  },
  "faq_proposal": {
    "registry": "src/data/articles.ts",
    "record_key": {
      "section": "etf",
      "id": "bedste-etf-til-aktiesparekonto"
    },
    "old": {
      "field_present": false
    },
    "new": {
      "field_present": false
    },
    "changes": []
  }
}
```

Den foreslåede ændringsdato begrundes med en substantiel rettelse af instrumentadgang og tilføjelse af dokumenteret indeksforklaring og kontrolleret omkostningseksempel. Den er ikke kosmetisk friskhed eller bevis for personlig kontrol af Kasper. Før integration er den synlige/strukturerede ændringsdato stadig 16/07/2026. Lead/integrator skal sikre, at synlig dato, Article-markup og sitemap får samme sandfærdige ændringsdato. `publishedAt=2026-07-16` og eksisterende planer bevares. Forslagets søgetitel er kontrolleret unik mod den aktuelle artikelregistry.

## Udførte kontroller

| Kontrol/kommando | Forventet exit | Observeret exit | Resultat |
| --- | --- | --- | --- |
| `node_modules/.bin/vitest run src/data/articles.test.ts src/data/seo-quality.test.ts src/data/internal-links.test.ts` før redigering | 0 | 0 | 3 filer, 7 tests bestået; baseline kl. 09:20 UTC. |
| Samme Vitest-kommando på den endelige brødtekst | 0 | 0 | 3 filer, 7 tests bestået; afsluttet kl. 09:33:10 UTC. Brødteksthashen svarer til den endelige hash ovenfor. |
| `git diff --check -- src/data/articles/etf/bedste-etf-til-aktiesparekonto.mdx` | 0 | 0 | Ingen whitespace-fejl. |
| `node --input-type=module`, regneeksempel-scriptet ovenfor | 0 | 0 | Alle seks beløb/forskelle stemmer. |
| `node --input-type=module`, registry- og strukturkontrol nedenfor | 0 | 0 | Fire eksisterende mål med faktiske records og MDX-filer; én H1; unikke overskriftstekster; foreslået SEO-titel unik. |
| `node --input-type=module`, afsluttende JSON- og hashkontrol | 0 | 0 | Begge JSON-blokke kan parses; brødtekst- og registryhash stemmer; originalrecord, gamle forslagværdier og bevaret publiceringsdato matcher faktisk kilde. |

Den målrettede linkkontrol brugte de faktiske `articles`- og `lessons`-arrays i kildekoden, ikke inventarfilen som bevis:

```sh
node --input-type=module <<'NODE'
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
function registry(file,variable){
  const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  let literal;
  function visit(node){
    if(ts.isVariableDeclaration(node)&&node.name.getText(source)===variable&&node.initializer&&ts.isArrayLiteralExpression(node.initializer))literal=node.initializer.getText(source);
    ts.forEachChild(node,visit);
  }
  visit(source);
  assert.ok(literal,variable+' missing');
  return vm.runInNewContext('('+literal+')');
}
const articles=registry('src/data/articles.ts','articles');
const modules=registry('src/data/lessons.ts','lessons');
const routes=new Map();
for(const item of articles)routes.set('/'+item.section+'/'+item.id,'src/data/articles/'+item.section+'/'+item.id+'.mdx');
for(const module of modules)for(const lesson of module.lessons)routes.set('/'+lesson.id,'src/data/lessons/'+module.id+'/'+lesson.id+'.mdx');
const body=readFileSync('src/data/articles/etf/bedste-etf-til-aktiesparekonto.mdx','utf8');
const targets=[...body.matchAll(/\]\((\/[^)\s]+)\)/g)].map(match=>match[1]);
assert.equal(targets.length,4);
for(const target of targets){assert.ok(routes.has(target),target);assert.ok(existsSync(routes.get(target)),target);console.log(target+' -> '+routes.get(target));}
assert.equal([...body.matchAll(/^# /gm)].length,1);
const headings=[...body.matchAll(/^#{1,3} (.+)$/gm)].map(match=>match[1]);
assert.equal(new Set(headings).size,headings.length);
assert.ok(!articles.some(item=>item.seoTitle==='ETF til aktiesparekonto: regler, valg og omkostninger'));
console.log('PASS: 4 registry-backed destinations with bodies; one H1; unique headings; proposed SEO title unique.');
NODE
```

Verificerede interne mål:

| URL | Faktisk kilde |
| --- | --- |
| `/etf/skats-positivliste` | `src/data/articles/etf/skats-positivliste.mdx`, record i `articles.ts` |
| `/etf/bedste-globale-etf` | `src/data/articles/etf/bedste-globale-etf.mdx`, record i `articles.ts` |
| `/hvad-er-en-investeringsstrategi` | `src/data/lessons/strategi-og-adfaerd/hvad-er-en-investeringsstrategi.mdx`, record i `lessons.ts` |
| `/guides/aktiesparekonto-eller-maanedsopsparing` | `src/data/articles/guides/aktiesparekonto-eller-maanedsopsparing.mdx`, record i `articles.ts` |

## Selvkontrol og separate godkendelsesstatusser

| Område | Status | Afgrænsning |
| --- | --- | --- |
| Implementering af brødtekst/evidens | UDFØRT | Kun de to ejede stier. Hele brødtekstdiffen er læst. |
| Hensigt | BESTÅET på brødtekst/proposal | Direkte svar og guide-H1; registry venter på integration. |
| Belæg og E2-særkontrol | BESTÅET inden for afgrænsningen | § 5/§ 19 B er læst i gældende udgaver. Ingen navngivne kandidater kræver produkt-/brokerkontrol. Ingen uløst beslutningsbærende påstand er bevidst efterladt i brødteksten. |
| Eksempel, dansk og selvstændig nytte | BESTÅET ved selvkontrol | Kontrolleret omkostningsvalg, forklarede termer, ingen lovet rangliste eller afkast. Uafhængig vurdering mangler. |
| Kildenavigation | BESTÅET lokalt | Fire faktiske interne mål og kilder nær relevante udsagn. |
| Metadata/FAQ-integration | PENDING | Eksakte forslag ovenfor; intet registryfelt ændret. Intet FAQ-forslag er nødvendigt. |
| Uafhængigt review | PENDING | Skal udføres af en anden reviewer. Ingen revieweridentitet, godkendelse eller reviewhash påstås. |
| Samlet side efter integration | PENDING | Ny gennemgang af faktisk body + anvendt metadata kræves. |
| HTTP/HTML, canonical, schema og sitemap | PENDING, lead | Ingen server eller browser er startet. Kildetests beviser ikke et HTTP-svar. |
| Direkte visuel kontrol | PENDING, lead | Ingen skærmbredde eller tema er verificeret. |
| Repræsentativ skabelonkontrol | PENDING, lead | Ingen indirekte layoutgodkendelse udledes af de beståede tests. |
| Build, fuld testpakke og lint | IKKE KØRT | Tilhører leadens batchkontrol efter integration. |

### Konkrete kontrolpunkter til lead

Åbn `/etf/bedste-etf-til-aktiesparekonto/` i den eksisterende T3-preview, når integrationen er klar. Kontrollér HTTP-svar, én H1, søgetitel/beskrivelse, canonical, Article-headline og begge datoer samt sitemap-ændringsdato. Den nuværende gamle registrytitel vil være misvisende, hvis metadataforslaget ikke integreres.

Layoutpunkter: tabellen med tre kolonner og formler kan kræve lokal tabelrulning ved 320 CSS-pixels; almindelig tekst må ikke skabe vandret rulning. Den lange H3 “Regneeksempel: lavest årlig procent er ikke altid billigst første år” skal bryde læsbart og have fungerende TOC-anker. Kontrollér også æ/ø/å i “Kontrollér den præcise andelsklasse før køb”, sticky header og kilde-links i lys/mørk visning med tastatur. Kontroller, at byline/partnerannonce ikke skubber det direkte svar væk eller skaber en udokumenteret personlig godkendelse. Delte komponenter er ikke ændret her.

### Mislykkede kildehentninger og erstatningskontroller

- Retsinformations HTML-visning gav en JavaScript-skal. De relevante afsnit blev i stedet læst i de officielle PDF'er og status-XML.
- Webværktøjets klik på et SKAT-info-link gav “Internal Error”. Den aktuelle, direkte ASK-indberetningsside og de officielle love blev åbnet og læst i stedet.
- Webværktøjet kunne ikke hente `/eli/lta/2026/615/pdf` og `/eli/lta/2026/729/pdf`. Direkte XML gav de officielle dokument-ID'er; `/api/pdf/256879` og `/api/pdf/257381` blev derefter åbnet. De relevante ændringsafsnit blev læst i XML. Den aktuelle samlede LBK 849/2026 blev efterfølgende verificeret direkte.
- Et terminalforsøg på PDF-til-tekst fejlede, fordi `pdftotext` ikke er installeret; curl viste følgelig kode 23. To begrænsede curl-visninger med `head` lukkede også røret tidligt og gav kode 23. Ingen pakke blev installeret. Efterfølgende afgrænsede læsninger med `rg` samt webværktøjets PDF-læsning lykkedes. Disse forsøg er kildehentning, ikke beståede kvalitetstests.
- Den forældede søgestatus for ABL 1098/2025 er tilsidesat af den direkte officielle versionskontrol. Ingen navngiven produktberettigelse udledes af søgesnippets eller en britisk kontobetegnelse.

Denne note afslutter kun den tildelte brødtekst-/evidensfase. Den er ikke en endelig artikelgodkendelse eller dokumentation for offentliggjorte ændringer.

## Serial metadataintegration · 2026-10-24

Grundlag: task `ki-seo-pilot-ask-review-r1`, hele `task.summary` i `reports/ask-review-r1.json`: **APPROVE FOR METADATA INTEGRATION**, uden fund i det tildelte indhold og forslag. Dette er den senere integrationsfase; påstandslog, oprindelige snapshots, forslag og tidligere statusser ovenfor er bevaret som historik.

Anvendt alene på `articles[section=etf,id=bedste-etf-til-aktiesparekonto]` i `src/data/articles.ts`:

- `title` → `ETF til aktiesparekonto: sådan vælger du`.
- `seoTitle` → `ETF til aktiesparekonto: regler, valg og omkostninger`.
- `description` → `Sådan vælger du ETF til aktiesparekonto: kontrollér ISIN og positivliste, vurder indeks og overlap, og sammenlign omkostninger med et regneeksempel.`
- `updatedAt` → `2026-10-24`.

TypeScript 5.9.3 afgrænsede den præcise object-literal og de fire strengværdier. Faktisk før-record matchede både evidenssnapshot, forslagets gamle værdier og reviewets hashes; ingen drift. Kun de fire AST-afgrænsede strengværdier blev erstattet. `publishedAt=2026-07-16`, ID, section, URL, alle tre related-records, fravær af FAQ og øvrige felter er bevaret. Alle øvrige 11 records er identiske som data og TS-literal, herunder den allerede integrerede skattepost. Brødteksten er uændret.

| Kontrolleret genstand | SHA-256 |
| --- | --- |
| Registry umiddelbart før integration | `5bbaa41a215598c4c25818f1f6c9893518385c8097ff213923a8a421e3724465` |
| Registry efter integration | `a0f9070f989586f1b25848cf51927c6592be776db477b1a70c17f328859656d3` |
| Endelig ASK-record, TS-literal | `8f9b4cf51c1d055d38d5be11357eea37b397309449366a2103ecdeec6ef0fe44` |
| Endelig ASK-record, kompakt JSON | `9d0b5bc037785cb77a25bfe554ff12d0675850f6cc90b4650e2048db384f0cdc` |
| Uændret brødtekst | `901f1341468455de89c0d8bac5e54b559e35f9f75e69ba5f2444a60a14f1635b` |
| Evidensnote før dette tillæg | `bf8cbaff87c537876ff3adb765dbf5e89eca1a9cda29c9e4b9b4734486402a8f` |

Hashmetoder: filer hashes som rå filbytes. TS-literal hashes som UTF-8 af `ObjectLiteralExpression.getText(sourceFile)`, fra `{` til `}` uden efterfølgende komma. Kompakt JSON hashes som UTF-8 af `JSON.stringify(record)` i kildens feltorden uden afsluttende linjeskift. JSON-hashen matcher reviewets forventede integrationshash.

Kildebelæg for datopropagation: `src/components/ArticlePage.astro:27–28` bruger `article.publishedAt` til `datePublished` og `article.updatedAt` til `dateModified`; linje 56 sender `updatedAt` til AuthorBox. `src/components/AuthorBox.astro:7–12,26` formatterer værdien på dansk og viser “Senest opdateret” med `<time datetime={updatedAt}>`. `src/pages/sitemap.xml.ts:102` sender artikelens `updatedAt` til sitemap; linje 37–40 skriver værdien i `<lastmod>`. Dette er læst kildebelæg, ikke en afviklet sidekontrol.

| Integrationskontrol | Forventet exit | Observeret exit | Resultat |
| --- | --- | --- | --- |
| `node_modules/.bin/vitest run src/data/articles.test.ts src/data/seo-quality.test.ts src/data/internal-links.test.ts` | 0 | 0 | 3 filer og 7 tests bestået på anvendt metadata. |
| `node_modules/.bin/biome check src/data/articles.ts` | 0 | 0 | 1 fil kontrolleret; ingen rettelser. |
| `git diff --check -- src/data/articles.ts` | 0 | 0 | Ingen whitespace-fejl. |
| `node --input-type=module`, AST-afgrænset integration og strukturel før/efter-kontrol | 0 | 0 | Præcis fire felter ændret; øvrige 11 records identiske; publiceringsdato/related/FAQ bevaret; brødteksthash og forventet slutrecordhash stemmer; alle 12 SEO-titler unikke. |

Metadata/FAQ-integration: **UDFØRT** inden for denne afgrænsning. Frisk godkendelse af den samlede side med anvendt metadata: **PENDING**. Fælles renderer-review og runtimekontrol: **PENDING**. HTTP/HTML, canonical, schema, sitemap og visuel kontrol er fortsat **PENDING hos lead**; build, fuld testpakke og server/browser er ikke kørt her. Ingen konkret ETF eller personlig Kasper-godkendelse er fastslået.
