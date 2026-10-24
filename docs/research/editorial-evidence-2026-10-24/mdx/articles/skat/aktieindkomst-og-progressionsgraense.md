# Evidens: Aktieindkomst og progressionsgrænsen

## Afgrænsning og status

- Stabilt side-ID: `mdx:articles/skat/aktieindkomst-og-progressionsgraense`.
- Implementeringsreference: `pilot-share-tax-implement-r1.md`. Intet T3-task-ID er oplyst i opgavefilen. Ingen videre delegation er udført.
- Brødtekst: `src/data/articles/skat/aktieindkomst-og-progressionsgraense.mdx`.
- URL til leadens kontrol: <https://kasperinvest.dk/skat/aktieindkomst-og-progressionsgraense/>. Lokal rute: `/skat/aktieindkomst-og-progressionsgraense/`.
- Læseropgave: Beregn skat af almindelig aktieindkomst i **indkomståret 2026**, og forstå ægtefællegrænsen, udbytteskat og de vigtigste afgrænsninger.
- Målgruppe: Danske private investorer, fuldt skattepligtige til Danmark, med frie midler. ASK og almindelige pensionsordninger forklares som særskilte skattesystemer. Ingen individuel vurdering af fraflytning, begrænset skattepligt, konkrete ETF'er eller særlige pensionsordninger.
- **Implementering:** FÆRDIG for den tildelte body-/evidensfase. Kun de to tildelte filer er skrevet af denne implementer.
- **Metadata/FAQ-integration:** PENDING. Registret er læst, men ikke ændret. Det præcise forslag står nedenfor.
- **Uafhængig faglig og redaktionel review:** PENDING. Intet review eller personlig godkendelse fra Kasper påstås.
- **Sidens HTTP/HTML og canonical/schema:** PENDING hos leaden. Åbning af offentlige kilder er ikke en HTTP-test af artiklen.
- **Direkte visuel kontrol og kontrol af skabelonen:** PENDING hos leaden. Ingen browser eller devserver er startet.

## Grundlag og oprindeligt øjebliksbillede

Hele den accepterede `MERGED_PLAN.md`, hele `docs/research/article-quality-standard-2026-10-24.md` og denne sides inventarpost er læst før redigering. SEO-skillsenes redaktionelle vejledning er anvendt som praksis; der er ingen påstand om en målt søgeeffekt. Ingen OpenWiki-generering er udført.

Oprindelig body-SHA-256: `fdb786c90949aeb91b928d6cf24ecf318e7a8643bdbdd2873806f0c6c8a7a0f4`. Den var identisk med inventarets hash og havde ingen lokal diff ved start. Der var derfor ingen nye rettelser i denne body at flette fra andre skribenter. Checkoutet havde andre ændringer i bl.a. `convex/**`, `scripts/**`, `README.md`, `package.json` og `docs/`; disse er bevaret.

Body efter denne fase, SHA-256: `83fa22ba5085a50b0c0d2684e46842582b1f1257e4f9c8ffa93ba9a584908b43`. Dette er implementeringens afleveringshash, **ikke** en reviewgodkendt hash.

Metadataregister: `src/data/articles.ts`, variabel `articles`.

Præcis nøgle og selector:

```js
articles.find(record => record.section === "skat" && record.id === "aktieindkomst-og-progressionsgraense")
```

- Registerfilens SHA-256 ved start og efter bodyændringen: `0a015a72fcaa026e8b0346768dbeb6a11e5cb2ba36cd12b9c84764cb2923b3d2`.
- Den præcise TS-records SHA-256: `23c07e38f9a9928a9ee3ed8c488219379e0f1f2e701d7d2acccef2c1306168e4`. Metode: TypeScripts `ObjectLiteralExpression.getText(sourceFile)`, fra `{` til `}`, UTF-8, uden foranstillet indrykning eller afsluttende komma.
- Recordens JSON-SHA-256: `407250e570edd8f658e935fdce988ad953b0927861071f05209abeb0371764dd`. Metode: `SHA256(JSON.stringify(record))`, med nedenstående feltrækkefølge, UTF-8, uden whitespace eller afsluttende linjeskift.

Eksakt oprindelig record, også sammenholdt med inventaret:

```json
{
  "id": "aktieindkomst-og-progressionsgraense",
  "section": "skat",
  "title": "Aktieindkomst og progressionsgrænsen",
  "seoTitle": "Aktieindkomst og progressionsgrænse forklaret",
  "description": "Forstå hvad der tæller som aktieindkomst, hvordan progressionsgrænsen bruges, og hvorfor årets officielle satser altid skal kontrolleres.",
  "publishedAt": "2026-07-16",
  "updatedAt": "2026-07-16",
  "related": [
    {
      "title": "Skat af aktier",
      "description": "Beregn og forstå aktieskat.",
      "href": "/skat-af-aktier"
    },
    {
      "title": "Fradrag for aktietab",
      "description": "Se hvordan tab modregnes.",
      "href": "/skat/fradrag-for-aktietab"
    },
    {
      "title": "Frie midler",
      "description": "Forstå investering uden pensionsbinding.",
      "href": "/ordbog/frie-midler"
    }
  ]
}
```

