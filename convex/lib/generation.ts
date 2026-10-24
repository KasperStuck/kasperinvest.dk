/**
 * Bounded generate → validate → fact-check → judge loop. Only output that passes the
 * deterministic rules, the fact-check and the judge is returned; callers save nothing on failure.
 */
import { hasErrors, type JudgeVerdict, type ValidationIssue } from "./contentRules";
import { LlmContentError, LlmDeadlineError, MIN_REMAINING_MS } from "./llm";
import { replaceDashes } from "./style";

export const MAX_ATTEMPTS = 3;
export const MIN_JUDGE_SCORE = 7;

export type GenerationResult<T> =
	| { ok: true; value: T; attempts: number; verdict: JudgeVerdict; warnings: ValidationIssue[] }
	| { ok: false; attempts: number; lastIssues: ValidationIssue[] };

const DEADLINE_ISSUE: ValidationIssue = {
	code: "deadline",
	message: "Jobbets tidsfrist blev nået.",
	severity: "error",
};

function issue(code: string, message: string): ValidationIssue {
	return { code, message, severity: "error" };
}

/** Judge verdict → blocking issues; empty when the verdict passes. The reason loses its dashes. */
export function judgeIssues(verdict: JudgeVerdict, minScore = MIN_JUDGE_SCORE): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	if (verdict.score < minScore) {
		issues.push(
			issue(
				"judge_low_score",
				`Redaktøren gav ${verdict.score}/10 (kræver ${minScore}): ${replaceDashes(verdict.reason)}`,
			),
		);
	}
	if (!verdict.danish) {
		issues.push(issue("judge_not_danish", "Teksten er ikke naturligt, korrekt og flydende dansk."));
	}
	if (!verdict.topicMatch) {
		issues.push(issue("judge_topic_mismatch", "Teksten handler ikke om kildens emne."));
	}
	if (!verdict.sourceSupported) {
		issues.push(
			issue("judge_unsupported", "Teksten indeholder påstande, som kilden ikke understøtter."),
		);
	}
	return issues;
}

/** Errors that consume one attempt; anything else (config, permanent HTTP, bugs) is rethrown. */
function attemptIssue(error: unknown): ValidationIssue | undefined {
	if (error instanceof LlmContentError) {
		return issue(
			error.code,
			"Svaret kunne ikke bruges; returnér et komplet svar i det krævede format.",
		);
	}
	// Availability exhaustion already includes bounded HTTP retries. Preserve its identity so
	// jobs stop without a paid content-repair attempt or a per-video failure/cooldown.
	return undefined;
}

type StepOutcome<R> =
	| { ok: true; value: R }
	| { ok: false; deadline: true }
	| { ok: false; deadline: false; consumed: ValidationIssue };

/** One provider step of an attempt: the deadline and attempt-consuming errors become outcomes. */
async function runStep<R>(call: () => Promise<R>): Promise<StepOutcome<R>> {
	try {
		return { ok: true, value: await call() };
	} catch (error) {
		if (error instanceof LlmDeadlineError) return { ok: false, deadline: true };
		const consumed = attemptIssue(error);
		if (!consumed) throw error;
		return { ok: false, deadline: false, consumed };
	}
}

/**
 * Per attempt: generate → deterministic rules → fact-check (optional) → judge. A failing step
 * skips the later ones and its issues are fed back to the next attempt.
 */
export async function generateValidated<T>(options: {
	generate: (feedback: ValidationIssue[]) => Promise<T>;
	normalize?: (value: T) => T;
	validate: (value: T) => ValidationIssue[];
	/** Checks the claims against the full source; returns blocking issues. */
	factCheck?: (value: T) => Promise<ValidationIssue[]>;
	/** Gets the attempt's rule warnings, so the judge can weigh them in context. */
	judge: (value: T, warnings: ValidationIssue[]) => Promise<JudgeVerdict>;
	minScore?: number;
	maxAttempts?: number;
	deadlineAt: number;
	now: () => number;
	label?: string;
	log?: (line: string) => void;
}): Promise<GenerationResult<T>> {
	const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
	const minScore = options.minScore ?? MIN_JUDGE_SCORE;
	const log = options.log ?? console.log;
	const label = options.label ?? "generation";
	const timeLeft = () => options.deadlineAt - options.now() >= MIN_REMAINING_MS;
	const codes = (issues: ValidationIssue[]) => issues.map((i) => i.code).join(",");

	const deadline = (attempts: number): GenerationResult<T> => ({
		ok: false,
		attempts,
		lastIssues: [DEADLINE_ISSUE],
	});

	let feedback: ValidationIssue[] = [];
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const prefix = `${label} attempt ${attempt}/${maxAttempts}:`;
		if (!timeLeft()) return deadline(attempt - 1);

		const generated = await runStep(async () => {
			const raw = await options.generate(feedback);
			return options.normalize ? options.normalize(raw) : raw;
		});
		if (!generated.ok) {
			if (generated.deadline) return deadline(attempt);
			feedback = [generated.consumed];
			log(`${prefix} issues=${generated.consumed.code}`);
			continue;
		}
		const value = generated.value;

		const issues = options.validate(value);
		const warnings = issues.filter((i) => i.severity === "warning");
		if (hasErrors(issues)) {
			feedback = issues.filter((i) => i.severity === "error");
			log(`${prefix} issues=${codes(feedback)}`);
			continue;
		}

		const { factCheck } = options;
		if (factCheck) {
			if (!timeLeft()) return deadline(attempt);
			const checked = await runStep(() => factCheck(value));
			if (!checked.ok) {
				if (checked.deadline) return deadline(attempt);
				feedback = [checked.consumed];
				log(`${prefix} fact-check issues=${checked.consumed.code}`);
				continue;
			}
			if (hasErrors(checked.value)) {
				feedback = checked.value.filter((i) => i.severity === "error");
				log(`${prefix} fact-check issues=${codes(feedback)}`);
				continue;
			}
		}

		if (!timeLeft()) return deadline(attempt);
		const judged = await runStep(() => options.judge(value, warnings));
		if (!judged.ok) {
			if (judged.deadline) return deadline(attempt);
			feedback = [judged.consumed];
			log(`${prefix} judge issues=${judged.consumed.code}`);
			continue;
		}
		const verdict = judged.value;

		const rejected = judgeIssues(verdict, minScore);
		// A judge call that ends past the deadline leaves no time to publish.
		if (options.now() > options.deadlineAt) return deadline(attempt);
		if (rejected.length === 0) {
			log(
				`${prefix} passed score=${verdict.score}${warnings.length ? ` warnings=${codes(warnings)}` : ""}`,
			);
			return { ok: true, value, attempts: attempt, verdict, warnings };
		}
		feedback = rejected;
		log(`${prefix} score=${verdict.score} issues=${codes(rejected)}`);
	}
	return { ok: false, attempts: maxAttempts, lastIssues: feedback };
}
