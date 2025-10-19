import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		watch: false,
	},
	resolve: {
		alias: {
			"@pkg/process": "../../process/src/index.ts",
			"@pkg/error-handling": "../../error-handling/src/index.ts",
			"@gftdcojp/performer-observability": "../../observability/src/index.ts",
		},
	},
});
