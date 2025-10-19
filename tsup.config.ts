import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	format: ["esm", "cjs"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: [
		"auth0-js",
		"bpmn-js",
		"@effect/schema",
		"effect",
		"neogma",
		"neo4j-driver",
		"vite",
		"react",
	],
});
