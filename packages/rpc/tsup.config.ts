import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: false,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["@gftdcojp/performer-observability", "@gftdcojp/performer-process", "@gftdcojp/performer-error-handling"],
});
