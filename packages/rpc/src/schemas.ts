// Merkle DAG: rpc_schemas -> i/o_validation -> boundary_control
// Zod schemas for RPC I/O validation and type safety

import { z } from "zod";

// HTTP Request/Response schemas
export const HttpRequestBodySchema = z.object({
	p: z.string().min(1, "procedure name is required"),
	i: z.unknown(), // procedure-specific input
});

export type HttpRequestBody = z.infer<typeof HttpRequestBodySchema>;

export const HttpResponseSchema = z.union([
	z.object({
		ok: z.literal(true),
		r: z.unknown(),
	}),
	z.object({
		ok: z.literal(false),
		error: z.object({
			code: z.string(),
			message: z.string(),
			correlationId: z.string().optional(),
			details: z.unknown().optional(),
		}),
	}),
]);

export type HttpResponse = z.infer<typeof HttpResponseSchema>;

// Procedure input/output schemas
export const ProcessStartInputSchema = z.object({
	processId: z.string().min(1),
	businessKey: z.string().min(1),
	variables: z.record(z.unknown()).optional(),
});

export type ProcessStartInput = z.infer<typeof ProcessStartInputSchema>;

export const ProcessSignalInputSchema = z.object({
	instanceId: z.string().min(1),
	signal: z.string().min(1),
	variables: z.record(z.unknown()).optional(),
});

export type ProcessSignalInput = z.infer<typeof ProcessSignalInputSchema>;

export const ProcessCompleteTaskInputSchema = z.object({
	instanceId: z.string().min(1),
	taskId: z.string().min(1),
	variables: z.record(z.unknown()).optional(),
});

export type ProcessCompleteTaskInput = z.infer<
	typeof ProcessCompleteTaskInputSchema
>;

export const ProcessGetTasksInputSchema = z.object({
	instanceId: z.string().min(1),
});

export type ProcessGetTasksInput = z.infer<typeof ProcessGetTasksInputSchema>;

export const ProcessGetInstanceInputSchema = z.object({
	instanceId: z.string().min(1),
});

export type ProcessGetInstanceInput = z.infer<
	typeof ProcessGetInstanceInputSchema
>;
