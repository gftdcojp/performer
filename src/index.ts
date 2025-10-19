// Merkle DAG: performer_core -> integrated_packages -> unified_api
// Integrated BPMN + Actor + Neo4j Web Framework - All packages unified

// Version info
export const VERSION = "1.0.0";

// Core framework name
export const FRAMEWORK_NAME = "Performer";

// Re-export all packages
export * from "@gftdcojp/performer-actions";
export * from "@gftdcojp/performer-actor";
export * from "@gftdcojp/performer-data";
export * from "@gftdcojp/performer-process";

// Error handling is private package, so only export specific functions if needed
// export * from "@gftdcojp/performer-error-handling";
export * from "@gftdcojp/performer-router";

// For backward compatibility - keep existing exports
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
  variables: Record<string, any>;
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
  variables: Record<string, any> = {}
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
