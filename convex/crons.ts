import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Full sync pipeline daily at 06:00 UTC:
// 1. Fetch new videos from all channels
// 2. Fetch transcripts
// 3. AI-process (summary, SEO, categories, FAQ)
// 4. Generate articles
// 5. Refresh view/like counts for all videos
crons.daily(
	"sync-youtube",
	{ hourUTC: 1, minuteUTC: 0 },
	internal.youtube.syncAllChannels,
);

// Refresh view/like counts and isShort status every hour
crons.interval("refresh-stats", { hours: 1 }, internal.youtube.refreshVideoStats);

// Refresh channel info from YouTube + regenerate AI descriptions weekly on Mondays at 08:00 UTC
crons.weekly(
	"refresh-channel-info-and-descriptions",
	{ dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 },
	internal.youtube.refreshAndGenerateAllChannelDescriptions,
);

export default crons;
