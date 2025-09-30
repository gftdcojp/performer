// Effect Actor implementation for Performer
// Merkle DAG: effect-actor-node

import { Effect, Queue, Fiber, Ref, Supervisor } from "effect"

// Base Message Interface
export interface Message {
  readonly _tag: string
}

// Actor Context
export interface ActorContext<Message> {
  readonly self: ActorRef<Message>
  readonly system: ActorSystem
}

// Actor Behavior Type
export type ActorBehavior<State, Msg extends Message> = (
  state: State,
  message: Msg,
  context: ActorContext<Msg>
) => Effect.Effect<State, Error, never>

// Actor Reference
export interface ActorRef<Msg extends Message> {
  readonly tell: (message: Msg) => Effect.Effect<void, never, never>
  readonly ask: <A>(message: Msg, f: (state: any) => A) => Effect.Effect<A, Error, never>
}

// Actor Configuration
export interface ActorConfig {
  readonly mailboxCapacity?: number
  readonly maxRestarts?: number
  readonly restartDelay?: number
  readonly messageTimeout?: number
}

// Actor System
export interface ActorSystem {
  readonly make: <State, Msg extends Message>(
    id: string,
    initialState: State,
    behavior: ActorBehavior<State, Msg>,
    config?: ActorConfig
  ) => Effect.Effect<ActorRef<Msg>, Error, never>

  readonly get: <Msg extends Message>(id: string) => Effect.Effect<ActorRef<Msg> | undefined, never, never>
  readonly stop: (id: string) => Effect.Effect<void, Error, never>
  readonly shutdown: () => Effect.Effect<void, never, never>
}

// Actor Runtime
class ActorRuntime<State, Msg extends Message> {
  constructor(
    private id: string,
    private state: Ref.Ref<State>,
    private mailbox: Queue.Queue<Msg>,
    private behavior: ActorBehavior<State, Msg>,
    private context: ActorContext<Msg>,
    private config: Required<ActorConfig>,
    private supervisor: Supervisor.Supervisor
  ) {}

  run(): Effect.Effect<void, never, never> {
    return Effect.gen(function* () {
      while (true) {
        const message = yield* Queue.take(this.mailbox)

        // Process message with timeout
        const processEffect = Effect.gen(function* () {
          const currentState = yield* Ref.get(this.state)
          const newState = yield* this.behavior(currentState, message, this.context)
          yield* Ref.set(this.state, newState)
        }).pipe(
          Effect.timeout(this.config.messageTimeout),
          Effect.catchAll((error) => {
            console.error(`Actor ${this.id} failed processing message:`, error)
            // Supervisor would handle restart logic here
            return Effect.succeed(undefined)
          })
        )

        yield* processEffect
      }
    })
  }
}

// Actor System Implementation
export class ActorSystemImpl implements ActorSystem {
  private actors = new Map<string, { ref: ActorRef<any>, fiber: Fiber.Fiber<void, never>, runtime: ActorRuntime<any, any> }>()
  private supervisor: Supervisor.Supervisor

  constructor(supervisor: Supervisor.Supervisor = Supervisor.none) {
    this.supervisor = supervisor
  }

  make<State, Msg extends Message>(
    id: string,
    initialState: State,
    behavior: ActorBehavior<State, Msg>,
    config: ActorConfig = {}
  ): Effect.Effect<ActorRef<Msg>, Error, never> {
    const self = this
    return Effect.gen(function* () {
      if (self.actors.has(id)) {
        return yield* Effect.fail(new Error(`Actor ${id} already exists`))
      }

      const fullConfig: Required<ActorConfig> = {
        mailboxCapacity: config.mailboxCapacity ?? 1000,
        maxRestarts: config.maxRestarts ?? 3,
        restartDelay: config.restartDelay ?? 1000,
        messageTimeout: config.messageTimeout ?? 30000,
      }

      // Create mailbox
      const mailbox = yield* Queue.bounded<Msg>(fullConfig.mailboxCapacity)

      // Create state ref
      const stateRef = yield* Ref.make(initialState)

      // Create actor ref (circular dependency resolved by lazy creation)
      let actorRef: ActorRef<Msg>

      const context: ActorContext<Msg> = {
        self: {} as ActorRef<Msg>, // Will be set after creation
        system: self,
      }

      // Create runtime
      const runtime = new ActorRuntime(
        id,
        stateRef,
        mailbox,
        behavior,
        context,
        fullConfig,
        self.supervisor
      )

      // Create actor ref
      actorRef = {
        tell: (message: Msg) => Queue.offer(mailbox, message),
        ask: <A>(message: Msg, f: (state: State) => A) =>
          Effect.gen(function* () {
            yield* Queue.offer(mailbox, message)
            // Wait a bit for processing (simplified)
            yield* Effect.sleep(10)
            const state = yield* Ref.get(stateRef)
            return f(state)
          }),
      }

      // Set self reference
      context.self = actorRef

      // Start actor fiber
      const fiber = yield* Effect.fork(runtime.run())

      // Store actor
      self.actors.set(id, { ref: actorRef, fiber, runtime })

      return actorRef
    })
  }

  get<Msg extends Message>(id: string): Effect.Effect<ActorRef<Msg> | undefined, never, never> {
    return Effect.succeed(this.actors.get(id)?.ref)
  }

  stop(id: string): Effect.Effect<void, Error, never> {
    return Effect.gen(function* () {
      const actor = this.actors.get(id)
      if (!actor) {
        return yield* Effect.fail(new Error(`Actor ${id} not found`))
      }

      yield* Fiber.interrupt(actor.fiber)
      this.actors.delete(id)
    })
  }

  shutdown(): Effect.Effect<void, never, never> {
    const self = this
    return Effect.gen(function* () {
      for (const [id, actor] of self.actors) {
        yield* Fiber.interrupt(actor.fiber)
      }
      self.actors.clear()
    })
  }
}

// Actor System Utilities
export const ActorSystemUtils = {
  make: (name: string): Effect.Effect<ActorSystem, never, never> => {
    return Effect.gen(function* () {
      // Simplified supervisor - in a real implementation we'd use proper supervision
      const supervisor = Supervisor.none
      return new ActorSystemImpl(supervisor)
    })
  },
}
