# Evidens: Velkommen til kurset

## Afgrænsning og status

- Stabilt side-ID: `mdx:lessons/velkommen-og-fundament/velkommen-til-kurset`.
- Implementeringsrunde: `pilot-welcome-implement-r1`, jf. den tildelte prompt. Et faktisk T3-taskId er ikke oplyst og er derfor ukendt.
- Kildetekst: `src/data/lessons/velkommen-og-fundament/velkommen-til-kurset.mdx`.
- Metadataregister: `src/data/lessons.ts`, variabel `lessons`, modul-ID `velkommen-og-fundament`, record-ID `velkommen-til-kurset`.
- Selector: `lessons.find(module => module.id === "velkommen-og-fundament").lessons.find(record => record.id === "velkommen-til-kurset")`.
- Konkret URL til leadens kontrol: <https://kasperinvest.dk/velkommen-til-kurset/>. URL'en angiver den eksisterende rute; ændringerne er kun lokale.
- Læseropgave: En ny eller let øvet privat investor i Danmark skal forstå kursets forløb, pris, kommercielle relationer og grænser og kunne begynde med et mål og et budget.
- Familie/sprog: kursuslektion, dansk. Skatteoplysningerne i FAQ-forslaget gælder dansk ASK og almindelige aktiedepoter med de angivne betingelser. ASK-loftet gælder kalenderåret 2026. Dette er ikke en historisk valgside.
- Research og implementering: 2026-10-24. Den accepterede `MERGED_PLAN.md` og hele kvalitetsstandarden er læst før redigering. Ingen ny plan, delegation eller OpenWiki-generering er udført.
- Implementering: **COMPLETED for den afgrænsede body-/evidensfase** efter kontrollerne nedenfor.
- Metadata-/FAQ-integration: **PENDING**. Registeret er ikke redigeret.
- Uafhængig reviewrunde 1: **NEEDS FIXES**, afsluttet; rapport og reviewer-hashes er fastholdt i korrektionsloggen nedenfor. W1–W3 er rettet i forslaget. **Re-review og integration: PENDING**; ingen slutgodkendelse foreligger.
- HTTP/HTML for den ændrede lektion: **PENDING**, leadens opgave.
- Direkte visuel kontrol: **PENDING**, leadens opgave.
- Repræsentativ skabelonkontrol: **PENDING**. Der er kun læst kildekode. Ingen browser eller devserver er startet.

## Oprindeligt øjebliksbillede

Checkout: `/home/workstation/code/KasperStuck/kasperinvest.dk`, gren `main`, HEAD `6656523e02010c9a1546075f5803dd12e349a3bb` ved opgavestart.

Den oprindelige body-SHA-256 var `064c48a5c62c29fc2a317d5623695e001f7ca3c6a0adb1215b8bc103e09d4ae4`. Den stemte med inventory og blev kontrolleret igen før skrivning. Ingen body-ændring siden inventory skulle flettes ind. Arbejdstræet havde allerede ændringer i bl.a. `convex/**`, `scripts/**`, `README.md`, `package.json` og dokumentation. De er uden for ejerskabet og er bevaret.

Registerets oprindelige fil-SHA-256: `5611b153a0d21ad18ec71d123a763fcdbc00816adc7011ee0554fca4c8e7bf32`.

Den præcise record blev læst fra det faktiske register med `getModules()`. Record-SHA-256: `34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1`. Hashmetode: UTF-8 af `JSON.stringify(record, null, 2)`, uden afsluttende linjeskift og med registerets feltorden. Denne JSON er det præcise gamle metadata-/FAQ-øjebliksbillede:

```json
{
  "id": "velkommen-til-kurset",
  "title": "Velkommen til kurset",
  "description": "Sæt rammer, forventninger og risikodisclaimer.",
  "video": null,
  "faq": [
    {
      "question": "Kan man starte med at investere med kun 500 kr.?",
      "answer": "Ja, absolut. Mange danske platforme tilbyder løsninger som Månedsopsparing. Her kan du automatisk købe for mindre beløb hver måned uden at betale høje gebyrer hver gang."
    },
    {
      "question": "Hvad er en aktiesparekonto?",
      "answer": "En aktiesparekonto (ASK) er en særlig konto med en lav skattesats på kun 17%. I 2026 er indskudsloftet 174.200 kr. Kontoen er lagerbeskattet. Det betyder, at skatten afregnes årligt af din værditilvækst."
    },
    {
      "question": "Er dette kursus gratis?",
      "answer": "Indholdet her er stillet til rådighed som en del af Kasper Invests mission om at demokratisere viden. Målet er at give dig et fundament uden skjulte dagsordener."
    },
    {
      "question": "Hvilken platform anbefaler kurset?",
      "answer": "Jeg peger ikke på en vinder. Jeg bruger ofte Nordnet og Saxo Bank som eksempler. De er de mest populære for private investorer i Danmark."
    },
    {
      "question": "Behøver jeg en revisor til min aktieskat?",
      "answer": "For de fleste er svaret nej. Danske platforme indberetter automatisk dine handler til Skattestyrelsen. Du skal dog altid selv tjekke din årsopgørelse en ekstra gang."
    }
  ]
}
```

`seoTitle`, `publishedAt`, `updatedAt`, draftflag og udgivelsesplan findes ikke på denne record. Inventory angiver `loader_exposed`, ingen konfigurerede eller effektive datoer og ingen tidlig udgivelse. Ruten dannes fra lektions-ID'et. Ingen af disse forhold er ændret.

Relevante delte kilder blev alene læst. Deres SHA-256 ved kontrollen var:

| Kilde | SHA-256 |
| --- | --- |
| `src/pages/[slug].astro` | `4679966209466bc306242ad01de8ea0e54ec52b1389187acf365f58911104235` |
| `src/components/Prose.astro` | `14ff971310e58bed7ed3f313e362542be8df006f7360a0a9d03f33be6613017b` |
| `src/components/AuthorBox.astro` | `cd1bc8c11f89ea73c39dc114a4659afd220bca78dbc373be9782ab66c7a1a355` |
| `src/components/ArticleSchema.astro` | `837ae15b187c65cc001d16e94f642c9c8323053063e10e15ccd19fdbbd8760a8` |
| `src/pages/sitemap.xml.ts` | `a3d0ba8800201b7fde954bc8f1d009a6fe2f519fdd91c42800b1e70255f9645b` |
| `src/pages/affiliatepolitik.astro` | `be5e1cd98985607902c4fb30bb7fe4ed49e7b2eb716bd28d1fd2c90d38503ef7` |
| `src/pages/index.astro` | `f575eb6b0673d16b7ba8154e62ad2ec30e1382f4a4a55c3e3bf85ffd9081e586` |

## Selvstændigt læste primærkilder

Alle eksterne kilder nedenfor er hentet direkte med begrænset `curl` og relevante afsnit læst **2026-10-24**. HTML er til sidst udtrukket med den installerede `parse5`; en søgesnippet er ikke brugt som belæg. Ingen personlige konti eller provideroperationer er brugt.

| Nøgle | Præcis kilde og læst afsnit | Kildedato/version og anvendelsesår |
| --- | --- | --- |
| S1 | Skattestyrelsen: <https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto>. Afsnittene “Hvem kan oprette en aktiesparekonto?”, “Du må kun eje én aktiesparekonto”, “Hvor meget må du indskyde”, “Hvilke værdipapirer må indgå på aktiesparekontoen” og “Beskatning”. | Løbende vejledning; ingen særskilt versions-/udgivelsesdato identificeret. Tabellen angiver udtrykkeligt 174.200 kr. for 1. januar–31. december 2026. Betingelser og 17 % er læst i samme version. |
| S2 | Skattestyrelsen: <https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-aktier>. Indledningen; “Vi modtager oplysninger om købet, hvis aktierne er i et dansk depot”; “Du skal selv sende oplysninger om købet til os, hvis aktierne er i et depot i udlandet”; “Sådan oplyser du om gevinst og tab samt udbytte”, herunder danske/udenlandske depoter og aktier, der ikke er optaget til handel. | Løbende vejledning uden identificeret versionsdato. De anvendte indberetningsbetingelser er den vejledning, der var tilgængelig på læsedatoen. Der bruges ingen aktieindkomstsats herfra i lektionsforslaget. |
| S3 | Saxo: <https://www.home.saxo/da-dk/products/autoinvest>. FAQ: “Hvad koster det at investere via min Månedsopsparing?”, “Er der grænser for hvor meget eller hvor lidt, jeg kan investere hver måned?” og “Hvem kan oprette en Månedsopsparing?”; desuden “Mere information om Månedsopsparing” → “Ordreafvigelser og investeringsbeløb” samt risikoteksten ved beregneren. | Dansk produktside uden identificeret versionsdato. Produkt-/prisvilkår observeret 2026-10-24; ikke et løfte om fremtidige vilkår. |
| S4 | Saxo: <https://www.home.saxo/da-dk/legal/risk-warning/saxo-risk-warning>. “Generelle risici”, første afsnit, samt den afsluttende generelle risikotekst. | Dansk risikotekst uden identificeret versionsdato; læst 2026-10-24. Kun udsagnet om mulighed for tab anvendes. Kildens særskilte omtale af gearing overføres ikke til et almindeligt kontant aktiekøb. |
| S5 | Vanguard: <https://investor.vanguard.com/investor-resources-education/portfolio-management/rebalancing-your-portfolio>. “Why portfolio rebalancing may be important”, første afsnit, og “Rebalancing and portfolio risk management”. | Uddannelsesside uden identificeret udgivelsesdato; læst 2026-10-24. Bruges kun til definitionen af rebalancering. Amerikanske skatte-/pensionsregler og anbefalinger om frekvens anvendes ikke. |
| L1 | Faktiske lokale primærkilder: `src/data/lessons.ts` / `getModules()`, `src/pages/index.astro`, `src/pages/[slug].astro` og de linkede lektionsfiler. | Checkout/HEAD og hashes ovenfor, læst 2026-10-24. Understøtter forløbets indhold, otte moduler, næste lektion og kildekodens frie læseadgang; ikke gennemført HTTP-verifikation. |
| L2 | Sitets egne oplysninger: `src/pages/om.astro`, `src/pages/affiliatepolitik.astro`, `src/pages/redaktionel-metode.astro` samt annoncekoden i `src/components/Prose.astro`. | Lokal version læst 2026-10-24. Understøtter oplysninger om afsender og kommerciel politik. Dokumenterer ikke personlige investeringshistorier, faktisk modtaget betaling eller at Kasper personligt har godkendt ændringen. |

