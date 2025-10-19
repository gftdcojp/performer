import { describe, expect, it, vi } from "vitest";
import { createContext, createContextFromRequest } from "./context";
import { createHttpHandler } from "./http";
import { router } from "./index";
import { createRouter } from "./router";

describe("OrpcRouter", () => {
	it("should register and call procedures", async () => {
		const router = createRouter<{ test: boolean }>().add(
			"test.echo",
			async (ctx, input: string) => {
				return { ctx: ctx.test, input };
			},
		);

		const result = await router.call("test.echo", { test: true }, "hello");
		expect(result).toEqual({ ctx: true, input: "hello" });
	});

	it("should throw for unknown procedures", async () => {
		const router = createRouter();
		await expect(router.call("unknown", {}, {})).rejects.toThrow(
			"orpc: procedure not found: unknown",
		);
	});

	it("should list registered procedures", () => {
		const router = createRouter()
			.add("proc1", async () => "ok1")
			.add("proc2", async () => "ok2");

		expect(router.list()).toEqual(["proc1", "proc2"]);
	});
});

describe("Context", () => {
	it("should create default context", () => {
		const ctx = createContext();
		expect(typeof ctx.ports.clock).toBe("function");
		expect(ctx.ports.clock()).toBeInstanceOf(Date);
	});

	it("should merge custom context", () => {
		const ctx = createContext({
			tenantId: "tenant-1",
			userId: "user-1",
			ports: {
				clock: () => new Date("2024-01-01"),
			},
		});

		expect(ctx.tenantId).toBe("tenant-1");
		expect(ctx.userId).toBe("user-1");
		expect(ctx.ports.clock()).toEqual(new Date("2024-01-01"));
	});

	it("should extract metadata from request", () => {
		const mockRequest = {
			headers: new Map([
				["x-request-id", "req-123"],
				["x-tenant-id", "tenant-456"],
				["x-user-id", "user-789"],
				["user-agent", "test-agent"],
				["x-forwarded-for", "192.168.1.1"],
			]),
		} as unknown as Request;

		const ctx = createContextFromRequest(mockRequest);
		expect(ctx.correlationId).toBe("req-123");
		expect(ctx.tenantId).toBe("tenant-456");
		expect(ctx.userId).toBe("user-789");
		expect(ctx.userAgent).toBe("test-agent");
		expect(ctx.ipAddress).toBe("192.168.1.1");
		expect(ctx.timestamp).toBeInstanceOf(Date);
	});

	it("should generate correlation ID when not provided", () => {
		const mockRequest = {
			headers: new Map(),
		} as unknown as Request;

		const ctx = createContextFromRequest(mockRequest);
		expect(ctx.correlationId).toMatch(/^req_\d+_[a-z0-9]+$/);
	});
});

describe("HTTP Handler", () => {
	it("should handle successful procedure calls", async () => {
		const testRouter = createRouter().add("test.success", async () => ({
			result: "ok",
		}));

		const handler = createHttpHandler(testRouter, async () => createContext());

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ p: "test.success", i: {} }),
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toEqual({
			ok: true,
			r: { result: "ok" },
		});
	});

	it("should return 405 for non-POST methods", async () => {
		const testRouter = createRouter();
		const handler = createHttpHandler(testRouter, async () => createContext());

		const mockRequest = new Request("http://test.com", {
			method: "GET",
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(405);

		const body = await response.json();
		expect(body).toEqual({
			ok: false,
			error: {
				code: "METHOD_NOT_ALLOWED",
				message: "Only POST method is allowed",
			},
		});
	});

	it("should return 415 for non-JSON content-type", async () => {
		const testRouter = createRouter();
		const handler = createHttpHandler(testRouter, async () => createContext());

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: { "content-type": "text/plain" },
			body: "not json",
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(415);

		const body = await response.json();
		expect(body).toEqual({
			ok: false,
			error: {
				code: "UNSUPPORTED_MEDIA_TYPE",
				message: "Content-Type must be application/json",
			},
		});
	});

	it("should return 400 for invalid JSON", async () => {
		const testRouter = createRouter();
		const handler = createHttpHandler(testRouter, async () => createContext());

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "invalid json",
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(400);

		const body = await response.json();
		expect(body).toEqual({
			ok: false,
			error: {
				code: "BAD_REQUEST",
				message: "Invalid JSON in request body",
			},
		});
	});

	it("should return 422 for invalid request format", async () => {
		const testRouter = createRouter();
		const handler = createHttpHandler(testRouter, async () => createContext());

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ invalid: "format" }),
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(422);

		const body = await response.json();
		expect(body.ok).toBe(false);
		expect(body.error.code).toBe("VALIDATION_FAILED");
		expect(body.error.message).toBe("Invalid request format");
		expect(body.error.details).toBeDefined();
	});

	it("should return 404 for unknown procedures", async () => {
		const testRouter = createRouter();
		const handler = createHttpHandler(testRouter, async (req) =>
			createContextFromRequest(req),
		);

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ p: "unknown.procedure", i: {} }),
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(404);

		const body = await response.json();
		expect(body).toEqual({
			ok: false,
			error: {
				code: "PROCEDURE_NOT_FOUND",
				message: "Requested procedure does not exist",
				correlationId: expect.any(String),
			},
		});
	});

	it("should handle procedure execution errors", async () => {
		const testRouter = createRouter().add("test.error", async () => {
			throw new Error("Procedure failed");
		});

		const handler = createHttpHandler(testRouter, async () => createContext());

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ p: "test.error", i: {} }),
		});

		const response = await handler(mockRequest);
		expect(response.status).toBe(500);

		const body = await response.json();
		expect(body.ok).toBe(false);
		expect(body.error.code).toBe("UNKNOWN_ERROR");
		expect(body.error.message).toBe("Procedure failed");
		expect(body.error.correlationId).toBeDefined();
	});

	it("should extract correlation ID from request headers", async () => {
		const testRouter = createRouter().add("test.correlation", async (ctx) => ({
			correlationId: ctx.correlationId,
		}));

		const mockRequest = new Request("http://test.com", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-request-id": "test-correlation-123",
			},
			body: JSON.stringify({ p: "test.correlation", i: {} }),
		});

		const handler = createHttpHandler(testRouter, async (req) =>
			createContextFromRequest(req),
		);
		const response = await handler(mockRequest);
		const body = await response.json();

		expect(body.r.correlationId).toBe("test-correlation-123");
	});
});

describe("RPC Procedures", () => {
	it("should have process procedures registered", () => {
		const procedures = router.list();
		expect(procedures).toContain("process.start");
		expect(procedures).toContain("process.signal");
		expect(procedures).toContain("process.completeTask");
		expect(procedures).toContain("process.getTasks");
		expect(procedures).toContain("process.getInstance");
	});
});
