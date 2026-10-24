import { describe, expect, it, vi } from "vitest";
import type { JudgeVerdict, ValidationIssue } from "./contentRules";
import { generateValidated, judgeIssues } from "./generation";
import {
	LlmConfigError,
	LlmContentError,
	LlmDeadlineError,
	LlmHttpError,
	LlmUnavailableError,
} from "./llm";

const pass: JudgeVerdict = {
	score: 8,
	danish: true,
	topicMatch: true,
	sourceSupported: true,
	reason: "Fin",
};
const bad: ValidationIssue = { code: "h1", message: "Brug ikke H1.", severity: "error" };
const warn: ValidationIssue = { code: "not_danish", message: "Advarsel.", severity: "warning" };

function setup(options: {
	outputs: Array<string | Error>;
	issues?: Record<string, ValidationIssue[]>;
	verdicts?: JudgeVerdict[];
	clock?: number[];
}) {
	const outputs = [...options.outputs];
	const verdicts = [...(options.verdicts ?? [])];
	const clock = [...(options.clock ?? [])];
	const generate = vi.fn(async (_feedback: ValidationIssue[]) => {
		const next = outputs.shift();
		if (next === undefined) throw new Error("unexpected generate");
		if (next instanceof Error) throw next;
		return next;
	});
	const validate = vi.fn((value: string) => options.issues?.[value] ?? []);
	const judge = vi.fn(
		async (_value: string, _warnings: ValidationIssue[]) => verdicts.shift() ?? pass,
	);
	const now = () => (clock.length > 1 ? (clock.shift() as number) : (clock[0] ?? 0));
	return { generate, validate, judge, now, deadlineAt: 8 * 60_000, log: vi.fn() };
}

