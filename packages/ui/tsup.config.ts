import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: false, // TODO: Enable dts generation after fixing TypeScript project configuration
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["react", "react-dom", "next"],
});
