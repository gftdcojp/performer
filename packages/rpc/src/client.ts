// Merkle DAG: rpc_client -> type_safe_generation -> fetch_bridge
// Type-safe client SDK generation from router metadata

import type { OrpcRouter } from "./router";

// Procedure metadata for client generation
export interface ProcedureMetadata {
	name: string;
	inputSchema?: any; // Zod schema or type info
	outputSchema?: any; // Zod schema or type info
	description?: string;
}

// Client configuration
export interface ClientConfig {
	baseUrl: string;
	fetch?: typeof fetch;
	headers?: Record<string, string>;
	timeout?: number;
}

// Type-safe client interface
export type Client<C> = {
	[K in keyof C]: C[K] extends (...args: any[]) => any
		? (...args: Parameters<C[K]>) => Promise<Awaited<ReturnType<C[K]>>>
		: never;
};

// Generic RPC client
export class RpcClient {
	private config: Required<ClientConfig>;

	constructor(config: ClientConfig) {
		this.config = {
			fetch: globalThis.fetch,
			headers: {},
			timeout: 30000,
			...config,
		};
	}

	async call(procedureName: string, input: unknown): Promise<unknown> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const response = await this.config.fetch(
				this.config.baseUrl,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...this.config.headers,
					},
					body: JSON.stringify({
						p: procedureName,
						i: input,
					}),
					signal: controller.signal,
				},
			);

			const body = await response.json();

			if (!response.ok || !body.ok) {
				throw new Error(
					body.error?.message || `RPC call failed: ${response.status} ${response.statusText}`,
				);
			}

			return body.r;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	// Update headers (for auth tokens, etc.)
	setHeader(key: string, value: string): void {
		this.config.headers[key] = value;
	}

	removeHeader(key: string): void {
		delete this.config.headers[key];
	}

	updateHeaders(headers: Record<string, string>): void {
		this.config.headers = { ...this.config.headers, ...headers };
	}
}

// Client factory function with type inference
export function createClient<C>(
	router: OrpcRouter<C>,
	config: ClientConfig,
): Client<C> {
	const client = new RpcClient(config);

	// Type assertion for the proxy
	const proxy = new Proxy({} as Client<C>, {
		get(target, prop) {
			if (typeof prop === "string") {
				return async (...args: unknown[]) => {
					const input = args[0]; // First argument is the input
					return client.call(prop, input);
				};
			}
			return target[prop as keyof Client<C>];
		},
	});

	return proxy;
}

// Utility function to extract procedure names from router
export function getProcedureNames(router: OrpcRouter<any>): string[] {
	return router.list();
}

// Development helper: Generate TypeScript client code
export function generateClientCode(router: OrpcRouter<any>, config: ClientConfig): string {
	const procedures = router.list();
	const procedureCalls = procedures
		.map((name) => `  ${name}: (input: any) => client.call("${name}", input),`)
		.join("\n");

	return `
// Auto-generated RPC client for ${config.baseUrl}
import { RpcClient } from "@gftdcojp/performer-rpc";

const client = new RpcClient(${JSON.stringify(config, null, 2)});

export const rpcClient = {
${procedureCalls}
};
`;
}
