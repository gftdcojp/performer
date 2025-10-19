import { describe, it, expect } from "vitest";
import { FileRouter, SSRPipeline } from "./index";

describe("FileRouter", () => {
	it("should match routes", async () => {
		const router = new FileRouter({
			basePath: "/",
			appDir: "app",
		});

		const match = await router.match("/test");
		expect(match).toBeDefined();
		expect(match?.path).toBe("/test");
	});

	it("should create SSR pipeline", () => {
		const router = new FileRouter({
			basePath: "/",
			appDir: "app",
		});

		const pipeline = new SSRPipeline(router);
		expect(pipeline).toBeDefined();
	});
});
