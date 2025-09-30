// Merkle DAG: /processes/complete-user-onboarding
// Saga Pattern: Orchestrates multiple business processes into a complete user onboarding workflow
// This demonstrates how multiple .process.ts files can be composed into a larger business transaction

// Process Metadata
export const processMetadata = {
  id: 'complete-user-onboarding',
  name: 'Complete User Onboarding Saga',
  type: 'saga' as const, // 'single' | 'saga'
  version: '1.0.0',
  description: 'Multi-step user onboarding saga with compensation transactions',
  author: 'Performer Framework',
  created: '2025-01-30',
  tags: ['saga', 'onboarding', 'user', 'compensation', 'orchestration']
};

import { Effect, Context, Layer, pipe } from "effect";
import { createMachine, assign, interpret, type Actor } from "xstate";
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
// 2. Saga State Machine (XState) - Orchestrates the workflow
//================================================================

interface SagaContext {
  userId?: string;
  email?: string;
  verificationId?: string;
  sagaId: string;
  completedSteps: string[];
  failedStep?: string;
  errorMessage?: string;
}

type SagaEvent =
  | { type: "START_SAGA"; userData: { name: string; email: string } }
  | { type: "STEP_COMPLETED"; step: string; result?: any }
  | { type: "STEP_FAILED"; step: string; error: any }
  | { type: "ROLLBACK" }
  | { type: "COMPLETE_SAGA" };

