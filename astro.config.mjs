// @ts-check
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

export default defineConfig({
	site: "https://kasperinvest.dk",
	redirects: {
		"/risiko-og-risikoprofil": "/risikoprofil",
		"/investering-i-nedture": "/disciplin-i-nedture",
	},
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [sentry({ sourcemaps: { disable: true }, telemetry: false }), mdx()],
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
	vite: {
		plugins: [tailwindcss()],
	},
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' https://i.ytimg.com https://img.youtube.com https://*.convex.cloud https://adtraction.com data:",
				"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
				"connect-src 'self' https://glitchtip.eagleapp.dk https://*.convex.cloud",
			],
		},
	},
});
