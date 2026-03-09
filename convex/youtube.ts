"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ChatOpenRouter } from "@langchain/openrouter";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import slugify from "slugify";
import { parseDuration, bestThumbnail, extractHashtags, getTranscriptText, forEachSafe, cleanDescription } from "./helpers";

// --- Config ---

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

function youtubeApiKey() {
	const key = process.env.YOUTUBE_API_KEY;
	if (!key) throw new Error("Missing YOUTUBE_API_KEY env var");
	return key;
}

function aiModel() {
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) throw new Error("Missing OPENROUTER_API_KEY env var");
	return new ChatOpenRouter({ model: "openrouter/free", apiKey: key });
}

// --- Helpers ---

async function ytFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${YOUTUBE_API}/${path}&key=${youtubeApiKey()}`);
	if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);
	return res.json();
}

// --- AI quality validation ---

const QUALITY_PROMPT = ChatPromptTemplate.fromMessages([
	[
		"system",
		`Du er en dansk tekstforfatter og korrekturlæser med speciale i økonomi og investering.

Bedøm den givne tekst på en skala fra 1-10 ud fra disse kriterier:
- Sprog: Er teksten skrevet på naturligt, flydende dansk? Ingen vrøvl, stavefejl, blandede sprog eller uforståelige sætninger.
- Relevans: Handler teksten om det emne der er beskrevet i konteksten?
- Kvalitet: Er teksten velskrevet, professionel og informativ?
- Troværdighed: Lyder teksten som noget en dansk finansskribent ville skrive?

VIGTIGT: Hvis teksten indeholder nonsens, blandede sprog, eller ikke er naturligt dansk, skal scoren ALTID være under 5.

En score på 9+ betyder at teksten er klar til publicering uden rettelser.
En score under 9 betyder at teksten har problemer der kræver regenerering.

Svar KUN med valid JSON.`,
	],
	[
		"human",
		`Kontekst: {context}

Tekst der skal bedømmes:
{text}

Svar med JSON: {{"score": <1-10>, "reason": "Kort forklaring"}}`,
	],
]);

async function generateWithQuality<T>(opts: {
	generate: () => Promise<T>;
	extractText: (result: T) => string;
	context: string;
	maxAttempts?: number;
}): Promise<T | null> {
	const { generate, extractText, context, maxAttempts = 3 } = opts;
	const validator = QUALITY_PROMPT.pipe(aiModel()).pipe(
		new JsonOutputParser<{ score: number; reason: string }>(),
	);

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const result = await generate();
			const text = extractText(result);

			if (!text || text.length < 10) {
				console.warn(`Attempt ${attempt}: generated text too short, retrying`);
				continue;
			}

			const evaluation = await validator.invoke({ context, text });
			console.log(`Attempt ${attempt}: score ${evaluation.score}/10 — ${evaluation.reason}`);

			if (evaluation.score >= 9) return result;
		} catch (e) {
			console.warn(`Attempt ${attempt} failed:`, e);
		}
	}

	console.error(`Failed to reach quality threshold after ${maxAttempts} attempts for: ${context}`);
	return null;
}

async function generateText(prompt: ChatPromptTemplate, vars: Record<string, string>, context: string): Promise<string | null> {
	const chain = prompt.pipe(aiModel());
	return generateWithQuality({
		generate: async () => {
			const res = await chain.invoke(vars);
			return typeof res.content === "string" ? res.content.trim() : String(res.content).trim();
		},
		extractText: (text) => text,
		context,
	});
}

// --- Prompts ---

const VIDEO_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
	[
		"system",
		`Du er en dansk tekstforfatter med ekspertise i privatøkonomi og investering.
Skriv ALTID på naturligt, flydende dansk. Analysér YouTube-videoer og returnér udelukkende valid JSON.

Gyldige kategorier: privatøkonomi, aktier, ETF, obligationer, skat, pension, strategi, psykologi, analyse, krypto, bolig, FIRE, marked, andet

relevanceScore: 0 = irrelevant for dansk privatinvestor, 100 = meget relevant.`,
	],
	[
		"human",
		`Analysér denne video:

Titel: {title}
Beskrivelse: {description}
{transcriptSection}

Svar KUN med valid JSON i dette format:
{{"summary": "Dansk opsummering (2-3 sætninger)", "seoTitle": "SEO-titel (maks 60 tegn, fængende, inkludér nøgleord)", "seoDescription": "SEO meta-beskrivelse (maks 155 tegn, inkludér nøgleord, opfordr til klik)", "themes": ["tema1", "tema2"], "categories": ["kategori1"], "keyTakeaways": ["pointe1", "pointe2", "pointe3"], "faq": [{{"question": "Relevant spørgsmål?", "answer": "Kort, præcist svar (1-2 sætninger)"}}, {{"question": "...", "answer": "..."}}], "relevanceScore": 75}}

