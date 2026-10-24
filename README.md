# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun run dev`             | Starts local dev server at `localhost:4321`      |
| `bun run build`           | Build your production site to `./dist/`          |
| `bun run preview`         | Preview your build locally, before deploying     |
| `bun run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun run astro --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## YouTube AI content (Convex)

The Convex backend writes an AI post for each YouTube video (analysis: summary, SEO title and
description, themes, categories, key takeaways, FAQ, relevance score; plus a Markdown article) and
an AI description for each channel. Code: `convex/aiPosts.ts` (AI jobs and their CLI commands,
Convex runtime), `convex/youtube.ts` (YouTube sync and transcript fetch, Node runtime),
`convex/videos.ts` and `convex/channels.ts` (queries and mutations), `convex/lib/` (provider,
rules, fact-check, prompts, loop, prices).

### Environment variables (Convex deployment)

| Variable | Used when | Default |
| --- | --- | --- |
| `AI_PROVIDER` | always | unset or empty = `openrouter`; `claude` = Anthropic Messages API |
| `ANTHROPIC_API_KEY` | `AI_PROVIDER=claude` | required; a standard (single-workspace) API key, no workspace header is sent |
| `ANTHROPIC_MODEL` | `AI_PROVIDER=claude` | `claude-sonnet-5-5` |
| `OPENROUTER_API_KEY` | `AI_PROVIDER=openrouter` | required |
| `OPENROUTER_MODEL` | `AI_PROVIDER=openrouter` | `nvidia/nemotron-3-super-120b-a12b:free` |
| `YOUTUBE_API_KEY` | YouTube sync | required |

There is no fallback between providers. A missing key or an unknown `AI_PROVIDER` stops the job
with an error that names the variable. Claude requests use `max_tokens` 16000 and
`output_config.effort: "medium"`; JSON parts use structured outputs.
Models and prices: <https://platform.claude.com/docs/en/about-claude/models/overview>,
<https://platform.claude.com/docs/en/about-claude/pricing>.

### Content rules

Every generated part passes deterministic rules (`convex/lib/contentRules.ts`, detectors in
`convex/lib/style.ts`), then (video posts only) a fact-check against the full source, then a
judge call to the same model (score ≥ 7 of 10, and `danish`, `topicMatch`, `sourceSupported` all
true). Rule errors and fact-check errors (with up to five short examples from the generated text,
never source text) and judge objections are fed back into the next attempt. Warnings never block;
they are listed for the judge, which weighs them in context. The same deterministic functions run
in the generation loop, in `videos.publishPost` / `channels.publishAiDescription` before a write,
and in the audit (`youtube:auditContent`, `aiPosts:regenerateInvalidPosts`). The year check
compares against the stored title, description and full transcript.

Before validation a deterministic normalize step replaces an en dash (U+2013, also as `&ndash;`
or `&#8211;`) directly between two digits with "-", so "2020–2024" becomes "2020-2024" without a
paid retry. Old posts keep their dashes until they are regenerated; the audit reports them.

Text checks use the visible text per block (heading, paragraph, list item, table cell) with
Markdown removed and HTML entities decoded. Sentences are split at `.`, `!`, `?` or `…` before a
word that is not lowercase; Danish abbreviations (f.eks., bl.a., dvs., ca. …) and initials do not
end a sentence.

Shared by all generated text:

- `thought_dash` (error): every "–" (U+2013), "—" or "―", literal or entity-encoded, ranges
  included; " - " between lowercase words or digits. Ranges use a hyphen (2020-2024, 5-6 %).
  Allowed: unspaced hyphens in compounds and ranges (ETF-investering, 2020-2024), negative
  numbers and list markers. `thought_dash_ambiguous` (warning): " - " next to a capitalized word
  (maybe a name). Prompts name the banned characters by code point and never write them, and the
  judge's reason loses its dashes before it is fed back.
