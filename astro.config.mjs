// @ts-check
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import { defineConfig, envField, fontProviders } from "astro/config";

export default defineConfig({
	site: "https://kasperinvest.dk",
	adapter: node({ mode: "standalone" }),
	integrations: [mdx()],
	image: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.ytimg.com",
			},
		],
	},
	env: {
		schema: {
			CONVEX_URL: envField.string({ context: "server", access: "secret" }),
		},
	},
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Inter",
			cssVariable: "--font-inter",
		},
	],
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' https://i.ytimg.com https://img.youtube.com https://*.convex.cloud data:",
				"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
				"connect-src 'self' https://*.convex.cloud",
			],
		},
	},
	experimental: {
		rustCompiler: true,
	},
});
