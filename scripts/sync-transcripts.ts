/**
 * Fetches transcripts locally (bypasses YouTube bot-detection on server IPs)
 * and pushes them to Convex.
 *
 * Usage: bun scripts/sync-transcripts.ts
 */

import { fetchTranscript } from "@egoist/youtube-transcript-plus";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) throw new Error("Missing CONVEX_URL - source .env.local");

const convex = new ConvexHttpClient(CONVEX_URL);

async function main() {
	const videos = await convex.query(api.videos.needsTranscript);

	if (!videos.length) {
		console.log("All videos have transcripts.");
		return;
	}

	console.log(`Found ${videos.length} videos without transcript.\n`);

	for (const video of videos) {
		process.stdout.write(`${video.title} ... `);

		try {
			const result = await fetchTranscript(video.videoId);
			const transcript = result.segments.map((s) => ({
				text: s.text,
				offset: Math.round(s.offset),
				duration: Math.round(s.duration),
			}));

			if (transcript.length === 0) {
				console.log("no captions available");
				continue;
			}

			await convex.mutation(api.videos.saveTranscript, {
				videoId: video.videoId,
				transcript,
			});

			console.log(`${transcript.length} segments`);
		} catch (e) {
			console.log(`FAILED: ${e instanceof Error ? e.message : String(e)}`);
		}
	}

	console.log("\nDone.");
}

main();
