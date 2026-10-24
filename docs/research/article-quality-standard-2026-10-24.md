# Kvalitetsstandard for investeringsartikler

Kontrolleret 24. oktober 2026. Målgruppe: private investorer i Danmark. Sprog: dansk. Omfang: de 12 MDX-artikler under `src/data/articles/{guides,etf,skat}` og deres metadata. Dette er research og en godkendelsesstandard, ikke en færdig faktakontrol af alle artikler.

**Dokumenteret** betyder, at en primær kilde beskriver forholdet. Der skelnes nedenfor mellem politik, anbefaling og standard. **Forskning** gælder den nævnte undersøgelses rammer. **Praksis** er vores redaktionelle valg, ikke et dokumenteret rankingkrav. Kilderne i kildelisten er åbnet og læst i denne research; læsedatoen er ikke deres udgivelsesdato.

## Hvad de officielle kilder understøtter

| Område | Grundlag og praktisk konsekvens |
| --- | --- |
| Hjælpsomt finansindhold | **Dokumenteret anbefaling:** Svar på læserens opgave med kontrollerbare oplysninger og selvstændig værdi. Finansstof er YMYL, hvor troværdighed vejer tungt. E-E-A-T er ikke en særskilt rankingfaktor eller en score, man kan opfylde med forfattermarkup. [G-helpful] |
| AI og masseindhold | **Dokumenteret politik/anbefaling:** AI er ikke generelt forbudt. Masseproduktion med manipulerende formål og ringe værdi kan være scaled content abuse. AI-udkast skal faktakontrolleres, også titler, beskrivelser og markup. En AI-kilde eller en overfladisk sproggennemgang dokumenterer ikke rigtighed. [G-spam] [G-ai] |
| Titel og beskrivelse | **Dokumenteret anbefaling:** Brug en særskilt, præcis titel og en beskrivelse af sidens faktiske indhold. Undgå gentagne søgeord og skabelontekst. Google kan vælge anden titeltekst og andre snippets. Der er ingen fast grænse på 60/160 tegn; visningen kan blive afkortet efter pladsen. [G-title] [G-snippet] |
| Overskrifter og længde | **Dokumenteret:** Google angiver intet magisk ordtal eller antal overskrifter. Semantiske overskrifter hjælper hjælpemidler; beskrivende overskrifter indgår i WCAG 2.4.6, AA. **Praksis:** Én tydelig H1 og logiske H2/H3 er skabelonens udgangspunkt. [G-starter] [W-headings] |
| Links og kommercielle relationer | **Dokumenteret anbefaling/politik:** Brug almindelige `<a href>`-links med beskrivende linktekst i relevant sammenhæng. Vigtige sider skal have et indgående internt link. Betalte links kvalificeres med `sponsored` eller `nofollow`. Der er intet ideelt antal links. [G-links] |
| Forfatter og dato | **Dokumenteret anbefaling:** Angiv sandfærdig forfatter og relevant baggrund. Synlige datoer og tilsvarende strukturerede datoer skal stemme. Brug reelle publicerings- og ændringsdatoer. Tid og tidszone anbefales for præcision, men dato alene er ikke automatisk ugyldig. Kosmetiske ændringer begrunder ikke kunstig friskhed. [G-helpful] [G-dates] |
| Article-markup | **Dokumenteret:** Google har ingen obligatoriske Article-egenskaber, men anbefaler relevante oplysninger som forfatter, overskrift, datoer og repræsentative billeder. Markup skal beskrive det synlige indhold. Korrekt syntaks giver ingen garanti for udvidede søgeresultater. Tilføj ikke et irrelevant billede for at udfylde et felt. [G-article] [G-schema] |
| FAQ | **Dokumenteret ændring:** Google stoppede FAQ-rich-results den **7. maj 2026**. Den tidligere begrænsning til visse myndigheds- og sundhedssider er derfor ikke den aktuelle mulighed. FAQ er kun relevant, når spørgsmålene hjælper læseren; FAQ-markup skal ikke sælges som en Google-fordel. Den gamle dokumentationsadresse viderestiller til ændringsloggen. [G-updates] |
| Microsoft/Bing | **Dokumenteret anbefaling:** Microsoft anbefaler sammenhæng mellem titel, beskrivelse og H1. Bings vejledning fra februar 2026 fremhæver tydelige overskrifter, tabeller og belæg for påstande. Det begrunder klare afsnit, ikke tvungne FAQ-blokke eller løfter om AI-citater. Citattal er ikke det samme som placering eller trafik. [MS-content] [B-ai] |

