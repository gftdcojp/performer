import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: false, // Skip DTS build due to @ts-rest/core type issues
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: false,
});
