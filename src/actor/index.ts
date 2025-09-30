// Actor Layer
// Merkle DAG: actor-node

import { ActorCoordinator } from "./business-actor"

// Actor coordinator instance
export const actorCoordinator = new ActorCoordinator()

// Create business actor
export const createBusinessActor = (id: string) => {
  // Implementation here
}

export * from "./types"
export * from "./business-actor"