**Forskning:** NN/Gs undersøgelse fra 1997 understøtter skanbar tekst, meningsfulde mellemoverskrifter og hovedpointen først. Det er historisk usabilityforskning, ikke en måling af danske investorer i 2026 eller en søgealgoritme. **Praksis:** Brug korte, sammenhængende afsnit med én hovedidé, og behold den faglige dybde. Undersøgelsen begrunder ikke et fast krav om at halvere ordtallet. [N-reading]

Ingen af disse kilder etablerer et mål for søgeordstæthed eller garanterer placeringer. Vurder dækning og nytte frem for at fylde tekst på for at nå en grænse. [G-starter] [G-spam]

## Finansiel faktakontrol og påstandslog

**Praksis:** Opret en påstandslog for hver artikel, før den godkendes. Medtag alle beslutningsbærende udsagn: satser, grænser, skat, frister, produktstruktur, priser, sammenligninger og forventninger. Brug felterne `påstand`, `præcis kilde-URL og afsnit`, `kontroldato`, `indkomstår eller datadato`, `vurdering` og `forbehold`. Brug vurderingerne **bekræftet**, **skal rettes** eller **uafklaret**. Hold regnestykker og redaktionelle vurderinger adskilt fra regler.

| Påstandstype | Kontrolmetode |
| --- | --- |
| Dansk skat og konto | Læs Skattestyrelsens konkrete vejledning og det rigtige indkomstår. Brug Retsinformation ved lovfortolkning; kontrollér gældende status, paragraf, ændringer og ikrafttrædelse. Et grundbeløb i loven er ikke nødvendigvis årets regulerede grænse. Angiv person, produkt, depot og skattekategori. ASK, pension og frie midler må ikke blandes sammen. [DK-aktier] [DK-ask] [DK-fonde] [DK-lov] |
| Positivliste og ASK | Kontrollér den nøjagtige ISIN og det relevante år i Skattestyrelsens fil. Registrér filens offentliggørelsesdato. Listens 2026-version gælder hele indkomståret 2026. Forklar forbindelsen til ASK-lovens § 5 og aktieavancebeskatningslovens § 19 B: forskellig kontobeskatning betyder ikke, at positivlisten er irrelevant for ETF'er på ASK. Brokerens produktudbud skal også kontrolleres. [DK-liste] [DK-lov] |
| ETF og andre produkter | Brug udstederens KID, faktaark og ved behov prospekt samt indeksudbyderens metode. Match ISIN/andelsklasse, akkumulation/udlodning, indeks, valuta, struktur, risiko og hver oplysnings datadato. Et aktuelt download kan indeholde ældre beholdningsdata. TER er ikke automatisk alle produkt- og handelsomkostninger. UK-status som ISA/SIPP-egnet dokumenterer ikke dansk ASK-egnethed. [P-kid] [P-fakta] [P-guld] [P-em] |
| Broker og pris | Brug officielle danske prislister og funktionsvilkår. Skeln mellem standardpris, kundetrin, marked, minimumskurtage og kampagne. Medtag køb, salg, valuta, spread, depot og produktomkostninger, når de er relevante. En overskrift med en fra-pris dokumenterer ikke en samlet pris eller en billigste udbyder. Nordnets prisside og Saxos oversigt viser forskellige prisniveauer; Saxos månedsopsparing skelner mellem gratis køb og salg/valuta. [B-nordnet] [B-saxo] [B-monthly] |
| Bolig og øvrige offentlige regler | Brug Borger.dk til borgerforløb og henvisninger til ansvarlige myndigheder; brug den konkrete lov/myndighed til beløbs- og finansieringskrav. Borger.dk anbefaler budget og forhåndsgodkendelse. Det er ikke belæg for et universelt opsparingsbeløb eller en bestemt investeringshorisont. [DK-bolig] |
| Estimat og regnestykke | Vis input, formel, afrunding, periode, skat, gebyrer og antaget afkast. Mærk eksempler som eksempler. Kontroller regnestykket særskilt. Et beregnet scenarie dokumenterer ikke et forventet eller garanteret markedsafkast. KID-scenarier må ikke omskrives til prognoser. [P-kid] |

