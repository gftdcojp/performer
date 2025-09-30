// Actor Layer using Effect Actor
// Merkle DAG: actor-node
// Extended with real-time synchronization support

import { Effect } from "effect"
import { ActorCoordinator, ActorSystemManager } from "./business-actor"
import { ActorConfig } from "./types"
import { RealtimeService } from "../realtime"

// Actor coordinator instance
export const actorCoordinator = new ActorCoordinator()

// Actor system manager instance
export const actorSystemManager = new ActorSystemManager()

// Create business actor using Effect
export const createBusinessActor = (
  id: string,
  config?: ActorConfig
) => {
  return actorCoordinator.createBusinessActor(id, config)
}

// Initialize actor system
export const initializeActorSystem = () => {
  return actorSystemManager.initialize()
}

// Shutdown actor system
export const shutdownActorSystem = () => {
  return actorSystemManager.shutdown()
}

// Set real-time service for actor system
export const setRealtimeService = (service: RealtimeService) => {
  actorCoordinator.setRealtimeService(service)
}

// Utility function to run actor operations
export const runActorOperation = <A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A> => {
  return Effect.runPromise(effect)
}

export * from "./types"
export * from "./business-actor"
