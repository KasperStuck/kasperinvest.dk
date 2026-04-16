"use node";

import { createOpenAI } from "@ai-sdk/openai";
import { ActionRetrier } from "@convex-dev/action-retrier";
import { generateText as aiGenerateText, generateObject } from "ai";
import { v } from "convex/values";
import slugify from "slugify";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action, internalAction } from "./_generated/server";
import {
	bestThumbnail,
	cleanDescription,
	extractHashtags,
	forEachSafe,
	getTranscriptText,
	parseDuration,
	type Thumbnails,
} from "./helpers";

// --- Config ---

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const PRIMARY_MODEL = "stepfun/step-3.5-flash:free";
const FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const MODELS = [PRIMARY_MODEL, FALLBACK_MODEL] as const;
const MAX_QUALITY_ATTEMPTS = 3;
const MIN_QUALITY_SCORE = 9;

const retrier = new ActionRetrier(components.actionRetrier, {
	initialBackoffMs: 500,
	base: 2,
	maxFailures: 3,
});

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing ${name} env var`);
	return value;
}

function openRouter(model: string) {
	return createOpenAI({
		apiKey: requireEnv("OPENROUTER_API_KEY"),
		baseURL: "https://openrouter.ai/api/v1",
	})(model);
}

// --- YouTube API types ---

type YouTubeChannelItem = {
	id: string;
	snippet: {
		title: string;
		description?: string;
		customUrl?: string;
		country?: string;
		thumbnails?: Thumbnails;
	};
	contentDetails: { relatedPlaylists: { uploads: string } };
	statistics: { subscriberCount?: string; videoCount?: string };
};

type YouTubeVideoItem = {
	id: string;
	snippet: {
		title: string;
		description?: string;
		publishedAt: string;
		thumbnails: Thumbnails;
		tags?: string[];
		resourceId?: { videoId: string };
	};
	contentDetails?: { duration?: string };
	statistics?: { viewCount?: string; likeCount?: string };
};

type YouTubePlaylistItem = {
	snippet: { resourceId: { videoId: string } };
};

type YouTubeListResponse<T> = { items: T[] };

async function ytFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${YOUTUBE_API}/${path}&key=${requireEnv("YOUTUBE_API_KEY")}`);
	if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);
	return res.json();
}

// --- AI schemas ---

const qualitySchema = z.object({
	score: z.number().min(1).max(10),
	reason: z.string(),
});

const videoAnalysisSchema = z.object({
	summary: z.string(),
	seoTitle: z.string(),
	seoDescription: z.string(),
	themes: z.array(z.string()),
	categories: z.array(z.string()),
	keyTakeaways: z.array(z.string()),
	faq: z.array(z.object({ question: z.string(), answer: z.string() })),
	relevanceScore: z.number().min(0).max(100),
});

type VideoAnalysis = z.infer<typeof videoAnalysisSchema>;

// --- AI system prompts ---

const QUALITY_SYSTEM = `Du er en dansk tekstforfatter og korrekturlæser med speciale i økonomi og investering.

Bedøm den givne tekst på en skala fra 1-10 ud fra disse kriterier:
- Sprog: Er teksten skrevet på naturligt, flydende dansk? Ingen vrøvl, stavefejl, blandede sprog eller uforståelige sætninger.
- Relevans: Handler teksten om det emne der er beskrevet i konteksten?
- Kvalitet: Er teksten velskrevet, professionel og informativ?
- Troværdighed: Lyder teksten som noget en dansk finansskribent ville skrive?

VIGTIGT: Hvis teksten indeholder nonsens, blandede sprog, eller ikke er naturligt dansk, skal scoren ALTID være under 5.
VIGTIGT: Alt output SKAL være på dansk. Inkludér ALDRIG links eller URL'er.

En score på 9+ betyder at teksten er klar til publicering uden rettelser.
En score under 9 betyder at teksten har problemer der kræver regenerering.`;

const VIDEO_ANALYSIS_SYSTEM = `Du er en dansk tekstforfatter med ekspertise i privatøkonomi og investering.
Skriv ALTID på naturligt, flydende dansk. Analysér YouTube-videoer og returnér udelukkende valid JSON.

Gyldige kategorier: privatøkonomi, aktier, ETF, obligationer, skat, pension, strategi, psykologi, analyse, krypto, bolig, FIRE, marked, andet

relevanceScore: 0 = irrelevant for dansk privatinvestor, 100 = meget relevant.

VIGTIGT: Alt output SKAL være på dansk. Inkludér ALDRIG links eller URL'er i noget felt.`;

