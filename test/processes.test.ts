// Processes Layer Tests
// Merkle DAG: test -> processes

import { Effect, Layer } from "effect"
import {
  completeUserOnboardingSagaProcess,
  createSagaActor,
  createSagaBehavior,
  SagaState,
  StartSagaMessage,
  StepCompletedMessage,
  StepFailedMessage,
  RollbackMessage,
  CompleteSagaMessage
} from "../src/processes/complete-user-onboarding.saga"
import {
  userOnboardingProcess,
  createOnboardingActor,
  createOnboardingBehavior,
  OnboardingState,
  UsernameChangedMessage,
  SubmitMessage,
  RestartMessage
} from "../src/processes/user-onboarding.process"
import { RpcService, CapabilityService, PermissionDeniedError } from "../src/capabilities/checker"

describe("Processes Layer", () => {
  describe("Complete User Onboarding Saga", () => {
    describe("Process Metadata", () => {
      test("should have correct process metadata", () => {
        expect(completeUserOnboardingSagaProcess.metadata).toBeDefined()
        expect(completeUserOnboardingSagaProcess.metadata.id).toBe("complete-user-onboarding")
        expect(completeUserOnboardingSagaProcess.metadata.name).toBe("Complete User Onboarding Saga")
        expect(completeUserOnboardingSagaProcess.metadata.type).toBe("saga")
        expect(completeUserOnboardingSagaProcess.metadata.version).toBe("1.0.0")
      })

      test("should have createActor function", () => {
        expect(completeUserOnboardingSagaProcess.createActor).toBeDefined()
        expect(typeof completeUserOnboardingSagaProcess.createActor).toBe("function")
      })
    })

    describe("Saga Messages", () => {
      test("should create StartSagaMessage", () => {
        const message: StartSagaMessage = {
          _tag: "StartSaga",
          userData: {
            name: "John Doe",
            email: "john@example.com"
          }
        }

        expect(message._tag).toBe("StartSaga")
        expect(message.userData.name).toBe("John Doe")
        expect(message.userData.email).toBe("john@example.com")
      })

      test("should create StepCompletedMessage", () => {
        const message: StepCompletedMessage = {
          _tag: "StepCompleted",
          step: "email-verification",
          result: { verificationId: "verify-123" }
        }

        expect(message._tag).toBe("StepCompleted")
        expect(message.step).toBe("email-verification")
        expect(message.result).toEqual({ verificationId: "verify-123" })
      })

      test("should create StepFailedMessage", () => {
        const message: StepFailedMessage = {
          _tag: "StepFailed",
          step: "user-creation",
          error: new Error("User creation failed")
        }

        expect(message._tag).toBe("StepFailed")
        expect(message.step).toBe("user-creation")
        expect(message.error).toBeInstanceOf(Error)
      })

      test("should create RollbackMessage", () => {
        const message: RollbackMessage = {
          _tag: "Rollback"
        }

        expect(message._tag).toBe("Rollback")
      })

      test("should create CompleteSagaMessage", () => {
        const message: CompleteSagaMessage = {
          _tag: "CompleteSaga"
        }

        expect(message._tag).toBe("CompleteSaga")
      })
    })

    describe("Saga State", () => {
      test("should create initial saga state", () => {
        const state: SagaState = {
          sagaId: "saga-123",
          completedSteps: [],
          currentStep: 'idle',
        }

        expect(state.sagaId).toBe("saga-123")
        expect(state.completedSteps).toEqual([])
        expect(state.currentStep).toBe('idle')
      })

      test("should handle saga state transitions", () => {
        const initialState: SagaState = {
          sagaId: "saga-123",
          completedSteps: [],
          currentStep: 'idle',
        }

        const updatedState: SagaState = {
          ...initialState,
          userId: "user-456",
          email: "test@example.com",
          completedSteps: ["user-creation"],
          currentStep: 'sendingVerificationEmail',
        }

        expect(updatedState.userId).toBe("user-456")
        expect(updatedState.email).toBe("test@example.com")
        expect(updatedState.completedSteps).toEqual(["user-creation"])
        expect(updatedState.currentStep).toBe('sendingVerificationEmail')
      })
    })

    describe("Saga Behavior", () => {
      const mockUserCreationService = {
        createUser: (userData: any) => Effect.succeed({ userId: "user-123" })
      }

      const mockEmailService = {
        sendVerificationEmail: (email: string) => Effect.succeed({ verificationId: "verify-123" })
      }

      const mockNotificationService = {
        sendWelcomeNotification: (userId: string) => Effect.succeed(undefined)
      }

      const mockWelcomeService = {
        sendWelcomeMessage: (userId: string) => Effect.succeed(undefined)
      }

      test("should create saga behavior", () => {
        const behavior = createSagaBehavior(
          mockUserCreationService,
          mockEmailService,
          mockNotificationService,
          mockWelcomeService
        )

        expect(behavior).toBeDefined()
        expect(typeof behavior).toBe("function")
      })

      test("should handle StartSaga message", async () => {
        const behavior = createSagaBehavior(
          mockUserCreationService,
          mockEmailService,
          mockNotificationService,
          mockWelcomeService
        )

        const initialState: SagaState = {
          sagaId: "saga-123",
          completedSteps: [],
          currentStep: 'idle',
        }

        const message: StartSagaMessage = {
          _tag: "StartSaga",
          userData: {
            name: "John Doe",
            email: "john@example.com"
          }
        }

        const program = behavior(initialState, message, {} as any)
        const result = await Effect.runPromise(program)

        expect(result.userId).toBe("user-123")
        expect(result.email).toBe("john@example.com")
        expect(result.completedSteps).toContain("user-creation")
        expect(result.currentStep).toBe('sendingVerificationEmail')
      })

      test("should handle StepCompleted message", async () => {
        const behavior = createSagaBehavior(
          mockUserCreationService,
          mockEmailService,
          mockNotificationService,
          mockWelcomeService
        )

        const state: SagaState = {
          sagaId: "saga-123",
          completedSteps: ["user-creation"],
          currentStep: 'sendingVerificationEmail',
        }

        const message: StepCompletedMessage = {
          _tag: "StepCompleted",
          step: "email-verification",
          result: { verificationId: "verify-123" }
        }

        const program = behavior(state, message, {} as any)
        const result = await Effect.runPromise(program)

        expect(result.verificationId).toBe("verify-123")
        expect(result.completedSteps).toContain("email-verification")
        expect(result.currentStep).toBe('sendingWelcomeNotification')
      })
    })

    describe("Saga Actor Creation", () => {
      test("should create saga actor", async () => {
        const mockUserCreationService = {
          createUser: (userData: any) => Effect.succeed({ userId: "user-123" })
        }

        const mockEmailService = {
          sendVerificationEmail: (email: string) => Effect.succeed({ verificationId: "verify-123" })
        }

        const mockNotificationService = {
          sendWelcomeNotification: (userId: string) => Effect.succeed(undefined)
        }

        const mockWelcomeService = {
          sendWelcomeMessage: (userId: string) => Effect.succeed(undefined)
        }

        const program = createSagaActor(
          mockUserCreationService,
          mockEmailService,
          mockNotificationService,
          mockWelcomeService
        )

        const actor = await Effect.runPromise(program)

        expect(actor).toBeDefined()
        expect(typeof actor.tell).toBe("function")
        expect(typeof actor.ask).toBe("function")
      })
    })
  })

  describe("User Onboarding Process", () => {
    describe("Process Metadata", () => {
      test("should have correct process metadata", () => {
        expect(userOnboardingProcess.metadata).toBeDefined()
        expect(userOnboardingProcess.metadata.id).toBe("user-onboarding")
        expect(userOnboardingProcess.metadata.name).toBe("User Onboarding Process")
        expect(userOnboardingProcess.metadata.type).toBe("single")
        expect(userOnboardingProcess.metadata.version).toBe("1.0.0")
      })

      test("should have createActor function", () => {
        expect(userOnboardingProcess.createActor).toBeDefined()
        expect(typeof userOnboardingProcess.createActor).toBe("function")
      })
    })

    describe("Onboarding Messages", () => {
      test("should create UsernameChangedMessage", () => {
        const message: UsernameChangedMessage = {
          _tag: "UsernameChanged",
          username: "johndoe"
        }

        expect(message._tag).toBe("UsernameChanged")
        expect(message.username).toBe("johndoe")
      })

      test("should create SubmitMessage", () => {
        const message: SubmitMessage = {
          _tag: "Submit"
        }

        expect(message._tag).toBe("Submit")
      })

      test("should create RestartMessage", () => {
        const message: RestartMessage = {
          _tag: "Restart"
        }

        expect(message._tag).toBe("Restart")
      })
    })

    describe("Onboarding State", () => {
      test("should create initial onboarding state", () => {
        const state: OnboardingState = {
          username: "",
          errorMessage: undefined,
          currentStep: 'enteringUsername',
        }

        expect(state.username).toBe("")
        expect(state.errorMessage).toBeUndefined()
        expect(state.currentStep).toBe('enteringUsername')
      })

      test("should handle state transitions", () => {
        const state: OnboardingState = {
          username: "johndoe",
          errorMessage: undefined,
          currentStep: 'checkingUsername',
        }

        expect(state.username).toBe("johndoe")
        expect(state.currentStep).toBe('checkingUsername')
      })

      test("should handle error states", () => {
        const errorState: OnboardingState = {
          username: "invalid",
          errorMessage: "Username is not available",
          currentStep: 'enteringUsername',
        }

        expect(errorState.errorMessage).toBe("Username is not available")
        expect(errorState.currentStep).toBe('enteringUsername')
      })
    })

    describe("Onboarding Behavior", () => {
      const mockRpcService: typeof RpcService = {
        checkUsername: (username) => {
          if (username === "admin") {
            return Effect.fail({ _tag: "UsernameTakenError" } as any)
          }
          if (username.length < 3) {
            return Effect.fail({ _tag: "InvalidFormatError" } as any)
          }
          return Effect.succeed({ available: true })
        }
      }

      const mockCapabilityService: typeof CapabilityService = {
        hasCapability: (capability) => Effect.succeed(undefined)
      }

      test("should create onboarding behavior", () => {
        const behavior = createOnboardingBehavior(mockRpcService, mockCapabilityService)

        expect(behavior).toBeDefined()
        expect(typeof behavior).toBe("function")
      })

      test("should handle UsernameChanged message", async () => {
        const behavior = createOnboardingBehavior(mockRpcService, mockCapabilityService)

        const initialState: OnboardingState = {
          username: "",
          errorMessage: undefined,
          currentStep: 'enteringUsername',
        }

        const message: UsernameChangedMessage = {
          _tag: "UsernameChanged",
          username: "johndoe"
        }

        const program = behavior(initialState, message, {} as any)
        const result = await Effect.runPromise(program)

        expect(result.username).toBe("johndoe")
        expect(result.errorMessage).toBeUndefined()
        expect(result.currentStep).toBe('enteringUsername')
      })

      test("should handle successful Submit message", async () => {
        const behavior = createOnboardingBehavior(mockRpcService, mockCapabilityService)

        const state: OnboardingState = {
          username: "johndoe",
          errorMessage: undefined,
          currentStep: 'enteringUsername',
        }

        const message: SubmitMessage = {
          _tag: "Submit"
        }

        const program = behavior(state, message, {} as any)
        const result = await Effect.runPromise(program)

        expect(result.currentStep).toBe('success')
        expect(result.errorMessage).toBeUndefined()
      })

      test("should handle taken username", async () => {
        const behavior = createOnboardingBehavior(mockRpcService, mockCapabilityService)

        const state: OnboardingState = {
          username: "admin", // This will be taken
          errorMessage: undefined,
          currentStep: 'enteringUsername',
        }

        const message: SubmitMessage = {
          _tag: "Submit"
        }

        const program = behavior(state, message, {} as any)

        // Expect the effect to fail with UsernameTakenError
        await expect(Effect.runPromise(program)).rejects.toThrow()
      })

      test("should handle invalid format", async () => {
        const behavior = createOnboardingBehavior(mockRpcService, mockCapabilityService)

        const state: OnboardingState = {
          username: "a", // Too short
          errorMessage: undefined,
          currentStep: 'enteringUsername',
        }

        const message: SubmitMessage = {
          _tag: "Submit"
        }

        const program = behavior(state, message, {} as any)

        // Expect the effect to fail with InvalidFormatError
        await expect(Effect.runPromise(program)).rejects.toThrow()
      })

      test("should handle Restart message", async () => {
        const behavior = createOnboardingBehavior(mockRpcService, mockCapabilityService)

        const state: OnboardingState = {
          username: "johndoe",
          errorMessage: "Some error",
          currentStep: 'error',
        }

        const message: RestartMessage = {
          _tag: "Restart"
        }

        const program = behavior(state, message, {} as any)
        const result = await Effect.runPromise(program)

        expect(result.username).toBe("")
        expect(result.errorMessage).toBeUndefined()
        expect(result.currentStep).toBe('enteringUsername')
      })
    })

    describe("Onboarding Actor Creation", () => {
      test("should create onboarding actor", async () => {
        const mockRpcService: typeof RpcService = {
          checkUsername: (username) => Effect.succeed({ available: true })
        }

        const mockCapabilityService: typeof CapabilityService = {
          hasCapability: (capability) => Effect.succeed(undefined)
        }

        const program = createOnboardingActor(mockRpcService, mockCapabilityService)
        const actor = await Effect.runPromise(program)

        expect(actor).toBeDefined()
        expect(typeof actor.tell).toBe("function")
        expect(typeof actor.ask).toBe("function")
      })
    })
  })

  describe("Process Integration", () => {
    test("should export both processes", () => {
      expect(completeUserOnboardingSagaProcess).toBeDefined()
      expect(userOnboardingProcess).toBeDefined()

      expect(completeUserOnboardingSagaProcess.metadata.type).toBe("saga")
      expect(userOnboardingProcess.metadata.type).toBe("single")
    })

    test("should have different process IDs", () => {
      expect(completeUserOnboardingSagaProcess.metadata.id).not.toBe(userOnboardingProcess.metadata.id)
      expect(completeUserOnboardingSagaProcess.metadata.id).toBe("complete-user-onboarding")
      expect(userOnboardingProcess.metadata.id).toBe("user-onboarding")
    })
  })
})
