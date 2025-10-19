import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	test: {
		watch: false,
	},
	resolve: {
		alias: {
			"@/*": resolve(__dirname, "src/*"),
			"@pkg/*": resolve(__dirname, "packages/*"),
		},
	},
});