**Modstridende eller utilstrækkeligt belæg:** S3 siger både “intet minimum” og, i de detaljerede vilkår, at ordrer udføres i hele enheder. FAQ-forslaget medtager derfor enhedsprisen som reel begrænsning. S3 har også ASK-tekst med både 2025- og 2026-lofter og en bred skattemæssig beskrivelse af månedsopsparing. Den er ikke brugt som dansk skattekilde. S1 er grundlaget for ASK-svaret. Der er ikke dokumenteret en markedsrangliste for platforme eller personlige handler i 2014/2016.

## Påstandslog

Alle rækker har kontroldato **2026-10-24**. Henvisningerne S1–S5/L1–L2 angiver præcis URL, afsnit og version i tabellen ovenfor. “Gammel body” henviser til det fastholdte oprindelige hash; nye placeringer angives med overskrift/tekst. Alle fem gamle FAQ-svar står fuldt i øjebliksbilledet. Der er ingen sammenligningstabel, produktvinder eller afkastprognose på siden.

| ID og præcis påstand/placering | Belæg og år | Vurdering, forbehold og handling |
| --- | --- | --- |
| B1. Gammel indledning: “mit eget første køb tilbage i 2014”, “5.000 kr.”, “en dansk indeksfond” og “hvert femte minut”. | Intet personligt primærbelæg fremlagt. Historisk år 2014. | **Uafklaret, fjernet.** Ingen omskrivning til anden opdigtet erfaring. |
| B2. Gammel “Hvem står bag?”: “brugt år”, “praktiker”, “startede for alvor i 2016”, “begik alle de klassiske fejl”, “dyre bankprodukter” og “kostede mig dyrt i tabt afkast”. | L2 dokumenterer afsender, ikke erfaring, investeringer, omkostninger eller tab i 2016. | **Uafklaret, fjernet.** Neutral afsenderhenvisning bevarer velkomsten uden at opfinde kvalifikationer eller godkendelse. |
| B3. Gammel indledning/forventninger: “penge burde arbejde for dig”, “mister købekraft til inflationen”, “sikkert grundlag” og “Det virker. ... Gør det i dag.” | Ingen dokumentation for læserens rente, økonomi eller investeringsbehov. | **Skal rettes, udført.** Intet pres for at købe nu og intet sikkerheds-/afkastløfte. Inflation nævnes alene som et undervisningsemne. |
| B4. Gammel “Hvorfor det er vigtigt”: “Mange danskere lader banken styre”, “en af de dyreste løsninger”, bankerne har “ofte” egne aktive fonde, “Det betyder lavere afkast til dig”. | Ingen dækkende bank-/produkt-/prisundersøgelse. Intet sammenligningsår angivet. | **Uafklaret, fjernet.** Behovet for at forstå omkostninger bevares som læringsmål; ingen udokumenteret bankrangering. |
| B5. Ny H1 “Gratis investeringskursus for begyndere”, indledning “for dig ... ny ... allerede har købt lidt”, gratis læsning uden forkundskaber/investeringskonto. | L1: forsidens eksisterende gratis-kursusbeskrivelse og almindelig lektionsrute uden betalings-/kontokrav i den læste kode. Læsergruppe er kursets redaktionelle valg. | **Bekræftet i lokal kilde.** Ingen påstand om et bestemt resultat for alle begyndere. HTTP-adgang er endnu ikke testet. |
| B6. Ny indledning og “Kursusstruktur”: budget/mål → principper → aktivklasser → strategi/adfærd → analyse → handel/platform → skat → nedsparing. “otte dele”; næste lektion “Byg dit budget og skab overblik”. | L1: alle otte faktiske moduler og deres lektions-ID'er. Egne opslag i registeret, separat programmatisk kontrol nedenfor. | **Bekræftet.** Rækkefølge og relevante eksisterende links bevaret. Lektionsindholdets øvrige finanspåstande er ikke godkendt ved denne velkomstsidekontrol. |
| B7. “Du kan læse om Kasper Stuck ... redaktionelle metode”; “Siden kan modtage betaling via partnerlinks og annoncer”; markering som annonce/partnerlink. | L2: `/om`, `/redaktionel-metode`, `/affiliatepolitik`; `Prose.astro` opretter “Annonce · Partnerlink” med `rel="sponsored ..."`. | **Bekræftet som sitets politik og lokal kode.** Ingen garanti om ens læserpris, ingen “uden skjulte dagsordener”, ingen påstået personlig review. Faktisk visning skal kontrolleres af leaden. |
| B8. “generel undervisning, ikke personlig investerings- eller skatterådgivning”; intet bestemt afkast; “Investering indebærer risiko for tab”. | Undervisningens afgrænsning: L1/L2 og den konkrete tekst. Tabsrisiko: S4 “Generelle risici”; understøttes også af S3/S5. Ikke et skatteårsspecifikt afkastestimat. | **Bekræftet/afgrænset.** Synligt primærkildelink ved tabsrisikoen. Ingen garanti om at kunne undgå tab eller om en senere genvinding. |
| B9. Kursusdel 4: rebalancering “hvor du justerer investeringernes fordeling tilbage mod den valgte plan”. | S5, “Why portfolio rebalancing may be important”. Begrebsdefinition, ikke dansk skatteregel. | **Bekræftet.** Ingen fast hyppighed, handelsanbefaling eller påstand om højere afkast. Det relevante eksisterende ordbogslink bevares. |
| B10. Gammel del 7: “Lagerbeskatning betyder, at du afregner skat af din gevinst hvert år, selvom du ikke har solgt.” Ny del 7 nævner kun emnerne realisation/lager og kontotyper. | S1 “Beskatning” underbygger lagerprincippet for ASK, ikke ét universelt svar på alle produkter/konti. | **Præciseret ved afgrænsning.** Den korte, generelle skatteforklaring er taget ud af velkomsten; konkret ASK-regel står i det betingede FAQ-forslag. Det eksisterende lager-link er bevaret. |
| B11. Første øvelse: formål, tidspunkt og konsekvensen af et tab; “10.000 kr. falder med 20 % ... 2.000 kr. ... 8.000 kr.” | Redaktionel øvelse, ikke ekstern markedsdata. Egen aritmetik nedenfor. | **Bekræftet beregning.** Skat, omkostninger og nye indbetalinger er udtrykkeligt udeladt. Ingen sandsynlighed, periode eller anbefalet tabstolerance udledes af de 20 %. |
| M1. Registertitel “Velkommen til kurset”, gammel beskrivelse “Sæt rammer, forventninger og risikodisclaimer.”; foreslået søgetitel/beskrivelse nedenfor. | L1 og den nye body. Der er ikke dokumenteret søgevolumen eller placering. | **Titel beholdes; beskrivelse præciseres, `seoTitle` foreslås.** Det konkrete løfte er begyndere, gratis kursus, otte dele og øvelse; ikke sikker investering eller garanteret kursuseffekt. |
| F1. Gammel `faq[0]`: “Ja, absolut”, “Mange danske platforme”, automatiske små køb “uden ... høje gebyrer hver gang”. | S3: ingen fast beløbsgrænse, 0 kr. købskurtage, salg/valuta; hele enheder; produktomkostninger; kun bosat/fuldt skattepligtig i Danmark. Produktvilkår læst 2026-10-24. | **Skal rettes via forslag.** 500 kr. er muligt under konkrete betingelser, ikke en universel købs- eller prisgaranti. Ingen subjektiv grænse for “høje” gebyrer. S3 er ikke belæg for “mange” udbydere. |
| F2a. `faq[1]`: ASK “kun 17%”, årlig lagerbeskatning. | S1 “Beskatning”. Dansk ASK, vejledningen læst 2026-10-24. | **Tal bekræftet; formulering præciseres i forslag.** Årets afkast omfatter urealiserede gevinster og korrigeres for ind-/udbetalinger. Banken opgør og betaler; “lav/kun” fjernes. Ingen påstand om, at dette er bedst for enhver investor. |
| F2b. `faq[1]`: indskudsloft 174.200 kr. i 2026. | S1 “Hvor meget må du indskyde”; samlet værdi 31. december 2025, årets nettoindskud, særregel for skat i det kalenderår, hvor skatten forfalder til betaling. | **Tal bekræftet; betingelser tilføjes i forslag.** Ikke nyt frit indskud hvert år og ikke et loft over markedsværdien. Skatteindskud kan ske ud over loftet i det kalenderår, hvor skatten forfalder til betaling; rettet efter W1. |
| F2c. Foreslået ASK-svar: fuldt skattepligtig ved oprettelse, kun én ASK, kun tilladte værdipapirer. | S1 afsnittene om oprettelse, én konto og tilladte værdipapirer. | **Bekræftet.** Den korte FAQ er ikke en ISIN-godkendelse. Ingen konkret ETF eller positivlisterække anbefales. |
| F3. `faq[2]`: gratis kursus, “demokratisere viden”, “uden skjulte dagsordener”. | L1 gratis læseadgang i kode; L2 kommerciel politik. | **Skal rettes via forslag.** Svar direkte ja på gratis adgang; oplys om partnerlinks/annoncer. En missionserklæring dokumenterer ikke kommerciel uafhængighed. |
| F4. `faq[3]`: Nordnet og Saxo “de mest populære for private investorer i Danmark”; ingen vinder. | Ingen defineret målgruppe, periode eller dækkende markedsmåling. Deres tilstedeværelse som kursuseksempler ses i `handel-og-platform/maanedsopsparing.mdx` og `vaelg-det-rette-depot.mdx`. | **Popularitetsrangering uafklaret, foreslås fjernet.** Eksemplerne bevares i svaret; valgkriterier er et redaktionelt råd, ikke en dokumenteret vinder. Andre lektioners popularitetsudsagn er ikke godkendt her. |
| F5a. `faq[4]`: “For de fleste ... nej” til revisor, “Danske platforme indberetter automatisk dine handler”. | S2 indledning og afsnit om aktier optaget til handel i dansk depot; manglende oplysninger og udenlandske depoter. | **For bredt; forslag afgrænser svaret.** S2 siger “i de fleste tilfælde” om beregning ved de konkrete betingelser, ikke en statistisk andel, der behøver revisor. Ingen garanti om enhver platform eller produkttype. |
| F5b. `faq[4]`: “selv tjekke din årsopgørelse”. Nyt svar skelner udenlandsk depot og ASK. | S2: pligt til korrekt årsopgørelse; manglende danske beregningsoplysninger suppleres i Værdipapirsystemet; ejeren af aktier i udenlandsk depot skal selv beregne og oplyse gevinst og tab samt oplyse udbytte. S1: ASK-afkast opgøres særskilt af banken. | **Bekræftet, beholdes og præciseres i forslag.** Automatisk indberetning ophæver ikke kontrolpligten. Den faste pligt ved udenlandsk depot er rettet efter W2 og adskilt fra manglende danske data. ASK-skat må ikke blandes sammen med almindelig aktieindkomst på årsopgørelsen. |

