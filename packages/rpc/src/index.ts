// Merkle DAG: rpc_procedures -> process_integration -> unified_api
// Process API procedures registration - domain logic delegation

import {
	type ProcessInstance,
	type Task,
	processEngine,
} from "@gftdcojp/performer-process";
import { type Context, createContextFromRequest } from "./context";
import { createHttpHandler } from "./http";
import { createRouter } from "./router";

// Procedure definitions for process engine
export const router = createRouter<Context>()
	.add(
		"process.start",
		async (
			_ctx,
			input: {
				processId: string;
				businessKey: string;
				variables?: Record<string, unknown>;
			},
		): Promise<ProcessInstance> => {
			return processEngine.startProcess(
				input.processId,
				input.businessKey,
				input.variables ?? {},
			);
		},
	)
	.add(
		"process.signal",
		async (
			_ctx,
			input: {
				instanceId: string;
				signal: string;
				variables?: Record<string, unknown>;
			},
		): Promise<{ ok: true }> => {
			await processEngine.signalProcess(
				input.instanceId,
				input.signal,
				input.variables,
			);
			return { ok: true };
		},
	)
	.add(
		"process.completeTask",
		async (
			_ctx,
			input: {
				instanceId: string;
				taskId: string;
				variables?: Record<string, unknown>;
			},
		): Promise<{ ok: true }> => {
			await processEngine.completeTask(
				input.instanceId,
				input.taskId,
				input.variables,
			);
			return { ok: true };
		},
	)
	.add(
		"process.getTasks",
		async (_ctx, input: { instanceId: string }): Promise<Task[]> => {
			return processEngine.getTasks(input.instanceId);
		},
	)
	.add(
		"process.getInstance",
		async (
			_ctx,
			input: { instanceId: string },
		): Promise<ProcessInstance | undefined> => {
			return processEngine.getInstance(input.instanceId);
		},
	);

// HTTP handler factory
export const handleOrpc = createHttpHandler(router, async (req) =>
	createContextFromRequest(req),
);

// Export types for client usage
export type { Context };

// Client SDK exports
export {
	RpcClient,
	createClient,
	getProcedureNames,
	generateClientCode,
	type ClientConfig,
	type ProcedureMetadata,
} from "./client";

// Auth0 integration exports
export {
	decodeJwt,
	extractAuth0Claims,
	extractUserIdentity,
	createContextWithAuth,
	auth0RequestExtractor,
	createContextFromRequestWithAuth,
	type Auth0JwtPayload,
	type Auth0Config,
	type JwtValidationResult,
} from "./auth";

// Streaming exports
export {
	EventBroker,
	createWebSocketHandler,
	createSSEHandler,
	globalEventBroker,
	type StreamingEvent,
	type WebSocketConnection,
	type SSEConnection,
	type StreamingConfig,
} from "./streaming";

// Observability exports
export {
	RPCObservability,
	initializeRPCObservability,
	getRPCObservability,
	withObservability,
	type RPCMetrics,
} from "./metrics";
