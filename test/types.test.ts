// Types Layer Tests
// Merkle DAG: test -> types

import { ActorState, ActorMessage, ActorBehavior, ActorConfig, BusinessProcessActor, ActorSystem } from "../src/actor/types"

describe("Actor Types", () => {
  describe("ActorState", () => {
    test("should create valid actor state", () => {
      const state: ActorState = {
        currentState: { count: 0, name: "test" },
        events: ["created", "updated"],
        entityId: "test-entity",
      }

      expect(state.currentState).toEqual({ count: 0, name: "test" })
      expect(state.events).toEqual(["created", "updated"])
      expect(state.entityId).toBe("test-entity")
      expect(state.error).toBeUndefined()
    })

    test("should handle actor state with error", () => {
      const error = new Error("Test error")
      const state: ActorState = {
        currentState: {},
        events: ["failed"],
        error,
      }

      expect(state.error).toBe(error)
      expect(state.events).toEqual(["failed"])
    })
  })

  describe("ActorMessage types", () => {
    test("should define message interface", () => {
      interface TestMessage extends ActorMessage {
        readonly _tag: "TestMessage"
        readonly value: string
      }

      const message: TestMessage = {
        _tag: "TestMessage",
        value: "test value"
      }

      expect(message._tag).toBe("TestMessage")
      expect(message.value).toBe("test value")
    })

    test("should support union types", () => {
      interface MessageA extends ActorMessage {
        readonly _tag: "MessageA"
        readonly data: number
      }

      interface MessageB extends ActorMessage {
        readonly _tag: "MessageB"
        readonly text: string
      }

      type TestMessage = MessageA | MessageB

      const msgA: TestMessage = { _tag: "MessageA", data: 42 }
      const msgB: TestMessage = { _tag: "MessageB", text: "hello" }

      expect(msgA._tag).toBe("MessageA")
      expect(msgB._tag).toBe("MessageB")
    })
  })

  describe("ActorBehavior", () => {
    test("should define behavior type", () => {
      const behavior: ActorBehavior = (state, message, context) => {
        return {
          ...state,
          currentState: { ...state.currentState, processed: true }
        }
      }

      expect(typeof behavior).toBe("function")
      expect(behavior.length).toBe(3) // (state, message, context)
    })

    test("should return Effect type", () => {
      // Behavior should return an Effect
      const behavior: ActorBehavior = (state, message, context) => {
        return {
          ...state,
          events: [...state.events, "processed"]
        }
      }

      const result = behavior(
        { currentState: {}, events: [] },
        { _tag: "Test" } as any,
        {} as any
      )

      expect(result).toHaveProperty("currentState")
      expect(result).toHaveProperty("events")
      expect(result.events).toContain("processed")
    })
  })

  describe("ActorConfig", () => {
    test("should create valid config", () => {
      const config: ActorConfig = {
        mailboxCapacity: 1000,
        maxRestarts: 3,
        restartDelay: 1000,
        messageTimeout: 30000,
      }

      expect(config.mailboxCapacity).toBe(1000)
      expect(config.maxRestarts).toBe(3)
      expect(config.restartDelay).toBe(1000)
      expect(config.messageTimeout).toBe(30000)
    })

    test("should handle partial config", () => {
      const partialConfig: Partial<ActorConfig> = {
        mailboxCapacity: 500,
      }

      expect(partialConfig.mailboxCapacity).toBe(500)
      expect(partialConfig.maxRestarts).toBeUndefined()
    })

    test("should support default values", () => {
      const emptyConfig: ActorConfig = {} as any

      // These would be filled with defaults in implementation
      expect(emptyConfig).toBeDefined()
    })
  })

  describe("BusinessProcessActor", () => {
    test("should define actor interface", () => {
      const mockActor: BusinessProcessActor = {
        id: "test-actor",
        execute: async (message) => ({ currentState: {}, events: [] }),
        getState: async () => ({ currentState: {}, events: [] }),
        subscribe: (listener) => () => {}, // unsubscribe function
      }

      expect(mockActor.id).toBe("test-actor")
      expect(typeof mockActor.execute).toBe("function")
      expect(typeof mockActor.getState).toBe("function")
      expect(typeof mockActor.subscribe).toBe("function")
    })

    test("should support subscription pattern", () => {
      const mockActor: BusinessProcessActor = {
        id: "subscription-test",
        execute: async (message) => ({ currentState: {}, events: [] }),
        getState: async () => ({ currentState: {}, events: [] }),
        subscribe: (listener) => {
          listener({ currentState: { data: "test" }, events: ["updated"] })
          return () => {} // unsubscribe
        },
      }

      const listener = vi.fn()
      const unsubscribe = mockActor.subscribe(listener)

      expect(typeof unsubscribe).toBe("function")
      expect(listener).toHaveBeenCalledWith({
        currentState: { data: "test" },
        events: ["updated"]
      })
    })
  })

  describe("ActorSystem", () => {
    test("should define system interface", () => {
      const mockSystem: ActorSystem = {
        make: async (id, initialState, behavior, config) => ({
          tell: (message) => {},
          ask: (message, f) => Promise.resolve(f(initialState))
        }),
        get: (id) => Promise.resolve(undefined),
        stop: (id) => Promise.resolve(undefined),
        shutdown: () => Promise.resolve(undefined),
      }

      expect(typeof mockSystem.make).toBe("function")
      expect(typeof mockSystem.get).toBe("function")
      expect(typeof mockSystem.stop).toBe("function")
      expect(typeof mockSystem.shutdown).toBe("function")
    })

    test("should support actor lifecycle", async () => {
      const mockSystem: ActorSystem = {
        make: async (id, initialState, behavior, config) => ({
          tell: (message) => {},
          ask: async (message, f) => f({ ...initialState, processed: true })
        }),
        get: async (id) => ({ tell: () => {}, ask: async () => ({}) }),
        stop: async (id) => undefined,
        shutdown: async () => undefined,
      }

      const actor = await mockSystem.make("test", { data: "initial" }, () => ({}))
      const result = await actor.ask({ _tag: "Test" } as any, state => state.processed)

      expect(result).toBe(true)
    })
  })

  describe("Type Safety", () => {
    test("should enforce type constraints", () => {
      // This should compile without errors
      const state: ActorState = {
        currentState: { value: 42 },
        events: ["event1", "event2"],
        entityId: "entity-123",
      }

      const config: ActorConfig = {
        mailboxCapacity: 100,
        maxRestarts: 5,
      }

      expect(state.entityId).toBe("entity-123")
      expect(config.mailboxCapacity).toBe(100)
    })

    test("should support generic constraints", () => {
      // Test that types work with generics
      interface CustomState {
        counter: number
        items: string[]
      }

      const customState: ActorState = {
        currentState: { counter: 0, items: ["a", "b"] } as CustomState,
        events: ["initialized"],
      }

      expect((customState.currentState as CustomState).counter).toBe(0)
      expect((customState.currentState as CustomState).items).toEqual(["a", "b"])
    })
  })
})