Følgende er **startposter**, én for hver artikel. De erstatter ikke artikelarbejderens fulde log. Alle er kontrolleret **2026-10-24**; år/datadato og begrænsning står særskilt. Artikel-ID'erne henviser til filtabellen nedenfor.

| Artikel | Påstand og kilde-URL | År/datadato | Vurdering og forbehold |
| --- | --- | --- | --- |
| G1 | ASK: 17 % skat og indskudsloft 174.200 kr. [DK-ask] | 2026 | Bekræftet. Loftet er ikke et nyt frit indskud hvert år; kilden forklarer værdien ved foregående årsskifte og nettoindskud. |
| G2 | Saxos månedsopsparing har ingen købskurtage; salg og eventuel valutaveksling koster. [B-monthly] | Vilkår læst 2026-10-24 | Bekræftet. Ingen fuld prissammenligning eller billigste udbyder er dokumenteret her. |
| G3 | iShares Physical Gold ETC, ISIN IE00B4ND3602, angives som `UCITS: No` og fysisk metalstruktur. [P-guld] | Produktside læst 2026-10-24 | Bekræftet for dette produkt. Det dokumenterer hverken alle guldprodukter eller dansk skat; denne er uafklaret her. |
| G4 | Fire lige store køb af 50.000 kr. er 12.500 kr. hver. Kilde-URL: ikke relevant, egen aritmetik. | Hypotetisk eksempel | Bekræftet med Node. Gebyrer er udeladt; ingen påstand om, at fire køb giver højest afkast. |
| G5 | Mål 250.000 kr., nu 100.000 kr., 36 måneder: oprundet 4.167 kr./måned giver 250.012 kr. Kilde-URL: ikke relevant, egen aritmetik. | Hypotetisk eksempel | Bekræftet med Node. Nul rente, skat og gebyrer er antaget; boligomkostninger skal indgå i selve målet. |
| E1 | iShares Core MSCI World, ISIN IE00B4L5Y983, følger MSCI World med udviklede markeder. [P-kid] [P-fakta] | KID 2026-09-03; faktaark september 2026 | Bekræftet. Navnet World dokumenterer ikke emerging markets. Ingen dansk ISIN-klassifikation er verificeret her. |
| E2 | ASK-lovens § 5 omfatter bl.a. omsættelige investeringsbeviser efter § 19 B. [DK-lov] | Gældende PDF læst 2026-10-24 | Bekræftet regelhenvisning. En konkret ETF er ikke godkendt alene på baggrund af artiklens generelle forklaring. |
| E3 | MSCI Emerging Markets omfatter large og mid cap. [P-em] | Indeksside; øvrige viste data pr. 2026-09-30 | Bekræftet. Ikke belæg for, at alle EM-indeks også omfatter small cap eller samme lande. |
| E4 | Skattestyrelsens side med listen angiver offentliggørelse 2026-09-28 og gyldighed for hele 2026. [DK-liste] | Indkomstår 2026 | Bekræftet på websiden. Regnearkets enkelte ISIN-rækker er ikke læst/verificeret. |
| S1 | Gevinst/tab på aktier/beviser i investeringsselskaber opgøres efter lagerprincippet. [DK-fonde] | Gældende vejledning læst 2026-10-24 | Bekræftet for den beskrevne produktkategori; ikke en regel udledt alene af betegnelsen ETF. |
| S2 | Aktieindkomst: 27 % til 79.400 kr., derover 42 %; 158.800 kr. for ægtefæller med kildens samlivsbetingelse. [DK-aktier] | 2026 | Bekræftet. Afgræns mod ASK og kapitalindkomst; vis ægtefællebetingelsen, ikke kun det dobbelte tal. |
| S3 | Tabsfradrag på aktier optaget til handel kræver rettidig oplysning om købet. [DK-aktier] | Vejledning læst 2026-10-24 | Bekræftet. Kilden angiver 1. juli året efter køb og en weekendregel. Kontrollér konkret frist og tabsgruppe; ingen generel direkte modregning i løn. |

