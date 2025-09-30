// Merkle DAG: /processes/user-onboarding
// この単一ファイルが、ユーザーオンボーディングのビジネスプロセス全体をカプセル化します。
// BPMN図にもマッピング可能です。

import { Effect, Context, Layer, pipe } from "effect";
import { createMachine, assign, interpret, type Actor } from "xstate";
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
// 3. State Machine Definition (using XState) -> Maps to BPMN
//================================================================

// --- Context and Events ---
interface OnboardingContext {
  username: string;
  errorMessage?: string;
}

type OnboardingEvent =
  | { type: "USERNAME_CHANGED"; username: string }
  | { type: "SUBMIT" }
  | { type: "RESTART" };

// --- State Machine ---
export const onboardingMachine = createMachine({
  id: "userOnboarding",
  types: {} as { context: OnboardingContext, events: OnboardingEvent },
  initial: "enteringUsername",
  context: {
    username: "",
    errorMessage: undefined,
  },
  states: {
    // BPMN: Start Event -> User Task "Enter Username"
    enteringUsername: {
      meta: {
        component: "username-input-step", // UI mapping
        description: "User provides their desired username.",
      },
      on: {
        USERNAME_CHANGED: {
          actions: assign({ username: ({ event }) => event.username }),
        },
        SUBMIT: {
          target: "checkingUsername",
        },
      },
    },
    // BPMN: Service Task "Check Username Availability"
    checkingUsername: {
      meta: {
        component: "loading-step",
        description: "System checks if the username is available.",
      },
      invoke: {
        src: "checkUsernameWithCapability",
        input: ({ context }) => ({ username: context.username }),
        onDone: "success",
        onError: {
          target: "enteringUsername",
          actions: assign({
            errorMessage: ({ event }) => {
              const error = event.error;
              // Handle PermissionDeniedError
              if (error instanceof PermissionDeniedError) {
                return "You do not have permission to perform this action.";
              }
              // Handle other errors
              if (error._tag === "UsernameTakenError") return "That username is already taken.";
              if (error._tag === "InvalidFormatError") return "Username must be at least 3 characters.";
              return "An unknown error occurred.";
            }
          }),
        },
      },
    },
    // BPMN: End Event "Onboarding Complete"
    success: {
      meta: {
        component: "success-step",
        description: "User has successfully completed onboarding.",
      },
      on: {
        RESTART: "enteringUsername",
      },
    },
  },
},
{
  actors: {
    checkUsernameWithCapability: Effect.toActor(
      pipe(
        // 1. Check capability first
        Effect.serviceFunctions(CapabilityService).hasCapability("canCheckUsername"),
        // 2. If successful, proceed to RPC call
        Effect.zipRight(Effect.serviceFunctions(RpcService).checkUsername),

        // Provide the services (this will be injected at runtime)
        // Note: In a real application, these would be provided by the framework
        Effect.provide(Layer.merge(
          Layer.succeed(RpcService, RpcService.of({
            checkUsername: (username) => Effect.tryPromise({
              try: async () => {
                console.log(`[Mock RPC] Checking username: ${username}`);
                await new Promise(resolve => setTimeout(resolve, 500));
                if (username === "admin") throw { _tag: "UsernameTakenError" };
                if (username.length < 3) throw { _tag: "InvalidFormatError" };
                return { available: true };
              },
              catch: (error: any) => {
                if (error._tag === "UsernameTakenError") return error;
                if (error._tag === "InvalidFormatError") return error;
                return { _tag: "UnknownRpcError" };
              }
            })
          })),
          Layer.succeed(CapabilityService, CapabilityService.of({
            hasCapability: (capability) => {
              console.log(`[Mock Capability] Checking: ${capability}`);
              // Always allow for demo
              return Effect.succeed(undefined);
            }
          }))
        ))
      )
    ),
  }
});


//================================================================
// 4. UI Components (using FAST Web Components)
//================================================================