const ARTICLE_SYSTEM = `Du er en erfaren dansk tekstforfatter med speciale i privatøkonomi og investering. Skriv en grundig, velformuleret artikel baseret på en YouTube-video.

Regler:
- Skriv på naturligt, flydende dansk i en professionel men tilgængelig tone
- Skriv KUN ren Markdown — brug ALDRIG HTML-tags som <h2>, <h3>, <p>, <ul>, <b> osv.
- Brug Markdown-formatering: overskrifter (##), afsnit, fed tekst (**tekst**), punktlister (-)
- Strukturér artiklen med en indledning, flere sektioner med overskrifter, og en afrunding
- Artiklen skal være 800-1500 ord
- Forklar begreber kort når de introduceres
- Inkludér konkrete pointer og eksempler fra videoen
- Skriv IKKE "I denne video" eller lignende — skriv som en selvstændig artikel
- Brug IKKE h1 (#) — start med h2 (##)
- Inkludér ALDRIG links eller URL'er i artiklen
- Alt output SKAL være på dansk`;

const CHANNEL_DESCRIPTION_SYSTEM = `Du er en erfaren dansk tekstforfatter med speciale i privatøkonomi og investering. Skriv en unik kanalbeskrivelse til en YouTube-kanal.

Regler:
- Skriv på naturligt, flydende dansk i en professionel men tilgængelig tone — som en rigtig dansk journalist ville skrive
- Beskrivelsen skal være ca. 70 ord fordelt på præcis 2 afsnit
- Første afsnit: Hvad kanalen handler om, hvem den henvender sig til, og hvilke emner der dækkes
- Andet afsnit: Hvad der gør kanalen unik eller aktuel, baseret på de seneste videoer
- Brug kanalens originale beskrivelse som udgangspunkt, men omskriv den fuldstændigt
- Skriv IKKE i første person — skriv som en neutral redaktionel beskrivelse
- Nævn IKKE specifikke videoer ved navn
- Adskil afsnit med en tom linje
- Inkludér ALDRIG links eller URL'er
- Alt output SKAL være på dansk`;

// --- AI quality validation ---

async function validateQuality(text: string, context: string) {
	const { object } = await generateObject({
		model: openRouter(PRIMARY_MODEL),
		schema: qualitySchema,
		system: QUALITY_SYSTEM,
		prompt: `Kontekst: ${context}\n\nTekst der skal bedømmes:\n${text}`,
	});
	return object;
}

async function generateWithQuality<T>(opts: {
	generate: (model: string) => Promise<T>;
	extractText: (result: T) => string;
	context: string;
}): Promise<T | null> {
	const { generate, extractText, context } = opts;

	for (const model of MODELS) {
		const label = model === PRIMARY_MODEL ? "primary" : "fallback";
		if (label === "fallback") {
			console.log(`Primary model failed quality threshold, trying fallback for: ${context}`);
		}

		for (let attempt = 1; attempt <= MAX_QUALITY_ATTEMPTS; attempt++) {
			try {
				const result = await generate(model);
				const text = extractText(result);

				if (!text || text.length < 10) {
					console.warn(`Attempt ${attempt} (${label}): generated text too short, retrying`);
					continue;
				}

				const { score, reason } = await validateQuality(text, context);
				console.log(`Attempt ${attempt} (${label}): score ${score}/10 — ${reason}`);

				if (score >= MIN_QUALITY_SCORE) return result;
			} catch (e) {
				console.warn(`Attempt ${attempt} (${label}) failed:`, e);
			}
		}
	}

	console.error(`Failed to reach quality threshold after all attempts for: ${context}`);
	return null;
}

async function generateTextWithQuality(
	system: string,
	prompt: string,
	context: string,
): Promise<string | null> {
	return generateWithQuality({
		generate: async (model) => {
			const { text } = await aiGenerateText({ model: openRouter(model), system, prompt });
			return text.trim();
		},
		extractText: (t) => t,
		context,
	});
}

// --- Channel actions (public) ---

async function fetchAndUpsertChannel(ctx: ActionCtx, channelId: string) {
	const data = await ytFetch<YouTubeListResponse<YouTubeChannelItem>>(
		`channels?part=snippet,contentDetails,statistics&id=${channelId}`,
	);
	if (!data.items?.length) throw new Error(`Channel ${channelId} not found`);

	const ch = data.items[0];
	const thumbnailUrl = ch.snippet.thumbnails?.medium?.url;

	let thumbnailStorageId: Id<"_storage"> | undefined;
	if (thumbnailUrl) {
		try {
			const res = await fetch(thumbnailUrl);
			if (res.ok) {
				thumbnailStorageId = await ctx.storage.store(await res.blob());
			}
		} catch (e) {
			console.warn(`Failed to store thumbnail for channel ${channelId}:`, e);
		}
	}

	await ctx.runMutation(internal.channels.upsert, {
		channelId,
		name: ch.snippet.title,
		description: ch.snippet.description ?? undefined,
		customUrl: ch.snippet.customUrl ?? undefined,
		country: ch.snippet.country ?? undefined,
		uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
		thumbnailUrl,
		thumbnailStorageId,
		bannerUrl: undefined,
		subscriberCount: Number(ch.statistics.subscriberCount) || 0,
		videoCount: Number(ch.statistics.videoCount) || 0,
	});

	return ch.snippet.title;
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
		const lookup = await ytFetch<YouTubeListResponse<YouTubeChannelItem>>(
			`channels?part=id&forHandle=${encodeURIComponent(handle)}`,
		);
		if (!lookup.items?.length) throw new Error(`Handle ${handle} not found`);

		const channelId = lookup.items[0].id;
		const name = await fetchAndUpsertChannel(ctx, channelId);
		return { name, channelId };
	},
});