- `ai_phrase` (error): fixed filler phrases such as "i en verden, hvor", "det er værd at bemærke",
  "spiller en afgørende rolle", "alt i alt", "kort sagt", "samlet set", "afslutningsvis", "dykke
  ned i", "sømløs", "holistisk", "din økonomiske rejse", "det finansielle landskab" (full list:
  `AI_PHRASES`). `ai_word_overuse` (warning): words like "afgørende", "det er vigtigt at",
  "ikke kun … men også", "understrege", "robust" (`AI_OVERUSE`) used more than twice in an
  article or more than once in an analysis or channel description.
- `sentence_too_long`: error over 50 words, warning over 40 (article paragraphs and list items,
  summary, key takeaways, FAQ answers, channel description).

Analysis:

- SEO title 30-50 characters without "|" or "KasperInvest" (`seo_title_separator`; the page
  appends " - KasperInvest"); SEO description 110-160.
- Summary = the intro: the short description at the top of the page, 150-350 characters in 1-2
  sentences (`summary_length`, `summary_sentences`). The first sentence gives the main point and
  the most important number or name from the source, written for search and AI answers; the
  judge scores a summary that does not lead with the main point below 7.
- 1-8 themes, 1-3 categories from the fixed list, 3-6 key takeaways of 6-25 words each
  (`key_takeaway_length`), relevance 0-100, no empty values, HTML or URLs.
- FAQ: 3-5 unique questions, each with one "?" at the end and at most 120 characters
  (`faq_question_mark`); answers of 1-3 sentences and at most 70 words (`faq_answer_length`) that
  never say the source does not answer or refer to the source (`faq_unanswered`). The page renders
  the FAQ as its own section with FAQPage JSON-LD from the same array.
- Summary, key takeaways and FAQ answers may not open with "Videoen", "I videoen" or "Denne video"
  (`video_reference`); no "skaberen", "videoskaberen" or "youtuberen" (`anonymous_creator`).
- No verbatim run of 8 words between summary and SEO description or a key takeaway
  (`duplicate_text`).
- Years (1900-2099, not amounts like "2000 kr") must appear in the title, description or
  transcript (`unsupported_year`; `year_unverified` warning when no transcript is stored).

Article:

- Markdown only: no HTML, links, images, URLs or code, also inside table cells; no "<" followed by
  a letter, "/", "!" or "?" anywhere.
- Starts directly with a `##` heading, because the summary above it is the intro
  (`starts_without_section`), then 3-6 `##` sections in total (`too_few_sections`,
  `too_many_sections`); `###` only inside a section, no `#` or `####`.
- No heading that repeats the title or SEO title, no "Hovedpointer", "Ofte stillede spørgsmål"
  or "FAQ" heading (the page renders those), and no closing heading such as Konklusion,
  Afrunding, Afslutning, Opsummering, Sammenfatning, Samlet set or Til slut (`closing_heading`).
- 500-1500 words (the prompt asks for 700-1200, shorter for a thin source); ends with a finished
  sentence.
- Paragraphs: error over 100 words, warning over 80 (`paragraph_too_long`); a paragraph may not
  be only italic or bold text (`emphasis_only_paragraph`); warning when sentences average more
  than 25 words (`sentence_avg_long`).
- No "videoen" or "denne video" (`video_reference`), no anonymous creator, no verbatim run of 8
  words from the summary or a key takeaway (`duplicate_text`), years only from the source.
- Warnings: `not_danish`, `title_keywords_missing`.

Channel description: exactly 2 paragraphs, 50-100 words, each paragraph at least 15 words, no
headings, lists, HTML, URLs or first person, plus the shared dash, phrase and sentence rules.

Style rules in every prompt and the judge also ask for natural Danish with context: write like a
Danish financial journalist, Danish word order, no translated English idioms, and give each fact
its context (who says it, why it matters to a Danish private investor, the source's conditions
such as horizon, risk and tax). The judge scores facts without context or translated-sounding
text below 7 and sets `danish=false` for unnatural Danish. There is no deterministic
naturalness rule.

Plain-text fields (analysis, FAQ, channel description) reject any "<" followed by a letter, "/",
"!" or "?". The video page also escapes "<" in its JSON-LD blocks. `RULESET_VERSION` in
`convex/lib/style.ts` changes with the rules and is recorded in sampler reports.

