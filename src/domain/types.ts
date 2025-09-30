// Domain Types and Interfaces
// Merkle DAG: domain-node

import { Effect, Context } from "effect"

// Business Entity Types
export interface BusinessEntity {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

// Domain Events
export interface DomainEvent {
  readonly entityId: string
  readonly eventType: string
  readonly payload: Record<string, unknown>
  readonly timestamp: Date
  readonly version: number
}

// Service Tags
export const ActorDBServiceId = Symbol.for("performer/ActorDBService")
export const WASMServiceId = Symbol.for("performer/WASMService")
export const UIStateServiceId = Symbol.for("performer/UIStateService")

// ActorDB Service Interface
export interface ActorDBService {
  readonly writeEvent: (event: DomainEvent) => Effect.Effect<never, Error, void>
  readonly readEvents: (entityId: string) => Effect.Effect<never, Error, readonly DomainEvent[]>
  readonly createProjection: (name: string, events: readonly DomainEvent[]) => Effect.Effect<never, Error, Record<string, unknown>>
}

// WASM Service Interface
export interface WASMService {
  readonly executeComputation: (input: unknown) => Effect.Effect<never, Error, unknown>
  readonly validateData: (data: unknown) => Effect.Effect<never, Error, boolean>
}

// UI State Service Interface
export interface UIStateService {
  readonly updateState: (state: Record<string, unknown>) => Effect.Effect<never, Error, void>
  readonly getState: () => Effect.Effect<never, Error, Record<string, unknown>>
}

// Service Implementations
export const ActorDBService = Context.GenericTag<ActorDBService>(ActorDBServiceId)
export const WASMService = Context.GenericTag<WASMService>(WASMServiceId)
export const UIStateService = Context.GenericTag<UIStateService>(UIStateServiceId)

// Effect Types
export type DomainEffect<R, E, A> = Effect.Effect<R, E, A>
export type BusinessLogic<A> = DomainEffect<ActorDBService | WASMService, Error, A>
