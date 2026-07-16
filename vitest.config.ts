import { getViteConfig } from "astro/config";

export default getViteConfig({
	test: {
		globals: true,
	},
} as Parameters<typeof getViteConfig>[0]);