## Fund i den nuværende kildekode

Alle 12 MDX-filer er læst. Delte filer er verificeret og læst: [articles.ts](../../src/data/articles.ts), [ArticlePage.astro](../../src/components/ArticlePage.astro), [seo-quality.test.ts](../../src/data/seo-quality.test.ts), [redaktionel-metode.astro](../../src/pages/redaktionel-metode.astro), [Prose.astro](../../src/components/Prose.astro), [AuthorBox.astro](../../src/components/AuthorBox.astro), [TableOfContents.astro](../../src/components/TableOfContents.astro) og [author.ts](../../src/data/author.ts).

- `seo-quality.test.ts` kræver mindst 220 ord for artikler. Det er en lokal testgrænse, ikke Googles indeks- eller kvalitetskrav. Testen beviser ikke faktuel rigtighed, dækket hensigt eller godt sprog. Den kontrollerer ikke artiklernes unikke metadata; unikhedstesten i samme fil gælder ordbogen.
- Metadata har både `title`, `seoTitle`, beskrivelse, relaterede links og publicerings-/ændringsdato. Ved læsningen havde alle 12 datoen 2026-07-16. Ens dato er ikke i sig selv en fejl; den oprindelige publiceringshistorik er ikke dokumenteret af denne research.
- `ArticlePage.astro` bruger metadata til Article-JSON-LD. Byline viser Kasper Stuck og “Senest opdateret og kontrolleret”. Et agentsprog-tjek dokumenterer ikke, at Kasper har gennemgået teksten. Bevar kun påstanden, når den er sand; omskriv ikke forfatterhistorik eller kvalifikationer.
- `Prose.astro` begrænser tekstbredden og flytter “Læs også” samt indsætter en relevant partnerannonce via JavaScript. `TableOfContents.astro` bygger links af H2/H3; sidekolonnen skjules under `lg`. Det er kildekodeobservationer, ikke bevis for læsbarhed eller fungerende ankre.
- De fire “bedste”-artikler er overvejende kriterieguides. Månedsopsparingssiden nævner udbydere, men viser ingen dateret prissammenligning. ETF-siderne sammenligner ikke navngivne ETF'er med ISIN og dokumenterede data. **Praksis:** Luk dette hul med en efterprøvbar sammenligning eller tilpas titel/løfte til en valgvejledning. Bevar eksisterende URL, medmindre en særskilt ændring er aftalt. En dokumentanalyse må ikke kaldes en praktisk produkttest eller opfundet testvinder. [G-reviews] [G-title]

Kildekoden var allerede ændret på flere områder, herunder tre af artiklerne. Andre opgaver deler checkoutet. Fundene beskriver det læste øjebliksbillede; denne opgave ændrer kun nærværende note.

## Godkendelse af hver artikel

**Praksis:** Registrér **bestået**, **ikke bestået** eller **ikke relevant med grund** for hvert punkt. Et uafklaret forhold, som kan ændre læserens økonomiske beslutning, kan ikke godkendes ved blot at tilføje en generel ansvarsfraskrivelse. Den fælles liste og artiklens særlige række skal begge opfyldes.