### Fact-check

`convex/lib/factCheck.ts` checks the analysis and the article (not the channel description) after
the deterministic rules and before the judge, with the judge's model. Its source is the title,
the description and the whole transcript, cut into chunks of 60,000 characters with 1,000
characters of overlap. The first chunk's call extracts every claim (number, year, name, quote,
or a material financial assertion without numbers such as tax, risk, causation or product rules)
and checks it; every later chunk rechecks every claim. One call per chunk.

- The candidate is split into segments with stable ids (each analysis field and FAQ question and
  answer; each article heading, paragraph, list item and table cell). The answer must list every
  segment once with its claim ids or a reason without facts; a missing, duplicate or unknown id
  (`fact_check_coverage`) or a quote that is not in its segment (`fact_check_quote`) rejects the
  answer and consumes the attempt, like a malformed judge answer.
- Evidence must be a verbatim, contiguous span of the source after normalization (NFKC, case,
  whitespace, typographic quotes only; signs, %, units, decimal and grouping marks and token
  boundaries are kept). Numbers, quotes and assertions need the transcript; names and years may
  rest on the title or description. A supported number or year must carry the same numbers as
  its evidence. Anything else counts as not found.
- Per claim over all chunks: supported (some chunk supports, none contradicts), contradicted, or
  both. Errors: `fact_unsupported` (not found), `fact_contradicted`, `fact_ambiguous` (support
  and contradiction: say who says what or drop it) and `fact_uncovered` (a digit-bearing token or
  a capitalized multi-word name outside the title and channel name that no claim quote covers).
- Supported claims are listed for the judge, which must not reject them only because the
  evidence lies outside its 18,000-character transcript excerpt.

### Budget, eligibility and failures

- Up to 3 attempts per part. AI jobs run in `convex/aiPosts.ts` in the Convex runtime (30-minute
  action limit; Node actions have 10). One deadline per job, 25 minutes from when the aiPosts
  action starts (after any stagger), for transcript, analysis, article and publish. A missing
  transcript is fetched by the Node action `youtube:fetchTranscriptForJob` within the time left
  (at most 8 minutes); a transcript that arrives after the deadline is not saved. A judge call
  that ends past the deadline fails the run, and the publish
  mutations reject a write after the deadline. Each provider request times out after at most
  180 s; HTTP 408/409/429/5xx/529, network errors and failed response-body reads are retried
  twice (2 s, 8 s); 400/401/403/404/413 stop the job. Token usage of every response is logged
  (provider, model, request-id, input and output tokens) before its content is checked, so
  rejected responses (`max_tokens`, refusal, empty output) are logged too.
- Maximum provider calls per post with C fact-check chunks: 2 parts × 3 attempts × (1
  generation + 1 judge + C fact-check calls) = 6C + 12 logical calls (18 for a transcript up to
  60,000 characters); each may be sent up to 3 times (two transient retries), so at most 3 ×
  (6C + 12) physical requests. Claude thinking tokens are billed as output tokens. The real cost
  per post is unknown until measured (see `scripts/compare-models.ts` below).
- Only videos longer than 90 seconds (not Shorts) with a transcript of at least 300 words get a
  post; other videos end as `insufficient_source` without a provider call.
- Nothing is saved unless analysis and article both pass; one mutation publishes both and
  re-validates them. An article-only publish re-validates the stored analysis too. Stored content is never cleared or partly replaced. A post changed since the
  job started returns `stale` and is not overwritten. So does a changed source: every write of
  the transcript raises `sourceVersion` on the video, and `publishPost` only accepts the version
  the job read (or wrote itself) at the start.