export const completeUserOnboardingSaga = createMachine({
  id: "completeUserOnboardingSaga",
  types: {} as { context: SagaContext, events: SagaEvent },
  initial: "idle",
  context: {
    sagaId: `saga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    completedSteps: [],
  },
  states: {
    idle: {
      on: {
        START_SAGA: {
          target: "creatingUser",
          actions: assign({
            email: ({ event }) => event.userData.email,
          }),
        },
      },
    },

    // Step 1: Create User
    creatingUser: {
      meta: {
        component: "saga-step-user-creation",
        description: "Create user account in the system",
        compensatable: true, // Can be rolled back
      },
      invoke: {
        src: "createUserEffect",
        input: ({ context, event }) => {
          if (event.type === "START_SAGA") {
            return { userData: event.userData };
          }
          return {};
        },
        onDone: {
          target: "sendingVerificationEmail",
          actions: [
            assign({
              userId: ({ event }) => event.output.userId,
              completedSteps: ({ context }) => [...context.completedSteps, "user-creation"],
            }),
            "logSagaProgress",
          ],
        },
        onError: {
          target: "failed",
          actions: assign({
            failedStep: "user-creation",
            errorMessage: ({ event }) => `User creation failed: ${event.error._tag}`,
          }),
        },
      },
    },

    // Step 2: Send Verification Email
    sendingVerificationEmail: {
      meta: {
        component: "saga-step-email-verification",
        description: "Send email verification to user",
        compensatable: false, // Email sending is not reversible
      },
      invoke: {
        src: "sendVerificationEmailEffect",
        input: ({ context }) => ({ email: context.email! }),
        onDone: {
          target: "sendingWelcomeNotification",
          actions: [
            assign({
              verificationId: ({ event }) => event.output.verificationId,
              completedSteps: ({ context }) => [...context.completedSteps, "email-verification"],
            }),
            "logSagaProgress",
          ],
        },
        onError: {
          target: "compensating",
          actions: assign({
            failedStep: "email-verification",
            errorMessage: ({ event }) => `Email verification failed: ${event.error._tag}`,
          }),
        },
      },
    },

    // Step 3: Send Welcome Notification
    sendingWelcomeNotification: {
      meta: {
        component: "saga-step-notification",
        description: "Send welcome notification to user",
        compensatable: true,
      },
      invoke: {
        src: "sendWelcomeNotificationEffect",
        input: ({ context }) => ({ userId: context.userId! }),
        onDone: {
          target: "sendingWelcomeMessage",
          actions: [
            assign({
              completedSteps: ({ context }) => [...context.completedSteps, "welcome-notification"],
            }),
            "logSagaProgress",
          ],
        },
        onError: {
          target: "compensating",
          actions: assign({
            failedStep: "welcome-notification",
            errorMessage: ({ event }) => `Welcome notification failed: ${event.error._tag}`,
          }),
        },
      },
    },

    // Step 4: Send Welcome Message
    sendingWelcomeMessage: {
      meta: {
        component: "saga-step-welcome-message",
        description: "Send personalized welcome message",
        compensatable: true,
      },
      invoke: {
        src: "sendWelcomeMessageEffect",
        input: ({ context }) => ({ userId: context.userId! }),
        onDone: {
          target: "completed",
          actions: [
            assign({
              completedSteps: ({ context }) => [...context.completedSteps, "welcome-message"],
            }),
            "logSagaProgress",
          ],
        },
        onError: {
          target: "compensating",
          actions: assign({
            failedStep: "welcome-message",
            errorMessage: ({ event }) => `Welcome message failed: ${event.error._tag}`,
          }),
        },
      },
    },

    // Compensation: Rollback completed steps
    compensating: {
      meta: {
        component: "saga-step-compensation",
        description: "Rolling back completed steps due to failure",
      },
      invoke: {
        src: "compensateSagaEffect",
        input: ({ context }) => ({ completedSteps: context.completedSteps }),
        onDone: "failed",
      },
    },

    // Final states
    completed: {
      meta: {
        component: "saga-step-completed",
        description: "Saga completed successfully",
      },
      type: "final",
    },

    failed: {
      meta: {
        component: "saga-step-failed",
        description: "Saga failed and was compensated",
      },
      on: {
        ROLLBACK: "idle",
      },
    },
  },
},
{
  actions: {
    logSagaProgress: ({ context }) => {
      console.log(`🎭 [Saga ${context.sagaId}] Progress: ${context.completedSteps.join(' → ')}`);
    },
  },
  actors: {
    // Effect-based implementations for each saga step
    createUserEffect: Effect.toActor(
      pipe(
        Effect.serviceFunctions(UserCreationService).createUser,
        Effect.provide(Layer.succeed(UserCreationService, UserCreationService.of({
          createUser: (userData) => Effect.tryPromise({
            try: async () => {
              console.log(`👤 [Saga] Creating user: ${userData.name} (${userData.email})`);

              // Simulate user creation with ActorDB logging
              const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              await fetch('http://localhost:9091/api/v1/events.write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: `create-user-${Date.now()}`,
                  params: {
                    entityId: userId,
                    eventType: 'user_created',
                    payload: { ...userData, createdAt: new Date() },
                    timestamp: new Date().toISOString(),
                    version: 1,
                  }
                })
              });

              await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
              return { userId };
            },
            catch: (error: any) => ({ _tag: "UserCreationFailed" } as const),
          })
        }))))
    ),

    sendVerificationEmailEffect: Effect.toActor(
      pipe(
        Effect.serviceFunctions(EmailVerificationService).sendVerificationEmail,
        Effect.provide(Layer.succeed(EmailVerificationService, EmailVerificationService.of({
          sendVerificationEmail: (email) => Effect.tryPromise({
            try: async () => {
              console.log(`📧 [Saga] Sending verification email to: ${email}`);

              const verificationId = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              await fetch('http://localhost:9091/api/v1/events.write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: `email-verification-${Date.now()}`,
                  params: {
                    entityId: `email-${email}`,
                    eventType: 'verification_email_sent',
                    payload: { email, verificationId, sentAt: new Date() },
                    timestamp: new Date().toISOString(),
                    version: 1,
                  }
                })
              });

              await new Promise(resolve => setTimeout(resolve, 300));
              // Randomly fail for testing (20% chance)
              if (Math.random() < 0.2) throw new Error("SMTP server unavailable");

              return { verificationId };
            },
            catch: (error: any) => ({ _tag: "EmailSendFailed" } as const),
          })
        }))))
    ),

    sendWelcomeNotificationEffect: Effect.toActor(
      pipe(
        Effect.serviceFunctions(NotificationService).sendWelcomeNotification,
        Effect.provide(Layer.succeed(NotificationService, NotificationService.of({
          sendWelcomeNotification: (userId) => Effect.tryPromise({
            try: async () => {
              console.log(`🔔 [Saga] Sending welcome notification to user: ${userId}`);

              await fetch('http://localhost:9091/api/v1/events.write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: `welcome-notification-${Date.now()}`,
                  params: {
                    entityId: userId,
                    eventType: 'welcome_notification_sent',
                    payload: { userId, notificationType: 'welcome', sentAt: new Date() },
                    timestamp: new Date().toISOString(),
                    version: 1,
                  }
                })
              });

              await new Promise(resolve => setTimeout(resolve, 200));
              return undefined;
            },
            catch: (error: any) => ({ _tag: "NotificationFailed" } as const),
          })
        }))))
    ),

    sendWelcomeMessageEffect: Effect.toActor(
      pipe(
        Effect.serviceFunctions(WelcomeMessageService).sendWelcomeMessage,
        Effect.provide(Layer.succeed(WelcomeMessageService, WelcomeMessageService.of({
          sendWelcomeMessage: (userId) => Effect.tryPromise({
            try: async () => {
              console.log(`💌 [Saga] Sending welcome message to user: ${userId}`);

              await fetch('http://localhost:9091/api/v1/events.write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: `welcome-message-${Date.now()}`,
                  params: {
                    entityId: userId,
                    eventType: 'welcome_message_sent',
                    payload: { userId, messageType: 'personalized_welcome', sentAt: new Date() },
                    timestamp: new Date().toISOString(),
                    version: 1,
                  }
                })
              });

              await new Promise(resolve => setTimeout(resolve, 300));
              return undefined;
            },
            catch: (error: any) => ({ _tag: "MessageSendFailed" } as const),
          })
        }))))
    ),

    compensateSagaEffect: Effect.toActor(
      Effect.tryPromise({
        try: async ({ completedSteps }: { completedSteps: string[] }) => {
          console.log(`🔄 [Saga] Compensating completed steps: ${completedSteps.join(', ')}`);

          // Compensation logic for each completed step
          for (const step of completedSteps.reverse()) {
            switch (step) {
              case 'welcome-message':
                console.log('  ↩️ Rolling back welcome message...');
                // Send cancellation message or delete sent message
                break;
              case 'welcome-notification':
                console.log('  ↩️ Rolling back welcome notification...');
                // Cancel notification
                break;
              case 'email-verification':
                console.log('  ↩️ Email verification is not compensatable (already sent)');
                break;
              case 'user-creation':
                console.log('  ↩️ Rolling back user creation...');
                // Mark user as inactive or delete (in real app)
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          return undefined;
        },
        catch: (error: any) => {
          console.error('Compensation failed:', error);
          return undefined;
        },
      })
    ),
  }
});

//================================================================
// 3. Saga UI Components (Web Components)
//================================================================

let sagaActorInstance: Actor<typeof completeUserOnboardingSaga> | null = null;

@customElement({ name: "saga-orchestrator" })
class SagaOrchestrator extends FASTElement {
  @observable currentStep?: string;
  @observable sagaStatus: 'idle' | 'running' | 'completed' | 'failed' = 'idle';
  @observable completedSteps: string[] = [];
  @observable errorMessage?: string;

  startSaga(userData: { name: string; email: string }) {
    if (sagaActorInstance) {
      sagaActorInstance.stop();
    }

    sagaActorInstance = interpret(completeUserOnboardingSaga).start();

    sagaActorInstance.subscribe((state) => {
      this.currentStep = state.value as string;
      this.completedSteps = state.context.completedSteps;
      this.errorMessage = state.context.errorMessage;

      if (state.matches('idle')) {
        this.sagaStatus = 'idle';
      } else if (state.matches('completed')) {
        this.sagaStatus = 'completed';
      } else if (state.matches('failed')) {
        this.sagaStatus = 'failed';
      } else {
        this.sagaStatus = 'running';
      }

      // Update UI
      this.requestUpdate();
    });

    sagaActorInstance.send({ type: "START_SAGA", userData });
  }

  render() {
    return html`
      <style>
        .saga-container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .saga-header { text-align: center; margin-bottom: 20px; }
        .status-idle { color: #666; }
        .status-running { color: #2196f3; }
        .status-completed { color: #4caf50; }
        .status-failed { color: #f44336; }
        .step-list { margin: 20px 0; }
        .step-item { display: flex; align-items: center; margin: 8px 0; padding: 8px; border-radius: 4px; }
        .step-completed { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .step-current { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .step-pending { background: #f5f5f5; border-left: 4px solid #ccc; }
        .step-icon { margin-right: 12px; font-size: 1.2em; }
        .error-message { color: #f44336; background: #ffebee; padding: 12px; border-radius: 4px; margin: 12px 0; }
        .user-form { margin: 20px 0; padding: 16px; background: #f9f9f9; border-radius: 4px; }
        input { display: block; width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .start-btn { background: #2196f3; color: white; }
        .start-btn:hover { background: #1976d2; }
        .start-btn:disabled { background: #ccc; cursor: not-allowed; }
      </style>

      <div class="saga-container">
        <div class="saga-header">
          <h2>Complete User Onboarding Saga</h2>
          <div class="status-${this.sagaStatus}">
            Status: ${this.sagaStatus.toUpperCase()}
          </div>
        </div>

        ${this.sagaStatus === 'idle' ? html`
          <div class="user-form">
            <h3>Start User Onboarding</h3>
            <input type="text" placeholder="User Name" id="userName" />
            <input type="email" placeholder="Email Address" id="userEmail" />
            <button
              class="start-btn"
              @click=${() => {
                const name = (this.shadowRoot?.getElementById('userName') as HTMLInputElement)?.value;
                const email = (this.shadowRoot?.getElementById('userEmail') as HTMLInputElement)?.value;
                if (name && email) {
                  this.startSaga({ name, email });
                }
              }}
            >
              Start Onboarding Saga
            </button>
          </div>
        ` : html`
          <div class="step-list">
            ${this.renderStep('user-creation', '👤 User Creation', 'Create user account')}
            ${this.renderStep('email-verification', '📧 Email Verification', 'Send verification email')}
            ${this.renderStep('welcome-notification', '🔔 Welcome Notification', 'Send welcome notification')}
            ${this.renderStep('welcome-message', '💌 Welcome Message', 'Send personalized message')}
          </div>

          ${this.errorMessage ? html`
            <div class="error-message">
              <strong>Error:</strong> ${this.errorMessage}
            </div>
          ` : ''}
        `}
      </div>
    `;
  }

  renderStep(stepId: string, icon: string, description: string) {
    const isCompleted = this.completedSteps.includes(stepId);
    const isCurrent = this.currentStep === stepId;
    const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';

    return html`
      <div class="step-item step-${statusClass}">
        <span class="step-icon">${icon}</span>
        <div>
          <strong>${description}</strong>
          <div style="font-size: 0.9em; color: #666;">
            ${isCompleted ? '✅ Completed' : isCurrent ? '🔄 In Progress' : '⏳ Pending'}
          </div>
        </div>
      </div>
    `;
  }
}

//================================================================
// 4. Saga Public Interface
//================================================================

export const completeUserOnboardingSagaProcess = {
  machine: completeUserOnboardingSaga,

  /**
   * Bootstrap the saga orchestrator into a container element
   */
  bootstrap: (container: HTMLElement) => {
    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create and append the saga orchestrator
    const orchestrator = document.createElement('saga-orchestrator');
    container.appendChild(orchestrator);

    return orchestrator;
  },

  /**
   * Get BPMN-compatible representation of the saga
   */
  toBpmnJson: () => {
    const definition = completeUserOnboardingSaga.definition;
    const nodes = Object.entries(definition.states).map(([id, stateNode]) => ({
      id,
      type: stateNode.invoke ? 'serviceTask' : 'userTask',
      description: stateNode.meta?.description,
      compensatable: stateNode.meta?.compensatable,
    }));

    return {
      id: definition.id,
      type: 'saga',
      nodes,
      description: 'Complete user onboarding saga orchestrating multiple business processes'
    };
  }
};

// Register components
void SagaOrchestrator;
