// Business Process Actor Implementation
// Merkle DAG: actor-node -> business-actor

import { createMachine, interpret, assign, ActorRef } from "xstate"
import { pipe } from "@effect-ts/core/Function"
import * as T from "@effect-ts/core/Effect"
import {
  ActorEvent,
  ActorContext,
  ActorStateSchema,
  BusinessLogicEvent,
  BusinessProcessActor,
  EntityCreatedEvent,
  EntityUpdatedEvent,
  DomainActorRef
} from "./types"
import { DomainService } from "@/domain/business-logic"

// Actor Machine Factory
export class ActorMachineFactory {
  // Merkle DAG: actor-machine-factory
  static createBusinessActor = (
    id: string,
    domainService: typeof DomainService
  ): BusinessProcessActor => {
    // State Machine Definition
    const machine = createMachine<ActorContext, ActorEvent>({
      id,
      initial: 'idle',
      context: {
        currentState: {},
        events: [],
      },
      states: {
        idle: {
          on: {
            ENTITY_CREATED: {
              target: 'processing',
              actions: assign({
                entityId: (_, event: EntityCreatedEvent) => event.payload.id,
                currentState: (_, event: EntityCreatedEvent) => event.payload,
                events: (context, event: EntityCreatedEvent) => [
                  ...context.events,
                  {
                    entityId: event.payload.id,
                    eventType: 'entity_created',
                    payload: event.payload,
                    timestamp: new Date(),
                    version: context.events.length + 1,
                  },
                ],
              }),
            },
            ENTITY_UPDATED: {
              target: 'processing',
              actions: assign({
                currentState: (context, event: EntityUpdatedEvent) => ({
                  ...context.currentState,
                  ...event.payload.updates,
                }),
                events: (context, event: EntityUpdatedEvent) => [
                  ...context.events,
                  {
                    entityId: event.payload.id,
                    eventType: 'entity_updated',
                    payload: event.payload.updates,
                    timestamp: new Date(),
                    version: context.events.length + 1,
                  },
                ],
              }),
            },
            EXECUTE_BUSINESS_LOGIC: {
              target: 'processing',
            },
          },
        },
        processing: {
          invoke: {
            src: 'executeBusinessLogic',
            onDone: {
              target: 'success',
              actions: assign({
                currentState: (context, event) => ({
                  ...context.currentState,
                  result: event.data,
                }),
              }),
            },
            onError: {
              target: 'error',
              actions: assign({
                error: (_, event) => event.data,
              }),
            },
          },
        },
        success: {
          on: {
            RESET: {
              target: 'idle',
              actions: assign({
                error: undefined,
              }),
            },
          },
        },
        error: {
          on: {
            RETRY: 'processing',
            RESET: {
              target: 'idle',
              actions: assign({
                error: undefined,
              }),
            },
          },
        },
      },
    }, {
      services: {
        executeBusinessLogic: async (context, event) => {
          if (event.type === 'EXECUTE_BUSINESS_LOGIC') {
            const logicEvent = event as BusinessLogicEvent
            // Execute business logic using EffectTS
            const result = await pipe(
              // Placeholder for actual business logic execution
              T.succeed({ executed: true, logic: logicEvent.payload.logic }),
              T.runPromise
            )
            return result
          }
          return context.currentState
        },
      },
    })

    // Create and start the actor
    const actor = interpret(machine)
    actor.start()

    return {
      id,
      execute: async (event: BusinessLogicEvent) => {
        actor.send(event)
        return new Promise((resolve) => {
          const subscription = actor.subscribe((state) => {
            if (state.matches('success') || state.matches('error')) {
              subscription.unsubscribe()
              resolve(state.context)
            }
          })
        })
      },
      getState: () => actor.getSnapshot().context,
      subscribe: (listener) => {
        const subscription = actor.subscribe((state) => {
          listener(state.context)
        })
        return () => subscription.unsubscribe()
      },
    }
  }
}

// Actor Registry Implementation
export class ActorRegistryImpl {
  // Merkle DAG: actor-registry
  private actors = new Map<string, DomainActorRef>()

  register(id: string, actor: DomainActorRef): void {
    this.actors.set(id, actor)
  }

  get(id: string): DomainActorRef | undefined {
    return this.actors.get(id)
  }

  list(): readonly string[] {
    return Array.from(this.actors.keys())
  }

  unregister(id: string): void {
    this.actors.delete(id)
  }

  clear(): void {
    this.actors.clear()
  }
}

// Actor Coordinator
export class ActorCoordinator {
  // Merkle DAG: actor-coordinator
  private registry = new ActorRegistryImpl()

  createBusinessActor(
    id: string,
    domainService: typeof DomainService
  ): BusinessProcessActor {
    const actor = ActorMachineFactory.createBusinessActor(id, domainService)
    return actor
  }

  registerActor(id: string, actor: DomainActorRef): void {
    this.registry.register(id, actor)
  }

  getActor(id: string): DomainActorRef | undefined {
    return this.registry.get(id)
  }

  getAllActors(): readonly string[] {
    return this.registry.list()
  }

  removeActor(id: string): void {
    this.registry.unregister(id)
  }

  clearAll(): void {
    this.registry.clear()
  }
}
