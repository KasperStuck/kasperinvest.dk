/**
 * Fetch captions locally and fill missing transcripts through the authenticated Convex CLI.
 * Usage: bun scripts/sync-transcripts.ts [--dev | --prod] (default: development).
 */
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fetchTranscript } from "@egoist/youtube-transcript-plus";
import { z } from "zod";

type Selector = "dev" | "prod";
type Runner = (args: string[], env: NodeJS.ProcessEnv) => Promise<{ code: number; stdout: string }>;
type Transcript = { text: string; offset: number; duration: number }[];
type FetchTranscript = (videoId: string) => Promise<{ segments: Transcript }>;

const CONVEX_BIN = fileURLToPath(new URL("../node_modules/.bin/convex", import.meta.url));
const MAX_OUTPUT_BYTES = 64 * 1024;
// Linux bounds each argv element to 128 KiB. Leave room for the CLI's other arguments.
const MAX_ARGUMENT_BYTES = 96 * 1024;
const CLI_TIMEOUT_MS = 60_000;
const missingVideosSchema = z.array(z.object({ videoId: z.string().min(1).max(256) })).max(50);

export function parseArgs(argv: string[]): Selector {
	if (argv.length === 0 || (argv.length === 1 && argv[0] === "--dev")) return "dev";
	if (argv.length === 1 && argv[0] === "--prod") return "prod";
	throw new Error("Usage: bun scripts/sync-transcripts.ts [--dev | --prod]");
}

/** No shell; discard CLI stderr because it can contain arguments or source text. */
export const runConvexCli: Runner = (args, env) =>
	new Promise((resolve, reject) => {
		const child = spawn(CONVEX_BIN, args, {
			shell: false,
			stdio: ["ignore", "pipe", "ignore"],
			env,
		});
		const chunks: Buffer[] = [];
		let bytes = 0;
		let settled = false;
		const fail = (message: string) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			child.kill("SIGKILL");
			reject(new Error(message));
		};
		const timer = setTimeout(() => fail("Convex CLI timeout"), CLI_TIMEOUT_MS);
		child.stdout.on("data", (chunk: Buffer) => {
			if (settled) return;
			bytes += chunk.length;
			if (bytes > MAX_OUTPUT_BYTES) fail("Convex CLI output limit");
			else chunks.push(chunk);
		});
		child.on("error", () => fail("Could not start Convex CLI"));
		child.on("close", (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve({ code: code ?? 1, stdout: Buffer.concat(chunks).toString("utf8") });
		});
	});

export async function syncTranscripts(
	selector: Selector,
	{
		runner = runConvexCli,
		fetchImpl = fetchTranscript,
		env = process.env,
		log = console.log,
	}: {
		runner?: Runner;
		fetchImpl?: FetchTranscript;
		env?: NodeJS.ProcessEnv;
		log?: (line: string) => void;
	} = {},
): Promise<{ uploaded: number; failed: number }> {
	for (const name of [
		"CONVEX_DEPLOY_KEY",
		"CONVEX_SELF_HOSTED_URL",
		"CONVEX_SELF_HOSTED_ADMIN_KEY",
	]) {
		if (env[name])
			throw new Error("Remove Convex credential target overrides before running this script");
	}
	if (!env.CONVEX_DEPLOYMENT?.trim()) {
		throw new Error("Missing CONVEX_DEPLOYMENT project selection; run with Bun in this checkout");
	}
	// Freeze project selection for both calls. Empty override variables also stop the CLI's
	// dotenv loading from selecting a different target or using a deploy key from a file.
	const childEnv = {
		...env,
		CONVEX_DEPLOY_KEY: "",
		CONVEX_SELF_HOSTED_URL: "",
		CONVEX_SELF_HOSTED_ADMIN_KEY: "",
	};
	const flags = ["--codegen", "disable", ...(selector === "prod" ? ["--prod"] : [])];
	async function run(name: "videos:needsTranscript" | "videos:saveTranscript", args: object) {
		const payload = JSON.stringify(args);
		if (Buffer.byteLength(payload) > MAX_ARGUMENT_BYTES)
			throw new Error("Transcript argument limit");
		const { code, stdout } = await runner(["run", name, payload, ...flags], childEnv);
		if (code !== 0 || Buffer.byteLength(stdout) > MAX_OUTPUT_BYTES)
			throw new Error("Convex CLI failed");
		return stdout;
	}

	let videos: z.infer<typeof missingVideosSchema>;
	try {
		videos = missingVideosSchema.parse(JSON.parse(await run("videos:needsTranscript", {})));
	} catch {
		throw new Error("Could not list missing transcripts; CLI diagnostics are suppressed");
	}
	log(`Found ${videos.length} videos without transcripts (${selector}).`);
	let uploaded = 0;
	let failed = 0;
	for (const [index, video] of videos.entries()) {
		try {
			const result = await fetchImpl(video.videoId);
			const transcript = result.segments.map((segment) => ({
				text: segment.text,
				offset: Math.round(segment.offset),
				duration: Math.round(segment.duration),
			}));
			if (transcript.length === 0) {
				log(`Video ${index + 1}: no captions available.`);
				continue;
			}
			await run("videos:saveTranscript", { videoId: video.videoId, transcript });
			uploaded++;
			log(`Video ${index + 1}: uploaded ${transcript.length} segments.`);
		} catch {
			failed++;
			log(
				`Video ${index + 1}: failed to fetch or upload (CLI errors and oversized payloads are suppressed).`,
			);
		}
	}
	log(`Done: ${uploaded} uploaded, ${failed} failed.`);
	return { uploaded, failed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	syncTranscripts(parseArgs(process.argv.slice(2)))
		.then(({ failed }) => {
			if (failed) process.exitCode = 1;
		})
		.catch(() => {
			console.error(
				"Transcript sync failed; check CLI login, project selection and arguments. Raw diagnostics are suppressed.",
			);
			process.exitCode = 1;
		});
}
