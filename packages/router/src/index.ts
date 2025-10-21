// Merkle DAG: performer_core -> integrated_packages -> unified_api
// Integrated BPMN + Actor + Neo4j Web Framework - All packages unified

// Version info
export const VERSION = "1.0.0";

// Core framework name
export const FRAMEWORK_NAME = "Performer";

// Basic types
export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface ProcessInstance {
  id: string;
  processId: string;
  businessKey: string;
  status: "running" | "completed" | "suspended" | "terminated";
  variables: Record<string, unknown>;
  startTime: Date;
  endTime?: Date;
}

// Factory functions
export function createUser(id: string, email: string, roles: string[] = []): User {
  return { id, email, roles };
}

export function createProcessInstance(
  processId: string,
  businessKey: string,
  variables: Record<string, unknown> = {}
): Omit<ProcessInstance, "id" | "startTime" | "status"> {
  return {
    processId,
    businessKey,
    variables,
  };
}

// Utility functions
export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isCompleted(instance: ProcessInstance): boolean {
  return instance.status === "completed";
}

export function isRunning(instance: ProcessInstance): boolean {
  return instance.status === "running";
}

// Re-export from dependent packages
export * as actions from "@gftdcojp/performer-actions";
export * as actor from "@gftdcojp/performer-actor";
export * as data from "@gftdcojp/performer-data";
export * as errorHandling from "@gftdcojp/performer-error-handling";
export * as process from "@gftdcojp/performer-process";
export { FileRouter, SSRPipeline, type RouterConfig, type RouteMatch } from "./router/index";
