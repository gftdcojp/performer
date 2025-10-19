import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		splitting: false,
		sourcemap: true,
		clean: true,
		minify: false,
	},
	{
		entry: ["src/cli.ts"],
		format: ["cjs"],
		dts: true,
		splitting: false,
		sourcemap: true,
		clean: false,
		minify: false,
		banner: {
			js: "#!/usr/bin/env node"
		}
	}
]);
