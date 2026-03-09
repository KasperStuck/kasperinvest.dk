// @ts-check
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://kasperinvest.dk",
	adapter: node({ mode: "standalone" }),
	integrations: [mdx()],
	image: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "assets.tailwindcss.com",
			},
		],
	},
});
