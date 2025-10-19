import { describe, expect, it, vi } from "vitest";
import { createContext, createContextFromRequest } from "./context";
import { createHttpHandler } from "./http";
import { router } from "./index";
import { createRouter } from "./router";
import {
	decodeJwt,
	extractAuth0Claims,
	extractUserIdentity,
	createContextWithAuth,
	createContextFromRequestWithAuth,
} from "./auth";
import { EventBroker } from "./streaming";
import {
	RPCObservability,
	initializeRPCObservability,
	getRPCObservability,
	withObservability,
} from "./metrics";
import {
	RpcClient,
	createClient,
	getProcedureNames,
	generateClientCode,
} from "./client";

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

describe("Client SDK", () => {
	it("should create RPC client", () => {
		const client = new RpcClient({
			baseUrl: "http://test.com/api",
		});

		expect(client).toBeInstanceOf(RpcClient);
	});

	it("should create typed client from router", () => {
		const testRouter = createRouter()
			.add("test.echo", async (ctx, input: string) => `echo: ${input}`);

		const client = createClient(testRouter, {
			baseUrl: "http://test.com/api",
		});

		// TypeScript should infer the correct types
		expect(typeof client["test.echo"]).toBe("function");
	});

	it("should extract procedure names", () => {
		const testRouter = createRouter()
			.add("proc1", async () => "ok1")
			.add("proc2", async () => "ok2");

		const names = getProcedureNames(testRouter);
		expect(names).toEqual(["proc1", "proc2"]);
	});

	it("should generate client code", () => {
		const testRouter = createRouter()
			.add("test.echo", async () => "ok");

		const code = generateClientCode(testRouter, {
			baseUrl: "http://test.com/api",
		});

		expect(code).toContain("test.echo");
		expect(code).toContain("http://test.com/api");
		expect(code).toContain("RpcClient");
	});

	it("should handle client configuration", () => {
		const client = new RpcClient({
			baseUrl: "http://test.com/api",
			headers: { "Authorization": "Bearer token" },
			timeout: 5000,
		});

		// Test header management
		client.setHeader("X-Custom", "value");
		client.updateHeaders({ "X-Another": "value2" });
		client.removeHeader("X-Custom");

		expect(client).toBeDefined();
	});
});

describe("Auth0 Integration", () => {
	it.skip("should decode valid JWT", () => {
		// Mock JWT: header.payload.signature
		const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
		const payload = Buffer.from(JSON.stringify({
			sub: "user123",
			aud: "audience",
			iss: "issuer",
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
		})).toString('base64url');
		const signature = "signature";

		const token = `${header}.${payload}.${signature}`;

		const result = decodeJwt(token);
		expect(result.valid).toBe(true);
		expect(result.payload?.sub).toBe("user123");
	});

	it("should reject invalid JWT", () => {
		const result = decodeJwt("invalid.jwt");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid JWT format");
	});

	it.skip("should extract Auth0 claims", () => {
		const mockPayload = {
			sub: "user123",
			aud: "audience",
			iss: "issuer",
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			permissions: ["read", "write"],
			roles: ["admin"],
			tenantId: "tenant456",
		};

		// Mock decodeJwt to return the payload
		const originalDecode = decodeJwt;
		// @ts-ignore - vitest version compatibility
		decodeJwt = vi.fn(() => ({ valid: true, payload: mockPayload }));

		const claims = extractAuth0Claims("mock.jwt.token");
		expect(claims?.sub).toBe("user123");
		expect(claims?.permissions).toEqual(["read", "write"]);

		// Restore original
		decodeJwt = originalDecode;
	});

	it("should extract user identity from claims", () => {
		const claims = {
			sub: "user123",
			tenantId: "tenant456",
			permissions: ["read", "write"],
			roles: ["admin"],
		} as any;

		const identity = extractUserIdentity(claims);
		expect(identity.userId).toBe("user123");
		expect(identity.tenantId).toBe("tenant456");
		expect(identity.permissions).toEqual(["read", "write"]);
		expect(identity.roles).toEqual(["admin"]);
	});

	it.skip("should create context with Auth0 JWT", () => {
		const mockClaims = {
			sub: "user123",
			tenantId: "tenant456",
			permissions: ["read"],
			roles: ["user"],
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
		};

		// Mock extractAuth0Claims
		const originalExtract = extractAuth0Claims;
		// @ts-ignore - vitest version compatibility
		extractAuth0Claims = vi.fn(() => mockClaims);

		const context = createContextWithAuth("mock.jwt.token");
		expect(context?.userId).toBe("user123");
		expect(context?.tenantId).toBe("tenant456");
		expect(context?.metadata?.auth?.permissions).toEqual(["read"]);

		// Restore original
		extractAuth0Claims = originalExtract;
	});

	it.skip("should create context from request with Auth0", () => {
		const mockRequest = new Request("http://test.com", {
			headers: {
				"authorization": "Bearer mock.jwt.token",
				"x-request-id": "req-123",
			},
		});

		// Mock createContextWithAuth
		const originalCreate = createContextWithAuth;
		// @ts-ignore - vitest version compatibility
		createContextWithAuth = vi.fn(() => ({
			userId: "user123",
			tenantId: "tenant456",
			metadata: { auth: { permissions: ["read"] } },
		}));

		const context = createContextFromRequestWithAuth(mockRequest);
		expect(context.userId).toBe("user123");
		expect(context.tenantId).toBe("tenant456");
		expect(context.correlationId).toBe("req-123");

		// Restore original
		createContextWithAuth = originalCreate;
	});

	it.skip("should fallback to headers when JWT is invalid", () => {
		const mockRequest = new Request("http://test.com", {
			headers: {
				"authorization": "Bearer invalid.token",
				"x-tenant-id": "header-tenant",
				"x-user-id": "header-user",
			},
		});

		// Mock createContextWithAuth to return null
		const originalCreate = createContextWithAuth;
		// @ts-ignore - vitest version compatibility
		createContextWithAuth = vi.fn(() => null);

		const context = createContextFromRequestWithAuth(mockRequest);
		expect(context.tenantId).toBe("header-tenant");
		expect(context.userId).toBe("header-user");

		// Restore original
		createContextWithAuth = originalCreate;
	});
});