faq: Generér 3-5 ofte stillede spørgsmål med svar baseret på videoens indhold. Spørgsmålene skal være naturlige søgeforespørgsler en dansk investor ville stille.`,
	],
]);

const ARTICLE_PROMPT = ChatPromptTemplate.fromMessages([
	[
		"system",
		`Du er en erfaren dansk tekstforfatter med speciale i privatøkonomi og investering. Skriv en grundig, velformuleret artikel baseret på en YouTube-video.

Regler:
- Skriv på naturligt, flydende dansk i en professionel men tilgængelig tone
- Skriv KUN ren Markdown — brug ALDRIG HTML-tags som <h2>, <h3>, <p>, <ul>, <b> osv.
- Brug Markdown-formatering: overskrifter (##), afsnit, fed tekst (**tekst**), punktlister (-)
- Strukturér artiklen med en indledning, flere sektioner med overskrifter, og en afrunding
- Artiklen skal være 800-1500 ord
- Forklar begreber kort når de introduceres
- Inkludér konkrete pointer og eksempler fra videoen
- Skriv IKKE "I denne video" eller lignende — skriv som en selvstændig artikel
- Brug IKKE h1 (#) — start med h2 (##)`,
	],
	[
		"human",
		`Skriv en artikel baseret på denne video:

Titel: {title}
Kanal: {channelName}
Opsummering: {summary}
Hovedpointer: {keyTakeaways}
Temaer: {themes}

Beskrivelse:
{description}

{transcriptSection}

Skriv artiklen nu:`,
	],
]);

const CHANNEL_DESCRIPTION_PROMPT = ChatPromptTemplate.fromMessages([
	[
		"system",
		`Du er en erfaren dansk tekstforfatter med speciale i privatøkonomi og investering. Skriv en unik kanalbeskrivelse til en YouTube-kanal.

Regler:
- Skriv på naturligt, flydende dansk i en professionel men tilgængelig tone — som en rigtig dansk journalist ville skrive
- Beskrivelsen skal være ca. 70 ord fordelt på præcis 2 afsnit
- Første afsnit: Hvad kanalen handler om, hvem den henvender sig til, og hvilke emner der dækkes
- Andet afsnit: Hvad der gør kanalen unik eller aktuel, baseret på de seneste videoer
- Brug kanalens originale beskrivelse som udgangspunkt, men omskriv den fuldstændigt
- Skriv IKKE i første person — skriv som en neutral redaktionel beskrivelse
- Nævn IKKE specifikke videoer ved navn
- Adskil afsnit med en tom linje`,
	],
	[
		"human",
		`Skriv en unik kanalbeskrivelse baseret på følgende:

Kanalnavn: {channelName}
Original beskrivelse: {originalDescription}

Seneste videoer:
{recentVideos}

Skriv kun selve beskrivelsen (ca. 70 ord, præcis 2 afsnit adskilt med tom linje), intet andet:`,
	],
]);

// --- Channel actions (public) ---

async function fetchAndUpsertChannel(
	ctx: { runMutation: (...args: any[]) => Promise<any> },
	channelId: string,
) {
	const data = await ytFetch<{ items: any[] }>(
		`channels?part=snippet,contentDetails,statistics&id=${channelId}`,
	);
	if (!data.items?.length) throw new Error(`Channel ${channelId} not found`);

	const ch = data.items[0];

	await ctx.runMutation(internal.channels.upsert, {
		channelId,
		name: ch.snippet.title,
		description: ch.snippet.description ?? undefined,
		customUrl: ch.snippet.customUrl ?? undefined,
		country: ch.snippet.country ?? undefined,
		uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
		thumbnailUrl: ch.snippet.thumbnails?.medium?.url ?? undefined,
		bannerUrl: undefined,
		subscriberCount: Number(ch.statistics.subscriberCount) || 0,
		videoCount: Number(ch.statistics.videoCount) || 0,
	});

	return ch.snippet.title as string;
}

export const addChannel = action({
	args: { channelId: v.string() },
	handler: async (ctx, { channelId }) => {
		const name = await fetchAndUpsertChannel(ctx, channelId);
		return { name };
	},
});

export const addChannelByHandle = action({
	args: { handle: v.string() },
	handler: async (ctx, { handle }) => {
		const lookup = await ytFetch<{ items: any[] }>(
			`channels?part=id&forHandle=${encodeURIComponent(handle)}`,
		);
		if (!lookup.items?.length) throw new Error(`Handle ${handle} not found`);

		const channelId = lookup.items[0].id;
		const name = await fetchAndUpsertChannel(ctx, channelId);
		return { name, channelId };
	},
});

