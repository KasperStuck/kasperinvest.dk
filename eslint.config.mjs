import convexPlugin from "@convex-dev/eslint-plugin";
import tseslint from "typescript-eslint";

// Biome lints and formats the project; ESLint only runs the Convex-specific rules on convex/.
export default [
	{
		ignores: ["convex/_generated/**", "dist/**", "node_modules/**"],
	},
	{
		files: ["convex/**/*.ts"],
		languageOptions: { parser: tseslint.parser },
	},
	...convexPlugin.configs.recommended,
];