- [ ] **Hensigt:** H1, søgetitel og beskrivelse lover det, teksten leverer. Første afsnit giver et direkte svar med den vigtigste betingelse. Ingen lovet rangliste uden sammenligning. [G-title] [G-snippet] [G-reviews]
- [ ] **Belæg:** Alle beslutningsbærende fakta har en afsluttet påstandslog og præcise primærkilder tæt på udsagnet. Skatteår, datadato, konto, produkt og målgruppe er angivet, hvor de ændrer svaret. [G-helpful] [G-ai]
- [ ] **Eksempel:** Et relevant eksempel gør valget eller reglen brugbar. Forudsætninger, udregning og begrænsninger er synlige. Forklar både fordele og ulemper samt hvornår et alternativ passer bedre. [G-reviews] [B-ai]
- [ ] **Naturligt dansk:** Fjern generelle indledninger som “I denne guide dykker vi ned i …”, gentaget søgefrase og afslutninger, der blot gentager indledningen. Forklar fagord. Hvert afsnit giver et svar, en nødvendig forklaring eller et næste skridt. Et mekanisk forbud mod bestemte ord er ikke et kvalitetstjek. **Praksis**, støttet af [N-reading] og [G-helpful].
- [ ] **Selvstændig værdi:** Ingen udskiftning af produktnavne i samme fyldskabelon. Ingen udokumenterede superlativer, egen erfaring, afkastløfter, testvindere eller autoritetspåstande. “Bedst” skal have kriterier, afgrænsning og dokumentation. [G-helpful] [G-reviews] [G-spam]
- [ ] **Navigation og ansvar:** Relevante interne links har dækkende linktekst og rigtige mål. Kilder og eventuelle partnerrelationer er klare. Forfatter og datoer er reelle og stemmer med metadata. [G-links] [G-dates] [G-schema]

| ID og artikel | Godkend kun, når denne særlige kontrol også er bestået |
| --- | --- |
| G1 · [Aktiesparekonto eller månedsopsparing](../../src/data/articles/guides/aktiesparekonto-eller-maanedsopsparing.mdx) | Forklar konto kontra købsfunktion; kontrollér 2026-sats/loft og konkrete udbyderes understøttelse af automatik på bestemte konti. Et pensionsloft må ikke forsvinde i en generel påstand om ubegrænset månedsopsparing. |
| G2 · [Bedste månedsopsparing](../../src/data/articles/guides/bedste-maanedsopsparing.mdx) | Vis faktiske udbydere, daterede vilkår og samlede omkostninger ved samme beløb/forudsætninger, eller afgræns løftet til en kriterieguide. Adskil selvvalgte køb fra porteføljeforvaltning. |
| G3 · [Investering i guld](../../src/data/articles/guides/investering-i-guld.mdx) | Adskil fysisk guld, ETC, mineaktier og fonde. Kontrollér skat for de konkrete instrumenter og begræns generelle udsagn. Påstå ikke sikker inflationsbeskyttelse eller automatisk ASK-egnethed. |
| G4 · [Invester 50.000 kr.](../../src/data/articles/guides/invester-50000-kr.mdx) | Giv et sammenhængende eksempel med buffer, gæld, horisont, konto og omkostninger. Engangskøb kontra gradvise køb skal vise kompromiset og undgå en udokumenteret universel vinder. |
| G5 · [Boligopsparing](../../src/data/articles/guides/boligopsparing.mdx) | Vis opsparingsmål, eksisterende beløb, måneder og månedlig overførsel. Angiv købsomkostninger og buffer. En valgt risikohorisont eller udbetalingsprocent må ikke fremstilles som en ubetinget lovregel. |
| E1 · [Bedste globale ETF](../../src/data/articles/etf/bedste-globale-etf.mdx) | Sammenlign faktiske ISIN/andelsklasser og indeks, hvis titlen lover produktvalg. Vis EM-dækning, omkostninger, struktur og dansk kontokontekst. Sammenlign ikke afkast i forskellige valutaer/perioder som samme mål. |
| E2 · [Bedste ETF til aktiesparekonto](../../src/data/articles/etf/bedste-etf-til-aktiesparekonto.mdx) | Dokumentér konkrete kandidaters klassifikation og kontoberettigelse samt udbyderens udbud. Forklar § 5/§ 19 B-forbindelsen; ingen antydning af, at positivlisten er irrelevant. Skeln løbende produktomkostning fra handelspris. |
| E3 · [Bedste emerging markets ETF](../../src/data/articles/etf/bedste-emerging-markets-etf.mdx) | Underbyg konkrete indekser/produkter, lande, størrelsessegmenter og datadatoer. Vis overlap med globale fonde og koncentrationsrisiko. Økonomisk vækst må ikke omskrives til forventet aktieafkast. |
| E4 · [Skats positivliste](../../src/data/articles/etf/skats-positivliste.mdx) | Vis en reproducerbar kontrol med ISIN, listeversion og indkomstår. Et eksempel kræver faktisk opslag i filen. Adskil aktie-/kapitalindkomst fra lager-/realisationsprincip og forklar ASK-forbindelsen. |
| S1 · [Lagerbeskatning vs. realisationsbeskatning](../../src/data/articles/skat/lagerbeskatning-vs-realisationsbeskatning.mdx) | Vis gevinst og efterfølgende tab med samme antagelser. Adskil tidspunkt, skattekategori og kontotype; udbytter og tab følger ikke automatisk den forenklede salgsforklaring. |
| S2 · [Aktieindkomst og progressionsgrænsen](../../src/data/articles/skat/aktieindkomst-og-progressionsgraense.mdx) | Angiv 2026-tal og ægtefællebetingelser samt et kontrolleret regneeksempel, der krydser grænsen. En henvisning til “årets tal” erstatter ikke svaret på artiklens spørgsmål. |
| S3 · [Fradrag for aktietab](../../src/data/articles/skat/fradrag-for-aktietab.mdx) | Vis konkret modregning/fremførsel og indberetningsbetingelser. Skeln aktier optaget til handel, unoterede aktier, fonde, ASK og pension. Gør fristen og depotets betydning tydelig. |