// --- Single-item actions (internal) ---

export const syncChannelVideos = internalAction({
	args: { channelId: v.string(), maxResults: v.optional(v.number()) },
	handler: async (ctx, { channelId, maxResults }) => {
		const channel = await ctx.runQuery(internal.channels.getByChannelId, { channelId });
		if (!channel) throw new Error(`Channel ${channelId} not in database`);

		const playlist = await ytFetch<{ items: any[] }>(
			`playlistItems?part=snippet&playlistId=${channel.uploadsPlaylistId}&maxResults=${maxResults ?? 10}`,
		);
		if (!playlist.items?.length) return { synced: 0 };

		const ids = playlist.items.map((i: any) => i.snippet.resourceId.videoId);
		const details = await ytFetch<{ items: any[] }>(
			`videos?part=snippet,contentDetails,statistics&id=${ids.join(",")}`,
		);

		let synced = 0;
		for (const vid of details.items ?? []) {
			const exists = await ctx.runQuery(internal.videos.getByVideoId, { videoId: vid.id });
			if (exists) continue;

			const durationSeconds = parseDuration(vid.contentDetails?.duration ?? "");
			const description = vid.snippet.description ?? "";

			await ctx.runMutation(internal.videos.insert, {
				videoId: vid.id,
				slug: slugify(vid.snippet.title, { lower: true, strict: true }),
				channelId,
				title: vid.snippet.title,
				description,
				publishedAt: vid.snippet.publishedAt,
				thumbnailUrl: bestThumbnail(vid.snippet.thumbnails),
				duration: vid.contentDetails?.duration,
				durationSeconds,
				viewCount: Number(vid.statistics?.viewCount) || 0,
				likeCount: Number(vid.statistics?.likeCount) || 0,
				tags: vid.snippet.tags ?? [],
				hashtags: extractHashtags(description),
				isShort: durationSeconds <= 60,
			});
			synced++;
		}

		await ctx.runMutation(internal.channels.updateLastSynced, {
			channelId,
			lastSyncedAt: Date.now(),
		});

		return { synced };
	},
});

export const fetchTranscript = internalAction({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.runQuery(internal.videos.getByVideoId, { videoId });
		if (!video || video.transcript) return;

		try {
			const { fetchTranscript } = await import("@egoist/youtube-transcript-plus");
			const result = await fetchTranscript(videoId);

			await ctx.runMutation(internal.videos.updateTranscript, {
				videoId,
				transcript: result.segments.map((entry) => ({
					text: entry.text,
					offset: Math.round(entry.offset),
					duration: Math.round(entry.duration),
				})),
			});
		} catch (e) {
			console.error(`Transcript fetch failed for ${videoId}:`, e);
		}
	},
});

export const processVideo = internalAction({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.runQuery(internal.videos.getByVideoId, { videoId });
		if (!video || video.processedAt) return;

		const chain = VIDEO_ANALYSIS_PROMPT.pipe(aiModel()).pipe(
			new JsonOutputParser<{
				summary: string;
				seoTitle: string;
				seoDescription: string;
				themes: string[];
				categories: string[];
				keyTakeaways: string[];
				faq: { question: string; answer: string }[];
				relevanceScore: number;
			}>(),
		);

		const transcriptText = getTranscriptText(video.transcript, 3000);
		const transcriptSection = transcriptText ? `\nTransskription (uddrag):\n${transcriptText}` : "";

		const result = await generateWithQuality({
			generate: () =>
				chain.invoke({
					title: video.title,
					description: cleanDescription(video.description).slice(0, 1500),
					transcriptSection,
				}),
			extractText: (r) =>
				[r.summary, r.seoTitle, r.seoDescription, ...(r.keyTakeaways ?? [])].join(" "),
			context: `Video-analyse af "${video.title}"`,
		});

		if (result) {
			await ctx.runMutation(internal.videos.updateProcessedData, {
				videoId,
				summary: result.summary ?? "",
				seoTitle: result.seoTitle ?? "",
				seoDescription: result.seoDescription ?? "",
				themes: result.themes ?? [],
				categories: result.categories ?? [],
				keyTakeaways: result.keyTakeaways ?? [],
				faq: result.faq ?? [],
				relevanceScore: result.relevanceScore ?? 0,
			});
		}
	},
});

