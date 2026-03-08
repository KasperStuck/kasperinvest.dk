// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://kasperinvest.dk",
	integrations: [mdx(), sitemap()],
	image: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "assets.tailwindcss.com",
			},
		],
	},
});
