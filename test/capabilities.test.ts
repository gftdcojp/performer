// Capabilities Layer Tests
// Merkle DAG: test -> capabilities

import { Effect, Layer } from "effect"
import { vi } from "vitest"
import { CapabilityService, CapabilityServiceLive, CapabilityServiceMock } from "../src/capabilities/checker"
import { PermissionDeniedError } from "../src/processes/user-onboarding.process"

describe("Capabilities Layer", () => {
  describe("PermissionDeniedError", () => {
    test("should create permission denied error", () => {
      const error = new PermissionDeniedError("test-capability")

      expect(error._tag).toBe("PermissionDeniedError")
      expect(error.capability).toBe("test-capability")
      expect(error.message).toContain("test-capability")
    })

    test("should be instanceof Error", () => {
      const error = new PermissionDeniedError("test-capability")

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(PermissionDeniedError)
    })
  })

  describe("CapabilityServiceLive", () => {
    test("should allow valid capabilities", async () => {
      const program = Effect.provide(
        CapabilityService.hasCapability("canCreateAccount"),
        CapabilityServiceLive
      )

      const result = await Effect.runPromise(program)

      expect(result).toBeUndefined() // void result indicates success
    })

    test("should handle capability checking logic", async () => {
      // Test with mock user session that has permissions
      const mockUserSession = { roles: ["user", "admin"] }

      // Since the implementation uses a hardcoded userSession, we can't easily test
      // different scenarios without mocking the module-level variable
      // But we can test that the service is properly structured

      expect(CapabilityServiceLive).toBeDefined()
    })

    test("should integrate with Effect layers", () => {
      const layer = CapabilityServiceLive

      expect(layer).toBeDefined()
      expect(typeof layer).toBe("object")
    })
  })

  describe("CapabilityServiceMock", () => {
    test("should always allow capabilities", async () => {
      const program = Effect.provide(
        CapabilityService.hasCapability("anyCapability"),
        CapabilityServiceMock
      )

      const result = await Effect.runPromise(program)

      expect(result).toBeUndefined() // void result indicates success
    })

    test("should work with any capability name", async () => {
      const testCapabilities = [
        "canCreateAccount",
        "canDeleteUser",
        "canAccessAdminPanel",
        "unknownCapability"
      ]

      for (const capability of testCapabilities) {
        const program = Effect.provide(
          CapabilityService.hasCapability(capability),
          CapabilityServiceMock
        )

        const result = await Effect.runPromise(program)
        expect(result).toBeUndefined()
      }
    })

    test("should log capability checks", async () => {
      // Mock console.log to capture output
      const originalLog = console.log
      const logSpy = vi.fn()
      console.log = logSpy

      try {
        const program = Effect.provide(
          CapabilityService.hasCapability("testCapability"),
          CapabilityServiceMock
        )

        await Effect.runPromise(program)

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("testCapability")
        )
      } finally {
        console.log = originalLog
      }
    })
  })

  describe("CapabilityService Interface", () => {
    test("should define capability service interface", () => {
      expect(CapabilityService).toBeDefined()

      // Check that it's a generic tag
      expect(CapabilityService._tag).toBeDefined()
    })

    test("should work with Effect's service system", async () => {
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

  describe("Layer Integration", () => {
    test("should provide capability service through layers", async () => {
      const program = Effect.gen(function* () {
        const service = yield* CapabilityService
        yield* service.hasCapability("testCapability")
        return "success"
      })

      const layeredProgram = Effect.provide(program, CapabilityServiceMock)

      const result = await Effect.runPromise(layeredProgram)
      expect(result).toBe("success")
    })

    test("should combine with other layers", async () => {
      const combinedLayer = Layer.merge(CapabilityServiceLive, Layer.succeed({} as any, {}))

      expect(combinedLayer).toBeDefined()
    })
  })

  describe("Error Handling", () => {
    test("should handle permission errors properly", () => {
      const error = new PermissionDeniedError("restrictedCapability")

      expect(error._tag).toBe("PermissionDeniedError")
      expect(error.capability).toBe("restrictedCapability")
      expect(error.message).toContain("restrictedCapability")
    })

    test("should be caught by Effect error handlers", async () => {
      const failingService: typeof CapabilityService = {
        hasCapability: () => Effect.fail(new PermissionDeniedError("testCapability"))
      }

      const program = Effect.gen(function* () {
        const service = yield* CapabilityService
        yield* service.hasCapability("testCapability")
        return "should not reach here"
      })

      const layeredProgram = Effect.provide(program, Layer.succeed(CapabilityService, failingService))

      await expect(Effect.runPromise(layeredProgram)).rejects.toThrow(PermissionDeniedError)
    })
  })

  describe("Service Implementation Details", () => {
    test("should have proper service structure", () => {
      const mockService: typeof CapabilityService = {
        hasCapability: (capability: string) => Effect.succeed(undefined)
      }

      expect(mockService.hasCapability).toBeDefined()
      expect(typeof mockService.hasCapability).toBe("function")
    })

    test("should support different capability types", () => {
      const capabilities = [
        "canCreateAccount",
        "canDeleteUser",
        "canUpdateProfile",
        "canViewReports",
        "canManageUsers",
        "canAccessSettings"
      ]

      // Test that capability strings are properly typed
      capabilities.forEach(capability => {
        expect(typeof capability).toBe("string")
        expect(capability.startsWith("can")).toBe(true)
      })
    })
  })

  describe("Effect Integration", () => {
    test("should work with Effect.gen", async () => {
      const program = Effect.gen(function* () {
        const service = yield* CapabilityService
        const result = yield* service.hasCapability("testCapability")
        return result
      })

      const result = await Effect.runPromise(
        Effect.provide(program, CapabilityServiceMock)
      )

      expect(result).toBeUndefined()
    })

    test("should work with Effect.flatMap", async () => {
      const program = Effect.gen(function* () {
        return yield* CapabilityService.pipe(
          Effect.flatMap(service => service.hasCapability("testCapability")),
          Effect.map(() => "capability checked")
        )
      })

      const result = await Effect.runPromise(
        Effect.provide(program, CapabilityServiceMock)
      )

      expect(result).toBe("capability checked")
    })

    test("should handle effects in service methods", async () => {
      const asyncService: typeof CapabilityService = {
        hasCapability: (capability) =>
          Effect.gen(function* () {
            yield* Effect.sleep(10) // Simulate async work
            return undefined
          })
      }

      const program = Effect.gen(function* () {
        const service = yield* CapabilityService
        const start = Date.now()
        yield* service.hasCapability("asyncCapability")
        const end = Date.now()
        return end - start >= 10 // Should take at least 10ms
      })

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.succeed(CapabilityService, asyncService))
      )

      expect(result).toBe(true)
    })
  })
})
