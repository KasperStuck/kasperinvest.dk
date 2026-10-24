/**
 * The production generation path: analysis loop, then article loop, and the channel description
 * loop. No Convex calls, so the Convex jobs and scripts/compare-models.ts share it unchanged.
 */
import type { TranscriptSegment } from "../helpers";
import {
	analysisSchema,
	type JudgeVerdict,
	judgeSchema,
	normalizeAnalysis,
	normalizeArticle,
	normalizeChannelDescription,
	type ValidationIssue,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
	validateChannelDescription,
} from "./contentRules";
import { type GenerationResult, generateValidated } from "./generation";
import {
	completeJson,
	completeText,
	type LlmCallOptions,
	type LlmConfig,
	type LlmPrompt,
} from "./llm";
import {
	appendFeedback,
	buildAnalysisPrompt,
	buildArticlePrompt,
	buildChannelPrompt,
	buildJudgePrompt,
	buildSourceContext,
	renderAnalysisForJudge,
} from "./prompts";

export type GenerationContext = {
	config: LlmConfig;
	/** Judge model; production leaves it unset so the generator judges itself. */
	judgeConfig?: LlmConfig;
	deadlineAt: number;
	now: () => number;
	/** Transport options passed to every provider call (fetch, sleep, usage callback). */
	llm?: Omit<LlmCallOptions, "deadlineAt" | "now">;
	log?: (line: string) => void;
	label: string;
};

export type PostSource = { title: string; description: string; transcript?: TranscriptSegment[] };

function callOptions(ctx: GenerationContext): LlmCallOptions {
	return { log: ctx.log, ...ctx.llm, deadlineAt: ctx.deadlineAt, now: ctx.now };
}

/** Structured verdict from the judge model (by default the configured model itself). */
async function judge(ctx: GenerationContext, prompt: LlmPrompt): Promise<JudgeVerdict> {
	const { value } = await completeJson(ctx.judgeConfig ?? ctx.config, judgeSchema, prompt, {
		...callOptions(ctx),
		name: "judge",
	});
	return value;
}

export function generateAnalysis(
	video: PostSource,
	ctx: GenerationContext,
): Promise<GenerationResult<VideoAnalysis>> {
	const sourceContext = buildSourceContext(video);
	const prompt = buildAnalysisPrompt({ ...video, sourceContext });
	return generateValidated({
		generate: async (feedback) => {
			const { value } = await completeJson(
				ctx.config,
				analysisSchema,
				appendFeedback(prompt, feedback),
				{ ...callOptions(ctx), name: "video_analysis", normalize: normalizeAnalysis },
			);
			return value;
		},
		validate: validateAnalysis,
		judge: (analysis) =>
			judge(
				ctx,
				buildJudgePrompt({
					part: "analysis",
					candidate: renderAnalysisForJudge(analysis),
					title: video.title,
					description: video.description,
					sourceContext,
				}),
			),
		deadlineAt: ctx.deadlineAt,
		now: ctx.now,
		label: `${ctx.label} analysis`,
		log: ctx.log,
	});
}

export function generateArticle(
	video: PostSource,
	analysis: VideoAnalysis,
	channelName: string,
	ctx: GenerationContext,
): Promise<GenerationResult<string>> {
	const sourceContext = buildSourceContext(video);
	const prompt = buildArticlePrompt({ ...video, channelName, analysis, sourceContext });
	return generateValidated({
		generate: async (feedback) =>
			(await completeText(ctx.config, appendFeedback(prompt, feedback), callOptions(ctx))).text,
		normalize: normalizeArticle,
		validate: (article) =>
			validateArticle(article, { title: video.title, seoTitle: analysis.seoTitle }),
		judge: (article) =>
			judge(
				ctx,
				buildJudgePrompt({
					part: "article",
					candidate: article,
					title: video.title,
					description: video.description,
					sourceContext,
				}),
			),
		deadlineAt: ctx.deadlineAt,
		now: ctx.now,
		label: `${ctx.label} article`,
		log: ctx.log,
	});
}

export type PostAttempts = { analysis?: number; article?: number };

export type VideoPostResult =
	| {
			ok: true;
			/** Present only when this run generated it (not with a stored analysis). */
			analysis?: VideoAnalysis;
			article: string;
			attempts: PostAttempts;
			verdicts: { analysis?: JudgeVerdict; article: JudgeVerdict };
			warnings: ValidationIssue[];
	  }
	| {
			ok: false;
			part: "analysis" | "article";
			lastIssues: ValidationIssue[];
			attempts: PostAttempts;
	  };

/** Analysis loop (unless a stored analysis is given), then the article loop from that analysis. */
export async function generateVideoPost(
	video: PostSource,
	channelName: string,
	ctx: GenerationContext,
	options: { storedAnalysis?: VideoAnalysis } = {},
): Promise<VideoPostResult> {
	let analysis = options.storedAnalysis;
	const attempts: PostAttempts = {};
	let analysisVerdict: JudgeVerdict | undefined;
	const warnings: ValidationIssue[] = [];
	if (!analysis) {
		const result = await generateAnalysis(video, ctx);
		attempts.analysis = result.attempts;
		if (!result.ok) return { ok: false, part: "analysis", lastIssues: result.lastIssues, attempts };
		analysis = result.value;
		analysisVerdict = result.verdict;
		warnings.push(...result.warnings);
	}

	const article = await generateArticle(video, analysis, channelName, ctx);
	attempts.article = article.attempts;
	if (!article.ok) return { ok: false, part: "article", lastIssues: article.lastIssues, attempts };
	warnings.push(...article.warnings);

	return {
		ok: true,
		...(options.storedAnalysis ? {} : { analysis }),
		article: article.value,
		attempts,
		verdicts: analysisVerdict
			? { analysis: analysisVerdict, article: article.verdict }
			: { article: article.verdict },
		warnings,
	};
}

export function generateChannelDescription(
	channel: { name: string; description?: string },
	recentVideos: Array<{ title: string; summary?: string }>,
	ctx: GenerationContext,
): Promise<GenerationResult<string>> {
	const input = { name: channel.name, description: channel.description, recentVideos };
	const prompt = buildChannelPrompt(input);
	return generateValidated({
		generate: async (feedback) =>
			(await completeText(ctx.config, appendFeedback(prompt, feedback), callOptions(ctx))).text,
		normalize: normalizeChannelDescription,
		validate: validateChannelDescription,
		judge: (candidate) => judge(ctx, buildJudgePrompt({ part: "channel", candidate, ...input })),
		deadlineAt: ctx.deadlineAt,
		now: ctx.now,
		label: `${ctx.label} description`,
		log: ctx.log,
	});
}
