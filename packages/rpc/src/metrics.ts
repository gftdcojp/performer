// Merkle DAG: rpc_metrics -> observability_integration -> opentelemetry_tracing -> performance_monitoring
// OpenTelemetry integration for RPC metrics, tracing, and performance monitoring

import type { Context } from "./context";
import { createObservabilityManager, type ObservabilityConfig } from "@gftdcojp/performer-observability";

// RPC-specific metrics and tracing
export interface RPCMetrics {
	requestCount: any; // Counter
	requestDuration: any; // Histogram
	activeConnections: any; // UpDownCounter (for streaming)
	errorCount: any; // Counter
	procedureCallCount: any; // Counter
	procedureCallDuration: any; // Histogram
}

// RPC observability manager
export class RPCObservability {
	private obsManager: any;
	private metrics: RPCMetrics;
	private serviceName: string;

	constructor(config: ObservabilityConfig) {
		this.obsManager = createObservabilityManager(config);
		this.serviceName = config.serviceName;

		// Initialize RPC-specific metrics
		this.metrics = this.initializeMetrics();
	}

	private initializeMetrics(): RPCMetrics {
		const meter = this.obsManager.meter;

		return {
			requestCount: meter.createCounter("rpc_requests_total", {
				description: "Total number of RPC requests",
			}),
			requestDuration: meter.createHistogram("rpc_request_duration_seconds", {
				description: "RPC request duration in seconds",
			}),
			activeConnections: meter.createUpDownCounter("rpc_active_connections", {
				description: "Number of active streaming connections",
			}),
			errorCount: meter.createCounter("rpc_errors_total", {
				description: "Total number of RPC errors",
			}),
			procedureCallCount: meter.createCounter("rpc_procedure_calls_total", {
				description: "Total number of procedure calls",
			}),
			procedureCallDuration: meter.createHistogram("rpc_procedure_call_duration_seconds", {
				description: "Procedure call duration in seconds",
			}),
		};
	}

	// Record incoming request
	recordRequest(method: string, procedure?: string, status?: number): void {
		this.metrics.requestCount.add(1, {
			method,
			procedure: procedure || "unknown",
			status: status?.toString() || "unknown",
		});
	}

	// Record request duration
	recordRequestDuration(method: string, durationMs: number, procedure?: string): void {
		this.metrics.requestDuration.record(durationMs / 1000, {
			method,
			procedure: procedure || "unknown",
		});
	}

	// Record procedure call
	recordProcedureCall(procedure: string, success: boolean): void {
		this.metrics.procedureCallCount.add(1, {
			procedure,
			success: success.toString(),
		});
	}

	// Record procedure call duration
	recordProcedureCallDuration(procedure: string, durationMs: number): void {
		this.metrics.procedureCallDuration.record(durationMs / 1000, {
			procedure,
		});
	}

	// Record error
	recordError(errorType: string, procedure?: string, context?: Context): void {
		this.metrics.errorCount.add(1, {
			error_type: errorType,
			procedure: procedure || "unknown",
			tenant_id: context?.tenantId || "unknown",
			user_id: context?.userId || "unknown",
		});

		// Log error with structured context
		this.obsManager.log("error", `RPC error: ${errorType}`, {
			procedure,
			tenantId: context?.tenantId,
			userId: context?.userId,
			correlationId: context?.correlationId,
			ipAddress: context?.ipAddress,
			userAgent: context?.userAgent,
		});
	}

	// Update active connections (for streaming)
	updateActiveConnections(delta: number, connectionType: "websocket" | "sse"): void {
		this.metrics.activeConnections.add(delta, {
			connection_type: connectionType,
		});
	}

	// Create request span
	startRequestSpan(operation: string, context?: Context): any {
		const span = this.obsManager.startSpan(operation, {
			"rpc.service": this.serviceName,
			"rpc.tenant_id": context?.tenantId || "unknown",
			"rpc.user_id": context?.userId || "unknown",
			"rpc.correlation_id": context?.correlationId || "unknown",
			"rpc.ip_address": context?.ipAddress || "unknown",
		});

		// Add context tags
		if (context?.metadata) {
			for (const [key, value] of Object.entries(context.metadata)) {
				if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
					span.setAttribute(`rpc.context.${key}`, value);
				}
			}
		}

		return span;
	}

	// Create procedure call span
	startProcedureSpan(procedure: string, context?: Context): any {
		return this.obsManager.startSpan(`procedure.${procedure}`, {
			"rpc.procedure": procedure,
			"rpc.tenant_id": context?.tenantId || "unknown",
			"rpc.user_id": context?.userId || "unknown",
			"rpc.correlation_id": context?.correlationId || "unknown",
		});
	}

	// Log structured message
	log(level: "info" | "warn" | "error", message: string, context?: Record<string, any>): void {
		this.obsManager.log(level, message, context);
	}

	// Capture error with context
	captureError(error: Error, context?: Record<string, any>): void {
		this.obsManager.captureError(error, context);
	}

	// Measure execution time with tracing
	async measureExecutionTime<T>(
		operation: () => Promise<T>,
		operationName: string,
		context?: Context,
		attributes?: Record<string, string | number | boolean>,
	): Promise<T> {
		return this.obsManager.measureExecutionTime(operation, operationName, {
			"rpc.operation": operationName,
			"rpc.tenant_id": context?.tenantId || "unknown",
			"rpc.user_id": context?.userId || "unknown",
			...attributes,
		});
	}
}

// Global RPC observability instance (lazy initialization)
let globalRPCObservability: RPCObservability | null = null;

export function initializeRPCObservability(config: ObservabilityConfig): RPCObservability {
	globalRPCObservability = new RPCObservability(config);
	return globalRPCObservability;
}

export function getRPCObservability(): RPCObservability | null {
	return globalRPCObservability;
}

// Utility function to create observability-enabled RPC handler
export function withObservability<T extends any[], R>(
	fn: (...args: T) => Promise<R>,
	operationName: string,
	observability?: RPCObservability,
	context?: Context,
): (...args: T) => Promise<R> {
	return async (...args: T): Promise<R> => {
		if (!observability) {
			return fn(...args);
		}

		const startTime = Date.now();
		let success = false;

		try {
			const result = await observability.measureExecutionTime(
				() => fn(...args),
				operationName,
				context,
			);
			success = true;
			return result;
		} catch (error) {
			observability.recordError(
				error instanceof Error ? error.name : "UnknownError",
				operationName,
				context,
			);
			throw error;
		} finally {
			observability.recordRequestDuration("POST", Date.now() - startTime, operationName);
			if (success) {
				observability.recordProcedureCall(operationName, true);
			}
		}
	};
}
