// Domain Layer
// Merkle DAG: domain-node

import * as T from "@effect-ts/core/Effect"
import { ActorDBService } from "./types"

// Business logic implementation
export const createUser = (userData: { name: string; email: string }) =>
  T.accessServiceM(ActorDBService)((db) =>
    db.writeEvent({
      entityId: crypto.randomUUID(),
      eventType: 'user_created',
      payload: userData,
      timestamp: new Date(),
      version: 1,
    })
  )

export * from "./types"
export * from "./business-logic"