Uafklarede gamle udsagn er fjernet fra den ejede body eller har et konkret korrektionsforslag. De er ikke erklæret falske. De gamle FAQ-udsagn står fortsat i det skrivebeskyttede register, indtil integrationen er gennemført; siden kan derfor ikke slutgodkendes på denne fase alene.

## Beregninger og forudsætninger

Der er ingen forventet afkastberegning. Øvelsen er et tænkt værditab: `10.000 kr. × 20 / 100 = 2.000 kr.` og `10.000 kr. − 2.000 kr. = 8.000 kr.`. Kontrollen med Node-assertioner gav de præcise heltal; ingen afrunding. Skat, omkostninger og nye indbetalinger sættes til nul i eksemplet. Et fald på 20 % siger intet om fremtidig sandsynlighed eller tid til genvinding.

ASK-kildens eget kontrolregnestykke er genberegnet særskilt: `174.200 kr. − 105.000 kr. = 69.200 kr.`. Forudsætning: 105.000 kr. er kontoens samlede værdi pr. 31. december 2025, før efterfølgende nettoindskud i 2026. Regnestykket er ikke indsat i velkomstteksten og er ikke en ekstra indbetalingsret til alle.

500 kr. i FAQ'en er et muligt startbeløb, ikke en beregnet minimumspris. Ingen valgt ISIN, dagskurs eller valutapris er opfundet. Ved S3 skal beløbet række til mindst én hel enhed af det valgte instrument og eventuelle omkostninger; ellers kan en ordre udeblive.

## Præcise forslag til metadata og FAQ — ikke anvendt

Integrationsnøgle: `src/data/lessons.ts` → `lessons[module.id="velkommen-og-fundament"].lessons[id="velkommen-til-kurset"]`. Sammenlign de enkelte gamle felter med øjebliksbilledet før anvendelse; en filhash-ændring på en anden record er ikke ret til at overskrive registeret.

| Felt | Gammel værdi | Foreslået ny værdi | Grund |
| --- | --- | --- | --- |
| `title` | `Velkommen til kurset` | `Velkommen til kurset` | Bevarer navigation og eksisterende kontrakt. |
| `seoTitle` | Felt mangler | `Gratis investeringskursus for begyndere – velkommen` | Beskriver det faktiske forløb og passer til H1. Ingen påstået rankingeffekt. |
| `description` | `Sæt rammer, forventninger og risikodisclaimer.` | `Start med budget og mål. Se kursets otte dele om risiko, aktier, fonde, depot, skat og nedsparing, og lav din første øvelse.` | Konkret resumé af siden uden generisk jargon eller afkastløfte. |
| `id` / `video` | `velkommen-til-kurset` / `null` | Uændret | Ingen URL-, video- eller publiceringsændring. |

Præcis ny `faq`-værdi nedenfor. Arrayorden og samtlige spørgsmål bevares; de gamle svar står fuldt ovenfor. Efter re-review skal integratoren anvende svarene og de præcise `sources`-arrays på denne record. Den fælles renderer skal vise kilderne umiddelbart efter det tilhørende svar, jf. integrationskontrakten nedenfor.

```json
{
  "registry": "src/data/lessons.ts",
  "module_id": "velkommen-og-fundament",
  "record_id": "velkommen-til-kurset",
  "old_record_sha256": "34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1",
  "proposed_fields": {
    "title": "Velkommen til kurset",
    "seoTitle": "Gratis investeringskursus for begyndere – velkommen",
    "description": "Start med budget og mål. Se kursets otte dele om risiko, aktier, fonde, depot, skat og nedsparing, og lav din første øvelse.",
    "faq": [
      {
        "question": "Kan man starte med at investere med kun 500 kr.?",
        "answer": "Ja, 500 kr. kan være nok, men det afhænger af produkt og omkostninger. Saxos månedsopsparing for personer bosat og fuldt skattepligtige i Danmark har intet fast minimumsbeløb og ingen købskurtage. Du skal dog have råd til mindst én hel enhed af det valgte værdipapir og eventuel valutaveksling. Fonde og ETF'er har også produktomkostninger, og salg koster kurtage. Kontrollér de aktuelle vilkår, før du køber.",
        "sources": [
          {
            "label": "Saxo: Månedsopsparing",
            "url": "https://www.home.saxo/da-dk/products/autoinvest"
          }
        ]
      },
      {
        "question": "Hvad er en aktiesparekonto?",
        "answer": "En aktiesparekonto (ASK) er en særlig investeringskonto, som personer, der er fuldt skattepligtige til Danmark, kan oprette. Du må kun have én. Afkastet beskattes med 17 % efter lagerprincippet, også af gevinster, du ikke har solgt. Banken beregner og indbetaler skatten. I 2026 er indskudsloftet 174.200 kr. Muligheden for yderligere indskud afhænger af kontoens samlede værdi den 31. december 2025 og årets nettoindskud; loftet er ikke et nyt indskud hvert år. Indskud til betaling af ASK-skat kan ske ud over loftet i det kalenderår, hvor skatten forfalder til betaling. Kontoen kan kun rumme værdipapirer, der opfylder ASK-reglerne.",
        "sources": [
          {
            "label": "Skattestyrelsen: Aktiesparekonto",
            "url": "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto"
          }
        ]
      },
      {
        "question": "Er dette kursus gratis?",
        "answer": "Ja. Lektionerne er gratis at læse. KasperInvest kan modtage betaling gennem annoncer og partnerlinks. Kommercielle placeringer markeres som annonce eller partnerlink; læs mere i affiliatepolitikken. Dine egne investeringer kan have omkostninger."
      },
      {
        "question": "Hvilken platform anbefaler kurset?",
        "answer": "Valget afhænger af dine behov. Nordnet og Saxo Bank indgår som eksempler i kurset. Sammenlign kontotyper, relevante værdipapirer, samlede omkostninger og skatteindberetning, før du vælger platform."
      },
      {
        "question": "Behøver jeg en revisor til min aktieskat?",
        "answer": "Ved aktier optaget til handel i et dansk depot kan Skattestyrelsen i de fleste tilfælde beregne gevinst og tab, når alle nødvendige oplysninger er modtaget. Mangler der oplysninger til beregningen for dit danske depot, skal du supplere dem i Værdipapirsystemet. Du har selv pligt til at sikre, at årsopgørelsen er korrekt. Har du aktier i et udenlandsk depot, skal du selv beregne og oplyse gevinst og tab på årsopgørelsen samt oplyse udbytte. På en dansk aktiesparekonto beregner og indbetaler banken ASK-skatten særskilt. Søg konkret hjælp, hvis du er i tvivl om din situation.",
        "sources": [
          {
            "label": "Skattestyrelsen: Skat af aktier",
            "url": "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-aktier"
          },
          {
            "label": "Skattestyrelsen: Aktiesparekonto",
            "url": "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto"
          }
        ]
      }
    ]
  }
}
```

**Dato-forslag, særskilt integrationsafhængighed:** Den faglige omskrivning fjerner udokumenteret erfaring og pris-/sikkerhedsløfter og tilføjer en øvelse og kommerciel åbenhed. En sandfærdig `updatedAt: "2026-10-24"` er derfor begrundet, hvis den anvendes som faktisk revisionsdato sammen med denne ændring. Den nuværende `Lesson`-type har intet datofelt; lektionsruten sender ingen dato til byline/Article-schema, og sitemap tilføjer lektioner uden `lastmod`. Der må derfor ikke blot tilføjes et ubrugt datofelt. Leaden må koordinere en særskilt ændring, som gør synlig dato, schema og sitemap ens, før datoen kan integreres. Ingen oprindelig `publishedAt` kendes eller må opfindes; den eksisterende mangel og al publiceringslogik bevares. Hvis yderligere substantiel revision sker senere, skal dato-forslaget revurderes. Datoen betyder ikke, at Kasper personligt har kontrolleret teksten.

