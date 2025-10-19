import { describe, it, expect } from "vitest";
import { createRouter } from "./router";
import { createContext } from "./context";
import { router } from "./index";

describe("OrpcRouter", () => {
	it("should register and call procedures", async () => {
		const router = createRouter<{ test: boolean }>()
			.add("test.echo", async (ctx, input: string) => {
				return { ctx: ctx.test, input };
			});

		const result = await router.call("test.echo", { test: true }, "hello");
		expect(result).toEqual({ ctx: true, input: "hello" });
	});

	it("should throw for unknown procedures", async () => {
		const router = createRouter();
		await expect(router.call("unknown", {}, {})).rejects.toThrow("orpc: procedure not found: unknown");
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