describe("Streaming", () => {
	it("should create event broker", () => {
		const broker = new EventBroker();
		expect(broker).toBeInstanceOf(EventBroker);
	});

	it("should subscribe and publish events", () => {
		const broker = new EventBroker();
		const mockConnection = {
			id: "test-conn",
			subscriptions: new Set<string>(),
		} as any;

		// Subscribe to event
		broker.subscribe("test.event", mockConnection);
		expect(mockConnection.subscriptions.has("test.event")).toBe(true);

		// Mock send method
		mockConnection.send = vi.fn();

		// Publish event
		const event = { type: "test.event", data: { message: "hello" } };
		broker.publish(event);

		expect(mockConnection.send).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "test.event",
				data: { message: "hello" },
				timestamp: expect.any(Date),
			})
		);

		// Unsubscribe
		broker.unsubscribe("test.event", mockConnection);
		expect(mockConnection.subscriptions.has("test.event")).toBe(false);
	});

	it("should buffer events", () => {
		const broker = new EventBroker(2); // Small buffer

		const event1 = { type: "buffered.event", data: "event1" };
		const event2 = { type: "buffered.event", data: "event2" };
		const event3 = { type: "buffered.event", data: "event3" };

		broker.publish(event1);
		broker.publish(event2);
		broker.publish(event3);

		const buffered = broker.getBufferedEvents("buffered.event");
		expect(buffered).toHaveLength(2); // Only last 2 events
		expect(buffered[0].data).toBe("event2");
		expect(buffered[1].data).toBe("event3");
	});

	it("should filter buffered events by time", () => {
		const broker = new EventBroker();

		const pastTime = new Date(Date.now() - 2000);
		const futureTime = new Date(Date.now() - 500);

		const event1 = { type: "time.event", data: "past", timestamp: pastTime };
		const event2 = { type: "time.event", data: "future", timestamp: futureTime };

		broker.publish(event1);
		broker.publish(event2);

		const recentEvents = broker.getBufferedEvents("time.event", new Date(Date.now() - 1000));
		expect(recentEvents).toHaveLength(1);
		expect(recentEvents[0].data).toBe("future");
	});
});

describe("RPC Observability", () => {
	it("should initialize RPC observability", () => {
		const obs = initializeRPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		expect(obs).toBeInstanceOf(RPCObservability);
		expect(getRPCObservability()).toBe(obs);
	});

	it("should record metrics", () => {
		const obs = new RPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		// Record request
		obs.recordRequest("POST", "test.procedure", 200);

		// Record request duration
		obs.recordRequestDuration("POST", 150, "test.procedure");

		// Record procedure call
		obs.recordProcedureCall("test.procedure", true);

		// Record procedure duration
		obs.recordProcedureCallDuration("test.procedure", 100);

		// Update connections
		obs.updateActiveConnections(1, "websocket");
		obs.updateActiveConnections(-1, "websocket");

		expect(obs).toBeDefined();
	});

	it("should handle errors", () => {
		const obs = new RPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		const context = createContext({
			tenantId: "tenant123",
			userId: "user456",
			correlationId: "corr789",
		});

		// Record error
		obs.recordError("ValidationError", "test.procedure", context);

		// Log message
		obs.log("info", "Test log message", { test: true });

		expect(obs).toBeDefined();
	});

	it("should create spans", () => {
		const obs = new RPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		const context = createContext({
			tenantId: "tenant123",
			userId: "user456",
		});

		// Create request span
		const requestSpan = obs.startRequestSpan("test.request", context);

		// Create procedure span
		const procedureSpan = obs.startProcedureSpan("test.procedure", context);

		expect(requestSpan).toBeDefined();
		expect(procedureSpan).toBeDefined();
	});

	it("should measure execution time", async () => {
		const obs = new RPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		const context = createContext({
			tenantId: "tenant123",
		});

		// Measure execution time
		const result = await obs.measureExecutionTime(
			async () => {
				await new Promise(resolve => setTimeout(resolve, 10));
				return "test result";
			},
			"test.operation",
			context,
			{ custom: "attribute" },
		);

		expect(result).toBe("test result");
	});

	it("should wrap functions with observability", async () => {
		const obs = new RPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		const context = createContext({
			tenantId: "tenant123",
		});

		// Create observed function
		const observedFn = withObservability(
			async (x: number) => x * 2,
			"multiply",
			obs,
			context,
		);

		const result = await observedFn(5);
		expect(result).toBe(10);
	});

	it("should handle function errors with observability", async () => {
		const obs = new RPCObservability({
			serviceName: "test-rpc",
			serviceVersion: "1.0.0",
			environment: "test",
		});

		const context = createContext({
			tenantId: "tenant123",
		});

		// Create observed function that throws
		const observedFn = withObservability(
			async () => {
				throw new Error("Test error");
			},
			"failing.operation",
			obs,
			context,
		);

		await expect(observedFn()).rejects.toThrow("Test error");
	});
});
