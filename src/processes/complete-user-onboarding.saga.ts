// Merkle DAG: /processes/complete-user-onboarding
// Saga Pattern: Orchestrates multiple business processes into a complete user onboarding workflow
// This demonstrates how multiple .process.ts files can be composed into a larger business transaction

// Process Metadata
export const processMetadata = {
  id: 'complete-user-onboarding',
  name: 'Complete User Onboarding Saga',
  type: 'saga' as const, // 'single' | 'saga'
  version: '1.0.0',
  hash: 'e5f6g7h8', // Process hash for versioning and caching
  description: 'Multi-step user onboarding saga with compensation transactions',
  author: 'Performer Framework',
  created: '2025-01-30',
  tags: ['saga', 'onboarding', 'user', 'compensation', 'orchestration']
};

import { Effect, Context, Layer, pipe } from "effect";
import { ActorSystemUtils, Message } from "../actor/effect-actor";
import { FASTElement, customElement, html, attr, observable } from "@microsoft/fast-element";

//================================================================
// 1. Sub-Process Definitions (Saga Steps)
//================================================================

// Each step in the saga is a separate business process
interface UserCreationProcess {
  createUser: (userData: { name: string; email: string }) => Effect.Effect<never, { _tag: "UserCreationFailed" }, { userId: string }>;
}

interface EmailVerificationProcess {
  sendVerificationEmail: (email: string) => Effect.Effect<never, { _tag: "EmailSendFailed" }, { verificationId: string }>;
}

interface NotificationProcess {
  sendWelcomeNotification: (userId: string) => Effect.Effect<never, { _tag: "NotificationFailed" }, void>;
}

interface WelcomeMessageProcess {
  sendWelcomeMessage: (userId: string) => Effect.Effect<never, { _tag: "MessageSendFailed" }, void>;
}

// Service Tags
const UserCreationService = Context.GenericTag<UserCreationProcess>("UserCreationService");
const EmailVerificationService = Context.GenericTag<EmailVerificationProcess>("EmailVerificationService");
const NotificationService = Context.GenericTag<NotificationProcess>("NotificationService");
const WelcomeMessageService = Context.GenericTag<WelcomeMessageProcess>("WelcomeMessageService");

//================================================================
// 2. Saga Actor (Effect Actor) - Orchestrates the workflow
//================================================================

interface SagaState {
  userId?: string;
  email?: string;
  verificationId?: string;
  sagaId: string;
  completedSteps: string[];
  failedStep?: string;
  errorMessage?: string;
  currentStep: 'idle' | 'creatingUser' | 'sendingVerificationEmail' | 'sendingWelcomeNotification' | 'sendingWelcomeMessage' | 'completed' | 'failed' | 'compensating';
}

interface StartSagaMessage extends Message {
  readonly _tag: "StartSaga";
  readonly userData: { name: string; email: string };
}

interface StepCompletedMessage extends Message {
  readonly _tag: "StepCompleted";
  readonly step: string;
  readonly result?: any;
}

interface StepFailedMessage extends Message {
  readonly _tag: "StepFailed";
  readonly step: string;
  readonly error: any;
}

interface RollbackMessage extends Message {
  readonly _tag: "Rollback";
}

interface CompleteSagaMessage extends Message {
  readonly _tag: "CompleteSaga";
}

type SagaMessage =
  | StartSagaMessage
  | StepCompletedMessage
  | StepFailedMessage
  | RollbackMessage
  | CompleteSagaMessage;

// Saga Actor Behavior
export const createSagaBehavior = (
  userCreationService: UserCreationProcess,
  emailVerificationService: EmailVerificationProcess,
  notificationService: NotificationProcess,
  welcomeMessageService: WelcomeMessageProcess
) => {
  return (state: SagaState, message: SagaMessage, context: any) => {
    return Effect.gen(function* () {
      switch (message._tag) {
        case "StartSaga": {
          const { userData } = message;

          // Transition to creatingUser step
          const newState: SagaState = {
            ...state,
            email: userData.email,
            currentStep: 'creatingUser',
          };

          // Execute user creation
          try {
            const result = yield* userCreationService.createUser(userData);
            // Success - transition to next step
            return {
              ...newState,
              userId: result.userId,
              completedSteps: [...newState.completedSteps, "user-creation"],
              currentStep: 'sendingVerificationEmail',
            };
          } catch (error) {
            // Failure - transition to failed state
            return {
              ...newState,
              failedStep: "user-creation",
              errorMessage: `User creation failed: ${error._tag}`,
              currentStep: 'failed',
            };
          }
        }

        case "StepCompleted": {
          const { step, result } = message;

          switch (step) {
            case "email-verification":
              return {
                ...state,
                verificationId: result?.verificationId,
                completedSteps: [...state.completedSteps, step],
                currentStep: 'sendingWelcomeNotification',
              };

            case "welcome-notification":
              return {
                ...state,
                completedSteps: [...state.completedSteps, step],
                currentStep: 'sendingWelcomeMessage',
              };

            case "welcome-message":
              return {
                ...state,
                completedSteps: [...state.completedSteps, step],
                currentStep: 'completed',
              };

            default:
              return state;
          }
        }

        case "StepFailed": {
          const { step, error } = message;

          return {
            ...state,
            failedStep: step,
            errorMessage: `${step} failed: ${error._tag}`,
            currentStep: step === "email-verification" ? 'compensating' : 'failed',
          };
        }

        case "Rollback": {
          // Implement rollback logic
          // This would undo completed steps in reverse order
          return {
            ...state,
            currentStep: 'failed', // After rollback, mark as failed
          };
        }

        case "CompleteSaga": {
          return {
            ...state,
            currentStep: 'completed',
          };
        }

        default:
          return state;
      }
    });
  };
};

// Saga Actor Factory
export const createSagaActor = (
  userCreationService: UserCreationProcess,
  emailVerificationService: EmailVerificationProcess,
  notificationService: NotificationProcess,
  welcomeMessageService: WelcomeMessageProcess
): Effect.Effect<any, Error, never> => {
  return Effect.gen(function* () {
    const system = yield* ActorSystemUtils.make("saga-system");

    const initialState: SagaState = {
      sagaId: `saga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completedSteps: [],
      currentStep: 'idle',
    };

    const behavior = createSagaBehavior(
      userCreationService,
      emailVerificationService,
      notificationService,
      welcomeMessageService
    );

    const actorRef = yield* system.make("complete-user-onboarding-saga", initialState, behavior);

    return actorRef;
  });
};

//================================================================
// 3. Saga Process Export
//================================================================

export const completeUserOnboardingSagaProcess = {
  metadata: processMetadata,
  createActor: createSagaActor,
};