// --- Video sync ---

export const syncChannelVideos = internalAction({
	args: { channelId: v.string(), maxResults: v.optional(v.number()) },
	handler: async (ctx, { channelId, maxResults }) => {
		const channel = await ctx.runQuery(internal.channels.getByChannelId, { channelId });
		if (!channel) throw new Error(`Channel ${channelId} not in database`);

		const playlist = await ytFetch<YouTubeListResponse<YouTubePlaylistItem>>(
			`playlistItems?part=snippet&playlistId=${channel.uploadsPlaylistId}&maxResults=${maxResults ?? 10}`,
		);
		if (!playlist.items?.length) {
			console.warn(`syncChannelVideos: No videos found for channel ${channelId}`);
			return { synced: 0 };
		}

		const ids = playlist.items.map((i) => i.snippet.resourceId.videoId);
		const details = await ytFetch<YouTubeListResponse<YouTubeVideoItem>>(
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
			});
			synced++;
		}

		await ctx.runMutation(internal.channels.updateLastSynced, {
			channelId,
			lastSyncedAt: Date.now(),
		});

		console.log(
			`syncChannelVideos: ${synced} new video(s) synced for channel ${channelId} (${details.items?.length ?? 0} checked)`,
		);
		return { synced };
	},
});

// --- Transcript ---

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

// --- AI processing ---

