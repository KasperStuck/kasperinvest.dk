/**
 * Bounded generate → validate → judge loop. Only output that passes the deterministic rules and
 * the judge is returned; callers save nothing on failure.
 */
import { hasErrors, type JudgeVerdict, type ValidationIssue } from "./contentRules";
import { LlmContentError, LlmDeadlineError, LlmUnavailableError, MIN_REMAINING_MS } from "./llm";

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

/** Judge verdict → blocking issues; empty when the verdict passes. */
export function judgeIssues(verdict: JudgeVerdict, minScore = MIN_JUDGE_SCORE): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	if (verdict.score < minScore) {
		issues.push(
			issue(
				"judge_low_score",
				`Redaktøren gav ${verdict.score}/10 (kræver ${minScore}): ${verdict.reason}`,
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
	if (error instanceof LlmUnavailableError) {
		return issue(error.code, "Udbyderen var midlertidigt utilgængelig.");
	}
	return undefined;
}

export async function generateValidated<T>(options: {
	generate: (feedback: ValidationIssue[]) => Promise<T>;
	normalize?: (value: T) => T;
	validate: (value: T) => ValidationIssue[];
	judge: (value: T) => Promise<JudgeVerdict>;
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

	let feedback: ValidationIssue[] = [];
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		if (!timeLeft()) return { ok: false, attempts: attempt - 1, lastIssues: [DEADLINE_ISSUE] };

		let value: T;
		try {
			const raw = await options.generate(feedback);
			value = options.normalize ? options.normalize(raw) : raw;
		} catch (error) {
			if (error instanceof LlmDeadlineError) {
				return { ok: false, attempts: attempt, lastIssues: [DEADLINE_ISSUE] };
			}
			const consumed = attemptIssue(error);
			if (!consumed) throw error;
			feedback = [consumed];
			log(`${label} attempt ${attempt}/${maxAttempts}: issues=${consumed.code}`);
			continue;
		}

		const issues = options.validate(value);
		const warnings = issues.filter((i) => i.severity === "warning");
		if (hasErrors(issues)) {
			feedback = issues.filter((i) => i.severity === "error");
			log(`${label} attempt ${attempt}/${maxAttempts}: issues=${codes(feedback)}`);
			continue;
		}

		if (!timeLeft()) return { ok: false, attempts: attempt, lastIssues: [DEADLINE_ISSUE] };
		let verdict: JudgeVerdict;
		try {
			verdict = await options.judge(value);
		} catch (error) {
			if (error instanceof LlmDeadlineError) {
				return { ok: false, attempts: attempt, lastIssues: [DEADLINE_ISSUE] };
			}
			const consumed = attemptIssue(error);
			if (!consumed) throw error;
			feedback = [consumed];
			log(`${label} attempt ${attempt}/${maxAttempts}: judge issues=${consumed.code}`);
			continue;
		}

		const rejected = judgeIssues(verdict, minScore);
		// A judge call that ends past the deadline leaves no time to publish.
		if (options.now() > options.deadlineAt) {
			return { ok: false, attempts: attempt, lastIssues: [DEADLINE_ISSUE] };
		}
		if (rejected.length === 0) {
			log(
				`${label} attempt ${attempt}/${maxAttempts}: passed score=${verdict.score}${warnings.length ? ` warnings=${codes(warnings)}` : ""}`,
			);
			return { ok: true, value, attempts: attempt, verdict, warnings };
		}
		feedback = rejected;
		log(
			`${label} attempt ${attempt}/${maxAttempts}: score=${verdict.score} issues=${codes(rejected)}`,
		);
	}
	return { ok: false, attempts: maxAttempts, lastIssues: feedback };
}
