// Merkle DAG: error_handling_tests -> unit_tests -> integration_tests
// Comprehensive tests for error handling system

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	ErrorFactory,
	ErrorCodes,
	ErrorSeverity,
	ConsoleErrorReporter,
	MemoryErrorReporter,
	globalRecoveryManager,
	withErrorHandling,
	createResult,
	createErrorFactory,
	actionsErrorFactory,
} from "./index";

describe("ErrorFactory", () => {
	let errorFactory: ErrorFactory;
	let memoryReporter: MemoryErrorReporter;

	beforeEach(() => {
		memoryReporter = new MemoryErrorReporter();
		errorFactory = new ErrorFactory("test-package", [memoryReporter]);
	});

	it("should create structured error", () => {
		const error = errorFactory.createError(
			ErrorCodes.UNKNOWN_ERROR,
			"Test error",
			"test-operation",
			{
				severity: ErrorSeverity.HIGH,
				userId: "user123",
				metadata: { key: "value" },
			},
		);

		expect(error.code).toBe(ErrorCodes.UNKNOWN_ERROR);
		expect(error.message).toBe("Test error");
		expect(error.context.package).toBe("test-package");
		expect(error.context.operation).toBe("test-operation");
		expect(error.context.userId).toBe("user123");
		expect(error.severity).toBe(ErrorSeverity.HIGH);
		expect(error.context.metadata).toEqual({ key: "value" });
	});

	it("should generate correlation ID", () => {
		const error = errorFactory.createError(
			ErrorCodes.UNKNOWN_ERROR,
			"Test error",
			"test-operation",
		);

		expect(error.context.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
	});

	it("should report error to reporters", () => {
		errorFactory.createError(
			ErrorCodes.UNKNOWN_ERROR,
			"Test error",
			"test-operation",
		);

		const errors = memoryReporter.getErrors();
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toBe("Test error");
	});

	it("should create auth error", () => {
		const error = errorFactory.authFailed("login");

		expect(error.code).toBe(ErrorCodes.AUTH_FAILED);
		expect(error.message).toBe("Authentication failed");
		expect(error.severity).toBe(ErrorSeverity.HIGH);
	});

	it("should create validation error", () => {
		const error = errorFactory.validationFailed(
			"user-creation",
			"Email is required",
		);

		expect(error.code).toBe(ErrorCodes.VALIDATION_FAILED);
		expect(error.message).toBe("Validation failed: Email is required");
		expect(error.severity).toBe(ErrorSeverity.MEDIUM);
	});
});

describe("ErrorReporters", () => {
	it("MemoryErrorReporter should store errors", () => {
		const reporter = new MemoryErrorReporter();
		const error = {
			code: ErrorCodes.UNKNOWN_ERROR,
			message: "Test error",
			context: {
				package: "test",
				operation: "test",
				timestamp: new Date(),
			},
			severity: ErrorSeverity.MEDIUM,
			recoverable: true,
		};

		reporter.report(error);
		const errors = reporter.getErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0]).toEqual(error);
	});

	it("MemoryErrorReporter should batch report", async () => {
		const reporter = new MemoryErrorReporter();
		const errors = [
			{
				code: ErrorCodes.UNKNOWN_ERROR,
				message: "Error 1",
				context: { package: "test", operation: "test", timestamp: new Date() },
				severity: ErrorSeverity.MEDIUM,
				recoverable: true,
			},
			{
				code: ErrorCodes.UNKNOWN_ERROR,
				message: "Error 2",
				context: { package: "test", operation: "test", timestamp: new Date() },
				severity: ErrorSeverity.MEDIUM,
				recoverable: true,
			},
		];

		await reporter.batchReport(errors);
		const storedErrors = reporter.getErrors();

		expect(storedErrors).toHaveLength(2);
	});
});

describe("ErrorRecoveryManager", () => {
	it("should execute recovery strategy", async () => {
		const strategy = {
			name: "test-strategy",
			description: "Test recovery strategy",
			execute: vi.fn().mockResolvedValue(true),
		};

		globalRecoveryManager.registerStrategy(ErrorCodes.NETWORK_ERROR, strategy);

		const error = {
			code: ErrorCodes.NETWORK_ERROR,
			message: "Network failed",
			context: { package: "test", operation: "test", timestamp: new Date() },
			severity: ErrorSeverity.MEDIUM,
			recoverable: true,
		};

		const recovered = await globalRecoveryManager.attemptRecovery(error);

		expect(recovered).toBe(true);
		expect(strategy.execute).toHaveBeenCalledWith(error);
	});

	it("should return false when no strategy available", async () => {
		const error = {
			code: ErrorCodes.UNKNOWN_ERROR,
			message: "Unknown error",
			context: { package: "test", operation: "test", timestamp: new Date() },
			severity: ErrorSeverity.MEDIUM,
			recoverable: true,
		};

		const recovered = await globalRecoveryManager.attemptRecovery(error);

		expect(recovered).toBe(false);
	});
});

describe("withErrorHandling", () => {
	let errorFactory: ErrorFactory;
	let memoryReporter: MemoryErrorReporter;

	beforeEach(() => {
		memoryReporter = new MemoryErrorReporter();
		errorFactory = new ErrorFactory("test-package", [memoryReporter]);
	});

	it("should return result on success", async () => {
		const result = await withErrorHandling(
			async () => "success",
			errorFactory,
			"test-operation",
		);

		expect(result).toBe("success");
	});

	it("should throw structured error on failure", async () => {
		await expect(
			withErrorHandling(
				async () => {
					throw new Error("Test failure");
				},
				errorFactory,
				"test-operation",
			),
		).rejects.toMatchObject({
			code: ErrorCodes.UNKNOWN_ERROR,
			message: "Test failure",
		});

		const errors = memoryReporter.getErrors();
		expect(errors).toHaveLength(1);
	});

	it("should retry on failure", async () => {
		let attempts = 0;

		const result = await withErrorHandling(
			async () => {
				attempts++;
				if (attempts < 2) {
					throw new Error("Temporary failure");
				}
				return "success";
			},
			errorFactory,
			"test-operation",
			{ retries: 1 },
		);

		expect(result).toBe("success");
		expect(attempts).toBe(2);
	});
});

describe("createResult", () => {
	it("should return success result", () => {
		const result = createResult(() => "success");

		expect(result).toEqual({
			success: true,
			data: "success",
		});
	});

	it("should return error result on exception", () => {
		const result = createResult(() => {
			throw new Error("Test error");
		});

		expect(result.success).toBe(false);
		expect(result.error.message).toBe("Test error");
	});
});

describe("Package Error Factories", () => {
	it("should create error factory for actions package", () => {
		const factory = createErrorFactory("actions");

		expect(factory).toBeInstanceOf(ErrorFactory);
	});

	it("should have pre-configured factory for actions", () => {
		expect(actionsErrorFactory).toBeInstanceOf(ErrorFactory);
	});
});
