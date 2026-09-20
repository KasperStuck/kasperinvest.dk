// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import config from "../astro.config.mjs";

// Shared deployment contract for all Astro sites: on-demand rendering behind
// the node adapter, shipped in the standard multi-stage container.
// Image builds that run the suite copy no Dockerfile into the context, so the
// container assertions only run where the file exists (local checkouts and CI).
const dockerfilePath = fileURLToPath(new URL("../Dockerfile", import.meta.url));
const dockerfile = existsSync(dockerfilePath) ? readFileSync(dockerfilePath, "utf8") : "";

describe("site setup", () => {
	it("renders on demand through the node adapter", () => {
		expect(config.output).toBe("server");
		expect(config.adapter?.name).toBe("@astrojs/node");
	});

	it.skipIf(dockerfile === "")("uses the shared container runtime", () => {
		expect(dockerfile).toMatch(/^FROM oven\/bun:\$\{BUN_VERSION\}-alpine AS base$/m);
		expect(dockerfile).toContain("dumb-init");
		expect(dockerfile).toMatch(/^USER bun$/m);
		expect(dockerfile).toContain("HEALTHCHECK");
		expect(dockerfile).toContain("bun install --frozen-lockfile --production");
		expect(dockerfile).toMatch(/^(ENV .*|\s*)PORT=\d+/m);
	});
});
