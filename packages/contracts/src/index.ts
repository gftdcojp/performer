// Merkle DAG: contracts_core -> ts_rest_integration -> zod_validation -> api_schemas
// ts-rest + Zod schemas for I/O boundaries

import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const contract = initContract();

// Common schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
});

export const ProcessInstanceSchema = z.object({
  id: z.string(),
  processId: z.string(),
  businessKey: z.string(),
  status: z.enum(["running", "completed", "suspended", "terminated"]),
  variables: z.record(z.any()),
  startTime: z.date(),
  endTime: z.date().optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["user", "service", "send", "receive", "manual", "businessRule"]),
  assignee: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.number().optional(),
  variables: z.record(z.any()),
});

// API Contracts
export const performerContract = contract.router({
  // User management
  getUser: {
    method: "GET",
    path: "/users/:id",
    responses: {
      200: UserSchema,
      404: z.object({ message: z.string() }),
    },
  },

  createUser: {
    method: "POST",
    path: "/users",
    body: UserSchema.omit({ id: true }),
    responses: {
      201: UserSchema,
      400: z.object({ message: z.string() }),
    },
  },

  // Process management
  getProcessInstance: {
    method: "GET",
    path: "/processes/:id",
    responses: {
      200: ProcessInstanceSchema,
      404: z.object({ message: z.string() }),
    },
  },

  startProcess: {
    method: "POST",
    path: "/processes",
    body: z.object({
      processId: z.string(),
      businessKey: z.string(),
      variables: z.record(z.any()).optional(),
    }),
    responses: {
      201: ProcessInstanceSchema,
      400: z.object({ message: z.string() }),
    },
  },

  // Task management
  getTasks: {
    method: "GET",
    path: "/processes/:processId/tasks",
    responses: {
      200: z.array(TaskSchema),
    },
  },

  completeTask: {
    method: "POST",
    path: "/tasks/:taskId/complete",
    body: z.object({
      variables: z.record(z.any()).optional(),
    }),
    responses: {
      200: z.object({ success: z.literal(true) }),
      400: z.object({ message: z.string() }),
    },
  },
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type ProcessInstance = z.infer<typeof ProcessInstanceSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type PerformerContract = typeof performerContract;