## Udførte ændringer og bevaret indhold

Indledningen svarer nu på målgruppe og konkret læringsforløb. Personhistorierne, bankstereotyperne, handlingspresset og tomme metaforer er fjernet. De otte dele, deres rækkefølge og de eksisterende faglige linkmål er bevaret. Den generelle risikoadvarsel har et synligt link til en læst primærkilde. Gratis adgang og kommercielle relationer beskrives i samme afsnit. Øvelsen giver læseren noget konkret at tage med til budgetlektionen.

Én H1 og fem beskrivende H2'er er anvendt. De to nummererede lister er henholdsvis kursusrækkefølge og øvelsestrin. Resten er sammenhængende afsnit. Der er ingen tabel eller nyt billede i body. Ingen billed-alttekst skal derfor ændres. Titel, beskrivelse og FAQ er kun forslag i denne note.

**SEO-afgrænsning:** Struktur, direkte svar, afsender, kildebelæg og beskrivende links følger kvalitetsstandardens dokumenterede anbefalinger. Den konkrete formulering og afsnitsrækkefølge er redaktionel praksis. Der er ingen SERP-, søgevolumen-, Search Console-, CTR- eller rangmåling. Ingen søgeeffekt eller FAQ-rich-result-fordel hævdes. Teknisk crawl/GEO-adgang er uden for denne body-fase; leadens HTTP-kontrol mangler.

## Kontroller og handoff

Miljø observeret: Node `v24.22.1`, Astro `7.3.3`, `@astrojs/mdx` `8.0.1`, Vitest `4.1.11` fra de installerede pakker. Ingen pakker er installeret, og ingen tests eller gates er redigeret.

Før redigering bestod `node_modules/.bin/vitest run src/data/lessons.test.ts src/data/internal-links.test.ts`: exit **0**, 2 testfiler og 13 tests. Efter redigering er samme kommando, body-diff, regnestykker, H1, links og registerhash kontrolleret med resultaterne nedenfor. Ingen build, fuld suite eller lint indgår i denne fase.

### Risiko- og integrationspunkter til leaden

1. Åbn `/velkommen-til-kurset/` efter integration. Kontroller titel/beskrivelse/canonical/H1, den korte indledning, listen med otte dele og den nye øvelse ved 320 px samt mobil/desktop, lys/mørk visning og større tekstafstand.
2. Kontroller H2-ankrene med danske bogstaver, herunder “Første øvelse: skriv dit mål og din tidshorisont ned”. Kildekontrollen dokumenterer ingen renderede fragmenter eller sticky-header-adfærd.
3. `Prose.astro` flytter relaterede links før anden H2 og indsætter en eventuel annonce før tredje H2. Kontroller det faktiske flow og læsbarhed med og uden JavaScript; indledningen skal være læsbar før disse indsættelser.
4. `src/pages/[slug].astro` bruger FAQ-arrayet i `FAQPage`-JSON-LD, men den læste skabelon har ingen synlig FAQ-gengivelse. Dette er en **kildeobservation**, ikke en browserreproduceret fejl. Integratoren må koordinere synlig FAQ eller schema-håndtering med den delte renderer-ejer. Body-arbejderen må ikke rette komponenten eller kopiere foreslåede svar ind som en ekstra, usynkroniseret sandhedskilde.
5. Byline siger “Skrevet og redigeret af Kasper Stuck”. Agentens arbejde dokumenterer ingen personlig godkendelse. Leaden skal håndtere fælles afsender-/reviewtekst sammen med dens ejer. Ingen egen erfaring er tilføjet i body.
6. Hjemmesidens moduloversigt linker til denne record via registerets ID. Indgående opdagelse er bekræftet i kildekoden, ikke via HTTP. Alle udgående interne mål kontrolleres mod de faktiske registre; det nye eksterne risikolink er en almindelig kildehenvisning uden partnerparameter.
7. Bevar side-ID, modulrækkefølge, URL og manglende oprindelig publiceringsdato. Få først separat review af forslagene, anvend dem serielt, og få dernæst review af den faktisk samlede side. Denne note er ikke en slutgodkendelse.

### Forsøg, der blev afløst

- Tidlige læsekommandoer nævnte de ikke-eksisterende `src/data/modules.ts`, `src/pages/[...slug].astro`, `src/layouts/ArticleLayout.astro` og `src/components/Lesson*`; relevante faktiske stier blev derefter identificeret og læst. Ingen filer blev oprettet på disse stier.
- Første HTML-udtræk med `happy-dom` sluttede med `TypeError: Invalid URL`, `ERR_INVALID_URL`, base `about:blank`, exit 1. Et efterfølgende inert udtræk gav tom/ufuldstændig tekst trods exit 0 og blev ikke accepteret som faktabelæg. Direkte HTML-inspektion og til sidst `parse5` gav de relevante komplette afsnit fra S1–S4. Ét mellemliggende Node-udtræk havde en bogstavelig `\n` uden for en streng og gav `SyntaxError: Invalid or unexpected token` samt curl-skrivefejl; det korrekte udtræk bestod bagefter.
- Forsøg på at åbne SEC's <https://www.investor.gov/introduction-investing/investing-basics/glossary/rebalancing> gav HTTP **403**, curl exit **22**. Kilden er ikke brugt som belæg. Den samme definition blev kontrolleret på den læsbare primærkilde S5; ingen uafklaret definition står tilbage af den grund.
- Det første filpatchforsøg kombinerede sletning og tilføjelse af samme body-sti og blev afvist med `invalid patch: multiple operations target ...`. Det ændrede ingen fil. En efterfølgende skrivning på den samme ejede sti lykkedes.

### Endelige lokale resultater

| Faktisk kontrol | Exit / forventet exit | Observeret resultat |
| --- | --- | --- |
| `node_modules/.bin/vitest run src/data/lessons.test.ts src/data/internal-links.test.ts` | **0 / 0** | Efter body-ændringen, kørsel 2026-10-24 kl. 09:29 UTC: **2 testfiler, 13 tests bestået**. |
| `git diff --check -- src/data/lessons/velkommen-og-fundament/velkommen-til-kurset.mdx` | **0 / 0** | Ingen whitespacefejl. Den fulde body-diff er læst. |
| `node --input-type=module` med den udførte kontrolblok på stdin | **0 / 0** | Importerede faktiske `getModules()` og `getGlossaryTerms()`. Alle **13 interne linkforekomster / 12 forskellige mål** findes i de faktiske registre eller de fire eksplicit kontrollerede statiske ruter og har kildefiler. **Én H1, fem H2'er, otte moduler**, korrekt næste lektion. |
| Samme Node-kontrolblok: evidens/metadata | **0 / 0** | Begge JSON-blokke i noten kan parses. Den gamle record matcher registeret og sit hash. De fem FAQ-forslag bevarer spørgsmål og rækkefølge. Både record- og registerfilhash er uændrede. |
| Samme Node-kontrolblok samt særskilt aritmetikkørsel | **0 / 0** | Assertioner bekræfter `10000 × 20 / 100 = 2000`, `10000 − 2000 = 8000` og `174200 − 105000 = 69200`. Ingen afrundingsrest. |
| `git diff --check --no-index -- /dev/null docs/research/editorial-evidence-2026-10-24/mdx/lessons/velkommen-og-fundament/velkommen-til-kurset.md` | **1 / 1** | Ingen whitespaceadvarsler. `--no-index` giver exit 1, fordi noten er en ny fil og afviger fra `/dev/null`; det er ikke en fejlet test. |

De 12 interne mål er `/om`, `/redaktionel-metode`, `/affiliatepolitik`, `/budget-og-overblik`, `/renters-rente`, `/hvad-er-aktier`, `/aktiefonde-og-etfer`, `/ordbog/rebalancering`, `/vaelg-det-rette-depot`, `/skat-fra-bunden`, `/ordbog/lagerbeskatning` og `/`. Budgetlektionen er linket både fra kursusoversigten og som næste skridt. Der er ingen nye fragmentlinks i body. Ankerfunktion i den fælles indholdsfortegnelse er fortsat uverificeret.

Endelig body-SHA-256 efter implementering: `0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586`. Dette er implementerens kontrollerede hash, ikke en uafhængigt godkendt hash. `src/data/lessons.ts` er fortsat `5611b153a0d21ad18ec71d123a763fcdbc00816adc7011ee0554fca4c8e7bf32`.

Skrivehandlingerne omfattede kun denne note og den ejede MDX-body. Andre opgavers ændringer voksede undervejs i det delte arbejdstræ og er ikke tilbageført eller medtaget som eget arbejde. Ingen commit, push, deploy, backendmutation, pakkeinstallation eller fælles register-/rendererændring er udført.

## Korrektion efter reviewrunde 1 — 2026-10-24

Denne runde ejer kun evidensnoten. Den godkendte body og den faktiske welcome-record er skrivebeskyttede i opgaven. Hele `welcome-review-r1.json`, den accepterede plan og kvalitetsstandarden er læst. Originalt øjebliksbillede og tidligere kontrolresultater ovenfor er historik; de er ikke nye kørsler. Den tidligere reviewers afsluttede runde havde ingen bodyfund og krævede W1–W3 rettet i forslaget. Rettelserne er **ikke re-reviewet eller integreret**. Et faktisk taskId for denne korrektionsrunde er ikke oplyst.

### Fund, svar og genlæst belæg

De følgende officielle sider er genåbnet via web-læseværktøjet 2026-10-24. Relevante afsnit er læst direkte. Der er ikke kørt browser, server, Executor eller provideroperationer.