export const processVideo = internalAction({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		const video = await ctx.runQuery(internal.videos.getByVideoId, { videoId });
		if (!video || video.processedAt) return;

		const transcriptText = getTranscriptText(video.transcript, 3000);
		const transcriptSection = transcriptText ? `\nTransskription (uddrag):\n${transcriptText}` : "";

		const result = await generateWithQuality<VideoAnalysis>({
			generate: async (model) => {
				const { object } = await generateObject({
					model: openRouter(model),
					schema: videoAnalysisSchema,
					system: VIDEO_ANALYSIS_SYSTEM,
					prompt: `Analysér denne video:

Titel: ${video.title}
Beskrivelse: ${cleanDescription(video.description).slice(0, 1500)}
${transcriptSection}

Generér 3-5 FAQ-spørgsmål baseret på videoens indhold. Spørgsmålene skal være naturlige søgeforespørgsler en dansk investor ville stille.`,
				});
				return object;
			},
			extractText: (r) => [r.summary, r.seoTitle, r.seoDescription, ...r.keyTakeaways].join(" "),
			context: `Video-analyse af "${video.title}"`,
		});

		if (result) {
			await ctx.runMutation(internal.videos.updateProcessedData, {
				videoId,
				summary: result.summary,
				seoTitle: result.seoTitle,
				seoDescription: result.seoDescription,
				themes: result.themes,
				categories: result.categories,
				keyTakeaways: result.keyTakeaways,
				faq: result.faq,
				relevanceScore: result.relevanceScore,
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

		const article = await generateTextWithQuality(
			ARTICLE_SYSTEM,
			`Skriv en artikel baseret på denne video:

Titel: ${video.title}
Kanal: ${channel?.name ?? "YouTube"}
Opsummering: ${video.summary ?? ""}
Hovedpointer: ${(video.keyTakeaways ?? []).join("\n- ")}
Temaer: ${(video.themes ?? []).join(", ")}

Beskrivelse:
${cleanDescription(video.description).slice(0, 2000)}

${transcriptSection}

Skriv artiklen nu:`,
			`Artikel baseret på video "${video.title}"`,
		);

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

		const recentVideos =
			videos.map((v) => `- ${v.title}${v.summary ? ` (${v.summary})` : ""}`).join("\n") ||
			"Ingen videoer endnu";

		const aiDescription = await generateTextWithQuality(
			CHANNEL_DESCRIPTION_SYSTEM,
			`Skriv en unik kanalbeskrivelse baseret på følgende:

Kanalnavn: ${channel.name}
Original beskrivelse: ${channel.description ?? "Ingen beskrivelse"}

Seneste videoer:
${recentVideos}

Skriv kun selve beskrivelsen (ca. 70 ord, præcis 2 afsnit adskilt med tom linje), intet andet:`,
			`Kanalbeskrivelse for "${channel.name}"`,
		);

		if (aiDescription) {
			await ctx.runMutation(internal.channels.updateAiDescription, { channelId, aiDescription });
		}
	},
});

// --- Pipeline ---

export const processNewVideo = internalAction({
	args: { videoId: v.string() },
	handler: async (ctx, { videoId }) => {
		console.log(`processNewVideo: Starting pipeline for ${videoId}`);
		await retrier.run(ctx, internal.youtube.fetchTranscript, { videoId });
		await retrier.run(ctx, internal.youtube.processVideo, { videoId });
		await retrier.run(ctx, internal.youtube.generateArticle, { videoId });
		console.log(`processNewVideo: Pipeline complete for ${videoId}`);
	},
});

export const refreshVideoStats = internalAction({
	args: {},
	handler: async (ctx) => {
		const videoIds = await ctx.runQuery(internal.videos.listAllVideoIds);
		if (videoIds.length === 0) return;

		console.log(`refreshVideoStats: Updating stats for ${videoIds.length} video(s)`);

		for (let i = 0; i < videoIds.length; i += 50) {
			const batch = videoIds.slice(i, i + 50);
			const data = await ytFetch<YouTubeListResponse<YouTubeVideoItem>>(
				`videos?part=statistics,snippet,contentDetails&id=${batch.join(",")}`,
			);

			for (const vid of data.items ?? []) {
				await ctx.runMutation(internal.videos.updateStats, {
					videoId: vid.id,
					viewCount: Number(vid.statistics?.viewCount) || 0,
					likeCount: Number(vid.statistics?.likeCount) || 0,
					thumbnailUrl: bestThumbnail(vid.snippet.thumbnails),
				});
			}
		}
	},
});

export const syncAllChannels = internalAction({
	args: {},
	handler: async (ctx) => {
		requireEnv("YOUTUBE_API_KEY");
		requireEnv("OPENROUTER_API_KEY");

		const channels = await ctx.runQuery(internal.channels.listAll);
		if (channels.length === 0) {
			console.warn("syncAllChannels: No channels found. Add channels first.");
			return;
		}

		console.log(
			`syncAllChannels: Starting pipeline for ${channels.length} channel(s): ${channels.map((c) => c.name).join(", ")}`,
		);

		// 1. Sync new videos from YouTube
		for (const ch of channels) {
			console.log(`[1/3] Syncing videos for "${ch.name}" (${ch.channelId})`);
			await retrier.run(ctx, internal.youtube.syncChannelVideos, {
				channelId: ch.channelId,
				maxResults: 50,
			});
		}

		// 2. Retry any videos that previously failed processing
		const withoutTranscript = await ctx.runQuery(internal.videos.listWithoutTranscript);
		const unprocessed = await ctx.runQuery(internal.videos.listUnprocessed);
		const withoutArticle = await ctx.runQuery(internal.videos.listWithoutArticle);

		const needsRetry = new Set(
			[...withoutTranscript, ...unprocessed, ...withoutArticle].map((v) => v.videoId),
		);

		if (needsRetry.size > 0) {
			console.log(`[2/3] Retrying ${needsRetry.size} video(s) with missing content`);
			for (const videoId of needsRetry) {
				await retrier.run(ctx, internal.youtube.processNewVideo, { videoId });
			}
		} else {
			console.log("[2/3] No videos need retry");
		}

		// 3. Refresh view/like counts
		console.log("[3/3] Refreshing video stats");
		await retrier.run(ctx, internal.youtube.refreshVideoStats, {});

		console.log("syncAllChannels: Pipeline complete.");
	},
});

export const refreshAllChannelInfo = internalAction({
	args: {},
	handler: async (ctx) => {
		const channels = await ctx.runQuery(internal.channels.listAll);
		if (channels.length === 0) return;

		console.log(`refreshAllChannelInfo: Refreshing ${channels.length} channel(s)`);
		await forEachSafe(
			channels,
			(ch) => `refresh ${ch.name}`,
			(ch) => fetchAndUpsertChannel(ctx, ch.channelId),
		);
	},
});

export const refreshAndGenerateAllChannelDescriptions = internalAction({
	args: {},
	handler: async (ctx) => {
		requireEnv("OPENROUTER_API_KEY");
		await ctx.runAction(internal.youtube.refreshAllChannelInfo);

		const channels = await ctx.runQuery(internal.channels.listAll);
		if (channels.length === 0) return;

		console.log(`Generating AI descriptions for ${channels.length} channel(s)`);
		for (const ch of channels) {
			await retrier.run(ctx, internal.youtube.generateChannelDescription, {
				channelId: ch.channelId,
			});
		}
	},
});