Publicering er ifølge inventaret `loader_exposed`, ikke en observeret liveudgivelse. `publishedAt` og `updatedAt` er fortsat `2026-07-16` i registret. Der er ingen draft- eller planlægningsfelter i denne record og intet FAQ-felt i `Article`-typen eller recorden. URL, ID, sektion, rækkefølge og publiceringslogik er bevaret.

Relevante delte kilder blev kun læst. Deres SHA-256 ved inspektionen:

| Kilde | SHA-256 |
| --- | --- |
| `src/components/ArticlePage.astro` | `7e21a6c4928ce00929d77cb949cdd80043b4be0c075bacdc9b488cd92650c3c6` |
| `src/components/Prose.astro` | `14ff971310e58bed7ed3f313e362542be8df006f7360a0a9d03f33be6613017b` |
| `src/components/AuthorBox.astro` | `cd1bc8c11f89ea73c39dc114a4659afd220bca78dbc373be9782ab66c7a1a355` |
| `src/pages/sitemap.xml.ts` | `a3d0ba8800201b7fde954bc8f1d009a6fe2f519fdd91c42800b1e70255f9645b` |

## Åbnede primærkilder

Alle nedenstående afsnit er åbnet og læst selvstændigt **2026-10-24** før ændring af brødteksten. Søgeresultater og den leverede research blev kun brugt til at finde kilderne. Skat.dk-siderne viste ingen særskilt publicerings-/ændringsdato i de læste afsnit; de behandles som løbende vejledning tilgået på denne dato. De er ikke dateret med søgemaskinens crawl- eller standarddato.