describe("generateValidated", () => {
	it("makes one generation and one judge call on success", async () => {
		const deps = setup({ outputs: ["ok"] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, value: "ok", attempts: 1, verdict: pass });
		expect(deps.generate).toHaveBeenCalledTimes(1);
		expect(deps.judge).toHaveBeenCalledTimes(1);
		expect(deps.generate).toHaveBeenCalledWith([]);
	});

	it("feeds validation errors back and skips the judge on a failed attempt", async () => {
		const deps = setup({ outputs: ["bad", "ok"], issues: { bad: [bad] } });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, value: "ok", attempts: 2 });
		expect(deps.judge).toHaveBeenCalledTimes(1);
		expect(deps.judge).toHaveBeenCalledWith("ok", []);
		expect(deps.generate.mock.calls[1][0]).toEqual([bad]);
	});

	it("retries when a judge boolean is false", async () => {
		const deps = setup({
			outputs: ["a", "b"],
			verdicts: [{ ...pass, sourceSupported: false }, pass],
		});
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, value: "b", attempts: 2 });
		expect(deps.generate.mock.calls[1][0].map((i: ValidationIssue) => i.code)).toEqual([
			"judge_unsupported",
		]);
	});

	it("retries when the judge score is below the minimum", async () => {
		const deps = setup({ outputs: ["a", "b"], verdicts: [{ ...pass, score: 6 }, pass] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, attempts: 2 });
		expect(deps.generate.mock.calls[1][0].map((i: ValidationIssue) => i.code)).toEqual([
			"judge_low_score",
		]);
	});

	it("returns the last issues after three failed attempts", async () => {
		const deps = setup({ outputs: ["bad", "bad", "bad"], issues: { bad: [bad] } });
		const result = await generateValidated(deps);
		expect(result).toEqual({ ok: false, attempts: 3, lastIssues: [bad] });
		expect(deps.generate).toHaveBeenCalledTimes(3);
		expect(deps.judge).not.toHaveBeenCalled();
	});

	it("rethrows permanent and configuration errors", async () => {
		const permanent = setup({ outputs: [new LlmHttpError("claude", 401, "authentication_error")] });
		await expect(generateValidated(permanent)).rejects.toBeInstanceOf(LlmHttpError);
		expect(permanent.generate).toHaveBeenCalledTimes(1);
		const config = setup({ outputs: [new LlmConfigError("Missing ANTHROPIC_API_KEY env var")] });
		await expect(generateValidated(config)).rejects.toBeInstanceOf(LlmConfigError);
	});

	it("retries content errors but preserves exhausted provider availability", async () => {
		const deps = setup({
			outputs: [
				new LlmContentError("invalid_json"),
				new LlmUnavailableError("claude", "HTTP 529"),
				"ok",
			],
		});
		await expect(generateValidated(deps)).rejects.toBeInstanceOf(LlmUnavailableError);
		expect(deps.generate).toHaveBeenCalledTimes(2);
		expect(deps.generate.mock.calls[1][0].map((i: ValidationIssue) => i.code)).toEqual([
			"invalid_json",
		]);
		expect(deps.judge).not.toHaveBeenCalled();
	});

	it("treats a malformed judge answer as a consumed attempt", async () => {
		const deps = setup({ outputs: ["a", "b"] });
		deps.judge
			.mockRejectedValueOnce(new LlmContentError("schema_mismatch"))
			.mockResolvedValueOnce(pass);
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, value: "b", attempts: 2 });
	});

	it("starts no judge when the deadline is reached after generation", async () => {
		const deps = setup({ outputs: ["ok"], clock: [0, 8 * 60_000 - 19_000] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: false, attempts: 1 });
		expect(result.ok === false && result.lastIssues.map((i) => i.code)).toEqual(["deadline"]);
		expect(deps.judge).not.toHaveBeenCalled();
	});

	it("fails with deadline when the deadline passes during a passing judge call", async () => {
		const deps = setup({ outputs: ["ok"], clock: [0, 0, 8 * 60_000 + 1] });
		const result = await generateValidated(deps);
		expect(result).toEqual({
			ok: false,
			attempts: 1,
			lastIssues: [expect.objectContaining({ code: "deadline" })],
		});
		expect(deps.judge).toHaveBeenCalledTimes(1);
	});

	it("starts no generation when the deadline is already reached", async () => {
		const deps = setup({ outputs: ["ok"], clock: [8 * 60_000] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: false, attempts: 0 });
		expect(deps.generate).not.toHaveBeenCalled();
	});

	it("stops when a provider call hits the deadline", async () => {
		const deps = setup({ outputs: [new LlmDeadlineError()] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: false, attempts: 1 });
		expect(deps.generate).toHaveBeenCalledTimes(1);
	});

	it("does not block on warnings", async () => {
		const deps = setup({ outputs: ["ok"], issues: { ok: [warn] } });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, warnings: [warn] });
	});

	it("passes the attempt's warnings to the judge", async () => {
		const deps = setup({ outputs: ["ok"], issues: { ok: [warn] } });
		await generateValidated(deps);
		expect(deps.judge).toHaveBeenCalledWith("ok", [warn]);
	});

	it("applies normalize before validation and judge", async () => {
		const deps = setup({ outputs: ["  ok  "] });
		const result = await generateValidated({ ...deps, normalize: (v: string) => v.trim() });
		expect(deps.validate).toHaveBeenCalledWith("ok");
		expect(result).toMatchObject({ ok: true, value: "ok" });
	});

	it("logs issue codes only", async () => {
		const deps = setup({ outputs: ["SECRET-OUTPUT", "ok"], issues: { "SECRET-OUTPUT": [bad] } });
		await generateValidated({ ...deps, label: "article v1" });
		const logged = JSON.stringify(deps.log.mock.calls);
		expect(logged).toContain("h1");
		expect(logged).toContain("article v1");
		expect(logged).not.toContain("SECRET-OUTPUT");
		expect(logged).not.toContain("Brug ikke H1.");
	});
});

describe("judgeIssues", () => {
	it("removes en and em dashes from the judge reason before it is fed back", () => {
		const [low] = judgeIssues({
			...pass,
			score: 5,
			reason: "Fin tekst \u2013 men 2020\u20132024 er uklart\u2014ret det.",
		});
		expect(low.code).toBe("judge_low_score");
		expect(low.message).not.toMatch(/[\u2013\u2014]/);
		expect(low.message).toContain("2020-2024");
	});
});

