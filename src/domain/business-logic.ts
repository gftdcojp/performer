// Business Logic Layer
// Merkle DAG: domain-node -> business-logic

import { Effect, pipe } from "effect"
import { DomainEvent, BusinessEntity, ActorDBService, BusinessLogic } from "./types"

// Business Rules and Logic
export interface BusinessRule<A> {
  readonly name: string
  readonly validate: (input: A) => Effect.Effect<never, Error, boolean>
  readonly execute: (input: A) => BusinessLogic<void>
}

export interface Workflow<A, B> {
  readonly name: string
  readonly steps: readonly BusinessRule<A>[]
  readonly aggregator: (results: readonly A[]) => B
}

// Entity Management
export class EntityManager {
  // Merkle DAG: entity-manager
  static createEntity = <T extends BusinessEntity>(
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Effect.Effect<ActorDBService, Error, T> =>
    pipe(
      Effect.succeed({
        ...entity,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T),
      Effect.tap((createdEntity) =>
        pipe(
          ActorDBService,
          Effect.flatMap((db) => db.writeEvent({
            entityId: createdEntity.id,
            eventType: 'entity_created',
            payload: createdEntity,
            timestamp: new Date(),
            version: 1,
          }))
        )
      )
    )

  static updateEntity = <T extends BusinessEntity>(
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Effect.Effect<ActorDBService, Error, T> =>
    pipe(
      ActorDBService,
      Effect.flatMap((db) => db.readEvents(id)),
      Effect.map((events) => {
        const latestEvent = events[events.length - 1]
        return {
          ...latestEvent.payload,
          ...updates,
          updatedAt: new Date(),
        } as T
      }),
      Effect.tap((updatedEntity) =>
        pipe(
          ActorDBService,
          Effect.flatMap((db) => db.writeEvent({
            entityId: id,
            eventType: 'entity_updated',
            payload: updates,
            timestamp: new Date(),
            version: events.length + 1,
          }))
        )
      )
    )
}

// Business Rule Engine
export class RuleEngine {
  // Merkle DAG: rule-engine
  static executeRule = <A>(
    rule: BusinessRule<A>,
    input: A
  ): BusinessLogic<boolean> =>
    pipe(
      rule.validate(input),
      T.chain((isValid) =>
        isValid
          ? pipe(
              rule.execute(input),
              T.map(() => true)
            )
          : T.succeed(false)
      )
    )

  static executeWorkflow = <A, B>(
    workflow: Workflow<A, B>,
    inputs: readonly A[]
  ): BusinessLogic<B> =>
    pipe(
      T.forEach_(inputs, (input) =>
        T.forEach_(workflow.steps, (step) =>
          RuleEngine.executeRule(step, input)
        )
      ),
      T.map(workflow.aggregator)
    )
}

// Domain Service Layer
export interface DomainService {
  readonly processBusinessLogic: <A>(
    logic: BusinessLogic<A>
  ) => T.Effect<never, Error, A>

  readonly createWorkflow: <A, B>(
    name: string,
    steps: readonly BusinessRule<A>[],
    aggregator: (results: readonly A[]) => B
  ) => Workflow<A, B>

  readonly validateEntity: <T extends BusinessEntity>(
    entity: T
  ) => T.Effect<never, Error, boolean>
}

export const DomainServiceLive: DomainService = {
  // Merkle DAG: domain-service
  processBusinessLogic: <A>(logic: BusinessLogic<A>) =>
    pipe(
      logic,
      T.provideService(ActorDBService)({
        writeEvent: (event) => T.succeed(undefined), // Placeholder
        readEvents: (entityId) => T.succeed([]), // Placeholder
        createProjection: (name, events) => T.succeed({}), // Placeholder
      }),
      T.catchAll((error) => T.fail(new Error(`Business logic failed: ${error.message}`)))
    ),

  createWorkflow: (name, steps, aggregator) => ({
    name,
    steps,
    aggregator,
  }),

  validateEntity: (entity) =>
    T.succeed(
      !!(entity.id && entity.createdAt && entity.updatedAt)
    ),
}
