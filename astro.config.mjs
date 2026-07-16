// @ts-check
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import { defineConfig, envField, fontProviders } from "astro/config";

export default defineConfig({
	site: "https://kasperinvest.dk",
	redirects: {
		"/risiko-og-risikoprofil": "/risikoprofil",
		"/investering-i-nedture": "/disciplin-i-nedture",
	},
	adapter: node({ mode: "standalone" }),
	integrations: [mdx()],
	markdown: {
		syntaxHighlight: false,
	},
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
			CONVEX_URL: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
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
				"img-src 'self' https://i.ytimg.com https://img.youtube.com https://*.convex.cloud https://adtraction.com data:",
				"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
				"connect-src 'self' https://*.convex.cloud",
			],
		},
	},
	experimental: {
		rustCompiler: true,
	},
});
