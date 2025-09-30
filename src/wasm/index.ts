// WASM Layer
// Merkle DAG: wasm-node

import { PerformanceComputeEngine } from "./performance-compute"

// Performance engine instance
export const computeEngine = new PerformanceComputeEngine()

export * from "./performance-compute"
