/**
 * The production generation path: analysis loop, then article loop, and the channel description
 * loop. Both video post parts are fact-checked against the full transcript; the channel
 * description is not. No Convex calls, so the Convex jobs and scripts/compare-models.ts share it
 * unchanged.
 */
import {
	analysisSchema,
	type JudgeVerdict,
	judgeSchema,
	normalizeAnalysis,
	normalizeArticle,
	normalizeChannelDescription,
	type PostSource,
	type ValidationIssue,
	type VideoAnalysis,
	validateAnalysis,
	validateArticle,
	validateChannelDescription,
} from "./contentRules";
import {
	analysisSegments,
	articleSegments,
	type CandidateSegment,
	factCheck,
	transcriptChunks,
} from "./factCheck";
import { type GenerationResult, generateValidated, MAX_ATTEMPTS } from "./generation";
import {
	completeJson,
	completeText,
	type LlmCallOptions,
	type LlmConfig,
	type LlmPrompt,
	TRANSIENT_RETRY_DELAYS_MS,
} from "./llm";
import {
	appendFeedback,
	buildAnalysisPrompt,
	buildArticlePrompt,
	buildChannelPrompt,
	buildJudgePrompt,
	buildSourceContext,
	renderAnalysisForJudge,
	transcriptText,
} from "./prompts";

export type GenerationContext = {
	config: LlmConfig;
	/** Judge and fact-check model; production leaves it unset so the generator checks itself. */
	judgeConfig?: LlmConfig;
	deadlineAt: number;
	now: () => number;
	/** Transport options passed to every provider call (fetch, sleep, usage callback). */
	llm?: Omit<LlmCallOptions, "deadlineAt" | "now">;
	log?: (line: string) => void;
	label: string;
};

export type { PostSource };

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

/** Fact-check chunks for this transcript: one call per chunk per checked attempt. */
export function factCheckChunkCount(video: Pick<PostSource, "transcript">): number {
	return transcriptChunks(transcriptText(video)).length;
}

/**
 * Most logical provider calls one post can make: 2 parts × MAX_ATTEMPTS × (generation + judge +
 * one fact-check call per chunk), i.e. 6C + 12.
 */
export function maxLogicalCallsPerPost(chunks: number): number {
	return 2 * MAX_ATTEMPTS * (2 + chunks);
}

/** Every logical call may be sent up to 1 + TRANSIENT_RETRY_DELAYS_MS.length times. */
export function maxPhysicalCallsPerPost(chunks: number): number {
	return maxLogicalCallsPerPost(chunks) * (1 + TRANSIENT_RETRY_DELAYS_MS.length);
}

/**
 * The fact-check step of one part, with the judge's model. Remembers the claims it verified so
 * the judge of the same attempt can see them.
 */
function factChecker<T>(
	ctx: GenerationContext,
	video: PostSource,
	channelName: string,
	part: "analysis" | "article",
	segmentsOf: (value: T) => CandidateSegment[],
) {
	const checker = { verifiedClaims: [] as string[] };
	const check = async (value: T) => {
		checker.verifiedClaims = [];
		const result = await factCheck({
			config: ctx.judgeConfig ?? ctx.config,
			part,
			segments: segmentsOf(value),
			source: {
				title: video.title,
				description: video.description,
				channelName,
				transcriptText: transcriptText(video),
			},
			call: callOptions(ctx),
		});
		checker.verifiedClaims = result.verifiedClaims;
		return result.issues;
	};
	return { check, checker };
}

export function generateAnalysis(
	video: PostSource,
	channelName: string,
	ctx: GenerationContext,
): Promise<GenerationResult<VideoAnalysis>> {
	const source = {
		title: video.title,
		description: video.description,
		channelName,
		sourceContext: buildSourceContext(video),
	};
	const prompt = buildAnalysisPrompt(source);
	const facts = factChecker(ctx, video, channelName, "analysis", analysisSegments);
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
		validate: (analysis) => validateAnalysis(analysis, video),
		factCheck: facts.check,
		judge: (analysis, warnings) =>
			judge(
				ctx,
				buildJudgePrompt({
					...source,
					part: "analysis",
					candidate: renderAnalysisForJudge(analysis),
					warnings,
					verifiedClaims: facts.checker.verifiedClaims,
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
	const source = {
		title: video.title,
		description: video.description,
		channelName,
		sourceContext: buildSourceContext(video),
	};
	const prompt = buildArticlePrompt({ ...source, analysis });
	const facts = factChecker(ctx, video, channelName, "article", articleSegments);
	return generateValidated({
		generate: async (feedback) =>
			(await completeText(ctx.config, appendFeedback(prompt, feedback), callOptions(ctx))).text,
		normalize: normalizeArticle,
		validate: (article) =>
			validateArticle(article, {
				title: video.title,
				seoTitle: analysis.seoTitle,
				analysis,
				source: video,
			}),
		factCheck: facts.check,
		judge: (article, warnings) =>
			judge(
				ctx,
				buildJudgePrompt({
					...source,
					part: "article",
					candidate: article,
					pageContext: analysis,
					warnings,
					verifiedClaims: facts.checker.verifiedClaims,
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
		const result = await generateAnalysis(video, channelName, ctx);
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
		judge: (candidate, warnings) =>
			judge(ctx, buildJudgePrompt({ part: "channel", candidate, ...input, warnings })),
		deadlineAt: ctx.deadlineAt,
		now: ctx.now,
		label: `${ctx.label} description`,
		log: ctx.log,
	});
}
