# Editorial inventory — 2026-10-24

Local source snapshot at **08:57:19 UTC**, branch `main`, HEAD `6656523e02010c9a1546075f5803dd12e349a3bb`. This is research documentation. No editorial body, application source, backend record or configuration was changed.

[Machine inventory](editorial-inventory-2026-10-24.json) contains **792 local editorial units**: **768 MDX files**, **8 savings category records**, and **16 pages with inline editorial content**. These are not 792 confirmed live pages: 767 MDX files have registry-backed routes; one is unregistered. Together with the 16 fixed pages, **783 pages are eligible in local source**. Eight savings routes depend on backend data. YouTube populations remain unknown.

Each JSON page has a stable `id`, classification, title, content path/hash, route source, canonical URL, metadata owner/key/line, publication state and dispatch scope. IDs survive title edits. A null route means no supported route was found. `source_eligible` describes local source, not deployed HTTP behavior or search-engine indexing. `source_snapshots` records the source hashes; concurrent source edits can make them stale.

## MDX coverage and route evidence

| Collection | Files | Metadata owner and key | Route supported by loader |
| --- | ---: | --- | --- |
| Articles | 12 | `src/data/articles.ts:46`, `(section,id)` | `/guides/{id}/` (5), `/etf/{id}/` (4), `/skat/{id}/` (3); `src/data/articles.ts:377`, `src/pages/guides/[slug].astro:4` and equivalent ETF/skat pages |
| Pension | 8 | `src/data/pension.ts:30`, `id` | `/pension/{id}/`; `src/data/pension.ts:21`, `src/pages/pension/[slug].astro:13` |
| Platforms | 7 | `src/data/platforms.ts:39`, `id` | `/platforme/{id}/`; `src/data/platforms.ts:30`, `src/pages/platforme/[slug].astro:13` |
| Lessons | 47 | `src/data/lessons.ts:53`, `(module_id,id)` | `/{id}/`, **without the module in the URL**; `src/pages/[slug].astro:14` and `:32` |
| Glossary | 666 | 665 records in `src/data/glossary.ts:116`, `id`; one file has no record | `/ordbog/{id}/` only for published registry entries; `src/data/glossary.ts:64`, `:83`, `:96`, `src/pages/ordbog/[slug].astro:21` |
| Elections | 28 | `src/data/elections.ts:51`, `(year,id)` | `/folketingsvalg/{year}/{id}/`; folder lookup uses `folketingsvalg-{year}`, `src/data/elections.ts:40`, `src/pages/folketingsvalg/[year]/[slug].astro:9` |
| **Total** | **768** | **767 registry-backed bodies + 1 unregistered body** | All files retained as separate inventory units |

The app declares server output (`astro.config.mjs:14`); route findings come from actual lookup/load functions, not inferred static generation. Canonicals use `https://kasperinvest.dk` and a trailing slash (`src/layouts/BaseLayout.astro:24`); article pages also supply an explicit canonical (`src/components/ArticlePage.astro:20`). The shared layout defaults to `index,follow` (`src/layouts/BaseLayout.astro:69`), and `public/robots.txt:1` allows crawling. No live response was checked.

Glossary publication excludes drafts and future dates except explicitly linked terms; linked early releases can have effective dates rewritten to `2026-07-16T00:00:00` (`src/data/glossary.ts:14`, `:62`, `:64`, `:69`). At the snapshot, all 665 records passed: zero draft records and zero future publication dates. Other MDX registries have no equivalent publication filter. Missing date fields are recorded as unknown, not invented.

## Additional editorial content

