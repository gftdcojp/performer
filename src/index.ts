// Application Entry Point
// Merkle DAG: root-node

import { actorCoordinator } from "./actor"
import { componentRegistry, initializeUI } from "./ui"
import { computeEngine } from "./wasm"
import { createRPCClient } from "./rpc"

// Initialize application
export const initializeApp = async () => {
  console.log("Initializing Performer application...")

  // Initialize UI
  initializeUI()

  // Setup RPC connection
  const rpcClient = createRPCClient({
    host: "localhost",
    port: 9090,
    secure: false,
  })

  console.log("Application initialized!")
}

// Start application
if (typeof window !== 'undefined') {
  initializeApp()
}
