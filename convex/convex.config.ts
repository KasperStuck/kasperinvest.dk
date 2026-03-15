import actionRetrier from "@convex-dev/action-retrier/convex.config";
import agent from "@convex-dev/agent/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(actionRetrier);
app.use(agent);

export default app;
