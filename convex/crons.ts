import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync affiliate programs from all networks daily at 02:00 UTC
crons.daily(
	"sync-affiliate-programs",
	{ hourUTC: 2, minuteUTC: 0 },
	internal.affiliateSync.syncAdtraction,
	{ market: "DK" },
);

// Daily sync + sweep at 01:00 UTC:
// 1. Fetch new videos (each triggers instant processing via scheduler)
// 2. Sweep: retry any videos with missing content from previous failures
// 3. Refresh view/like counts for all videos
crons.daily("sync-youtube", { hourUTC: 1, minuteUTC: 0 }, internal.youtube.syncAllChannels);

// Refresh view/like counts and thumbnails every hour
crons.interval("refresh-stats", { hours: 1 }, internal.youtube.refreshVideoStats);

// Refresh channel info from YouTube + regenerate AI descriptions weekly on Mondays at 08:00 UTC
crons.weekly(
	"refresh-channel-info-and-descriptions",
	{ dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 },
	internal.youtube.refreshAndGenerateAllChannelDescriptions,
);

export default crons;
