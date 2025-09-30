// Main Index Tests
// Merkle DAG: test -> index

import * as ActorIndex from "../src/actor/index"
import * as DomainIndex from "../src/domain/index"
import * as CapabilitiesIndex from "../src/capabilities/index"
import * as RpcIndex from "../src/rpc/index"
import * as UiIndex from "../src/ui/index"
import * as WasmIndex from "../src/wasm/index"

describe("Main Index Exports", () => {
  describe("Actor Index", () => {
    test("should export actor coordinator", () => {
      expect(ActorIndex.actorCoordinator).toBeDefined()
      expect(typeof ActorIndex.actorCoordinator.createBusinessActor).toBe("function")
      expect(typeof ActorIndex.actorCoordinator.registerActor).toBe("function")
      expect(typeof ActorIndex.actorCoordinator.getActor).toBe("function")
    })

    test("should export actor system manager", () => {
      expect(ActorIndex.actorSystemManager).toBeDefined()
      expect(typeof ActorIndex.actorSystemManager.initialize).toBe("function")
      expect(typeof ActorIndex.actorSystemManager.getSystem).toBe("function")
      expect(typeof ActorIndex.actorSystemManager.shutdown).toBe("function")
    })

    test("should export factory functions", () => {
      expect(ActorIndex.createBusinessActor).toBeDefined()
      expect(typeof ActorIndex.createBusinessActor).toBe("function")
    })

    test("should export system management functions", () => {
      expect(ActorIndex.initializeActorSystem).toBeDefined()
      expect(ActorIndex.shutdownActorSystem).toBeDefined()
      expect(typeof ActorIndex.initializeActorSystem).toBe("function")
      expect(typeof ActorIndex.shutdownActorSystem).toBe("function")
    })

    test("should export utility functions", () => {
      expect(ActorIndex.runActorOperation).toBeDefined()
      expect(typeof ActorIndex.runActorOperation).toBe("function")
    })
  })

  describe("Domain Index", () => {
    test("should export domain services", () => {
      expect(DomainIndex.DomainServiceLive).toBeDefined()
      expect(typeof DomainIndex.DomainServiceLive.processBusinessLogic).toBe("function")
      expect(typeof DomainIndex.DomainServiceLive.createWorkflow).toBe("function")
      expect(typeof DomainIndex.DomainServiceLive.validateEntity).toBe("function")
    })

    test("should export entity manager", () => {
      expect(DomainIndex.EntityManager).toBeDefined()
      expect(typeof DomainIndex.EntityManager.createEntity).toBe("function")
      expect(typeof DomainIndex.EntityManager.updateEntity).toBe("function")
    })

    test("should export rule engine", () => {
      expect(DomainIndex.RuleEngine).toBeDefined()
      expect(typeof DomainIndex.RuleEngine.executeRule).toBe("function")
      expect(typeof DomainIndex.RuleEngine.executeWorkflow).toBe("function")
    })
  })

  describe("Capabilities Index", () => {
    test("should export capability service", () => {
      expect(CapabilitiesIndex.CapabilityService).toBeDefined()
      expect(CapabilitiesIndex.CapabilityServiceLive).toBeDefined()
      expect(CapabilitiesIndex.CapabilityServiceMock).toBeDefined()
    })

    test("should export permission error", () => {
      expect(CapabilitiesIndex.PermissionDeniedError).toBeDefined()
    })
  })

  describe("RPC Index", () => {
    test("should export RPC services", () => {
      expect(RpcIndex.RpcService).toBeDefined()
      expect(RpcIndex.ActorDBService).toBeDefined()
      expect(RpcIndex.PerformerClient).toBeDefined()
    })

    test("should export client implementations", () => {
      expect(RpcIndex.ActorDBClient).toBeDefined()
      expect(RpcIndex.QueryBuilder).toBeDefined()
    })
  })

  describe("UI Index", () => {
    test("should export UI components", () => {
      expect(UiIndex.WebComponents).toBeDefined()
    })
  })

  describe("WASM Index", () => {
    test("should export WASM utilities", () => {
      expect(WasmIndex.PerformanceCompute).toBeDefined()
      expect(typeof WasmIndex.PerformanceCompute.compute).toBe("function")
    })
  })

  describe("Index Integration", () => {
    test("should provide cohesive API surface", () => {
      // Test that all main modules are properly exported
      const modules = [
        ActorIndex,
        DomainIndex,
        CapabilitiesIndex,
        RpcIndex,
        UiIndex,
        WasmIndex,
      ]

      modules.forEach(module => {
        expect(module).toBeDefined()
        expect(typeof module).toBe("object")
      })
    })

    test("should support cross-module integration", () => {
      // Test that modules can work together
      // This is more of a structural test than functional

      // Actor system should be able to use domain services
      expect(ActorIndex.actorCoordinator).toBeDefined()
      expect(DomainIndex.DomainServiceLive).toBeDefined()

      // Capabilities should work with RPC
      expect(CapabilitiesIndex.CapabilityService).toBeDefined()
      expect(RpcIndex.RpcService).toBeDefined()
    })
  })

  describe("Framework Architecture", () => {
    test("should follow layered architecture", () => {
      // Test that the framework follows proper separation of concerns

      // Infrastructure layer (RPC, WASM)
      expect(RpcIndex).toBeDefined()
      expect(WasmIndex).toBeDefined()

      // Domain layer (Business logic, entities)
      expect(DomainIndex).toBeDefined()

      // Application layer (Actors, capabilities)
      expect(ActorIndex).toBeDefined()
      expect(CapabilitiesIndex).toBeDefined()

      // Presentation layer (UI)
      expect(UiIndex).toBeDefined()
    })

    test("should provide consistent interface patterns", () => {
      // Test that similar concepts follow similar patterns

      // Services should have Live and Mock variants where applicable
      expect(DomainIndex.DomainServiceLive).toBeDefined()
      expect(CapabilitiesIndex.CapabilityServiceLive).toBeDefined()
      expect(CapabilitiesIndex.CapabilityServiceMock).toBeDefined()

      // Complex modules should have manager/coordinator patterns
      expect(ActorIndex.actorCoordinator).toBeDefined()
      expect(ActorIndex.actorSystemManager).toBeDefined()
    })

    test("should support framework extension", () => {
      // Test that the framework is extensible

      // Should be able to add new actors
      expect(typeof ActorIndex.createBusinessActor).toBe("function")

      // Should be able to add new domain logic
      expect(typeof DomainIndex.DomainServiceLive.createWorkflow).toBe("function")

      // Should be able to add new capabilities
      expect(CapabilitiesIndex.CapabilityService).toBeDefined()
    })
  })
})
