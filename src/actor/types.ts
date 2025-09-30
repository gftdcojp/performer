// Actor Types and State Management
// Merkle DAG: actor-node

import { ActorRef, EventObject, StateValue, StateSchema } from "xstate"
import { DomainEvent, BusinessEntity } from "@/domain/types"

// Actor Event Types
export interface ActorEvent extends EventObject {
  readonly type: string
  readonly payload?: Record<string, unknown>
  readonly entityId?: string
}

// Domain Actor Events
export interface EntityCreatedEvent extends ActorEvent {
  readonly type: "ENTITY_CREATED"
  readonly payload: BusinessEntity
}

export interface EntityUpdatedEvent extends ActorEvent {
  readonly type: "ENTITY_UPDATED"
  readonly payload: { id: string; updates: Record<string, unknown> }
}

export interface BusinessLogicEvent extends ActorEvent {
  readonly type: "EXECUTE_BUSINESS_LOGIC"
  readonly payload: {
    logic: string
    params: Record<string, unknown>
  }
}

// Actor State Schema
export interface ActorStateSchema extends StateSchema {
  states: {
    idle: {}
    processing: {}
    success: {}
    error: {}
  }
}

// Actor Context
export interface ActorContext {
  readonly entityId?: string
  readonly currentState: Record<string, unknown>
  readonly events: readonly DomainEvent[]
  readonly error?: Error
}

// Actor Types
export type DomainActorRef = ActorRef<ActorEvent, ActorContext>
export type BusinessActorRef = ActorRef<BusinessLogicEvent, ActorContext>

// Actor Machine Configuration
export interface ActorMachineConfig {
  readonly id: string
  readonly initial: StateValue
  readonly context: ActorContext
  readonly states: ActorStateSchema["states"]
}

// Actor Registry
export interface ActorRegistry {
  readonly register: (id: string, actor: DomainActorRef) => void
  readonly get: (id: string) => DomainActorRef | undefined
  readonly list: () => readonly string[]
  readonly unregister: (id: string) => void
}

// Business Process Actor
export interface BusinessProcessActor {
  readonly id: string
  readonly execute: (event: BusinessLogicEvent) => Promise<ActorContext>
  readonly getState: () => ActorContext
  readonly subscribe: (listener: (state: ActorContext) => void) => () => void
}
