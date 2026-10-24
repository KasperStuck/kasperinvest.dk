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
an AI description for each channel. Code: `convex/youtube.ts` (actions), `convex/videos.ts` and
`convex/channels.ts` (queries and mutations), `convex/lib/` (provider, rules, prompts, loop).

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

Every generated part passes deterministic rules (`convex/lib/contentRules.ts`) and then a judge
call to the same model (score ≥ 7 of 10, and `danish`, `topicMatch`, `sourceSupported` all true).
Rule failures and judge objections are fed back into the next attempt.

- Article: Markdown only; starts with an intro paragraph; at least 3 `##` sections, `###` only
  inside a section, no `#` or `####`; no heading that repeats the title or SEO title, and no
  "Hovedpointer", "Ofte stillede spørgsmål" or "FAQ" heading (the page renders those); no HTML,
  links, images, URLs or code, also inside table cells; no "<" followed by a letter, "/", "!" or
  "?" anywhere; no "i denne video" phrasing; 800-1500 words; ends with a finished sentence.
- Analysis: SEO title 30-50 characters (the page appends " - KasperInvest"), SEO description
  110-160, summary 80-600, 1-8 themes, 1-3 categories from the fixed list, 3-6 key takeaways,
  3-5 unique FAQ questions ending with "?", relevance 0-100, no empty values, HTML or URLs.
- Channel description: exactly 2 paragraphs, 50-100 words, each paragraph at least 15 words,
  no headings, lists, HTML, URLs or first person.
- Plain-text fields (analysis, FAQ, channel description) reject any "<" followed by a letter,
  "/", "!" or "?". The video page also escapes "<" in its JSON-LD blocks.

### Budget, eligibility and failures

- Up to 3 attempts per part. One deadline per job: 8 minutes for transcript, analysis, article
  and publish. The transcript fetch is aborted at the deadline, and a transcript that arrives
  later is not saved. A judge call that ends past the deadline fails the run, and the publish
  mutations reject a write after the deadline. Each provider request times out after at most
  180 s; HTTP 408/409/429/5xx/529, network errors and failed response-body reads are retried
  twice (2 s, 8 s); 400/401/403/404/413 stop the job. Token usage of every response is logged
  (provider, model, request-id, input and output tokens) before its content is checked, so
  rejected responses (`max_tokens`, refusal, empty output) are logged too.
- Maximum provider calls per post: 2 parts × 3 attempts × (1 generation + 1 judge) = 12, plus
  transient retries. Claude thinking tokens are billed as output tokens. The real cost per post
  is unknown until measured (see `scripts/compare-models.ts` below).
- Only videos longer than 90 seconds (not Shorts) with a transcript of at least 300 words get a
  post; other videos end as `insufficient_source` without a provider call.
- Nothing is saved unless analysis and article both pass; one mutation publishes both and
  re-validates them. Stored content is never cleared or partly replaced. A changed post since the
  job started returns `stale` and is not overwritten.
- An exhausted run stores `aiFailureCount`, `aiLastFailedAt` and `aiLastIssues` (issue codes) on
  the video. HTTP 413 (request too large) also counts against the video
  (`provider_rejected_request`). Other provider errors (400, 401, 403, 404, other 4xx) and
  configuration errors can affect every video: the job logs them with status, error type and
  request-id and throws without changing the failure fields. A 400 is also returned when an
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
  get the same full job (`youtube:processNewVideo`), which fetches a missing transcript first and
  makes no provider call when the source is insufficient.
- Hourly `youtube:refreshVideoStats`: view and like counts, and a missing duration.
- Monday 08:00 UTC: refreshes channel info, then queues one description job per channel, 30 s
  apart.

### CLI commands

All commands are internal functions. Run them with the Convex CLI against the dev deployment;
adding `--prod` runs them on production and needs explicit authorization.

```sh
# Rerun one video post now (by videoId, or by slug; add channelId when the slug is ambiguous)
npx convex run youtube:rerunVideo '{"target":{"videoId":"VIDEO_ID"}}'
npx convex run youtube:rerunVideo '{"target":{"slug":"SLUG","channelId":"CHANNEL_ID"}}'
# Only the article, from the stored analysis
npx convex run youtube:rerunVideo '{"target":{"videoId":"VIDEO_ID"},"parts":"article"}'
# Dry run: returns the result and writes nothing, but still makes paid provider calls
npx convex run youtube:rerunVideo '{"target":{"videoId":"VIDEO_ID"},"dryRun":true}'

# Rerun one channel description (dryRun works the same way)
npx convex run youtube:rerunChannelDescription '{"channelId":"CHANNEL_ID"}'

# Audit stored content with the current rules: no provider calls, no writes.
# pageSize defaults to 10 (max 25). Repeat with the returned continueCursor until isDone is true;
# audit "videos" and "channels" separately.
npx convex run youtube:auditContent '{"table":"videos"}'
npx convex run youtube:auditContent '{"table":"videos","cursor":"CONTINUE_CURSOR"}'
npx convex run youtube:auditContent '{"table":"channels"}'

# Re-validate up to 5 videos and schedule a rerun (30 s apart) only for failing or missing posts
npx convex run youtube:regenerateInvalidPosts '{"targets":["VIDEO_ID_1","VIDEO_ID_2"]}'
```

Maintenance functions are internal too: `youtube:addChannel`, `youtube:addChannelByHandle`,
`videos:resetProcessing`, `videos:resetAllProcessing`, `videos:backfillHashtags` and
`channels:resetAllAiDescriptions`. The public `videos:saveTranscript` (used by
`scripts/sync-transcripts.ts`) only fills a missing transcript and never replaces one.

Video pages are cached with `max-age=300, stale-while-revalidate=3600`, so a rerun shows on the
site after up to 5 minutes, or up to 1 hour while a stale copy is served.

### Model comparison

`scripts/compare-models.ts` runs the production generation path (same prompts, rules and
attempt budget) for each video and model without writing to Convex. Unlike production, one judge
model (`--judge-model`, default `claude-opus-5-5`) judges every generator. With the defaults the
judge is also a generator, so it judges its own output; the script then prints a warning and
`report.md` notes it under the summary table. Pick a judge outside `--models` to avoid this.
Then each Claude model ranks the anonymized passing articles for natural,
correct Danish. The report shows each evaluator's ranks and a mean rank that leaves out each
evaluator's rank of its own article. Pass rate = passed / runs that generated; errors count as
not passed and are listed separately.

```sh
bun scripts/compare-models.ts --slugs slug-a,slug-b [--models claude-haiku-5-5,claude-sonnet-5-5,claude-opus-5-5] [--judge-model claude-opus-5-5] [--include-openrouter] [--out <dir>] [--yes]
```

It reads `CONVEX_URL`, `ANTHROPIC_API_KEY` and optionally `OPENROUTER_API_KEY` /
`OPENROUTER_MODEL` (Bun loads `.env.local`), prints the configured maximum number of provider
calls before it starts, and refuses more than 5 slugs or 4 models without `--yes`. It writes
`report.md`, `results.json` and `mapping.json` (label → model) to
`.content-research/model-compare-<timestamp>/` by default. Every run makes paid provider calls.

### Accepted risks

- `videos:saveTranscript` is public and unauthenticated. It never replaces a transcript, but
  anyone can still seed a missing one.
- `scripts/compare-models.ts --out` writes to any path the operator gives.