let actorInstance: Actor<typeof onboardingMachine> | null = null;

@customElement({ name: "username-input-step" })
class UsernameInputStep extends FASTElement {
  @attr errorMessage?: string;
  @attr username?: string;

  connectedCallback(): void {
    super.connectedCallback();
    this.shadowRoot?.querySelector('input')?.focus();
  }

  render() {
    return html`
      <style>
        .error { color: red; font-size: 0.9em; height: 1.2em; }
        input { font-size: 1.2em; padding: 8px; margin-top: 4px; width: 100%; box-sizing: border-box; }
        button { font-size: 1.2em; padding: 8px 16px; margin-left: 8px; }
        .container { display: flex; align-items: center; gap: 8px; }
      </style>
      <h2>Choose a Username</h2>
      <div class="error">${this.errorMessage}</div>
      <div class="container">
        <input
          type="text"
          .value=${this.username}
          @input=${(e: Event) => actorInstance?.send({ type: "USERNAME_CHANGED", username: (e.target as HTMLInputElement).value })}
          @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && actorInstance?.send({ type: 'SUBMIT' })}
          placeholder="Enter username..."
        />
        <button @click=${() => actorInstance?.send({ type: "SUBMIT" })}>Next</button>
      </div>
    `;
  }
}

@customElement({ name: "loading-step" })
class LoadingStep extends FASTElement {
  render() {
    return html`
      <style>
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
      <h2>Checking availability...</h2>
      <div class="spinner"></div>
    `;
  }
}

@customElement({ name: "success-step" })
class SuccessStep extends FASTElement {
  @attr username?: string;
  render() {
    return html`
      <style>
        .welcome { color: #2e7d32; font-size: 1.5em; }
        button { font-size: 1.2em; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #1976d2; }
      </style>
      <div class="welcome">Welcome, ${this.username}!</div>
      <p>Your account is ready.</p>
      <button @click=${() => actorInstance?.send({ type: "RESTART" })}>Start Over</button>
    `;
  }
}

//================================================================
// 5. Public Interface (Process Orchestrator)
//================================================================

export const userOnboardingProcess = {
  machine: onboardingMachine,

  /**
   * Initializes the process and renders its UI into a container element.
   * @param container The HTML element to render the process UI into.
   */
  bootstrap: (container: HTMLElement) => {
    actorInstance = interpret(onboardingMachine).start();

    actorInstance.subscribe((state) => {
      // Clear container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Get component name from state metadata
      const componentName = state.meta[`userOnboarding.${state.value as string}`]?.component;
      if (!componentName) {
        console.error(`No component defined for state: ${state.value as string}`);
        return;
      }

      // Create and append the component for the current state
      const element = document.createElement(componentName);

      // Pass context data to the component as attributes
      for (const [key, value] of Object.entries(state.context)) {
        if (typeof value === 'string') {
          element.setAttribute(key, value);
        }
      }

      container.appendChild(element);
    });

    return actorInstance;
  },

  /**
   * Exports a BPMN-compatible JSON representation of the process.
   * This can be used for visualization or integration with BPMN engines.
   */
  toBpmnJson: () => {
    const definition = onboardingMachine.definition;
    const nodes = Object.entries(definition.states).map(([id, stateNode]) => ({
      id,
      type: stateNode.invoke ? 'serviceTask' : 'userTask',
      description: stateNode.meta?.description,
    }));
    const edges = Object.entries(definition.states).flatMap(([sourceId, stateNode]) =>
      Object.entries(stateNode.on ?? {}).map(([event, transition]) => {
        const target = (Array.isArray(transition) ? transition[0].target : (transition as any).target) as string;
        return {
          id: `${sourceId}-${event}-${target}`,
          source: sourceId,
          target: target,
          label: event
        }
      })
    );
    return { id: definition.id, nodes, edges };
  }
};

// Ensure components are registered
void UsernameInputStep;
void LoadingStep;
void SuccessStep;
