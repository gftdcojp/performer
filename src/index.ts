// Performer Framework Public API
// Merkle DAG: root-node

// Export business processes
export { userOnboardingProcess } from "./processes/user-onboarding.process";

// Export sagas (composed processes)
export { completeUserOnboardingSagaProcess } from "./processes/complete-user-onboarding.saga";

// Export process metadata
export { processMetadata as userOnboardingMetadata } from "./processes/user-onboarding.process";
export { processMetadata as completeUserOnboardingMetadata } from "./processes/complete-user-onboarding.saga";

// Export services (for advanced usage)
export { RpcService, RpcServiceLive, RpcServiceMock } from "./rpc/client";
export { CapabilityService, CapabilityServiceLive, PermissionDeniedError } from "./capabilities/checker";

// Export types (for TypeScript users)
export type { RpcService, CapabilityService } from "./processes/user-onboarding";

// Process Registry - Unified process management
export interface ProcessMetadata {
  id: string;
  name: string;
  type: 'single' | 'saga';
  version: string;
  description: string;
  author: string;
  created: string;
  tags: string[];
}

export interface ProcessInstance {
  metadata: ProcessMetadata;
  bootstrap: (container: HTMLElement) => any;
  toBpmnJson: () => any;
}

const processRegistry: Map<string, ProcessInstance> = new Map();

// Auto-register processes
import { userOnboardingProcess, processMetadata as userOnboardingMeta } from "./processes/user-onboarding.process";
import { completeUserOnboardingSagaProcess, processMetadata as sagaMeta } from "./processes/complete-user-onboarding.saga";

processRegistry.set('user-onboarding', {
  metadata: userOnboardingMeta,
  bootstrap: userOnboardingProcess.bootstrap,
  toBpmnJson: userOnboardingProcess.toBpmnJson
});

processRegistry.set('complete-user-onboarding', {
  metadata: sagaMeta,
  bootstrap: completeUserOnboardingSagaProcess.bootstrap,
  toBpmnJson: completeUserOnboardingSagaProcess.toBpmnJson
});

// Process Registry API
export const ProcessRegistry = {
  get: (id: string): ProcessInstance | undefined => processRegistry.get(id),
  list: (): ProcessInstance[] => Array.from(processRegistry.values()),
  listByType: (type: 'single' | 'saga'): ProcessInstance[] =>
    Array.from(processRegistry.values()).filter(p => p.metadata.type === type),
  getMetadata: (id: string): ProcessMetadata | undefined =>
    processRegistry.get(id)?.metadata
};

// Framework initialization helper
export const initializePerformer = () => {
  console.log("🎭 Performer framework initialized");

  const singleProcesses = ProcessRegistry.listByType('single');
  const sagaProcesses = ProcessRegistry.listByType('saga');

  console.log(`📋 Registered processes: ${singleProcesses.length} single, ${sagaProcesses.length} sagas`);

  return {
    version: "0.1.0",
    processes: {
      userOnboarding: userOnboardingProcess,
      completeUserOnboardingSaga: completeUserOnboardingSagaProcess,
    },
    registry: ProcessRegistry,
    metadata: {
      singleProcesses: singleProcesses.map(p => p.metadata),
      sagaProcesses: sagaProcesses.map(p => p.metadata),
    }
  };
};
