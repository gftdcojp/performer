import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: {
		only: true,
	},
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: false,
});
