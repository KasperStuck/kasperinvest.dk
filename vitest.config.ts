import { getViteConfig } from "astro/config";

export default getViteConfig({
	test: {},
} as Parameters<typeof getViteConfig>[0]);
