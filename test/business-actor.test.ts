// Business Actor Implementation Tests
// Merkle DAG: test -> business-actor

import { Effect } from "effect"
import { vi } from "vitest"
import { ActorCoordinator, ActorFactory, ActorRegistryImpl, ActorSystemManager } from "../src/actor/business-actor"
import { ActorConfig, ActorState } from "../src/actor/types"

describe("Business Actor Implementation", () => {
  describe("ActorCoordinator", () => {
    let coordinator: ActorCoordinator

    beforeEach(() => {
      coordinator = new ActorCoordinator()
    })

    test("should create actor coordinator", () => {
      expect(coordinator).toBeDefined()
      expect(typeof coordinator.createBusinessActor).toBe("function")
      expect(typeof coordinator.registerActor).toBe("function")
      expect(typeof coordinator.getActor).toBe("function")
      expect(typeof coordinator.getAllActors).toBe("function")
      expect(typeof coordinator.removeActor).toBe("function")
      expect(typeof coordinator.clearAll).toBe("function")
    })

    test("should create business actor through coordinator", async () => {
      const program = coordinator.createBusinessActor("coordinator-test")

      const result = await Effect.runPromise(program)

      expect(result).toBeDefined()
      expect(result.id).toBe("coordinator-test")
    })

    test("should register and retrieve actors", async () => {
      const actorProgram = coordinator.createBusinessActor("register-test")
      const actor = await Effect.runPromise(actorProgram)

      const registerProgram = coordinator.registerActor("register-test", actor)
      await Effect.runPromise(registerProgram)

      const getProgram = coordinator.getActor("register-test")
      const retrieved = await Effect.runPromise(getProgram)

      expect(retrieved).toBe(actor)
    })

    test("should list all actors", async () => {
      const actor1Program = coordinator.createBusinessActor("list-test-1")
      const actor2Program = coordinator.createBusinessActor("list-test-2")

      const actor1 = await Effect.runPromise(actor1Program)
      const actor2 = await Effect.runPromise(actor2Program)

      await Effect.runPromise(coordinator.registerActor("list-test-1", actor1))
      await Effect.runPromise(coordinator.registerActor("list-test-2", actor2))

      const listProgram = coordinator.getAllActors()
      const actors = await Effect.runPromise(listProgram)

      expect(actors).toContain("list-test-1")
      expect(actors).toContain("list-test-2")
      expect(actors.length).toBeGreaterThanOrEqual(2)
    })

    test("should remove actors", async () => {
      const actorProgram = coordinator.createBusinessActor("remove-test")
      const actor = await Effect.runPromise(actorProgram)

      await Effect.runPromise(coordinator.registerActor("remove-test", actor))

      const getBeforeRemove = coordinator.getActor("remove-test")
      const actorBefore = await Effect.runPromise(getBeforeRemove)
      expect(actorBefore).toBe(actor)

      await Effect.runPromise(coordinator.removeActor("remove-test"))

      const getAfterRemove = coordinator.getActor("remove-test")
      const actorAfter = await Effect.runPromise(getAfterRemove)
      expect(actorAfter).toBeUndefined()
    })

    test("should clear all actors", async () => {
      const actor1Program = coordinator.createBusinessActor("clear-test-1")
      const actor2Program = coordinator.createBusinessActor("clear-test-2")

      const actor1 = await Effect.runPromise(actor1Program)
      const actor2 = await Effect.runPromise(actor2Program)

      await Effect.runPromise(coordinator.registerActor("clear-test-1", actor1))
      await Effect.runPromise(coordinator.registerActor("clear-test-2", actor2))

      const listBeforeClear = coordinator.getAllActors()
      const actorsBefore = await Effect.runPromise(listBeforeClear)
      expect(actorsBefore.length).toBeGreaterThanOrEqual(2)

      await Effect.runPromise(coordinator.clearAll())

      const listAfterClear = coordinator.getAllActors()
      const actorsAfter = await Effect.runPromise(listAfterClear)
      expect(actorsAfter.length).toBe(0)
    })
  })

  describe("ActorRegistryImpl", () => {
    let registry: ActorRegistryImpl

    beforeEach(() => {
      registry = new ActorRegistryImpl()
    })

    test("should create actor registry", () => {
      expect(registry).toBeDefined()
    })

    test("should register and get actors", async () => {
      const mockActor = { id: "mock", execute: vi.fn(), getState: vi.fn(), subscribe: vi.fn() }

      await Effect.runPromise(registry.register("test-id", mockActor))

      const retrievedProgram = registry.get("test-id")
      const retrieved = await Effect.runPromise(retrievedProgram)

      expect(retrieved).toBe(mockActor)
    })

    test("should return undefined for non-existent actors", async () => {
      const retrievedProgram = registry.get("non-existent")
      const retrieved = await Effect.runPromise(retrievedProgram)

      expect(retrieved).toBeUndefined()
    })

    test("should list registered actors", async () => {
      const mockActor1 = { id: "mock1", execute: vi.fn(), getState: vi.fn(), subscribe: vi.fn() }
      const mockActor2 = { id: "mock2", execute: vi.fn(), getState: vi.fn(), subscribe: vi.fn() }

      await Effect.runPromise(registry.register("test-1", mockActor1))
      await Effect.runPromise(registry.register("test-2", mockActor2))

      const listProgram = registry.list()
      const list = await Effect.runPromise(listProgram)

      expect(list).toContain("test-1")
      expect(list).toContain("test-2")
      expect(list.length).toBe(2)
    })

    test("should unregister actors", async () => {
      const mockActor = { id: "mock", execute: vi.fn(), getState: vi.fn(), subscribe: vi.fn() }

      await Effect.runPromise(registry.register("test-id", mockActor))

      const retrievedBeforeProgram = registry.get("test-id")
      const retrievedBefore = await Effect.runPromise(retrievedBeforeProgram)
      expect(retrievedBefore).toBe(mockActor)

      await Effect.runPromise(registry.unregister("test-id"))

      const retrievedAfterProgram = registry.get("test-id")
      const retrievedAfter = await Effect.runPromise(retrievedAfterProgram)
      expect(retrievedAfter).toBeUndefined()
    })

    test("should clear all actors", async () => {
      const mockActor1 = { id: "mock1", execute: vi.fn(), getState: vi.fn(), subscribe: vi.fn() }
      const mockActor2 = { id: "mock2", execute: vi.fn(), getState: vi.fn(), subscribe: vi.fn() }

      await Effect.runPromise(registry.register("test-1", mockActor1))
      await Effect.runPromise(registry.register("test-2", mockActor2))

      const listBeforeClearProgram = registry.list()
      const listBeforeClear = await Effect.runPromise(listBeforeClearProgram)
      expect(listBeforeClear.length).toBe(2)

      await Effect.runPromise(registry.clear())

      const listAfterClearProgram = registry.list()
      const listAfterClear = await Effect.runPromise(listAfterClearProgram)
      expect(listAfterClear.length).toBe(0)
    })
  })

  describe("ActorSystemManager", () => {
    let manager: ActorSystemManager

    beforeEach(() => {
      manager = new ActorSystemManager()
    })

    test("should create actor system manager", () => {
      expect(manager).toBeDefined()
      expect(typeof manager.initialize).toBe("function")
      expect(typeof manager.getSystem).toBe("function")
      expect(typeof manager.shutdown).toBe("function")
    })

    test("should initialize actor system", async () => {
      await Effect.runPromise(manager.initialize())

      const system = manager.getSystem()
      expect(system).toBeDefined()
    })

    test("should shutdown actor system", async () => {
      await Effect.runPromise(manager.initialize())

      let system = manager.getSystem()
      expect(system).toBeDefined()

      await Effect.runPromise(manager.shutdown())

      system = manager.getSystem()
      expect(system).toBeNull()
    })
  })

  describe("ActorState and Configuration", () => {
    test("should create valid actor state", () => {
      const state: ActorState = {
        currentState: { count: 0, name: "test" },
        events: ["created", "updated"],
        entityId: "test-entity",
        error: undefined,
      }

      expect(state.currentState).toEqual({ count: 0, name: "test" })
      expect(state.events).toEqual(["created", "updated"])
      expect(state.entityId).toBe("test-entity")
      expect(state.error).toBeUndefined()
    })

    test("should create valid actor config", () => {
      const config: ActorConfig = {
        mailboxCapacity: 500,
        maxRestarts: 5,
        restartDelay: 2000,
        messageTimeout: 10000,
      }

      expect(config.mailboxCapacity).toBe(500)
      expect(config.maxRestarts).toBe(5)
      expect(config.restartDelay).toBe(2000)
      expect(config.messageTimeout).toBe(10000)
    })

    test("should handle optional config properties", () => {
      const partialConfig: Partial<ActorConfig> = {
        mailboxCapacity: 100,
      }

      expect(partialConfig.mailboxCapacity).toBe(100)
      expect(partialConfig.maxRestarts).toBeUndefined()
      expect(partialConfig.restartDelay).toBeUndefined()
      expect(partialConfig.messageTimeout).toBeUndefined()
    })
  })

  describe("Business Logic Integration", () => {
    test("should handle business logic execution in actors", async () => {
      const actorProgram = ActorFactory.createBusinessActor("business-logic-test")
      const actor = await Effect.runPromise(actorProgram)

      // Test that actor can be created without errors
      // (Full message passing tests would require more complex setup)
      expect(actor.execute).toBeDefined()
      expect(typeof actor.execute).toBe("function")
    })
  })
})