| Fund / påstand | Genlæst primærkilde og præcist afsnit | Svar og afgrænsning |
| --- | --- | --- |
| **W1 · should:** FAQ 2/F2b manglede betalingsåret for skatteindskud over loftet. | [Skattestyrelsen: Aktiesparekonto](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto), “Hvor meget må du indskyde”, afsnittet om indskud til betaling af skat. Løbende vejledning uden identificeret versionsdato; 2026-loftet er fortsat 174.200 kr. | **Rettet i forslaget og F2b.** Skatteindskud over loftet skal ske i det kalenderår, hvor skatten forfalder til betaling. Det er betalingsåret, ikke automatisk det indkomstår, afkastet vedrører. Resten af FAQ 2 er bevaret. |
| **W2 · should:** FAQ 5 gjorde egen beregning og indberetning ved udenlandsk depot usikker. | [Skattestyrelsen: Skat af aktier](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-aktier), indledningen samt “Sådan oplyser du om gevinst og tab samt udbytte” → dansk depot, manglende beregningsoplysninger og depot i udlandet. [Skattestyrelsen: Aktiesparekonto](https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto), “Beskatning”. Løbende vejledninger uden identificeret versionsdato. | **Rettet i forslaget og F5b.** Ejeren af aktier i udenlandsk depot skal selv beregne og oplyse gevinst og tab samt oplyse udbytte. Manglende danske beregningsdata skal suppleres i Værdipapirsystemet. Egen pligt til korrekt årsopgørelse og bankens særskilte ASK-skat er bevaret. Ingen rubriknumre, frister eller nye generelle produktregler er tilføjet. |
| **W3 · should:** FAQ 1, 2 og 5 manglede præcise læsersynlige kilder. | [Saxo: Månedsopsparing](https://www.home.saxo/da-dk/products/autoinvest), FAQ om pris, minimum og oprettelse samt “Ordreafvigelser og investeringsbeløb”; S1 og S2 som ovenfor. Saxo-vilkår observeret på læsedatoen, uden identificeret versionsdato. | **Rettet som konkret forslag og integrationskontrakt.** FAQ 1 får S3; FAQ 2 får S1; FAQ 5 får S2 og S1. Hele enheder, mulige omkostninger og Saxos målgruppe er genkontrolleret; FAQ 1's svar er bevaret. FAQ 3 og 4 samt øvrige metadata er uændrede. |

### Præcis integrationskontrakt med fælles renderer

1. Brug det aftalte valgfrie felt på hvert FAQ-element: `sources?: { label: string; url: string }[]`. `label` er almindelig tekst, og `url` er en officiel absolut HTTPS-adresse. De præcise labels, adresser og rækkefølger står i det aktuelle `proposed_fields.faq` ovenfor. Feltet er udeladt på FAQ 3 og 4.
2. Integratoren skal først genlæse **den konkrete welcome-record**, sammenligne med det originale JSON-øjebliksbillede og derefter kun anvende de re-reviewede forslagsfelter på den record. `id`, `video`, spørgsmål og FAQ-rækkefølge bevares. En ændring af registerets typer eller andre records gør ikke dette øjebliksbillede ugyldigt i sig selv; faktisk welcome-record-drift skal afklares før anvendelse.
3. Render spørgsmålet og svaret fra samme FAQ-element. Vis derefter elementets `sources` som almindelige klikbare `a href`-links i en synlig kildehenvisning ved svaret, med “Kilde:” for ét link og “Kilder:” for flere. FAQ 1 skal vise “Saxo: Månedsopsparing”; FAQ 2 “Skattestyrelsen: Aktiesparekonto”; FAQ 5 “Skattestyrelsen: Skat af aktier” efterfulgt af “Skattestyrelsen: Aktiesparekonto”. Brug labels som tekst og URL'er som linkmål uden affiliate-/trackingparametre.
4. Læg hverken Markdown-links eller kilde-HTML i `answer`. Kopiér ikke FAQ ind i MDX. Den synlige FAQ og eventuel struktureret gengivelse skal bruge de samme aktuelle spørgsmål og svar. En intern evidensnote erstatter ikke de synlige kilder; en integration med kun skjult FAQ-schema opfylder ikke denne kontrakt.
5. Type-, renderer-, byline- og datoarbejde tilhører den separate fælles ejer. Dato-forslaget ovenfor og den ukendte oprindelige publiceringsdato er uændrede. Der er ingen implementeringsændring i denne runde.
6. Leaden skal efter integration kontrollere den faktiske HTML og visning på `/velkommen-til-kurset/`: fem FAQ i rigtig rækkefølge, præcis én samlet FAQ-gengivelse, kildeantal **1/1/0/0/2**, korrekte linkmål, læsbarhed og tastaturadgang. Re-review af de rettede felter, review af samlet side, byline og runtimekontrol er fortsat **PENDING**.

### Fastholdt reviewerhistorik, gamle forslagsværdier og nye hashes

Den første JSON-blok i noten er fortsat det originale, uændrede record-øjebliksbillede. `old_values` nedenfor fastholder de to svar og de manglende kildefelter fra det hidtil reviewede forslag. Reviewrunde 1's hashes beskriver den tidligere version; de omskrives ikke til de nye hashes. Det nye forslagshash omfatter alle `proposed_fields`, inklusive de fire kildelinks.

```json
{
  "correction_id": "welcome-proposal-correction-r1",
  "correction_task_id": null,
  "research_date": "2026-10-24",
  "review_history": [
    {
      "round": 1,
      "task_id": "node:delegated-task:command%3Amcp%3A22b22515-a516-476d-b5e8-1340011ce3d3%3Adelegate-task%3Aki-seo-pilot-welcome-review-sol-r1",
      "report_path": "/home/workstation/.local/state/agent-setup/tasks/kasperinvest-seo-20261024/reports/welcome-review-r1.json",
      "verdict": "NEEDS FIXES",
      "body_findings": [],
      "proposal_findings": [
        "W1",
        "W2",
        "W3"
      ],
      "shared_gates": [
        "Synlig FAQ og kilder i fælles renderer",
        "Sandfærdig byline",
        "Leadens HTTP/HTML- og visuelle kontrol"
      ],
      "reviewed_hashes": {
        "body_sha256": "0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586",
        "registry_file_sha256": "5611b153a0d21ad18ec71d123a763fcdbc00816adc7011ee0554fca4c8e7bf32",
        "record_sha256": "34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1",
        "note_sha256": "3949513054e9fe58542c33fc3be60a1a5e648e1a50d5622dd4bfba3578117995",
        "proposed_fields_sha256": "d40ef224cdb544ef449954d02dee300216adf92b4f486e3bc9e461cc2ccb9d0c"
      }
    }
  ],
  "old_values": {
    "proposed_fields.faq[1].answer": "En aktiesparekonto (ASK) er en særlig investeringskonto, som personer, der er fuldt skattepligtige til Danmark, kan oprette. Du må kun have én. Afkastet beskattes med 17 % efter lagerprincippet, også af gevinster, du ikke har solgt. Banken beregner og indbetaler skatten. I 2026 er indskudsloftet 174.200 kr. Muligheden for yderligere indskud afhænger af kontoens samlede værdi den 31. december 2025 og årets nettoindskud; loftet er ikke et nyt indskud hvert år. Indskud til betaling af ASK-skat kan ske ud over loftet. Kontoen kan kun rumme værdipapirer, der opfylder ASK-reglerne.",
    "proposed_fields.faq[4].answer": "Ved aktier optaget til handel i et dansk depot kan Skattestyrelsen i de fleste tilfælde beregne gevinst og tab, når alle nødvendige oplysninger er modtaget. Du har selv pligt til at sikre, at årsopgørelsen er korrekt. Ved udenlandsk depot eller manglende oplysninger kan du selv skulle beregne og oplyse gevinst, tab og udbytte. På en dansk aktiesparekonto beregner og indbetaler banken ASK-skatten særskilt. Søg konkret hjælp, hvis du er i tvivl om din situation.",
    "proposed_fields.faq[0].sources": {
      "present": false
    },
    "proposed_fields.faq[1].sources": {
      "present": false
    },
    "proposed_fields.faq[4].sources": {
      "present": false
    }
  },
  "responses": [
    {
      "finding": "W1",
      "status": "CORRECTED_PENDING_REVIEW",
      "changed_fields": [
        "proposed_fields.faq[1].answer"
      ],
      "claim_ledger": "F2b",
      "evidence": "S1: Hvor meget må du indskyde; genåbnet 2026-10-24"
    },
    {
      "finding": "W2",
      "status": "CORRECTED_PENDING_REVIEW",
      "changed_fields": [
        "proposed_fields.faq[4].answer"
      ],
      "claim_ledger": "F5b",
      "evidence": "S2: indledning og Sådan oplyser du om gevinst og tab samt udbytte; S1: Beskatning; genåbnet 2026-10-24"
    },
    {
      "finding": "W3",
      "status": "CORRECTED_PENDING_REVIEW",
      "changed_fields": [
        "proposed_fields.faq[0].sources",
        "proposed_fields.faq[1].sources",
        "proposed_fields.faq[4].sources"
      ],
      "evidence": "S3 ved FAQ 1; S1 ved FAQ 2; S2 og S1 ved FAQ 5; alle genåbnet 2026-10-24"
    }
  ],
  "hash_method": "SHA-256 af UTF-8 JSON.stringify(value, null, 2), uden afsluttende linjeskift, for record og proposed_fields; rå filbytes for filer.",
  "hashes": {
    "body_before_sha256": "0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586",
    "body_expected_after_sha256": "0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586",
    "record_before_sha256": "34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1",
    "record_expected_after_sha256": "34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1",
    "registry_file_before_sha256": "5611b153a0d21ad18ec71d123a763fcdbc00816adc7011ee0554fca4c8e7bf32",
    "note_before_correction_sha256": "3949513054e9fe58542c33fc3be60a1a5e648e1a50d5622dd4bfba3578117995",
    "review_report_sha256": "980c3888decfd35772158107ff49e94112262da80e67add4406ea86567398301",
    "proposed_fields_before_sha256": "d40ef224cdb544ef449954d02dee300216adf92b4f486e3bc9e461cc2ccb9d0c",
    "proposed_fields_corrected_sha256": "5ac20cdfaa32abc3ad342ab67d2ab4d5955775e95308d80ec6ffecd4fa2c6220"
  },
  "integration": "PENDING",
  "re_review": "PENDING",
  "http_html": "PENDING_LEAD",
  "direct_visual": "PENDING_LEAD",
  "representative_template": "PENDING_LEAD"
}
```

### Korrektionsrundens observerede kontroller

Kontrollerne nedenfor er kørt i det eksisterende checkout på `main`. De er dokumentkontroller uden adfærdsændring; ingen nye tests eller applikationskørsler er tilføjet.

| Faktisk kommando | Exit / forventet exit | Observeret resultat |
| --- | --- | --- |
| `node --input-type=module`, førkontrol via stdin, 09:48:44 UTC | **0 / 0** | Begge oprindelige JSON-blokke parses; faktisk welcome-record matcher øjebliksbilledet og recordhash; body og det hidtil reviewede forslag matcher promptens hashes. |
| `node --input-type=module`, korrektionskontrol via stdin, 09:52:37 UTC | **0 / 0** | Alle **tre** JSON-blokke parses. Originalt øjebliksbillede og `old_values` er eksakte. Kun de to svarfelter og tre kildearrays er ændret i `proposed_fields`. Alle fem spørgsmål bevares; kildemapping og antal **1/1/0/0/2** stemmer. Body, konkret welcome-record og den eksterne reviewer-rapport er uændrede. |
| `sha256sum src/data/lessons/velkommen-og-fundament/velkommen-til-kurset.mdx docs/research/editorial-evidence-2026-10-24/mdx/lessons/velkommen-og-fundament/velkommen-til-kurset.md` | **0 / 0** | Body er fortsat `0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586`. Notens mellemhash efter korrektion, før denne kontroltilføjelse, er `38ecc07cab31bc1c0ca8ca0ea7ef2ffcfd3f661f06eca6f12813d497d0e903f0`; det er ikke slutfilens hash. |
| `git diff --check --no-index -- /dev/null docs/research/editorial-evidence-2026-10-24/mdx/lessons/velkommen-og-fundament/velkommen-til-kurset.md` | **1 / 1** | Ingen whitespaceadvarsler. Exit 1 skyldes den nye fils forskel fra `/dev/null`. |

Det korrigerede `proposed_fields`-hash er `5ac20cdfaa32abc3ad342ab67d2ab4d5955775e95308d80ec6ffecd4fa2c6220`; det gamle `d40ef224cdb544ef449954d02dee300216adf92b4f486e3bc9e461cc2ccb9d0c` gælder alene det tidligere reviewede forslag. Den konkrete welcome-record er før/efter `34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1`. Hele registerfilen blev også observeret uændret kl. 09:52:37 UTC; dette er ikke en gate mod den separate ejers senere typeændringer. Ingen targetdrift blev observeret i denne kontrol. Slutkontrollen genkører assertioner, afgrænsning og whitespace på den færdige note; dens faktiske resultater og slutfilhash returneres i korrektionsrapporten uden et selvrefererende filhash i noten.

Supplerende driftkontrol kl. 09:54:52 UTC: Hele `src/data/lessons.ts` er nu ændret fra `5611b153a0d21ad18ec71d123a763fcdbc00816adc7011ee0554fca4c8e7bf32` til `b2d56de074c48023e09ceae611302f4b4d257342e38e5362dce69d80c0826319`. `git diff -- src/data/lessons.ts` viser tilføjelsen af `updatedAt?`, FAQ-feltet `sources?` og typeangivelsen `const lessons: Module[]`. Det er den separate fælles ejers arbejde. Den **konkrete welcome-record er fortsat eksakt uændret** mod det oprindelige øjebliksbillede og recordhash; body er også uændret. Ingen drift er overskrevet. Denne korrektionsrunde godkender ikke den fælles implementering.

Afløste læse-/værktøjsforsøg i denne runde: En `rg --files`-søgning uden match gav exit 1 og afbrød den sammenkædede statuslæsning; separate Git-kontroller og `fd`-søgning blev derefter udført. En forkert antaget lokal sti til TypeScript-skillen gav `cat` exit 1; den oplyste plugin-sti blev derefter læst med exit 0. Et in-memory hjælpeforsøg i værktøjsharnessen gav `ReferenceError: structuredClone is not defined`; forsøget nåede ingen skrivning eller shellkommando, og JSON-kopiering virkede bagefter. En kontroltilføjelse ramte først den oprindelige JSON-bloks afslutning; placeringen blev rettet til korrektionsloggens slutning før slutkontrollen. Afkortede læseoutputs blev genlæst i mindre afsnit. Ingen af disse forsøg ændrede filer.

Kun denne note er skrevet i korrektionsrunden. Brødtekst, register, renderer og alle andre ejeres filer er ikke redigeret her. Re-review, seriel integration og leadens renderede kontrol er fortsat **PENDING**; denne afgrænsede korrektion godkender ikke siden eller sitet.


## Seriel metadata-integration — 2026-10-24

Denne tilføjelse beskriver den aktuelle integrationsstatus. Alle tidligere statusangivelser, snapshots, kildeobservationer og hashes ovenfor er bevaret som historik. Tidligere forventninger om fravær af `seoTitle`, `updatedAt` og kildefelter beskrev de daværende records; de er ikke forventninger til den nu integrerede record. De fire rå reviewrapporter er læst og forbliver uændrede.

**Integration: COMPLETED for præcis denne record. Frisk review af faktisk samlet side: PENDING. HTTP/HTML, direkte visuel kontrol og repræsentativ skabelonkontrol: PENDING hos leaden.** Dette er ikke en slutgodkendelse af siden eller sitet.

Ejerskab: kun `lessons[module.id="velkommen-og-fundament"].lessons[id="velkommen-til-kurset"]` i `src/data/lessons.ts` og denne evidensnote. Integrationsrunde: `welcome-integrate-r1`; faktisk integrator-taskId er ikke oplyst og er derfor ukendt. Integratoren har ikke ændret MDX-body, fælles renderer, typer, andre records eller andre ejeres arbejde.

### Godkendelse og førkontrol

- Den accepterede `MERGED_PLAN.md`, hele den ejede note og `welcome-review-r1.json`, `welcome-proposal-review-r2.json`, `shared-renderer-review-r1.json` og `shared-renderer-security-r1.json` er læst.
- `welcome-proposal-review-r2.json` godkender præcis `proposed_fields`-SHA-256 `5ac20cdfaa32abc3ad342ab67d2ab4d5955775e95308d80ec6ffecd4fa2c6220` til metadata-integration. Review-taskId: `node:delegated-task:command%3Amcp%3A621b6cb3-fbb6-4b15-bef9-ec4f86c455d3%3Adelegate-task%3Aki-seo-welcome-proposal-review-r2`.
- Før skrivning matchede hele registeret `b2d56de074c48023e09ceae611302f4b4d257342e38e5362dce69d80c0826319`, den konkrete record `34a34b55cd61a5344865446507b5ef952f8166624a6997dd4291510c55cd02f1`, noten `fcd195e7b28525e572732ecbd60a0805665d189a50c3e710d59a0bd2b4e6d815` og body `0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586`. Den faktiske gamle record blev sammenlignet felt for felt med det oprindelige JSON-snapshot. Ingen targetdrift krævede overskrivning eller afklaring.
- Installeret TypeScript `5.9.3` identificerede den entydige modul-/record-node i AST'en. Kun feltpositioner i den node blev ændret med JSON-strengserialisering og et afgrænset, eksakt patch. Ingen bred formatering eller regex-baseret recordgætning blev brugt.

| Fund | Godkendt rettelse og faktisk anvendelse |
| --- | --- |
| W1 | APPROVED/APPLIED: FAQ 2 angiver kalenderåret, hvor ASK-skatten forfalder til betaling. Det præcise re-reviewede svar er anvendt. |
| W2 | APPROVED/APPLIED: FAQ 5 adskiller manglende danske beregningsdata fra pligten til selv at beregne og oplyse gevinst/tab og oplyse udbytte ved udenlandsk depot. Det præcise re-reviewede svar er anvendt. |
| W3 | APPROVED/APPLIED som data: alle godkendte kildelabels, URL'er og deres rækkefølge er anvendt. Kildeantal er 1/1/0/0/2. `sources` er fortsat udeladt på FAQ 3 og 4. Fælles renderer er særskilt reviewet; faktisk samlet HTML/visning er PENDING. |

Der er kun ændret fire recordfelter: `seoTitle`, `description`, `faq` og `updatedAt`. Alle fem FAQ-svar er erstattet af de godkendte svar. Alle spørgsmål og deres rækkefølge er uændrede. `title` er fortsat `Velkommen til kurset`; `id`, `video: null`, modulplacering og næste lektion `budget-og-overblik` er bevaret. Ingen nye finansielle formuleringer eller kilder er tilføjet ud over det godkendte forslag. Integratoren har ikke genåbnet eksterne kilder; det faktuelle belæg er de dokumenterede primærkilder og de uafhængige reviews.

De faktisk anvendte feltværdier er:

```json
{
  "seoTitle": "Gratis investeringskursus for begyndere – velkommen",
  "description": "Start med budget og mål. Se kursets otte dele om risiko, aktier, fonde, depot, skat og nedsparing, og lav din første øvelse.",
  "faq": [
    {
      "question": "Kan man starte med at investere med kun 500 kr.?",
      "answer": "Ja, 500 kr. kan være nok, men det afhænger af produkt og omkostninger. Saxos månedsopsparing for personer bosat og fuldt skattepligtige i Danmark har intet fast minimumsbeløb og ingen købskurtage. Du skal dog have råd til mindst én hel enhed af det valgte værdipapir og eventuel valutaveksling. Fonde og ETF'er har også produktomkostninger, og salg koster kurtage. Kontrollér de aktuelle vilkår, før du køber.",
      "sources": [
        {
          "label": "Saxo: Månedsopsparing",
          "url": "https://www.home.saxo/da-dk/products/autoinvest"
        }
      ]
    },
    {
      "question": "Hvad er en aktiesparekonto?",
      "answer": "En aktiesparekonto (ASK) er en særlig investeringskonto, som personer, der er fuldt skattepligtige til Danmark, kan oprette. Du må kun have én. Afkastet beskattes med 17 % efter lagerprincippet, også af gevinster, du ikke har solgt. Banken beregner og indbetaler skatten. I 2026 er indskudsloftet 174.200 kr. Muligheden for yderligere indskud afhænger af kontoens samlede værdi den 31. december 2025 og årets nettoindskud; loftet er ikke et nyt indskud hvert år. Indskud til betaling af ASK-skat kan ske ud over loftet i det kalenderår, hvor skatten forfalder til betaling. Kontoen kan kun rumme værdipapirer, der opfylder ASK-reglerne.",
      "sources": [
        {
          "label": "Skattestyrelsen: Aktiesparekonto",
          "url": "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto"
        }
      ]
    },
    {
      "question": "Er dette kursus gratis?",
      "answer": "Ja. Lektionerne er gratis at læse. KasperInvest kan modtage betaling gennem annoncer og partnerlinks. Kommercielle placeringer markeres som annonce eller partnerlink; læs mere i affiliatepolitikken. Dine egne investeringer kan have omkostninger."
    },
    {
      "question": "Hvilken platform anbefaler kurset?",
      "answer": "Valget afhænger af dine behov. Nordnet og Saxo Bank indgår som eksempler i kurset. Sammenlign kontotyper, relevante værdipapirer, samlede omkostninger og skatteindberetning, før du vælger platform."
    },
    {
      "question": "Behøver jeg en revisor til min aktieskat?",
      "answer": "Ved aktier optaget til handel i et dansk depot kan Skattestyrelsen i de fleste tilfælde beregne gevinst og tab, når alle nødvendige oplysninger er modtaget. Mangler der oplysninger til beregningen for dit danske depot, skal du supplere dem i Værdipapirsystemet. Du har selv pligt til at sikre, at årsopgørelsen er korrekt. Har du aktier i et udenlandsk depot, skal du selv beregne og oplyse gevinst og tab på årsopgørelsen samt oplyse udbytte. På en dansk aktiesparekonto beregner og indbetaler banken ASK-skatten særskilt. Søg konkret hjælp, hvis du er i tvivl om din situation.",
      "sources": [
        {
          "label": "Skattestyrelsen: Skat af aktier",
          "url": "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/skat-af-aktier"
        },
        {
          "label": "Skattestyrelsen: Aktiesparekonto",
          "url": "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto"
        }
      ]
    }
  ],
  "updatedAt": "2026-10-24"
}
```

### Faktisk revisionsdato og nuværende propagation

`updatedAt: "2026-10-24"` gennemfører det særskilte, begrundede datoforslag ovenfor. Datoen beskriver den substantielle body-/metadatarevision med fjernelse af udokumenterede udsagn, ny øvelse, præcisering af FAQ og kilder. Research alene er ikke datobegrundelsen. Datoen betyder ikke Kasper Stucks personlige redigering, kontrol eller godkendelse. Ingen oprindelig `publishedAt` kendes; feltet er ikke opfundet eller tilføjet.

De særskilt reviewede dato-/typeændringer er bevaret. Aktuel kildekode er genlæst:

- `Lesson.updatedAt?: string` er det eksisterende valgfrie felt i `src/data/lessons.ts`.
- `src/pages/[slug].astro` sender `lesson.updatedAt` til både `AuthorBox.updatedAt` og `ArticleSchema.dateModified`.
- `src/components/AuthorBox.astro` bruger værdien i `time.datetime` under “Senest opdateret”; bylinen siger “Redaktionelt ansvar” og henviser til den redaktionelle metode.
- `src/components/ArticleSchema.astro` medtager kun `dateModified`, når værdien findes. Lektionsruten sender ingen `datePublished`.
- `src/pages/sitemap.xml.ts` sender `lesson.updatedAt` til `add` og derfra til XML-escapet `lastmod` i `urlEntry`.

`shared-renderer-review-r1.json` godkender kilde og tests, inklusive datopropagation og synlig FAQ fra samme datakilde. `shared-renderer-security-r1.json` godkender den afgrænsede sikkerhedsgennemgang af samme renderer. Disse rapporter erstatter hverken frisk review af denne nu samlede side eller leadens HTTP-/visuelle kontrol. De uændrede tests bruger lokale fixtures og backendmocks; de beviser ikke live provideradgang.

### Integrationskontroller og endelige hashes

| Faktisk kommando | Exit / forventet exit | Observeret resultat |
| --- | --- | --- |
| `node_modules/.bin/vitest run tests/editorial-renderer.test.ts tests/lesson-sitemap.test.ts src/data/lessons.test.ts src/data/internal-links.test.ts` | **0 / 0** | Fire testfiler og 21 tests bestået efter metadataændringen. Eksisterende Astro-advarsel: `getStaticPaths()` ignoreres på den dynamiske lektionsrute. Routing er ikke ændret. |
| `node_modules/.bin/biome check src/data/lessons.ts` | **0 / 0** | Én fil kontrolleret; ingen rettelser anvendt. |
| `git diff --check -- src/data/lessons.ts` | **0 / 0** | Ingen whitespacefejl. |
| `node --input-type=module` med strukturerede assertions på stdin | **0 / 0** | Præcis fire ændrede recordfelter. Godkendt forslag anvendt eksakt; unik SEO-titel; fem bevarede spørgsmål; kildeantal 1/1/0/0/2. Alle 47 IDs, øvrige 46 records og otte modulmetadata uændrede. TypeScript-AST, dataserialisering og rekonstruktion til det eksakte før-filhash bekræfter, at alle bytes uden for den konkrete record, inklusive typer og funktioner, er identiske. MDX-body, fælles filer og rå rapporter er uændrede. |

- Endelig konkret record-SHA-256: `9dcbad086f36120d4d23c71b6fb5a1564e5bfbef6fa92997a78206aa0281c569`.
- Endelig registerfil-SHA-256: `910ccc208c88f46c277d690986752e848a3066ca5852a328c9bc4c113d6d8289`.
- Uændret body-SHA-256: `0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586`.
- Anvendt `proposed_fields`-SHA-256: `5ac20cdfaa32abc3ad342ab67d2ab4d5955775e95308d80ec6ffecd4fa2c6220`.
- Record- og forslagshashes: SHA-256 af UTF-8 `JSON.stringify(value, null, 2)`, uden afsluttende linjeskift og med faktisk feltorden. Filhashes: rå filbytes. Aktuel recordfeltorden: `id`, `title`, `seoTitle`, `description`, `updatedAt`, `video`, `faq`.
- Kun denne lektion har nu `updatedAt`. De øvrige 46 records har fortsat hverken `updatedAt` eller `publishedAt`; ingen lesson-record har `publishedAt`.
- Notens oprindelige tekst, alle tre historiske JSON-blokke og deres hashes/status er bevaret eksakt som append-only historik. Denne notes endelige filhash returneres til leaden uden selvrefererende filhash her.

Et første patchforsøg blev afvist, fordi patchkonteksten udelod recordens afsluttende komma. Det ændrede ingen fil. Førhashes blev genkontrolleret, og det korrigerede eksakte patch lykkedes. Afkortede læseoutputs blev genlæst i mindre afsnit; en indledende bred instruktionssøgning gav exit 2 og blev afløst af afgrænset instruktionseftersøgning. Ingen ukendt drift blev overskrevet.

**Handoff til lead/finalreview:** Brug record- og bodyhashes ovenfor. Få et frisk, skrivebeskyttet review af den faktiske samlede body, metadata, alle fem FAQ og kilder. Kontroller derefter `/velkommen-til-kurset/` og sitemap i den aftalte HTTP-/browserverifikation: korrekt title/description/canonical, én FAQ-gengivelse med kildeantal 1/1/0/0/2, samme spørgsmål/svar som FAQ-schema, synlig revisionsdato, Article.dateModified og sitemap.lastmod `2026-10-24`, intet opfundet datePublished samt læsbarhed, fokus, TOC og kommerciel markering. Disse lag er **PENDING**. Ingen browser, devserver, build, fuld suite, backendoperation, installation, commit, push eller deployment er udført af integratoren.

## W4: Kommerciel tekst efter ændret banner — 2026-10-24

Denne tilføjelse er den aktuelle status for W4. Alle tidligere snapshots, forslag, påstandsvurderinger, resultater og review-hashes ovenfor er uændret historik. Det oprindelige forslag og de anvendte integrationsværdier beskriver tidligere versioner; det eksakte delta nedenfor gælder nu. Hele noten, den accepterede plan, seneste W4/A1-status og de to rapporter `welcome-integrate-r1.json` og `welcome-final-review-r1.json` er læst. Faktisk taskId for denne korrektionsrunde er ikke oplyst.

**W4: CORRECTED_PENDING_DELTA_REVIEW. Frisk delta-review og leadens HTTP-/visningskontrol af W4: PENDING.** Den tidligere fulde kildegodkendelse omfatter den gamle body og FAQ 3. Den videreføres ikke som godkendelse af dette delta eller af annoncers faktiske visning. Sidens eller sitets samlede godkendelse hævdes ikke her.

### Nyt belæg og påstandsvurdering

[Koordinatorens observerede brugerinstruks](/home/workstation/.local/state/agent-setup/tasks/kasperinvest-seo-20261024/state.md:100) registrerer designtråd `b2647599-2814-4185-88cd-1888cc2bfd46`, position **1798**, tidspunkt **2026-10-24T10:10:35Z**: **“remove Annonce · Partnerlink”**. Den eksterne ændring er oplyst som commit `267763cf571a9dd9b1ca21acf63c6ee835cacf4f`. A1 er udsat af koordinatoren på baggrund af denne udtrykkelige brugerundtagelse. Denne runde genåbner ikke bannerændringen.

`src/components/Prose.astro:107–124` er genlæst lokalt. `createBanner` opretter et `aside` med `aria-label="Annonce"`, et link med `rel="sponsored noopener noreferrer"` og et billede. Funktionen tilføjer ingen synlig labeltekst. Fil-SHA-256 er `8da15c04abbe3bb47c4efce30b2dcec18ae42500c40a57c5a1007dc201ed153c`. Dette er kildebelæg; ingen browserkontrol er udført af denne skriver.

| Påstand | Ny vurdering og handling |
| --- | --- |
| B7/F3: “Kommercielle placeringer markeres som annonce eller partnerlink” | Den generelle synlige markeringspåstand understøttes ikke længere af bannerkoden. Fjernet fra body og FAQ 3. Den tidligere B7-vurdering gælder den historiske Prose-version. |
| B7/F3: gratis læsning og mulig betaling via partnerlinks/annoncer | Beholdt med samme forbehold “kan”. Ingen faktisk indtjening eller kommerciel uafhængighed påstås. Tidligere kildegrundlag og uændret læseadgang genbruges; ingen ny finansiel påstand. |
| B7/F3: egne investeringsomkostninger er adskilt fra gratis kursusadgang | Beholdt. Ingen pris, gebyrgaranti eller produktanbefaling er tilføjet. |
| Henvisning til affiliatepolitikken | MDX-linket `/affiliatepolitik` og FAQ'ens teksthenvisning er bevaret som læserhjælp. Politiksidens egen markeringspåstand er en særskilt, fortsat pending opgave hos koordinatoren. Politiksiden er ikke ændret eller godkendt her. |

### Præcist anvendt delta og hashafgrænsning

Kun body-afsnittet på linje 11 og `faq[2].answer` er ændret. Alle fem spørgsmål og deres rækkefølge, FAQ 1/2/4/5, alle kildearrays, øvrige metadata, video, navigation, 46 andre records, otte modulmetadata samt typer og funktioner bevares. `updatedAt` er fortsat `2026-10-24`, samme substantielle revisionsdag. Ingen `publishedAt` er tilføjet. Banner, policy og andre ejeres filer er ikke redigeret.

```json
{
  "correction_id": "W4-welcome-commercial-copy-r1",
  "correction_task_id": null,
  "date": "2026-10-24",
  "selector": {
    "registry": "src/data/lessons.ts",
    "module_id": "velkommen-og-fundament",
    "record_id": "velkommen-til-kurset"
  },
  "instruction_record": {
    "state_path": "/home/workstation/.local/state/agent-setup/tasks/kasperinvest-seo-20261024/state.md",
    "state_line": 100,
    "thread_id": "b2647599-2814-4185-88cd-1888cc2bfd46",
    "position": 1798,
    "timestamp": "2026-10-24T10:10:35Z",
    "user_text": "remove Annonce · Partnerlink",
    "dependency_commit": "267763cf571a9dd9b1ca21acf63c6ee835cacf4f"
  },
  "body_delta": {
    "path": "src/data/lessons/velkommen-og-fundament/velkommen-til-kurset.mdx",
    "paragraph_line": 11,
    "old": "Lektionerne er gratis at læse. Siden kan modtage betaling via partnerlinks og annoncer. Kommercielle placeringer markeres som annonce eller partnerlink; se [affiliatepolitikken](/affiliatepolitik). Udgifter til dine egne investeringer er noget andet end adgang til kurset.",
    "new": "Lektionerne er gratis at læse. Siden kan modtage betaling via partnerlinks og annoncer. Læs mere i [affiliatepolitikken](/affiliatepolitik). Udgifter til dine egne investeringer er noget andet end adgang til kurset."
  },
  "record_delta": [
    {
      "field": "faq[2].answer",
      "question": "Er dette kursus gratis?",
      "old": "Ja. Lektionerne er gratis at læse. KasperInvest kan modtage betaling gennem annoncer og partnerlinks. Kommercielle placeringer markeres som annonce eller partnerlink; læs mere i affiliatepolitikken. Dine egne investeringer kan have omkostninger.",
      "new": "Ja. Lektionerne er gratis at læse. KasperInvest kan modtage betaling gennem annoncer og partnerlinks. Læs mere i affiliatepolitikken. Dine egne investeringer kan have omkostninger."
    }
  ],
  "historical_review": {
    "report_path": "/home/workstation/.local/state/agent-setup/tasks/kasperinvest-seo-20261024/reports/welcome-final-review-r1.json",
    "verdict": "APPROVE FINAL ASSEMBLED SOURCE",
    "body_sha256": "0fc9451f4b38f9052f74756ab5b1e0a783f9d8fb41d5fd40f5603a44dc24a586",
    "record_sha256": "9dcbad086f36120d4d23c71b6fb5a1564e5bfbef6fa92997a78206aa0281c569",
    "registry_file_sha256": "910ccc208c88f46c277d690986752e848a3066ca5852a328c9bc4c113d6d8289",
    "note_sha256": "b76a103e70b11e45f1daa5678ea7d08075eeedcb8a0962f3ebf5fae8dbeabe74",
    "applicability": "Godkendelsen gælder den tidligere body og FAQ 3. W4-deltaet er ikke uafhængigt godkendt."
  },
  "hash_method": "SHA-256 af rå filbytes for filer; UTF-8 JSON.stringify(record, null, 2) uden afsluttende linjeskift og med faktisk feltorden for record.",
  "final_content_hashes": {
    "body_sha256": "0592e9026a4641e03cc13d83ed1b1a358e3f324d9092060f401e065a8da423be",
    "registry_file_sha256": "714c0f89be222cfd656480ca70e7eba68e410fce2271fff36a33f668d0ff9e8f",
    "record_sha256": "41a68d96a0c46e35176ceaccd24cd8ca85fab2fb479765467ab6932f25a81520"
  },
  "prose_source_sha256": "8da15c04abbe3bb47c4efce30b2dcec18ae42500c40a57c5a1007dc201ed153c",
  "updatedAt": "2026-10-24",
  "publishedAt_present": false,
  "w4": "CORRECTED_PENDING_DELTA_REVIEW",
  "delta_review": "PENDING",
  "http_html": "PENDING_LEAD_FOR_W4",
  "direct_visual": "PENDING_LEAD_FOR_W4",
  "representative_template": "PENDING_LEAD_FOR_W4"
}
```

Filhashes beskriver de endelige body-/registerbytes efter W4. Recordhashen bruger samme metode og feltorden som den tidligere godkendte record. Historiske godkendelses- og forslagshashes ovenfor er ikke opdateret. Notens endelige filhash returneres i skriverens rapport, så noten ikke får et selvrefererende hash.

### Observerede lokale kontroller

| Faktisk kommando | Exit / forventet exit | Resultat |
| --- | --- | --- |
| `node_modules/.bin/vitest run tests/editorial-renderer.test.ts tests/lesson-sitemap.test.ts src/data/lessons.test.ts src/data/internal-links.test.ts` | **0 / 0** | Fire filer, 21 tests bestået efter W4. Vitest 4.1.11. Samme Astro-advarsel om `getStaticPaths()` på den dynamiske lektionsrute som tidligere. |
| `node_modules/.bin/biome check src/data/lessons.ts` | **0 / 0** | Én fil kontrolleret; ingen rettelser anvendt. Biome 2.4.6. |
| `git diff --check -- src/data/lessons/velkommen-og-fundament/velkommen-til-kurset.mdx src/data/lessons.ts` | **0 / 0** | Ingen whitespacefejl efter body-/FAQ-rettelsen. |

Den afsluttende strukturerede kontrol sammenligner det faktiske register med førkontrollen, rekonstruerer førhashes ved kun at tilbageføre de to tekstændringer og kontrollerer alle JSON-blokke samt notens oprindelige bytepræfiks. Det faktiske resultat returneres i rapporten. Kontrollen erstatter hverken uafhængigt delta-review eller runtimekontrol.

Et indledende in-memory førkontrolforsøg gav for stort output til værktøjsgrænsen; det afkortede output kunne ikke JSON-parses. Shellkontrollen havde ingen skrivehandlinger. Den afløste førkontrol brugte et mindre, hashbundet snapshot, verificerede de forventede førhashes og den faktiske record og bestod med exit 0. Andre afkortede læseoutputs blev genlæst i mindre afsnit. Ingen backupfiler er oprettet.

Første afsluttende assertionkontrol gav exit 1 ved linkoptællingen: kontroludtrykket krævede et tegn efter `/` og udelod derfor forsidelinket. Den optalte 12 forekomster. Udtrykket er rettet til også at medtage `/`; den hashverificerede oprindelige body bruges til linksammenligningen. Ingen indhold eller linkmål blev ændret af dette forsøg. Det afløses kun af den tilsvarende beståede slutkontrol i rapporten.

Der er ikke tilføjet tests eller udført browser, server, fuld build, installation, delegation, commit, push, deployment eller backend-/provideroperationer. Nye personhistorier, rangeringer og garantier er ikke tilføjet. Handoff gælder kun den udførte W4-korrektion.
