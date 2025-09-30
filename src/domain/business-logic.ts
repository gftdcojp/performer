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
      Effect.flatMap((isValid) =>
        isValid
          ? pipe(
              rule.execute(input),
              Effect.map(() => true)
            )
          : Effect.succeed(false)
      )
    )

  static executeWorkflow = <A, B>(
    workflow: Workflow<A, B>,
    inputs: readonly A[]
  ): BusinessLogic<B> =>
    pipe(
      Effect.forEach(inputs, (input) =>
        Effect.forEach(workflow.steps, (step) =>
          RuleEngine.executeRule(step, input)
        )
      ),
      Effect.map(workflow.aggregator)
    )
}

// Domain Service Layer
export interface DomainService {
  readonly processBusinessLogic: <A>(
    logic: BusinessLogic<A>
  ) => Effect.Effect<never, Error, A>

  readonly createWorkflow: <A, B>(
    name: string,
    steps: readonly BusinessRule<A>[],
    aggregator: (results: readonly A[]) => B
  ) => Workflow<A, B>

  readonly validateEntity: <T extends BusinessEntity>(
    entity: T
  ) => Effect.Effect<never, Error, boolean>

  readonly executeBusinessLogic: (
    logicName: string,
    params: Record<string, unknown>
  ) => Promise<Record<string, unknown>>
}

export const DomainServiceLive: DomainService = {
  // Merkle DAG: domain-service
  processBusinessLogic: <A>(logic: BusinessLogic<A>) =>
    pipe(
      logic,
      Effect.provideService(ActorDBService, {
        writeEvent: (event) => Effect.succeed(undefined), // Placeholder
        readEvents: (entityId) => Effect.succeed([]), // Placeholder
        createProjection: (name, events) => Effect.succeed({}), // Placeholder
      }),
      Effect.catchAll((error) => Effect.fail(new Error(`Business logic failed: ${error.message}`)))
    ),

  createWorkflow: (name, steps, aggregator) => ({
    name,
    steps,
    aggregator,
  }),

  validateEntity: (entity) =>
    Effect.succeed(
      !!(entity.id && entity.createdAt && entity.updatedAt)
    ),

  executeBusinessLogic: async (logicName: string, params: Record<string, unknown>) => {
    // Business logic execution with supervision-friendly error handling
    switch (logicName) {
      case 'user-registration':
        // Simulate user registration logic
        if (!params.email || !params.password) {
          throw new Error('Missing required fields: email and password')
        }
        return {
          success: true,
          userId: crypto.randomUUID(),
          message: 'User registered successfully'
        }

      case 'entity-validation':
        // Simulate entity validation logic
        const entity = params.entity as any
        if (!entity || !entity.id) {
          throw new Error('Invalid entity: missing id')
        }
        return {
          valid: true,
          entityId: entity.id,
          validatedAt: new Date()
        }

      default:
        // Unknown logic - supervisor will handle this
        throw new Error(`Unknown business logic: ${logicName}`)
    }
  },
}