- **Eight savings categories:** `el`, `mobil`, `internet`, `tv`, `streaming`, `bank-laan`, `investering`, `tjen-penge`. Their titles, descriptions and intro bodies live in `categoryDefs` (`src/data/savings.ts:40`). The loader reads approved DK programs and drops categories with no providers (`:101`, `:121`); the page returns 404 for an absent category (`src/pages/spar-penge/[slug].astro:23`). All eight definitions are inventoried; visible category/provider counts are unknown.
- **Sixteen fixed pages:** `/`; `/resources/`; `/om/`; `/redaktionel-metode/`; `/affiliatepolitik/`; the nine hubs `/guides/`, `/etf/`, `/skat/`, `/pension/`, `/platforme/`, `/ordbog/`, `/spar-penge/`, `/youtube/`, `/folketingsvalg/`; and the 2022/2026 election hubs. Their individual source paths and metadata owners are in JSON. The sitemap explicitly lists the first fourteen and derives the two year hubs (`src/pages/sitemap.xml.ts:54`, `:77`).
- **Editorial seams outside bodies:** lesson FAQ answers are in `src/data/lessons.ts` and feed FAQ JSON-LD (`src/pages/[slug].astro:68`). Course module descriptions feed the homepage (`src/pages/index.astro:14`). Author identity lives in `src/data/author.ts:2`. These belong in the relevant page's review.
- **Supporting copies:** `/llms.txt` and `/llms-full.txt` contain authored introductory copy and metadata summaries. The latter repeats resource lists in separate arrays (`src/pages/llms-full.txt.ts:117`, `:146`, `:164`, `:225`); it does not export full MDX bodies. Review these copies with `/resources/`, rather than counting every book or tool as a new article.

JSON separately records nine excluded routes/surfaces: login, OTP, 404, HTML sitemap, XML sitemap, both llms files, telemetry API and robots.txt. Navigation/footer text, breadcrumbs, generic disclaimers, banners and provider cards are shared UI or commercial data, not independent article bodies. The affiliate policy remains an editorial trust page. Exclusion from editorial dispatch does **not** imply `noindex`: `AuthLayout` currently passes no such flag (`src/layouts/AuthLayout.astro:12`).

## Duplicates and aliases

`src/data/glossary/pengestroem.mdx:1` and `src/data/glossary/pengestrøm.mdx:1` both use “Pengestrøm” as H1, but their bytes differ. Only Unicode ID `pengestrøm` is registered (`src/data/glossary.ts:2602`). Its canonical is `/ordbog/pengestr%C3%B8m/`; the transliterated file has **no supported canonical route**. Both remain separate. Inventory does not authorize publishing, merging, deleting or redirecting either.

No two MDX files had identical bytes. JSON records equal H1/title groups, including party names repeated across election years and pension terms shared with glossary entries. These are overlap signals, not proof that pages should merge. Preserve year-qualified keys and every existing route.

Two configured aliases remain separate records: `/risiko-og-risikoprofil/` → `/risikoprofil/` and `/investering-i-nedture/` → `/disciplin-i-nedture/` (`astro.config.mjs:10`). Redirect HTTP status and deployed behavior are unverified.

## Dynamic content: unknown populations, known read paths

**Video articles:** Convex `videos` stores `article`, summary, SEO fields, FAQ, takeaways and classification fields (`convex/schema.ts:68`, `:98`). The page queries `videos.getBySlug`, renders Markdown and uses optional summary/FAQ sections (`src/pages/youtube/[handle]/[slug].astro:18`, `:73`, `:213`, `:233`, `:239`). An existing record can render without an article; video-row count and article-body count must therefore be separate.

An authorized exhaustive inventory would consume `videos.listSweepPage` until `isDone`, then read each video using `videos.getByVideoId` or public `videos.get({videoId})` (`convex/videos.ts:200`, `:210`, `:346`). Count total rows, nonempty article bodies and complete posts separately. The sweep projection contains flags, not article text; audit queries return diagnostics (`convex/videos.ts:261`, `:276`). **No provider read was performed.**

Do not substitute frontend discovery for enumeration: the YouTube index fetches at most 200 videos (`src/pages/youtube/index.astro:18`), a channel fetches 200 (`src/pages/youtube/[handle]/index.astro:36`), and the sitemap fetches only 100 recent videos and requires a slug (`src/pages/sitemap.xml.ts:119`, `:133`). `getBySlug` selects the first matching slug and does not validate the incoming handle (`convex/videos.ts:355`; page `:18`). The page's canonical retains that incoming handle (`:75`). Card URLs can fall back to `videoId`, but the lookup only searches `by_slug`; the fallback is not proof of a working video-ID route. An export must retain record IDs and identify aliases/ambiguous slugs.

