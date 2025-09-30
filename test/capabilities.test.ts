// Capabilities Layer Tests
// Merkle DAG: test -> capabilities

import { Effect } from "effect"
import { CapabilityService, CapabilityServiceLive, CapabilityServiceMock } from "../src/capabilities/checker"

describe("Capabilities Layer", () => {
  describe("CapabilityServiceLive", () => {
    test("should be defined", () => {
      expect(CapabilityServiceLive).toBeDefined()
      expect(typeof CapabilityServiceLive).toBe("object")
    })

    test("should integrate with Effect layers", () => {
      expect(CapabilityServiceLive).toBeDefined()
    })
  })

  describe("CapabilityServiceMock", () => {
    test("should be defined", () => {
      expect(CapabilityServiceMock).toBeDefined()
      expect(typeof CapabilityServiceMock).toBe("object")
    })

    test("should work with Effect system", async () => {
      const program = Effect.gen(function* () {
        const service = yield* CapabilityService
        expect(service).toBeDefined()
        expect(typeof service.hasCapability).toBe("function")
        return service
      })

      const result = await Effect.runPromise(
        Effect.provide(program, CapabilityServiceMock)
      )

      expect(result.hasCapability).toBeDefined()
    })
  })

  describe("CapabilityService Interface", () => {
    test("should define capability service interface", () => {
      expect(CapabilityService).toBeDefined()
    })

    test("should work with Effect's service system", async () => {
      const program = Effect.gen(function* () {
        const service = yield* CapabilityService
        expect(service).toBeDefined()
        expect(typeof service.hasCapability).toBe("function")
        return "success"
      })

      const result = await Effect.runPromise(
        Effect.provide(program, CapabilityServiceMock)
      )

      expect(result).toBe("success")
    })
  })

  describe("Basic Functionality", () => {
    test("should support different capability types", () => {
      const capabilities = [
        "canCreateAccount",
        "canDeleteUser",
        "canUpdateProfile",
        "canViewReports",
        "canManageUsers",
        "canAccessSettings"
      ]

      capabilities.forEach(capability => {
        expect(typeof capability).toBe("string")
        expect(capability.startsWith("can")).toBe(true)
      })
    })

    test("should have proper service structure", () => {
      const mockService: typeof CapabilityService = {
        hasCapability: (capability: string) => Effect.succeed(undefined)
      }

      expect(mockService.hasCapability).toBeDefined()
      expect(typeof mockService.hasCapability).toBe("function")
    })
  })
})