## Særskilt kontrol af den renderede side

Disse kontroller er **ikke udført** i researchopgaven. Den ansvarlige for UI/integration skal registrere URL, miljø, skærmbredde, metode og resultat for de berørte sider. Tjek både indledningen, længere nede på siden og eventuelle tabeller.

- [ ] **HTTP/HTML:** Den tilsigtede artikel svarer korrekt; titel, beskrivelse, canonical og Article-JSON-LD matcher sidens indhold, forfatter og datoer. Interne links og fragmenter rammer rigtige mål. En bestået kildekodetest erstatter ikke dette. [G-title] [G-dates] [G-schema]
- [ ] **Reflow:** Ved 320 CSS-pixels og relevant zoom er brødtekst og lange danske overskrifter læsbare uden tab eller vandret rulning i almindelig tekst. En nødvendig todimensionel datatabel kan have egen vandret rulning. **Dokumenteret standard:** WCAG 1.4.10, AA. Kontrol ved fx 390, 768 og 1280 pixels er supplerende **praksis**. [W-reflow]
- [ ] **Tekstafstand:** Intet indhold eller funktion går tabt ved brugerens samtidige tilsidesættelse til linjeafstand 1,5, afsnitsafstand 2 em, bogstavafstand 0,12 em og ordafstand 0,16 em. Det er en tilpasningskontrol, ikke et krav om disse standardværdier i designet. **Dokumenteret standard:** WCAG 1.4.12, AA. [W-spacing]
- [ ] **Læsbarhed:** Tekstbredde, linjeafstand og afsnit giver et roligt læseforløb på mobil og desktop. Undgå fuldjusteret brødtekst. **Praksis** med inspiration fra WCAG 1.4.8: kriteriets mekanisme for bl.a. højst 80 tegn og tilpasning af tekstvisning er **AAA**, ikke et AA- eller Googlekrav. [W-visual]
- [ ] **Kontrast og tastatur:** Kontrollér tekstkontrast i lys/mørk tilstand: normalt mindst 4,5:1, stor tekst mindst 3:1 efter kriteriets definition. Tab gennem kilder, relaterede links og indholdsfortegnelse med synligt fokus. **Dokumenterede standarder:** WCAG 1.4.3 og 2.4.7, AA. [W-contrast] [W-focus]
- [ ] **Semantik:** Overskrifter beskriver afsnittet. Tabeller har forståelige kolonne-/rækkeoverskrifter, enheder og år; brug passende `<th>` og ved tvetydighed `scope`. “Kriterium” er bedre end en tom første kolonneoverskrift. [W-headings] [W-table]
- [ ] **Indholdsfortegnelse og indsættelser:** H2/H3 har unikke ankre, også med æ/ø/å. Link, valgt afsnit og sticky header fungerer sammen. Det direkte svar står før partnerannoncen; “Læs også” afbryder ikke en nødvendig forklaring. Kontrollér efter JavaScript-indsættelser og med scripts slået fra, at artiklen stadig kan læses. **Praksis**, begrundet i den læste lokale implementering.
- [ ] **Tillid i visningen:** Byline, dato, kilder og annoncemærkning er læselige. Et langt forfatterfelt eller en kampagne må ikke skjule svaret. Der må ikke opstå en opfundet ekspertgodkendelse i den fælles skabelon. **Praksis** med baggrund i [G-helpful] og [G-links].

