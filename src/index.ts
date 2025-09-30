// Performer Framework Public API
// Merkle DAG: root-node

// Export business processes
export { userOnboardingProcess } from "./processes/user-onboarding.process";

// Export services (for advanced usage)
export { RpcService, RpcServiceLive, RpcServiceMock } from "./rpc/client";
export { CapabilityService, CapabilityServiceLive, PermissionDeniedError } from "./capabilities/checker";

// Export types (for TypeScript users)
export type { RpcService, CapabilityService } from "./processes/user-onboarding";

// Framework initialization helper
export const initializePerformer = () => {
  console.log("🎭 Performer framework initialized");
  return {
    version: "0.1.0",
    processes: {
      userOnboarding: userOnboardingProcess,
    },
  };
};