export const generateArticle = internalAction({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.runQuery(internal.videos.getByVideoId, { videoId });
		if (!video || video.article || !video.processedAt) return;

		const channel = await ctx.runQuery(internal.channels.getByChannelId, {
			channelId: video.channelId,
		});

		const transcriptText = getTranscriptText(video.transcript, 6000);
		const transcriptSection = transcriptText ? `Transskription:\n${transcriptText}` : "";

		const article = await generateText(ARTICLE_PROMPT, {
			title: video.title,
			channelName: channel?.name ?? "YouTube",
			summary: video.summary ?? "",
			keyTakeaways: (video.keyTakeaways ?? []).join("\n- "),
			themes: (video.themes ?? []).join(", "),
			description: cleanDescription(video.description).slice(0, 2000),
			transcriptSection,
		}, `Artikel baseret på video "${video.title}"`);

		if (article) {
			await ctx.runMutation(internal.videos.updateArticle, {
				videoId,
				article: article.replace(/<\/?[a-z][a-z0-9]*[^>]*>/gi, ""),
			});
		}
	},
});

export const generateChannelDescription = internalAction({
	args: { channelId: v.string() },
	handler: async (ctx, { channelId }) => {
		const channel = await ctx.runQuery(internal.channels.getByChannelId, { channelId });
		if (!channel) return;

		const videos = await ctx.runQuery(internal.videos.listRecentByChannel, {
			channelId,
			limit: 10,
		});

		const aiDescription = await generateText(CHANNEL_DESCRIPTION_PROMPT, {
			channelName: channel.name,
			originalDescription: channel.description ?? "Ingen beskrivelse",
			recentVideos: videos.map((v) => `- ${v.title}${v.summary ? ` (${v.summary})` : ""}`).join("\n") || "Ingen videoer endnu",
		}, `Kanalbeskrivelse for "${channel.name}"`);

		if (aiDescription) {
			await ctx.runMutation(internal.channels.updateAiDescription, { channelId, aiDescription });
		}
	},
});

// --- Stats refresh ---

export const refreshVideoStats = internalAction({
	args: {},
	handler: async (ctx) => {
		const videoIds = await ctx.runQuery(internal.videos.listAllVideoIds);
		// YouTube API allows up to 50 IDs per request
		for (let i = 0; i < videoIds.length; i += 50) {
			const batch = videoIds.slice(i, i + 50);
			const data = await ytFetch<{ items: any[] }>(
				`videos?part=statistics&id=${batch.join(",")}`,
			);
			for (const vid of data.items ?? []) {
				await ctx.runMutation(internal.videos.updateStats, {
					videoId: vid.id,
					viewCount: Number(vid.statistics?.viewCount) || 0,
					likeCount: Number(vid.statistics?.likeCount) || 0,
				});
			}
		}
	},
});

// --- Pipeline (cron + manual) ---

export const syncAllChannels = internalAction({
	args: {},
	handler: async (ctx) => {
		const channels = await ctx.runQuery(internal.channels.listAll);

		// 1. Sync videos from YouTube
		await forEachSafe(channels, (ch) => `sync ${ch.name}`, (ch) =>
			ctx.runAction(internal.youtube.syncChannelVideos, { channelId: ch.channelId, maxResults: 5 }),
		);

		// 2. Fetch transcripts
		const withoutTranscript = await ctx.runQuery(internal.videos.listWithoutTranscript);
		await forEachSafe(withoutTranscript, (v) => `transcript ${v.videoId}`, (v) =>
			ctx.runAction(internal.youtube.fetchTranscript, { videoId: v.videoId }),
		);

		// 3. AI-process (summary, SEO, categories, FAQ)
		const unprocessed = await ctx.runQuery(internal.videos.listUnprocessed);
		await forEachSafe(unprocessed, (v) => `process ${v.videoId}`, (v) =>
			ctx.runAction(internal.youtube.processVideo, { videoId: v.videoId }),
		);

		// 4. Generate articles
		const withoutArticle = await ctx.runQuery(internal.videos.listWithoutArticle);
		await forEachSafe(withoutArticle, (v) => `article ${v.videoId}`, (v) =>
			ctx.runAction(internal.youtube.generateArticle, { videoId: v.videoId }),
		);

		// 5. Refresh view/like counts for all videos
		await ctx.runAction(internal.youtube.refreshVideoStats);
	},
});

export const refreshAllChannelInfo = internalAction({
	args: {},
	handler: async (ctx) => {
		const channels = await ctx.runQuery(internal.channels.listAll);
		await forEachSafe(channels, (ch) => `refresh ${ch.name}`, (ch) =>
			fetchAndUpsertChannel(ctx, ch.channelId),
		);
	},
});

export const refreshAndGenerateAllChannelDescriptions = internalAction({
	args: {},
	handler: async (ctx) => {
		await ctx.runAction(internal.youtube.refreshAllChannelInfo);

		const channels = await ctx.runQuery(internal.channels.listAll);
		await forEachSafe(channels, (ch) => `description ${ch.name}`, (ch) =>
			ctx.runAction(internal.youtube.generateChannelDescription, { channelId: ch.channelId }),
		);
	},
});
