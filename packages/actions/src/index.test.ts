import { describe, it, expect } from "vitest";
import { createActions, TypeValidator } from "./index";

describe("TypeValidator", () => {
	it("should validate successfully", () => {
		const result = TypeValidator.validate<{ name: string }>({ name: "test" });
		expect(result).toEqual({ name: "test" });
	});

	it("should handle safe validation", () => {
		const result = TypeValidator.safeValidate<{ name: string }>({
			name: "test",
		});
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ name: "test" });
	});
});

describe("ActionBuilder", () => {
	it("should create action builder", () => {
		const actions = createActions({
			domain: "test.auth0.com",
			clientID: "test-client-id",
			audience: "test-audience",
		});
		expect(actions).toBeDefined();
	});
});
