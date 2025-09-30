// Actor Types and State Management for Effect Actor
// Merkle DAG: actor-node

import { Effect } from "effect"
import { Message } from "./effect-actor"
import { DomainEvent, BusinessEntity } from "@/domain/types"

// Base Message Interface
export interface BaseMessage extends Message {
  readonly _tag: string
}

// Domain Actor Messages
export interface EntityCreatedMessage extends BaseMessage {
  readonly _tag: "EntityCreated"
  readonly payload: BusinessEntity
}

export interface EntityUpdatedMessage extends BaseMessage {
  readonly _tag: "EntityUpdated"
  readonly payload: { id: string; updates: Record<string, unknown> }
}

export interface BusinessLogicMessage extends BaseMessage {
  readonly _tag: "ExecuteBusinessLogic"
  readonly payload: {
    logic: string
    params: Record<string, unknown>
  }
}

// Actor State
export interface ActorState {
  readonly entityId?: string
  readonly currentState: Record<string, unknown>
  readonly events: readonly DomainEvent[]
  readonly error?: Error
}

// Actor Behavior Context
export interface ActorContext {
  readonly self: any // ActorRef will be defined in implementation
  readonly system: any // ActorSystem will be defined in implementation
}

// Union type for all actor messages
export type ActorMessage =
  | EntityCreatedMessage
  | EntityUpdatedMessage
  | BusinessLogicMessage

// Actor Behavior Type
export type ActorBehavior = (
  state: ActorState,
  message: ActorMessage,
  context: ActorContext
) => Effect.Effect<ActorState, Error, never>

// Actor Configuration
export interface ActorConfig {
  readonly mailboxCapacity?: number
  readonly maxRestarts?: number
  readonly restartDelay?: number
  readonly messageTimeout?: number
}

// Actor Registry Interface
export interface ActorRegistry {
  readonly register: (id: string, actorRef: any) => Effect.Effect<void, never, never>
  readonly get: (id: string) => Effect.Effect<any | undefined, never, never>
  readonly list: () => Effect.Effect<readonly string[], never, never>
  readonly unregister: (id: string) => Effect.Effect<void, never, never>
}

// Business Process Actor Interface
export interface BusinessProcessActor {
  readonly id: string
  readonly execute: (message: BusinessLogicMessage) => Effect.Effect<ActorState, Error, never>
  readonly getState: () => Effect.Effect<ActorState, Error, never>
  readonly subscribe: (listener: (state: ActorState) => void) => Effect.Effect<() => void, never, never>
}

// Actor System Interface
export interface ActorSystem {
  readonly make: <T extends ActorMessage>(
    id: string,
    initialState: ActorState,
    behavior: ActorBehavior,
    config?: ActorConfig
  ) => Effect.Effect<any, Error, never>
  readonly get: (id: string) => Effect.Effect<any | undefined, never, never>
  readonly stop: (id: string) => Effect.Effect<void, Error, never>
  readonly shutdown: () => Effect.Effect<void, never, never>
}