- An exhausted content-repair run or a missed deadline stores `aiFailureCount`, `aiLastFailedAt` and `aiLastIssues` (issue codes) on
  the video. HTTP 413 (request too large) also counts against the video
  (`provider_rejected_request`). Other provider errors (400, 401, 403, 404, other 4xx) and
  configuration errors can affect every video: the job logs them with status, error type and
  request-id and throws without changing the failure fields. Exhausted availability errors
  (429, 5xx, network failures) also stop without a content-repair retry or a per-video failure.
  Their two bounded transport retries still apply. A 400 is also returned when an
  organization or workspace spend limit is reached
  ([Claude API errors](https://platform.claude.com/docs/en/api/errors)). The daily sweep skips videos with 3
  or more failures or a failure within the last 20 hours. A successful publish clears these
  fields. Manual reruns ignore the gate.
- Live and upcoming videos sync with duration 0; the hourly stats refresh fills in the duration
  once YouTube reports one, so they are no longer treated as Shorts.

### Schedules

- Daily 01:00 UTC `youtube:syncAllChannels`: syncs new videos (each insert schedules its own
  job, 30 s apart across all channels), then queues up to 10 jobs for older incomplete videos,
  continuing the same 30 s spacing after the new-video jobs: first videos with a transcript,
  newest first, then videos still missing one. All
  get the same full job (`aiPosts:generateVideoPost`), which fetches a missing transcript first
  and makes no provider call when the source is insufficient.
- Hourly `youtube:refreshVideoStats`: view and like counts, and a missing duration.
- Monday 08:00 UTC: refreshes channel info, then queues one description job per channel
  (`aiPosts:generateChannelDescription`), 30 s apart.
- The old job names in `convex/youtube.ts` (`processNewVideo`, `processVideo`, `generateArticle`,
  `generateChannelDescription`) stay with their arguments for jobs that are already scheduled;
  each only schedules the matching aiPosts job.

### CLI commands

All commands are internal functions. Run them with the Convex CLI against the dev deployment;
adding `--prod` runs them on production and needs explicit authorization.

```sh
# Rerun one video post now (by videoId, or by slug; add channelId when the slug is ambiguous)
npx convex run aiPosts:rerunVideo '{"target":{"videoId":"VIDEO_ID"}}'
npx convex run aiPosts:rerunVideo '{"target":{"slug":"SLUG","channelId":"CHANNEL_ID"}}'
# Only the article, from the stored analysis. Stops before any provider call when the stored
# analysis fails the current rules (true for most posts from the old flow); use parts "all" then.
npx convex run aiPosts:rerunVideo '{"target":{"videoId":"VIDEO_ID"},"parts":"article"}'
# Dry run: returns the result and publishes no post, but it costs money: every provider call
# (generation, fact-check, judge) is made and billed
npx convex run aiPosts:rerunVideo '{"target":{"videoId":"VIDEO_ID"},"dryRun":true}'

# Rerun one channel description (dryRun works the same way)
npx convex run aiPosts:rerunChannelDescription '{"channelId":"CHANNEL_ID"}'

# Audit stored content with the current rules: no provider calls, no writes.
# pageSize defaults to 10 (max 25). Repeat with the returned continueCursor until isDone is true;
# audit "videos" and "channels" separately.
npx convex run youtube:auditContent '{"table":"videos"}'
npx convex run youtube:auditContent '{"table":"videos","cursor":"CONTINUE_CURSOR"}'
npx convex run youtube:auditContent '{"table":"channels"}'

# Re-validate up to 5 videos and schedule a rerun (30 s apart) only for failing or missing posts
npx convex run aiPosts:regenerateInvalidPosts '{"targets":["VIDEO_ID_1","VIDEO_ID_2"]}'
```

The old CLI names `youtube:rerunVideo`, `youtube:rerunChannelDescription` and
`youtube:regenerateInvalidPosts` still work with the same arguments: they call the aiPosts
command and return its result, but run inside a Node action and so stop after 10 minutes.

| Function | Runtime | Args | Returns | Deadline |
| --- | --- | --- | --- | --- |
| `aiPosts:generateVideoPost` (scheduled) | Convex | `{videoId}` | job result | 25 min from start |
| `aiPosts:generateChannelDescription` (scheduled) | Convex | `{channelId}` | job result | 25 min from start |
| `aiPosts:rerunVideo` | Convex | `{target, parts?, dryRun?}` | job result (incl. dryRun post) | 25 min from start |
| `aiPosts:rerunChannelDescription` | Convex | `{channelId, dryRun?}` | job result | 25 min from start |
| `aiPosts:regenerateInvalidPosts` | Convex | `{targets}` (≤ 5) | receipts; schedules `aiPosts:rerunVideo` | none (no provider calls) |
| `youtube:fetchTranscriptForJob` | Node | `{videoId, timeoutMs}` | transcript segments | min(timeoutMs, 8 min) |
| `youtube:processNewVideo`, `processVideo`, `generateArticle` | Node | `{videoId}` | `null`; schedules `aiPosts:generateVideoPost` | none |
| `youtube:generateChannelDescription` | Node | `{channelId}` | `null`; schedules `aiPosts:generateChannelDescription` | none |
| `youtube:rerunVideo`, `rerunChannelDescription`, `regenerateInvalidPosts` | Node | unchanged | the aiPosts result | Node 10-min limit |

Maintenance functions are internal too: `youtube:addChannel`, `youtube:addChannelByHandle`,
`videos:resetProcessing`, `videos:resetAllProcessing`, `videos:backfillHashtags` and
`channels:resetAllAiDescriptions`. Transcript maintenance uses the internal
`videos:needsTranscript` query and `videos:saveTranscript` mutation. The query returns only up
to 50 missing transcript IDs. Uploads only fill a missing or empty transcript, never replace
one, and increment `sourceVersion`. They do not schedule generation.

`bun scripts/sync-transcripts.ts` fetches captions locally and uploads them through the
installed Convex CLI with its existing administrator login. The default (also `--dev`) uses
the CLI's development selection. Production requires `bun scripts/sync-transcripts.ts --prod`.
Both the query and every upload use the same selection and a snapshot of `CONVEX_DEPLOYMENT`
loaded by Bun from the project environment. The script does not use `CONVEX_URL` to choose a
target. It refuses deploy-key and self-hosted overrides. It never pushes code or runs codegen.
These internal function boundaries take effect on a deployment only after the code is deployed.

Each CLI call has a 60-second limit and a 64 KiB response limit. Transcript JSON arguments
larger than 96 KiB are skipped as failures, because this CLI accepts JSON through argv and
has no arguments-file option. Logs show counts only; raw CLI errors and transcript text are
suppressed. Failed fetches or uploads produce exit code 1. The local YouTube fetch is unchanged.

Video pages are cached with `max-age=300, stale-while-revalidate=3600`, so a rerun shows on the
site after up to 5 minutes, or up to 1 hour while a stale copy is served.

### Content sampling

`scripts/content-sample.ts` (`bun run content:sample`) pulls a seeded random or filtered sample of
stored posts, re-validates it with the rules in this checkout (not the deployed ones) and writes
review files for people to read. It only reads: it runs `node_modules/.bin/convex run` (no shell)
on four queries, `videos:listSweepPage`, `videos:getByVideoId`, `videos:listByChannel` and
`channels:getByChannelId`, and refuses any other function. It needs no deploy and makes no
provider calls.

```sh
bun run content:sample -- --prod --n 30 --seed 20261024
bun run content:sample -- --dev --failing-only --eligible-only --min-relevance 40
bun run content:sample -- --deployment-name NAME --channel CHANNEL_ID --from 2026-01-01 --to 2026-06-30
bun run content:sample -- --prod --ids VIDEO_ID_1,VIDEO_ID_2
# Offline, from a jsonl dump of video documents (optionally channels too)
bun scripts/content-sample.ts --input videos.jsonl [--channels-input channels.jsonl] --n 10 --seed 1
```

- Exactly one of `--prod`, `--dev` (the CLI's default deployment), `--deployment-name NAME` or
  `--input FILE`. The run stops when `CONVEX_DEPLOY_KEY` is set, because that key overrides the
  deployment flags. `--prod` reads production data and needs the same authorization as any other
  production read.
- `--n` 1-100 (default 10); `--seed` (default: the current time; printed and stored).
  `--channel` takes a channel id (not an @handle) and samples among the channel's newest 50
  videos. `--from`/`--to` filter on the publish date. `--ids` is a fixed cohort in the given
  order, without random selection or filters. At most 300 documents are read per run.
- Output goes to `.content-research/content-sample-<timestamp>/` (or `--out`, which must be
  inside `.content-research/`): one Markdown file per post in page order (meta line, SEO block,
  summary, Hovedpointer, article, FAQ, then `## Stikprøve-noter` with every issue and its
  examples), `report.md`, `metrics.json`, `manifest.json` (origin, seed, filters, ids,
  processedAt, git revision, rule-set version) and `targets.txt`.
- Population numbers come from `listSweepPage` only (count, posts, Shorts, eligibility, failure
  state); everything else is labelled as the sample. Shorts with an old post (`old_short_post`)
  and relevance under 40 (`low_relevance`) are report flags only.
- `targets.txt` lists eligible (over 90 s, transcript of at least 300 words), relevance ≥ 40 and
  failing posts as JSON arrays of at most 5 ids, one per line, for
  `npx convex run aiPosts:regenerateInvalidPosts '{"targets":[...]}'` (paid; needs approval).
- Transcripts are used in memory for word counts and the year check only. They are never written
  or printed, and errors name the function, file line or field names, never document content.
  The CLI's own stderr is discarded; rerun the same `convex run` by hand to see a CLI error.

### Model comparison

`scripts/compare-models.ts` runs the production generation path (same prompts, rules and
attempt budget, fact-check included) for each video and model without writing to Convex. Unlike
production, one judge model (`--judge-model`, default `claude-opus-5-5`) judges and fact-checks
every generator; the script states it in its output and in `results.json`. With the defaults the
judge is also a generator, so it judges its own output; the script then prints a warning and
`report.md` notes it under the summary table. Pick a judge outside `--models` to avoid this.
Then each Claude model ranks the anonymized passing posts for natural,
correct Danish. Each post is the whole visible text in page order (summary, Hovedpointer,
article, FAQ), shown blind in `report.md` with its rule warnings. The report shows each
evaluator's ranks and a mean rank that leaves out each evaluator's rank of its own post. Pass rate = passed / runs that generated; errors count as
not passed and are listed separately.

```sh
bun scripts/compare-models.ts --slugs slug-a,slug-b --max-usd 5 [--models claude-haiku-5-5,claude-sonnet-5-5,claude-opus-5-5] [--judge-model claude-opus-5-5] [--include-openrouter] [--out <dir>] [--yes]
```

`--max-usd` is required: a hard cap on the run's spend, which Convex does not meter. Before every
physical request the script reserves the model's entire documented input window (including the
response schema and provider-added instructions), plus `max_tokens` output at the highest
list-price tier from `convex/lib/pricing.ts`. It stops before that reservation exceeds the cap.
For the supported direct Claude models this is 1M input tokens plus maximum output, so a small
cap can stop the run before its first call. Token-counting estimates are not treated as bounds.
Valid positive token usage replaces the reservation; missing, invalid or zero usage keeps it.
Every physical retry needs a new reservation, while ambiguous prior requests retain theirs.
A stopped run still writes its report and exits with an error. Other providers and models without
a verified bound are refused. Before it starts, the script reads the videos and prints the call bound per run: per post
6C + 12 logical calls from each transcript's fact-check chunks, plus one ranking call per
evaluator and video, and the physical bound with transient retries.

It reads `CONVEX_URL`, `ANTHROPIC_API_KEY` and optionally `OPENROUTER_API_KEY` /
`OPENROUTER_MODEL` (Bun loads `.env.local`) and refuses more than 5 slugs or 4 models without
`--yes`. It writes
`report.md`, `results.json` and `mapping.json` (label → model) to
`.content-research/model-compare-<timestamp>/` by default. Every run makes paid provider calls.

### Accepted risks

- `scripts/compare-models.ts --out` writes to any path the operator gives.