describe("generateValidated with a fact-check step", () => {
	const fact: ValidationIssue = {
		code: "fact_unsupported",
		message: "Disse påstande kunne ikke findes i kilden.",
		severity: "error",
	};

	function withFactCheck(
		options: Parameters<typeof setup>[0] & { facts?: Array<ValidationIssue[] | Error> },
	) {
		const deps = setup(options);
		const order: string[] = [];
		const facts = [...(options.facts ?? [])];
		const generate = vi.fn(async (feedback: ValidationIssue[]) => {
			order.push("generate");
			return deps.generate(feedback);
		});
		const validate = vi.fn((value: string) => {
			order.push("validate");
			return deps.validate(value);
		});
		const factCheck = vi.fn(async (_value: string) => {
			order.push("factCheck");
			const next = facts.shift() ?? [];
			if (next instanceof Error) throw next;
			return next;
		});
		const judge = vi.fn(async (value: string, warnings: ValidationIssue[]) => {
			order.push("judge");
			return deps.judge(value, warnings);
		});
		return { ...deps, generate, validate, factCheck, judge, order };
	}

	it("runs after the deterministic rules and before the judge", async () => {
		const deps = withFactCheck({ outputs: ["ok"] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, attempts: 1 });
		expect(deps.order).toEqual(["generate", "validate", "factCheck", "judge"]);
	});

	it("is skipped when the deterministic rules fail", async () => {
		const deps = withFactCheck({ outputs: ["bad", "ok"], issues: { bad: [bad] } });
		await generateValidated(deps);
		expect(deps.order).toEqual([
			"generate",
			"validate",
			"generate",
			"validate",
			"factCheck",
			"judge",
		]);
	});

	it("feeds fact errors back and skips the judge for that attempt", async () => {
		const deps = withFactCheck({ outputs: ["a", "b"], facts: [[fact], []] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: true, value: "b", attempts: 2 });
		expect(deps.order).toEqual([
			"generate",
			"validate",
			"factCheck",
			"generate",
			"validate",
			"factCheck",
			"judge",
		]);
		expect(deps.generate.mock.calls[1][0]).toEqual([fact]);
		expect(JSON.stringify(deps.log.mock.calls)).toContain("fact-check issues=fact_unsupported");
	});

	it("returns the fact errors after three failed attempts", async () => {
		const deps = withFactCheck({ outputs: ["a", "b", "c"], facts: [[fact], [fact], [fact]] });
		expect(await generateValidated(deps)).toEqual({ ok: false, attempts: 3, lastIssues: [fact] });
		expect(deps.judge).not.toHaveBeenCalled();
	});

	it("retries fact-check content errors but preserves exhausted provider availability", async () => {
		const deps = withFactCheck({
			outputs: ["a", "b", "c"],
			facts: [
				new LlmContentError("fact_check_coverage"),
				new LlmUnavailableError("claude", "HTTP 529"),
				[],
			],
		});
		await expect(generateValidated(deps)).rejects.toBeInstanceOf(LlmUnavailableError);
		expect(deps.generate).toHaveBeenCalledTimes(2);
		expect(deps.generate.mock.calls[1][0].map((i: ValidationIssue) => i.code)).toEqual([
			"fact_check_coverage",
		]);
		expect(deps.judge).not.toHaveBeenCalled();
	});

	it("rethrows a permanent provider error from the fact-check", async () => {
		const deps = withFactCheck({ outputs: ["a"], facts: [new LlmHttpError("claude", 401)] });
		await expect(generateValidated(deps)).rejects.toBeInstanceOf(LlmHttpError);
		expect(deps.judge).not.toHaveBeenCalled();
	});

	it("starts no fact-check when the deadline is reached after validation", async () => {
		const deps = withFactCheck({ outputs: ["ok"], clock: [0, 8 * 60_000 - 19_000] });
		const result = await generateValidated(deps);
		expect(result).toMatchObject({ ok: false, attempts: 1 });
		expect(deps.factCheck).not.toHaveBeenCalled();
	});

	it("stops with deadline when a fact-check call hits the deadline", async () => {
		const deps = withFactCheck({ outputs: ["ok"], facts: [new LlmDeadlineError()] });
		const result = await generateValidated(deps);
		expect(result).toEqual({
			ok: false,
			attempts: 1,
			lastIssues: [expect.objectContaining({ code: "deadline" })],
		});
		expect(deps.judge).not.toHaveBeenCalled();
	});
});