| ID | Præcis URL og læste afsnit | Version og anvendelsesår |
| --- | --- | --- |
| S1 | [Skat af aktier](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-aktier): »Skattesatser for gevinster og udbytte (aktieindkomst)«, »Hvis du er gift«, »Sådan opgør du gevinst og tab«, »Tab på aktier, der er optaget til handel«, »Tab på aktier, der ikke er optaget til handel« samt oplysninger om udbytte og udenlandske depoter. | Løbende vejledning; satsafsnittet angiver udtrykkeligt **2026**. Tabellen nedenfor bruger ikke sidens 2025-tal. |
| S2 | [Skat af investeringsbeviser](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-investeringsbeviser-udstedt-af-investeringsforeninger-og-investeringsselskaber): rubrikkerne 38/345 og 422/375, »Investeringsbeviser i en investeringsforening«, »Aktier/beviser i investeringsselskaber« og »Liste over aktiebaserede investeringsselskaber«. | Løbende vejledning læst 2026-10-24; anvendt på almindelig produktklassifikation og opgørelse i 2026. Ingen konkret ISIN eller listepost er kontrolleret eller anbefalet. |
| S3 | [Aktiesparekonto](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto): »Beskatning«. | Løbende vejledning læst 2026-10-24; 17 %, lagerprincip og særskilt afregning, anvendt for 2026. Intet indskudsloft bruges i artiklen. |
| S4 | [Skat af pensionsafkast](https://skat.dk/borger/pension-og-efterloen/skat-af-pensionsafkast): indledning, »Hvem skal betale skat af pensionsafkast?« og afsnit om negativ skat. | Løbende vejledning læst 2026-10-24; 15,3 % PAL-skat. Afgrænset til almindelige PAL-omfattede ordninger og afkast under opsparing. Ingen regel om udbetalingsskat udledes af satsen. |
| S5 | [Indberet og betal udbytte og udbytteskat](https://skat.dk/erhverv/selskaber-fonde-og-foreninger/selskaber-og-fonde/indberet-og-betal-udbytte-og-udbytteskat): »Hovedregler for indeholdelsesprocent for udbyttemodtagere« → »Satser for personer, der er hjemmehørende i Danmark«. | Løbende vejledning læst 2026-10-24; hovedregel 27 %. Afgrænset til danske selskabers almindelige udbytte til danske privatpersoner, ikke udenlandsk kildeskat eller pensionsundtagelser. |
| S6 | [Den juridiske vejledning A.B.4.1.4.1.3, Betaling af udbytteskat](https://info.skat.dk/data.aspx?oid=2169095): »Modregning«. | **Den juridiske vejledning 2026-2**, versionsbetegnelsen læst på selve siden via offentlig `curl`. Afsnittet henviser til KSL § 60, stk. 1, litra d, og § 67, stk. 1. Læst 2026-10-24. Indeholder også undtagelsen, hvor indeholdelsen er endelig betaling efter PSL § 8 a, stk. 1. |

S6 er vejledningens aktuelle beskrivelse, ikke en selvstændig ny lovfortolkning. Den almindelige indeholdelsesregel er desuden kontrolleret direkte i S5. Artiklen generaliserer ikke eksemplets modregning til enhver udbyttemodtager eller udenlandsk skat.

## Påstandslog

Hver række nedenfor har adgangsdato **2026-10-24**, skatteår **2026** og den præcise kilde/version ovenfor, medmindre rækken udtrykkeligt er et hypotetisk regnestykke eller et redaktionelt valg. Placeringer henviser til den nye body og de keyed metadataforslag nedenfor. Citater identificerer egne tekststeder; myndighedsteksten er gengivet med egne ord.

| ID og placering | Præcis påstand eller løfte | Kilde og konkret afsnit | Vurdering, forbehold og handling |
| --- | --- | --- | --- |
| B1 · indledning; M1–M2 | »2026 … 27 % af de første 79.400 kr. … 42 % af resten«; årets progressionsgrænse. | S1, »Skattesatser for gevinster og udbytte (aktieindkomst)«. | **Bekræftet.** Tilføjet det manglende svar. Kun overskydende indkomst får 42 %, ikke hele indkomsten. |
| B2 · indledning og ægtefælleafsnit | »158.800 kr. for jeres samlede aktieindkomst« ved ægteskab og samliv ved årets udgang. | S1, »Hvis du er gift«. | **Bekræftet.** Betingelsen er synlig begge steder. Uudnyttet grænse kan bruges af den anden ægtefælle; ugifte samlevende omfattes ikke af denne ægtefælleregel. Ikke anvendt på ASK-loft. |
| B3 · indledning og »Hvad tæller …?« | Grænsen gælder indkomst, ikke depotværdi eller hele salgsprovenuet; gevinsten er det relevante beløb ved almindeligt aktiesalg. | S1, »Sådan opgør du gevinst og tab« og satsafsnittet. | **Bekræftet.** Afgrænset til almindelige skattepligtige aktier. Der påstås ikke, at alle historiske aktiebeholdninger er skattepligtige; S1 beskriver også overgangsregler. |
| B4 · »Hvad tæller …?« | Aktieudbytter og skattepligtige salgsgevinster indgår; udbyttet medregnes før indeholdt skat. | S1, indledning og satsafsnit; S5, indberetning af bruttoudbytte og indeholdelsesprocent; S6, »Modregning«. | **Bekræftet.** Bruttoudbyttet bruges som input, mens indeholdelsen behandles særskilt. |
| B5 · »Hvad tæller …?« | Visse fonde/ETF'er giver aktieindkomst; aktiebaserede investeringsselskaber bruger lagerprincip, herunder urealiserede ændringer; andre produkter giver kapitalindkomst. | S2, rubrikker 345/375 over for 38/422 og »Aktier/beviser i investeringsselskaber«. | **Bekræftet.** Bevarer og præciserer den oprindelige produktnuance. Ingen slutning om skat ud fra navnet ETF, ingen verificeret konkret positivlistepost. |
| B6 · regneeksemplets input | Ugift person; 20.000 kr. dansk bruttoudbytte + 80.000 kr. skattepligtig salgsgevinst efter omkostninger; ingen tab eller anden aktieindkomst = 100.000 kr. | Egen aritmetik; skattebehandling i S1. | **Bekræftet som hypotetisk eksempel**, ikke observerede investoroplysninger. Fuldt dansk skattepligtig er angivet i sidens scope. Ingen antaget afkastprocent eller pris. |
| B7 · tabellens første række | 79.400 kr. × 27 % = 21.438 kr. | S1, 2026-satsen; beregning A nedenfor. | **Bekræftet.** Eksakt kronebeløb; ingen afrunding. |
| B8 · tabellens anden række | 100.000 − 79.400 = 20.600 kr.; 20.600 kr. × 42 % = 8.652 kr. | S1, 2026-satsen; beregning A. | **Bekræftet.** Kun delen over grænsen indgår her. |
| B9 · tabeltotal og efterfølgende afsnit | Skat i eksemplet: 30.090 kr.; krydsning af grænsen gør ikke hele indkomsten skattepligtig med 42 %. | S1, satsafsnittets todeling; beregning A. | **Bekræftet.** Totalen er før fradrag af allerede indeholdt skat. Tabellen er ikke en produktsammenligning. |
| B10 · ægtefælleeksempel | 100.000 kr. hos den ene, 0 kr. hos den anden → 27.000 kr. skat, når betingelserne er opfyldt. | S1, »Hvis du er gift«; beregning B. | **Bekræftet som hypotetisk eksempel.** Samliv ved årets udgang, ingen tab eller anden aktieindkomst. Ikke en påstand om alle ægtefællers skat. |
| B11 · »Indeholdt udbytteskat …« | Danske selskaber indeholder normalt 27 % på almindeligt udbytte til privatpersoner i Danmark. | S5, »Satser for personer, der er hjemmehørende i Danmark«. | **Bekræftet.** »Normalt« bevarer undtagelser. Satsen bruges ikke som generel udenlandsk kildeskattesats. |
| B12 · udbytteeksempel | 20.000 × 27 % = 5.400 kr.; beløbet er indeholdt i de 30.090 kr., så 24.690 kr. mangler, hvis ingen anden skat af aktieindkomsten er betalt. | S6, »Modregning«; beregning C. | **Bekræftet for eksemplet.** Det er en beregnet rest af aktieskatten, ikke et løfte om personens samlede restskat på årsopgørelsen. S6's undtagelse for endelig indeholdelse er ikke gjort til en generel forudbetalingspåstand. |
| B13 · tabsafsnit | Tab på aktier optaget til handel kan modregnes i bestemte aktieudbytter og aktiegevinster; ikke direkte i løn. | S1, »Tab på aktier, der er optaget til handel«. | **Bekræftet.** Den kildeartsbegrænsede modregning er bevidst snævrere end »alle tab reducerer al indkomst«. Den fulde tabsguide er bevaret som link. |
| B14 · tabsafsnit | Uudnyttet tab kan fremføres; modregning hos ægtefælle kan komme først. | S1, samme tabsafsnit, afsnittene om ægtefælle og efterfølgende år. | **Bekræftet.** Kilden betinger ægtefællemodregning af samliv; formuleringen »kan« lover ikke modregning for alle gifte. Oplysningsbetingelserne følger straks efter. |
| B15 · tabsafsnit | Købet skal være rettidigt oplyst; fremførsel kræver, at tabet er oplyst eller beregnet inden oplysningsfristen. | S1, »Du skal sikre dig, at Skattestyrelsen modtager oplysninger om købet« og »Tab på aktier, der er optaget til handel«. | **Bekræftet.** Købsoplysning og tabsoplysning er to krav. Kilden siger senest 1. juli året efter købet med weekendregel; en konkret kalenderfrist udledes ikke i denne artikel. Henvisningen til tabsvejledningen bevares. |
| B16 · tabsafsnit | Ikke-handelsoptagne aktier og forskellige investeringsbeviser kan have andre tabsregler. | S1, »Tab på aktier, der ikke er optaget til handel«; S2, undtagelserne for investeringsbeviser. | **Bekræftet.** Ingen påstand om, at alle tabsgrupper kan blandes. S1 beskriver skatteværdi mod øvrige skatter ved negativ aktieindkomst for visse ikke-handelsoptagne aktier samt særreglen for tidligere handelsoptagne aktier; dette er ikke omskrevet til et direkte lønfradrag. |
| B17 · »Hvad holdes udenfor …?«, ASK | 17 % lagerbeskatning; kontogevinst/-tab indgår ikke i almindelig aktieindkomst. | S3, »Beskatning«. | **Bekræftet.** Kontoens separate skatteopgørelse forklares. Ingen påstand om, at ASK-tab kan flyttes til et almindeligt depot. |
| B18 · samme afsnit, pension | Afkast på almindelige pensionsordninger beskattes som udgangspunkt med 15,3 % PAL-skat; det er afkastbeskatning, ikke skat ved udbetaling. | S4, indledning og »Hvem skal betale skat af pensionsafkast?«. | **Bekræftet og afgrænset.** Ingen udlægning af alle ordningstyper eller undtagelser for udenlandske kunder. Ingen påstand om skattefri pensionsudbetaling. |
| B19 · samme afsnit, kapitalindkomst | Fx obligationsbaserede investeringsselskaber giver kapitalindkomst, som ikke bruger aktieindkomstens grænse; ETF-navnet afgør ikke dette. | S2, rubrikker 38/422 og sondringen til 345/375; S1, aktieindkomstens satser. | **Bekræftet.** Skattekategori og opgørelsesprincip er to forskellige spørgsmål. |
| B20 · sidste afsnit | Salg bestemmer indkomståret for realisationsbeskattede aktiegevinster; lageropgørelse sker årligt, også uden salg. | S1, »Du har solgt dine aktier med gevinst«; S2, »Aktier/beviser i investeringsselskaber«. | **Bekræftet.** Udbytter er forklaret særskilt; formuleringen begrænser ikke al beskatning til et salg. Oprindeligt internt link er bevaret. |
| B21 · sidste sætning | Vurder risiko, spredning og omkostninger, før du handler alene for at udnytte en skattegrænse. | Redaktionelt forsigtighedsvalg; ingen empirisk eller regulatorisk påstand. | **Bevidst bevaret vurdering.** Lover ingen skattebesparelse, bestemt risiko eller afkast. |
| M1 · ny `seoTitle` | »Aktieindkomst 2026: satser og progressionsgrænse«. | S1 og B1–B2; sidens faktiske dækning. | **Bekræftet løfte.** Den aktuelle body leverer årets satser og grænse. Ingen rankingpåstand eller universel tegnlængderegel. |
| M2 · ny `description` | »I 2026 er skatten 27 % op til 79.400 kr. og 42 % derover. Se regneeksempel, ægtefælleregler, udbytteskat og tabsmodregning.« | S1, S5–S6 og B6–B15. | **Bekræftet løfte.** Beskriver basegrænsen for én person og de faktisk tilføjede afsnit. Ægtefællebetingelsen forklares i body. |
| M3 · eksisterende titel/SEO-beskrivelse og related | Eksisterende titel og søgetitel lover forklaring af aktieindkomst/grænse. Den gamle beskrivelse lover klassifikation og kontrol af satser; relaterede kort peger til aktieskat, tab og frie midler. | Ovenstående record og læste registre `articles.ts`, `lessons.ts`, `glossary.ts`; S1–S2 for reglernes emner. | **Bekræftet som navigations-/dækningsløfter.** H1, recordtitel og related bevares. Den nye beskrivelse erstatter opfordringen til kun at kontrollere satser med et konkret svar. Kortene tilhører ikke en ny produktsammenligning. |
| M4 · datofelter | `publishedAt` bevares; `updatedAt` foreslås ændret til den faktiske dato for den substantielle bodyændring. | Filens record, denne revision og kalenderdato 2026-10-24. | **Begrundet forslag.** Oprindelig historik omskrives ikke. Ingen personlig Kasper-kontrol tilskrives denne dato. |
| F1 · FAQ | Ingen eksisterende FAQ og intet FAQ-felt i denne artikels record/type; intet FAQ-forslag. | `src/data/articles.ts` og `ArticlePage.astro`, læst direkte. | **Ikke relevant.** Der er ingen skjulte FAQ-påstande eller nye FAQ-/rich-resultløfter i dette forslag. |

Ingen tilbageværende uafklaret beslutningsbærende bodypåstand er identificeret af implementeren. Dette erstatter ikke den særskilte reviewers vurdering.

## Uafhængig kontrol af regnestykker

Et separat Node-script med assertions er kørt efter redigeringen. Alle beløb er i DKK; satser er fra S1/S5. Der er ingen afrunding i eksemplerne.

| Beregning | Input og formel | Kontrolleret resultat |
| --- | --- | --- |
| A · Ugift, almindeligt depot, 2026 | Aktieindkomst = 20.000 + 80.000. Skat = 79.400 × 27 / 100 + (100.000 − 79.400) × 42 / 100. | 100.000 kr. indkomst; 21.438 + 8.652 = **30.090 kr. skat**. |
| B · Ægtefæller med opfyldt samlivsbetingelse | Grænse = 2 × 79.400. Samlet indkomst = 100.000 + 0. Skat = 100.000 × 27 / 100. | Grænse **158.800 kr.**; skat **27.000 kr.** |
| C · Allerede indeholdt skat i A | Udbytteskat = 20.000 × 27 / 100. Manglende betaling = 30.090 − 5.400. | **5.400 kr. indeholdt**, **24.690 kr.** tilbage, når ingen anden skat af aktieindkomsten er betalt. |

De 80.000 kr. er en antaget skattepligtig gevinst efter handelsomkostninger, ikke en kursgevinst beregnet ud fra opdigtede priser. Der er ingen tab fra året eller tidligere år og ingen anden aktieindkomst. Ingen udenlandsk lempelse, ændring af risikoniveau, fremtidig gevinst eller automatisk skattebesparelse er forudsat.

## Ændringer og bevidst bevaret indhold

- Det abstrakte svar om »årets tal« er erstattet med de kontrollerede 2026-tal og ægtefællebetingelsen.
- Et regneeksempel krydser grænsen. Tabellen viser år, kroner og procent med tre ikke-tomme kolonneoverskrifter. Ægtefælleeksemplet gør den ekstra grænse konkret.
- Bruttoaktieindkomst, indeholdt udbytteskat og beregnet samlet skat er adskilt. Dermed fremstår 27 % indeholdelse ikke som en ubetinget endelig skattesats.
- Tabsafsnittet skelner mellem modregningsgrupper, fremførsel og oplysningskrav. ASK, pension og kapitalindkomst holdes uden for den almindelige grænse.
- Den oprindelige H1, URL og alle tre relevante kontekstlinks er bevaret. Produktklassifikation, lager-/realisationssondring og hensynet til risiko/omkostninger er bevaret og præciseret.
- Ingen generisk indledning, rangliste, testvinder, opdigtet erfaring, personlig godkendelse eller gentaget konklusion er tilføjet. Der er ingen målordlængde; eksisterende gates er uændrede.

## Eksakt forslag til seriel metadata- og FAQ-integration

**Må ikke anvendes som automatisk erstatning af hele registerfilen.** Integratoren skal genlæse den præcise record og kontrollere de gamle værdier. Andre records og andre skribenters ændringer bevares.

```json
{
  "registry": "src/data/articles.ts",
  "variable": "articles",
  "record_key": {
    "section": "skat",
    "id": "aktieindkomst-og-progressionsgraense"
  },
  "expected_record_json_sha256": "407250e570edd8f658e935fdce988ad953b0927861071f05209abeb0371764dd",
  "changes": {
    "seoTitle": {
      "old": "Aktieindkomst og progressionsgrænse forklaret",
      "new": "Aktieindkomst 2026: satser og progressionsgrænse"
    },
    "description": {
      "old": "Forstå hvad der tæller som aktieindkomst, hvordan progressionsgrænsen bruges, og hvorfor årets officielle satser altid skal kontrolleres.",
      "new": "I 2026 er skatten 27 % op til 79.400 kr. og 42 % derover. Se regneeksempel, ægtefælleregler, udbytteskat og tabsmodregning."
    },
    "updatedAt": {
      "old": "2026-07-16",
      "new": "2026-10-24"
    }
  },
  "preserve": {
    "id": "aktieindkomst-og-progressionsgraense",
    "section": "skat",
    "title": "Aktieindkomst og progressionsgrænsen",
    "publishedAt": "2026-07-16",
    "related": "unchanged: exact array in original record snapshot above"
  },
  "faq_proposal": {
    "old_field_present": false,
    "new_field_present": false,
    "changes": []
  }
}
```

Begrundelse: Den nye søgetitel og beskrivelse lover de konkrete svar, body nu giver. Den foreslåede `updatedAt` skyldes de substantielle tilføjelser om årets skattesatser, beregning, indeholdelse, tabsbetingelser og kontoafgrænsning, ikke kosmetisk friskhed. **`publishedAt: 2026-07-16` bevares.**

Den læste renderer bruger `article.updatedAt` både i `AuthorBox` og i Article-JSON-LD's `dateModified`; sitemap bruger samme værdi som `lastmod`. Integratoren skal sikre samme reelle ændringsdato i alle tre flader. Den delte byline siger stadig »Skrevet og redigeret af Kasper Stuck« og »Senest opdateret og kontrolleret«. Denne agentrevision dokumenterer ikke Kasper-personlig gennemgang. Det er en fælles redaktionel afhængighed, som leaden skal håndtere i sit ejede scope. Denne fase ændrer ikke delte komponenter.

## Udført verifikation

Miljø: aktuelt fælles checkout, Node **v24.22.1**, installeret Vitest **4.1.11**, Astro **7.3.3**, MDX **8.0.1**, TypeScript **5.9.3**, læst fra installerede `package.json`-filer. Ingen pakker er installeret. Bun-forskellen i planen er ikke ændret eller genmålt i denne fase.

| Kommando/metode | Forventet exit | Observeret resultat |
| --- | --- | --- |
| `node_modules/.bin/vitest run src/data/articles.test.ts src/data/seo-quality.test.ts src/data/internal-links.test.ts` før bodyændring | 0 | **0**, 3 filer og 7 tests bestod; baseline. |
| Samme fokuserede Vitest-kommando efter bodyændring | 0 | **0**, 3 filer og 7 tests bestod. |
| `git diff --check -- src/data/articles/skat/aktieindkomst-og-progressionsgraense.mdx` | 0 | **0**, ingen whitespacefejl. |
| `node --input-type=module`, read-only script via stdin: indlæs det faktiske artikelregister med installeret TypeScript, slå bodylinks op, kontrollér målfilernes eksistens og assert regnestykkerne | 0 | **0**, alle 3 bodylinks har præcis section/id-record og eksisterende MDX-mål; A–C består. Én H1. `publishedAt`/`updatedAt` er uændrede i registeret. Foreslået SEO-titel er unik mod det læste register. |
| Udtræk evidensnotens to JSON-blokke via Node, validér med `jq -s -e` | 0 | **0**, `true`: gyldig JSON, korrekt recordnøgle, gamle forslag matcher snapshot, ny ændringsdato er 2026-10-24, publiceringsdato bevares og FAQ-forslaget er tomt. |

De tre bevarede kontekstlinks er verificeret mod faktiske records og filer:

| Link | Registerrecord og eksisterende body |
| --- | --- |
| `/etf/skats-positivliste` | `articles[section=etf, id=skats-positivliste]`; `src/data/articles/etf/skats-positivliste.mdx` |
| `/skat/fradrag-for-aktietab` | `articles[section=skat, id=fradrag-for-aktietab]`; `src/data/articles/skat/fradrag-for-aktietab.mdx` |
| `/skat/lagerbeskatning-vs-realisationsbeskatning` | `articles[section=skat, id=lagerbeskatning-vs-realisationsbeskatning]`; `src/data/articles/skat/lagerbeskatning-vs-realisationsbeskatning.mdx` |

Indgående opdagelse er kildeverificeret: `/skat/` bygger kort fra `getArticles("skat")`; de to øvrige skatteartiklers `related` i `articles.ts` linker til siden. Ingen ny indgående linkplacering er nødvendig. De uændrede related-mål `/skat-af-aktier` og `/ordbog/frie-midler` er også identificeret i deres faktiske `lessons.ts`-/`glossary.ts`-registre; de fælles registry/linktests består. Dette beviser ikke HTTP-status eller fragmentadfærd.

Den fulde bodydiff er læst. Evidensnoten er gennemgået som ny fil. Ingen build, fuld testsuite, lint, HTTP-crawl, browserkontrol eller produkt-/kontooperation er udført i denne fase.

## Supersederede forsøg og begrænsninger

- En tidlig læsekommando gættede fejlagtigt `src/pages/skat/[id].astro`; `cat` meldte, at filen ikke fandtes. Den rigtige `src/pages/skat/[slug].astro` blev derefter identificeret fra inventaret og læst. Det var en læsefejl, ingen fil blev ændret.
- En `rg`-søgning efter den fulde siderute i MDX/hubkoden gav ingen tekstmatch og exit 1. Årsagen er, at opdagelse her går via registerkort. Den faktiske hub og de relaterede registerrecords er efterfølgende læst; en manglende literal er ikke behandlet som et manglende link.
- Webværktøjet rapporterede `Blocked by robots.txt` for `info.skat.dk`; Retsinformations HTML gav kun `You need to enable JavaScript to run this app.`. Ingen af delene er brugt som faktabelæg. Den aktuelle offentlige S6-side blev i stedet læst med en afgrænset `curl`, exit 0, inklusive versionsbetegnelsen **2026-2** og afsnittet »Modregning«. Der påstås ikke fuld lovversionskontrol af Retsinformation.
- Ingen Search Console-, volumen-, placerings- eller CTR-data er observeret. Metadataforslaget er et redaktionelt valg, ikke en dokumenteret trafikløsning.

## Implementerens egenkontrol mod kvalitetsstandarden

Dette er egenkontrol af kilde og forslag, ikke uafhængig godkendelse af en renderet side.

| Kontrol | Status og grund |
| --- | --- |
| Hensigt | **Bestået for body/forslag.** Årets svar kommer først; title/description-forslag matcher indholdet. Faktiske metadata afventer integration. |
| Belæg | **Bestået i egenkontrol.** B1–B20 og M1–M4 har præcise primærkilder, år og forbehold; B21 er et angivet redaktionelt valg. Uafhængig review er PENDING. |
| Eksempel | **Bestået.** A krydser grænsen; B viser ægtefællereglen; C skelner indeholdelse fra samlet skat. Forudsætninger er synlige og tal er assert-kontrolleret. |
| Naturligt dansk | **Bestået i egenkontrol.** Direkte svar, forklaring af fagord, sammenhængende afsnit og intet gentaget konklusionsafsnit. |
| Selvstændig værdi | **Bestået i egenkontrol.** Gennemregnet skat og indeholdelse frem for blot en henvisning til årets tal. Ingen erfaring, kvalifikation, afkastgaranti eller rangliste er opfundet. |
| Navigation og ansvar | **Bestået på kilde-/forslagsniveau.** Tre bevarede bodylinks er verificeret. Datoændring er kun et begrundet forslag. HTTP, byline og samstemmende synlige/schema-/sitemapdatoer afventer leaden. |
| S2, sidens særlige krav | **Bestået for body.** 2026-satser, 79.400/158.800 kr., ægtefællernes samlivsbetingelse og grænsekrydsende eksempel er med. |
| Produktsammenligning og FAQ | **Ikke relevant.** Siden vælger ikke produkter, og artikelrecorden har ingen FAQ. Tabellen er kun et regneeksempel. |
| Renderet layout | **PENDING.** Ingen kildekodetest påstås at dokumentere reflow, kontrast, ankre, annoncers placering eller personlig forfatterkontrol. |

## Handoff til uafhængig reviewer og lead

Review bodyhashen ovenfor sammen med det præcise metadataforslag, alle påstande og kilder. Efter integration kræves review af de faktiske samlede body-/recordhashes; proposal-review er ikke slutgodkendelse.

Leaden skal kontrollere `/skat/aktieindkomst-og-progressionsgraense/` i den rigtige applikation og registrere miljø/revision:

1. HTTP-status, faktisk title/description, én H1, production-canonical, Article-JSON-LD og datoer efter metadata-integration.
2. Den nye tabel ved **320 CSS-pixels**, suppleret med mobil/desktop. De tre overskrifter indeholder emne/år, sats og kroner; især første kolonne kan give ombrydning. Bekræft, at eventuel vandret rulning er begrænset til tabellen.
3. TOC-ankre for bl.a. »Eksempel: Skat af 100.000 kr. i aktieindkomst i 2026«, »Hvordan bruges grænsen for ægtefæller?« og »Hvilke tab kan reducere aktieindkomsten?«. Tjek danske tegn, tal, sticky header og tastaturfokus.
4. Den fælles `Prose` flytter related-boksen før anden H2 og kan indsætte annonce før tredje H2. Bekræft, at svar og beregning kan læses i sammenhæng med og uden JavaScript. Dette er en kildebaseret layout-risiko, ikke en observeret fejl.
5. Lys/mørk tilstand, tekstafstand, kilde-/linkkontrast samt læsbar byline og reelle datoer. Ingen billedændring er nødvendig for den tildelte tekst.

Layoutstatus er fortsat **PENDING**, indtil disse scenarier er observeret. Afleveringen gælder alene denne sides body-/evidensfase.

## Seriel metadataintegration · 2026-10-24

**FÆRDIG for den afgrænsede integration.** Tidligere øjebliksbilleder, påstandslog og historiske statusangivelser ovenfor er bevaret. Denne sektion beskriver den efterfølgende integration.

Reviewerreferencen er `ki-seo-pilot-share-tax-review-sol-r1`, fuldt task-ID `node:delegated-task:command%3Amcp%3A22b22515-a516-476d-b5e8-1340011ce3d3%3Adelegate-task%3Aki-seo-pilot-share-tax-review-sol-r1`. Den afsluttede rapport i `shareReview-status.json` godkendte det præcise metadataforslag til integration. Godkendelsen er ikke slutgodkendelse af den samlede side.

Kun følgende tre felter er ændret i `articles[section=skat, id=aktieindkomst-og-progressionsgraense]`:

- `seoTitle`: `Aktieindkomst 2026: satser og progressionsgrænse`.
- `description`: `I 2026 er skatten 27 % op til 79.400 kr. og 42 % derover. Se regneeksempel, ægtefælleregler, udbytteskat og tabsmodregning.`
- `updatedAt`: `2026-10-24`, begrundet i den allerede dokumenterede substantielle bodyrevision.

Den oprindelige `publishedAt: 2026-07-16`, titel, ID, sektion, related og øvrige felter er uændrede. Ingen FAQ er tilføjet. Integratoren har ikke ændret artikelteksten, ruter eller publiceringslogik.

Installeret TypeScript **5.9.3** blev brugt til at finde den præcise objektliteral og erstatte kun de tre strengværdier. AST-aflæsning og serialisering før/efter viste præcis tre ændrede felter, identiske øvrige felter og identiske øvrige **11 af 12 records**. Kildeteksten uden for den ejede record er byteidentisk, og alle SEO-titler er fortsat unikke. Alle leverede før-hashes matchede; ingen konflikt skulle flettes.

Afleveringsidentiteter efter integration:

| Genstand | Endelig SHA-256 og metode |
| --- | --- |
| Præcis TS-record | `edd963cb2582639cc6369f80b76d16d2239bf417bea87fc36435b73fd57fb833` · `ObjectLiteralExpression.getText(sourceFile)`, UTF-8, fra `{` til `}`, uden foranstillet indrykning eller efterfølgende komma. |
| Kompakt record-JSON | `16e93523864bb4a2dc408b72eddf75f97f1f4e950f0da1fa996393b782559542` · SHA-256 af `JSON.stringify(record)` i kildens feltrækkefølge, UTF-8, uden afsluttende linjeskift. |
| Artikeltekst | `83fa22ba5085a50b0c0d2684e46842582b1f1257e4f9c8ffa93ba9a584908b43` · SHA-256 af filens rå bytes, identisk før/efter integration. |
| `src/data/articles.ts` | `5bbaa41a215598c4c25818f1f6c9893518385c8097ff213923a8a421e3724465` · SHA-256 af filens rå bytes. |

Datoforløbet er genlæst i den aktuelle kilde: `ArticlePage.astro:28` bruger `article.updatedAt` til Article-JSON-LD's `dateModified`, og linje 56 sender samme felt til `AuthorBox`. `AuthorBox.astro:7` formaterer datoen på dansk, og linje 26 bruger feltet i det synlige `<time>` og dets `datetime`. `sitemap.xml.ts:101`–102 sender `article.updatedAt` til sitemapregistreringen; linje 37–40 skriver værdien som `lastmod`. `ArticlePage.astro:27` bruger fortsat den uændrede `publishedAt` som `datePublished`. De tre delte filer havde fortsat deres ovenfor registrerede hashes ved kontrollen og er kun læst. Dette dokumenterer kildeforløbet; faktisk HTML og sitemaprespons er ikke observeret.

Verifikation i fælles checkout med Node **v24.22.1**, Vitest **4.1.11** og Biome **2.4.6**:

- `node_modules/.bin/vitest run src/data/articles.test.ts src/data/seo-quality.test.ts src/data/internal-links.test.ts`: exit **0** før og efter integration; **3 filer og 7 tests** bestod begge gange.
- `node_modules/.bin/biome check src/data/articles.ts`: exit **0** før og efter integration; ingen formateringsrettelse nødvendig.
- `git diff --check -- src/data/articles.ts`: exit **0**; ingen whitespacefejl. Den læste diff viser kun de tre godkendte feltværdier.
- `node --input-type=module` med AST-/hashkontrol via stdin: exit **0**; leverede før-hashes og forslag kontrolleret, præcis delta og bevaret artikeltekst verificeret, endelige hashes beregnet.

**OPEN:** Reviewfundet i `AuthorBox.astro:20` om »Skrevet og redigeret af Kasper Stuck« er uændret og uden for dette scope. Agentarbejdet dokumenterer ikke Kaspers personlige redigering, kontrol eller godkendelse.

**PENDING:** Frisk review af den samlede artikeltekst og integrerede record samt HTTP/HTML, canonical, schema, sitemaprespons og direkte visuel kontrol hos leaden. Ingen build, fuld testsuite, browser eller server er kørt i denne integrationsfase. Færdig integration betyder ikke endelig sidegodkendelse.
