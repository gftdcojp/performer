import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: false,
		splitting: false,
		sourcemap: true,
		clean: true,
		minify: false,
		external: ["vite"],
	},
	{
		entry: ["src/cli.ts"],
		format: ["cjs"],
		dts: false,
		splitting: false,
		sourcemap: true,
		clean: false,
		minify: false,
		external: ["vite"],
		banner: {
			js: "#!/usr/bin/env node"
		}
	}
]);
