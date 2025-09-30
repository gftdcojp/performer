// Domain Layer Tests
// Merkle DAG: test -> domain

import { Effect } from "effect"
import { DomainServiceLive, EntityManager, RuleEngine } from "../src/domain/business-logic"
import { BusinessEntity, DomainEvent, ActorDBService } from "../src/domain/types"

describe("Domain Layer", () => {
  describe("DomainServiceLive", () => {
    test("should process business logic", async () => {
      const mockLogic = Effect.succeed("test result")

      const program = DomainServiceLive.processBusinessLogic(mockLogic)
      const result = await Effect.runPromise(program)

      expect(result).toBe("test result")
    })

    test("should create workflows", () => {
      const mockRule = {
        name: "test-rule",
        validate: (input: string) => Effect.succeed(input.length > 0),
        execute: (input: string) => Effect.succeed(`processed-${input}`)
      }

      const workflow = DomainServiceLive.createWorkflow(
        "test-workflow",
        [mockRule],
        (results) => results.join(",")
      )

      expect(workflow.name).toBe("test-workflow")
      expect(workflow.steps).toHaveLength(1)
      expect(typeof workflow.aggregator).toBe("function")
    })

    test("should validate entities", async () => {
      const validEntity: BusinessEntity = {
        id: "test-id",
        name: "Test Entity",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const program = DomainServiceLive.validateEntity(validEntity)
      const result = await Effect.runPromise(program)

      expect(result).toBe(true)
    })

    test("should reject invalid entities", async () => {
      const invalidEntity = {
        name: "Test Entity",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any // Missing id

      const program = DomainServiceLive.validateEntity(invalidEntity)
      const result = await Effect.runPromise(program)

      expect(result).toBe(false)
    })

    test("should execute business logic by name", async () => {
      // Test user-registration logic
      const userRegResult = await DomainServiceLive.executeBusinessLogic("user-registration", {
        email: "test@example.com",
        password: "password123"
      })

      expect(userRegResult).toHaveProperty("success", true)
      expect(userRegResult).toHaveProperty("userId")
      expect(userRegResult).toHaveProperty("message")

      // Test entity-validation logic
      const entityValidationResult = await DomainServiceLive.executeBusinessLogic("entity-validation", {
        entity: { id: "test-entity", name: "Test" }
      })

      expect(entityValidationResult).toHaveProperty("valid", true)
      expect(entityValidationResult).toHaveProperty("entityId", "test-entity")

      // Test unknown logic
      await expect(DomainServiceLive.executeBusinessLogic("unknown-logic", {}))
        .rejects.toThrow("Unknown business logic: unknown-logic")
    })
  })

  describe("EntityManager", () => {
    test("should have create and update methods", () => {
      expect(EntityManager.createEntity).toBeDefined()
      expect(typeof EntityManager.createEntity).toBe("function")
      expect(EntityManager.updateEntity).toBeDefined()
      expect(typeof EntityManager.updateEntity).toBe("function")
    })
  })

  describe("RuleEngine", () => {
    const mockRule = {
      name: "test-rule",
      validate: (input: string) => Effect.succeed(input.length > 3),
      execute: (input: string) => Effect.succeed(`processed-${input}`)
    }

    test("should execute valid rules", async () => {
      const executeProgram = RuleEngine.executeRule(mockRule, "valid-input")

      const result = await Effect.runPromise(executeProgram)

      expect(result).toBe(true)
    })

    test("should reject invalid rules", async () => {
      const executeProgram = RuleEngine.executeRule(mockRule, "no") // Too short

      const result = await Effect.runPromise(executeProgram)

      expect(result).toBe(false)
    })

    test("should execute workflows", async () => {
      const mockWorkflow = {
        name: "test-workflow",
        steps: [mockRule],
        aggregator: (results: readonly boolean[]) => results.every(Boolean)
      }

      const executeProgram = RuleEngine.executeWorkflow(mockWorkflow, ["input1", "input2"])

      const result = await Effect.runPromise(executeProgram)

      expect(result).toBe(true)
    })
  })

  describe("Business Entities", () => {
    test("should create valid business entities", () => {
      const entity: BusinessEntity = {
        id: "test-entity-id",
        name: "Test Entity",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: "A test entity",
      }

      expect(entity.id).toBe("test-entity-id")
      expect(entity.name).toBe("Test Entity")
      expect(entity.createdAt).toBeInstanceOf(Date)
      expect(entity.updatedAt).toBeInstanceOf(Date)
      expect(entity.description).toBe("A test entity")
    })

    test("should handle entities with optional fields", () => {
      const minimalEntity: BusinessEntity = {
        id: "minimal-id",
        name: "Minimal Entity",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(minimalEntity.id).toBe("minimal-id")
      expect(minimalEntity.name).toBe("Minimal Entity")
      expect(minimalEntity.description).toBeUndefined()
    })
  })

  describe("Domain Events", () => {
    test("should create valid domain events", () => {
      const event: DomainEvent = {
        entityId: "entity-123",
        eventType: "entity_created",
        payload: { name: "Test Entity", value: 42 },
        timestamp: new Date(),
        version: 1,
      }

      expect(event.entityId).toBe("entity-123")
      expect(event.eventType).toBe("entity_created")
      expect(event.payload).toEqual({ name: "Test Entity", value: 42 })
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(event.version).toBe(1)
    })

    test("should handle different event types", () => {
      const createEvent: DomainEvent = {
        entityId: "entity-123",
        eventType: "entity_created",
        payload: { initialData: "data" },
        timestamp: new Date(),
        version: 1,
      }

      const updateEvent: DomainEvent = {
        entityId: "entity-123",
        eventType: "entity_updated",
        payload: { changes: { name: "New Name" } },
        timestamp: new Date(),
        version: 2,
      }

      expect(createEvent.eventType).toBe("entity_created")
      expect(updateEvent.eventType).toBe("entity_updated")
      expect(updateEvent.version).toBe(2)
    })
  })

  describe("Business Logic Types", () => {
    test("should define business rule interface", () => {
      const rule: BusinessRule<string> = {
        name: "string-length-rule",
        validate: (input: string) => Effect.succeed(input.length > 0),
        execute: (input: string) => Effect.succeed(input.toUpperCase())
      }

      expect(rule.name).toBe("string-length-rule")
      expect(typeof rule.validate).toBe("function")
      expect(typeof rule.execute).toBe("function")
    })

    test("should define workflow interface", () => {
      const workflow: Workflow<string, string> = {
        name: "uppercase-workflow",
        steps: [],
        aggregator: (results) => results.join(" ")
      }

      expect(workflow.name).toBe("uppercase-workflow")
      expect(Array.isArray(workflow.steps)).toBe(true)
      expect(typeof workflow.aggregator).toBe("function")
    })
  })

  describe("ActorDB Service Interface", () => {
    test("should define ActorDB service interface", () => {
      const mockService: ActorDBService = {
        writeEvent: (event) => Effect.succeed(undefined),
        readEvents: (entityId) => Effect.succeed([]),
        createProjection: (name, events) => Effect.succeed({}),
      }

      expect(typeof mockService.writeEvent).toBe("function")
      expect(typeof mockService.readEvents).toBe("function")
      expect(typeof mockService.createProjection).toBe("function")
    })

    test("should handle write event operations", async () => {
      const mockService: ActorDBService = {
        writeEvent: (event) => {
          expect(event.entityId).toBe("test-entity")
          expect(event.eventType).toBe("test_event")
          return Effect.succeed(undefined)
        },
        readEvents: (entityId) => Effect.succeed([]),
        createProjection: (name, events) => Effect.succeed({}),
      }

      const event: DomainEvent = {
        entityId: "test-entity",
        eventType: "test_event",
        payload: { data: "test" },
        timestamp: new Date(),
        version: 1,
      }

      await Effect.runPromise(mockService.writeEvent(event))
    })

    test("should handle read events operations", async () => {
      const mockEvents: DomainEvent[] = [
        {
          entityId: "test-entity",
          eventType: "created",
          payload: { initial: true },
          timestamp: new Date(),
          version: 1,
        }
      ]

      const mockService: ActorDBService = {
        writeEvent: (event) => Effect.succeed(undefined),
        readEvents: (entityId) => {
          expect(entityId).toBe("test-entity")
          return Effect.succeed(mockEvents)
        },
        createProjection: (name, events) => Effect.succeed({}),
      }

      const events = await Effect.runPromise(mockService.readEvents("test-entity"))

      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe("created")
    })
  })
})
