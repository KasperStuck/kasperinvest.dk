import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as sync from "./sync-transcripts";

vi.mock("@egoist/youtube-transcript-plus", () => ({ fetchTranscript: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: vi.fn() }));

const SENTINEL = "PRIVATE-TRANSCRIPT-BOUNDARY";
const env = { CONVEX_DEPLOYMENT: "dev:example-dev" };
const fetched = { segments: [{ text: SENTINEL, offset: 1.6, duration: 2.3 }] };

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

describe("transcript uploader boundary", () => {
	it("defaults to development and requires an explicit production option", () => {
		expect(sync.parseArgs([])).toBe("dev");
		expect(sync.parseArgs(["--dev"])).toBe("dev");
		expect(sync.parseArgs(["--prod"])).toBe("prod");
		for (const args of [["--prod", "--dev"], ["--deployment-name", "prod"], ["--push"]]) {
			expect(() => sync.parseArgs(args)).toThrow();
		}
	});

	it.each([
		"dev",
		"prod",
	] as const)("uses the same %s selector for query and upload", async (selector) => {
		const runner = vi
			.fn()
			.mockResolvedValueOnce({ code: 0, stdout: JSON.stringify([{ videoId: "video-id" }]) })
			.mockResolvedValueOnce({ code: 0, stdout: "null" });
		const fetchImpl = vi.fn().mockResolvedValue(fetched);
		const log = vi.fn();
		expect(await sync.syncTranscripts(selector, { runner, fetchImpl, env, log })).toEqual({
			uploaded: 1,
			failed: 0,
		});
		expect(fetchImpl).toHaveBeenCalledWith("video-id");
		const flags = ["--codegen", "disable", ...(selector === "prod" ? ["--prod"] : [])];
		expect(runner.mock.calls.map(([args]) => args)).toEqual([
			["run", "videos:needsTranscript", "{}", ...flags],
			[
				"run",
				"videos:saveTranscript",
				JSON.stringify({
					videoId: "video-id",
					transcript: [{ text: SENTINEL, offset: 2, duration: 2 }],
				}),
				...flags,
			],
		]);
		for (const [, childEnv] of runner.mock.calls) {
			expect(childEnv).toMatchObject({
				CONVEX_DEPLOYMENT: env.CONVEX_DEPLOYMENT,
				CONVEX_DEPLOY_KEY: "",
				CONVEX_SELF_HOSTED_URL: "",
				CONVEX_SELF_HOSTED_ADMIN_KEY: "",
			});
		}
		expect(JSON.stringify(log.mock.calls)).not.toContain(SENTINEL);
	});

	it("refuses credential target overrides before querying or fetching", async () => {
		for (const name of [
			"CONVEX_DEPLOY_KEY",
			"CONVEX_SELF_HOSTED_URL",
			"CONVEX_SELF_HOSTED_ADMIN_KEY",
		]) {
			const runner = vi.fn();
			const fetchImpl = vi.fn();
			await expect(
				sync.syncTranscripts("dev", { runner, fetchImpl, env: { ...env, [name]: SENTINEL } }),
			).rejects.toThrow("override");
			expect(runner).not.toHaveBeenCalled();
			expect(fetchImpl).not.toHaveBeenCalled();
		}
	});

	it("never infers production from a URL or uses a URL as a deployment selector", async () => {
		const runner = vi.fn().mockResolvedValue({ code: 0, stdout: "[]" });
		await sync.syncTranscripts("dev", {
			runner,
			env: { ...env, CONVEX_URL: "https://production.invalid" },
			log: () => {},
		});
		expect(runner.mock.calls[0][0]).not.toContain("--prod");
		expect(runner.mock.calls[0][0]).not.toContain("https://production.invalid");
	});

	it("requires a fixed project selection before starting the CLI", async () => {
		const runner = vi.fn();
		await expect(
			sync.syncTranscripts("dev", { runner, env: { CONVEX_URL: "https://production.invalid" } }),
		).rejects.toThrow("Missing CONVEX_DEPLOYMENT");
		expect(runner).not.toHaveBeenCalled();
	});

	it.each([
		{ code: 1, stdout: SENTINEL },
		{ code: 0, stdout: SENTINEL },
		{ code: 0, stdout: JSON.stringify([{ videoId: 42, transcript: SENTINEL }]) },
		{ code: 0, stdout: " ".repeat(70_000) },
	])("refuses unsafe query responses without fetching or leaking diagnostics", async (response) => {
		const fetchImpl = vi.fn();
		const promise = sync.syncTranscripts("dev", {
			runner: vi.fn().mockResolvedValue(response),
			fetchImpl,
			env,
		});
		await expect(promise).rejects.toThrow("Could not list missing transcripts");
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it.each([
		"fetch",
		"upload",
		"oversize",
		"empty",
	])("handles %s without printing transcript or raw errors", async (failure) => {
		const runner = vi.fn().mockResolvedValueOnce({ code: 0, stdout: '[{"videoId":"video-id"}]' });
		runner.mockRejectedValue(new Error(SENTINEL));
		const fetchImpl = vi
			.fn()
			.mockResolvedValue(
				failure === "empty"
					? { segments: [] }
					: failure === "oversize"
						? { segments: [{ ...fetched.segments[0], text: SENTINEL.repeat(5000) }] }
						: fetched,
			);
		if (failure === "fetch") fetchImpl.mockRejectedValue(new Error(SENTINEL));
		const log = vi.fn();
		expect(await sync.syncTranscripts("dev", { runner, fetchImpl, env, log })).toEqual({
			uploaded: 0,
			failed: failure === "empty" ? 0 : 1,
		});
		expect(runner).toHaveBeenCalledTimes(failure === "upload" ? 2 : 1);
		expect(JSON.stringify(log.mock.calls)).not.toContain(SENTINEL);
	});
});

describe("Convex subprocess", () => {
	async function childProcess() {
		const { spawn } = await import("node:child_process");
		const child = Object.assign(new EventEmitter(), {
			stdout: new PassThrough(),
			kill: vi.fn(),
		});
		vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
		return { child, spawn };
	}

	it("uses structured argv, no shell or stderr, and freezes the target environment", async () => {
		const { child, spawn } = await childProcess();
		const args = ["run", "videos:needsTranscript", "{}", "--codegen", "disable"];
		const promise = sync.runConvexCli(args, env);
		child.stdout.write("[]");
		child.emit("close", 0);
		expect(await promise).toEqual({ code: 0, stdout: "[]" });
		expect(spawn).toHaveBeenCalledWith(expect.stringContaining("node_modules/.bin/convex"), args, {
			shell: false,
			stdio: ["ignore", "pipe", "ignore"],
			env,
		});
	});

	it("kills a CLI that exceeds the output bound", async () => {
		const { child } = await childProcess();
		const promise = sync.runConvexCli([], env);
		child.stdout.write(SENTINEL.repeat(5000));
		await expect(promise).rejects.toThrow("Convex CLI output limit");
		expect(child.kill).toHaveBeenCalledWith("SIGKILL");
	});

	it("kills a stalled CLI within 60 seconds and suppresses spawn errors", async () => {
		vi.useFakeTimers();
		const { child } = await childProcess();
		const promise = sync.runConvexCli([], env);
		const rejected = expect(promise).rejects.toThrow("Convex CLI timeout");
		await vi.advanceTimersByTimeAsync(60_000);
		await rejected;
		expect(child.kill).toHaveBeenCalledWith("SIGKILL");
		const second = sync.runConvexCli([], env);
		child.emit("error", new Error(SENTINEL));
		await expect(second).rejects.toThrow("Could not start Convex CLI");
	});
});
