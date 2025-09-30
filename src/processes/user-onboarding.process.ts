// Merkle DAG: /processes/user-onboarding
// この単一ファイルが、ユーザーオンボーディングのビジネスプロセス全体をカプセル化します。
// BPMN図にもマッピング可能です.

// Process Metadata
export const processMetadata = {
  id: 'user-onboarding',
  name: 'User Onboarding Process',
  type: 'single' as const, // 'single' | 'saga'
  version: '1.0.0',
  hash: 'a1b2c3d4', // Process hash for versioning and caching
  description: 'Simple user onboarding with username validation',
  author: 'Performer Framework',
  created: '2025-01-30',
  tags: ['onboarding', 'user', 'validation']
};

import { Effect, Context, Layer, pipe } from "effect";
import { ActorSystemUtils, Message } from "../actor/effect-actor";
import { FASTElement, customElement, html, attr } from "@microsoft/fast-element";

//================================================================
// 1. RPC Service Definition (The Interface)
//================================================================

// --- RPC Service Interface ---
// このプロセスが必要とする外部APIの「契約」を定義します。
export interface RpcService {
  checkUsername: (username: string) => Effect.Effect<never, { _tag: "UsernameTakenError" } | { _tag: "InvalidFormatError" }, { available: boolean }>;
}
export const RpcService = Context.GenericTag<RpcService>("RpcService");

//================================================================
// 2. Capability Service Definition (The Interface)
//================================================================

// --- エラーの定義 ---
export class PermissionDeniedError {
  readonly _tag = "PermissionDeniedError";
  constructor(readonly capability: string) {}
}

// --- Capabilityサービスのインターフェース ---
export interface CapabilityService {
  hasCapability: (capability: string) => Effect.Effect<never, PermissionDeniedError, void>;
}
export const CapabilityService = Context.GenericTag<CapabilityService>("CapabilityService");

//================================================================
// 3. Actor Definition (using Effect Actor) -> Maps to BPMN
//================================================================

// --- State and Messages ---
interface OnboardingState {
  username: string;
  errorMessage?: string;
  currentStep: 'enteringUsername' | 'checkingUsername' | 'success' | 'error';
}

interface UsernameChangedMessage extends Message {
  readonly _tag: "UsernameChanged";
  readonly username: string;
}

interface SubmitMessage extends Message {
  readonly _tag: "Submit";
}

interface RestartMessage extends Message {
  readonly _tag: "Restart";
}

type OnboardingMessage =
  | UsernameChangedMessage
  | SubmitMessage
  | RestartMessage;

// --- Actor Behavior ---
export const createOnboardingBehavior = (
  rpcService: RpcService,
  capabilityService: CapabilityService
) => {
  return (state: OnboardingState, message: OnboardingMessage, context: any) => {
    return Effect.gen(function* () {
      switch (message._tag) {
        case "UsernameChanged": {
          const { username } = message;
          return {
            ...state,
            username,
            errorMessage: undefined,
          };
        }

        case "Submit": {
          // Transition to checkingUsername step
          const newState: OnboardingState = {
            ...state,
            currentStep: 'checkingUsername',
          };

          try {
            // Check capability first
            yield* capabilityService.hasCapability("canCreateAccount");

            // Check username availability
            const result = yield* rpcService.checkUsername(state.username);

            if (result.available) {
              // Success - transition to success state
              return {
                ...newState,
                currentStep: 'success',
                errorMessage: undefined,
              };
            } else {
              // Username not available - stay in enteringUsername with error
              return {
                ...state,
                currentStep: 'enteringUsername',
                errorMessage: "Username is not available",
              };
            }
          } catch (error: any) {
            if (error._tag === "PermissionDeniedError") {
              return {
                ...newState,
                currentStep: 'error',
                errorMessage: "Permission denied",
              };
            } else if (error._tag === "UsernameTakenError") {
              return {
                ...state,
                currentStep: 'enteringUsername',
                errorMessage: "Username is already taken",
              };
            } else if (error._tag === "InvalidFormatError") {
              return {
                ...state,
                currentStep: 'enteringUsername',
                errorMessage: "Invalid username format",
              };
            } else {
              return {
                ...newState,
                currentStep: 'error',
                errorMessage: error.message || "Unknown error occurred",
              };
            }
          }
        }

        case "Restart": {
          return {
            username: "",
            errorMessage: undefined,
            currentStep: 'enteringUsername',
          };
        }

        default:
          return state;
      }
    });
  };
};

// --- Actor Factory ---
export const createOnboardingActor = (
  rpcService: RpcService,
  capabilityService: CapabilityService
): Effect.Effect<any, Error, never> => {
  return Effect.gen(function* () {
    const system = yield* ActorSystemUtils.make("onboarding-system");

    const initialState: OnboardingState = {
      username: "",
      errorMessage: undefined,
      currentStep: 'enteringUsername',
    };

    const behavior = createOnboardingBehavior(rpcService, capabilityService);
    const actorRef = yield* system.make("user-onboarding", initialState, behavior);

    return actorRef;
  });
};

//================================================================
// 4. Process Export
//================================================================

export const userOnboardingProcess = {
  metadata: processMetadata,
  createActor: createOnboardingActor,
};