## Grænser for denne research

- Search Console, Bing Webmaster Tools, søgevolumen, placeringer, CTR og en dansk SERP-sammenligning er ikke observeret. Artikelintentionerne ovenfor er redaktionelle vurderinger ud fra titel og indhold, ikke målte søgeordsfund. Ingen trafik- eller rankingeffekt er verificeret.
- Ingen fuld ISIN-kontrol i Skattestyrelsens regneark, fuld produkt-/pristest, individuel guldskatteklassifikation eller verifikation af personlig investeringserfaring er udført.
- Bings generelle Webmaster Guidelines-side gav kun en JavaScript-skal ved direkte læsning. Bing-anbefalingerne ovenfor bygger derfor på de faktisk læste Microsoft- og Bing-artikler, ikke på den tomme hjælpeside.
- Retsinformations HTML-side krævede JavaScript; loven blev i stedet læst som officiel PDF med markeringen “Gældende”. Google FAQ-dokumentationens flytning er kontrolleret mod den officielle ændringslog. Ingen browserkontrol, Rich Results Test, build eller automatiseret testkørsel er udført; der er kun tilføjet dokumentation.

## Kilder og læsedato

Alle eksterne henvisninger ovenfor er åbnet og relevante afsnit læst 2026-10-24. De linker til den konkrete side, ikke til søgeresultater. NN/G er egen historisk forskning; øvrige kilder er myndigheder, standardorganisationen eller den ansvarlige udbyder om eget produkt/egen tjeneste.

[G-helpful]: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
[G-spam]: https://developers.google.com/search/docs/essentials/spam-policies
[G-ai]: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
[G-title]: https://developers.google.com/search/docs/appearance/title-link
[G-snippet]: https://developers.google.com/search/docs/appearance/snippet
[G-starter]: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
[G-links]: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
[G-dates]: https://developers.google.com/search/docs/appearance/publication-dates
[G-article]: https://developers.google.com/search/docs/appearance/structured-data/article
[G-schema]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
[G-updates]: https://developers.google.com/search/updates
[G-reviews]: https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews
[MS-content]: https://about.ads.microsoft.com/en/blog/post/october-2025/optimizing-your-content-for-inclusion-in-ai-search-answers
[B-ai]: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
[N-reading]: https://www.nngroup.com/articles/how-users-read-on-the-web/
[W-headings]: https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html
[W-reflow]: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
[W-spacing]: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
[W-visual]: https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html
[W-contrast]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
[W-focus]: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
[W-table]: https://www.w3.org/WAI/tutorials/tables/one-header/
[DK-aktier]: https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-aktier
[DK-ask]: https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto
[DK-fonde]: https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-investeringsbeviser-udstedt-af-investeringsforeninger-og-investeringsselskaber
[DK-liste]: https://skat.dk/erhverv/ekapital/vaerdipapirer/beviser-og-aktier-i-investeringsforeninger-og-selskaber-ifpa
[DK-lov]: https://www.retsinformation.dk/api/pdf/248332
[DK-bolig]: https://www.borger.dk/bolig-og-flytning/ejerbolig/bolighandel/koeb-af-ejerbolig
[P-kid]: https://www.blackrock.com/gls-download/literature/kiid/eu_priips-ishares-core-msci-world-ucits-etf-ch-ie00b4l5y983-en.pdf
[P-fakta]: https://www.blackrock.com/gls-download/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-dk.pdf
[P-guld]: https://www.ishares.com/uk/individual/en/products/258441/ishares-physical-gold-etc-fund
[P-em]: https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2
[B-nordnet]: https://www.nordnet.dk/kundeservice/prisliste/kurtageklasser
[B-saxo]: https://www.home.saxo/da-dk/rates-and-conditions/pricing-overview
[B-monthly]: https://www.home.saxo/da-dk/products/autoinvest
