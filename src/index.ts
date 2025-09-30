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
  hash: string; // Process hash for versioning and caching
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
    processRegistry.get(id)?.metadata,

  // Dynamic process loading by name and hash
  async loadByNameAndHash(processName: string, expectedHash?: string): Promise<ProcessInstance | null> {
    try {
      // First check if already loaded
      const existing = processRegistry.get(processName);
      if (existing) {
        if (expectedHash && existing.metadata.hash !== expectedHash) {
          console.warn(`Process ${processName} hash mismatch. Expected: ${expectedHash}, Got: ${existing.metadata.hash}`);
          // Hash mismatch - force reload
        } else {
          return existing;
        }
      }

      // Dynamic import based on process name
      let modulePath: string;
      if (processName === 'user-onboarding') {
        modulePath = './processes/user-onboarding.process';
      } else if (processName === 'complete-user-onboarding') {
        modulePath = './processes/complete-user-onboarding.saga';
      } else {
        // Generic dynamic loading (for future extensibility)
        modulePath = `./processes/${processName}.process`;
      }

      console.log(`🔄 Dynamically loading process: ${processName} from ${modulePath}`);

      const module = await import(modulePath);
      const metadata = module.processMetadata;
      const process = module[`${processName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}Process`] ||
                     module[`${processName}SagaProcess`] ||
                     module[Object.keys(module).find(key => key.includes('Process') && !key.includes('Metadata'))!];

      if (!process) {
        throw new Error(`Process export not found in module ${modulePath}`);
      }

      // Verify hash if provided
      if (expectedHash && metadata.hash !== expectedHash) {
        console.warn(`Process ${processName} hash verification failed. Expected: ${expectedHash}, Got: ${metadata.hash}`);
      }

      const processInstance: ProcessInstance = {
        metadata,
        bootstrap: process.bootstrap,
        toBpmnJson: process.toBpmnJson
      };

      // Cache the loaded process
      processRegistry.set(processName, processInstance);

      console.log(`✅ Process ${processName} loaded successfully (hash: ${metadata.hash})`);
      return processInstance;

    } catch (error) {
      console.error(`❌ Failed to load process ${processName}:`, error);
      return null;
    }
  },

  // Get process by name and hash (synchronous if already loaded)
  getByNameAndHash(processName: string, expectedHash?: string): ProcessInstance | undefined {
    const existing = processRegistry.get(processName);
    if (existing && (!expectedHash || existing.metadata.hash === expectedHash)) {
      return existing;
    }
    return undefined;
  }
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