**Channel descriptions:** `channels.aiDescription` is optional (`convex/schema.ts:63`) and renders as paragraphs (`src/pages/youtube/[handle]/index.astro:95`). The page's meta description is separate template text (`:80`). `channels.listAll`/`channels.list` collect all channel rows; `channels.get` reads an individual record (`convex/channels.ts:70`, `:77`, `:90`). An authorized export must count rows, nonempty descriptions and records with routable `customUrl` separately. `getByHandle` requires `customUrl === @handle` (`:102`); a channel-ID fallback is not evidence of a supported channel route.

**Provider cards:** `affiliatePrograms.listApproved({market:"DK"})` supplies savings cards (`convex/affiliatePrograms.ts:78`). These affect the eight category routes but do not create another article population. Video, article, channel, description and provider counts remain null in JSON. No Convex CLI, external application API or backend mutation was used.

## Safe per-page work ownership

Keep **one Codex implementer and a separate reviewer per page**. The simplest safe workflow is to serialize complete tasks that share a metadata file. The JSON records each exact compound key; never assign an entire registry to several simultaneous writers.

For parallel MDX editing, let the page's implementer edit only its body and return a metadata proposal containing `page_id`, owner path, record key, base file hash, old/new values, factual evidence and link targets. The **same page implementer** applies that proposal later while holding the file's exclusive write turn. Re-read the current record, preserve other changes, and rebase stale proposals. Review the assembled body and metadata afterward. No registry refactor or agent-launch script is needed.

The shared files are `articles.ts` (12 articles plus `sectionMeta`), `lessons.ts` (47 lessons plus FAQs/module copy), `glossary.ts` (665 records plus publication rules), `pension.ts` (8), `platforms.ts` (7), `elections.ts` (28 plus two hubs), and `savings.ts` (8). Serialize savings writers because the **body itself** is in the shared file. Hub changes also contend on `src/lib/navigation.ts:21` (`sectionDescriptions`), `src/data/articles.ts:22` (`sectionMeta`) and module/election metadata. Related-card proposals can contend on `src/data/related.ts`. Do not let an article task change publication rules, aliases or shared renderers incidentally.

## Focused checks for later article work

Installed evidence: Node **24.22.1**, Bun **1.4.4** (manifest specifies `bun@1.4.2`), Astro **7.3.3**, MDX **8.0.1**, Astro check **0.9.10**, TypeScript **5.9.3**, Vitest **4.1.11**, Convex **1.32.0**. Versions came from CLI output and installed package manifests. Local `vitest run --help`, `astro --help` and `astro check --help` were read. These are available commands, **not test results**:

```sh
node_modules/.bin/vitest run src/data/articles.test.ts src/data/seo-quality.test.ts src/data/internal-links.test.ts
node_modules/.bin/vitest run src/data/lessons.test.ts src/data/platforms.test.ts src/data/elections.test.ts
bun run check
bun run build
```

Expected exit: **0** for each. The first group checks article registry uniqueness, existing article/glossary body/link gates and links from locally indexable MDX. Its link inventory omits election bodies and dynamic routes (`src/data/internal-links.test.ts:33`, `:45`). The second checks registry shapes/IDs, selected lookups and lesson file existence. Existing word/link floors (`src/data/seo-quality.test.ts:20`) do not prove factual correctness, natural Danish, useful layout or ranking performance. `package.json` defines check as `astro check` and build as check followed by build. Browser/layout verification remains a lead-owned follow-up after content changes, through the prescribed T3 preview.

Research-note verification uses JSON parsing, unique IDs, exact collection counts, complete MDX path reconciliation and source-path existence. No tests/builds were needed or run. No live layout, deployed publication, search indexing, external factual claim or dynamic population was verified. Concurrent source edits were preserved. The separate quality-standard document was not read or used.
