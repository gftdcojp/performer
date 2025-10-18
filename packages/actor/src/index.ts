// Merkle DAG: actor_core -> effect_actor -> bpmn_integration -> supervision
// Effect-based actor system integration for BPMN service tasks, supervision, and coordination

export interface ActorMessage {
  id: string
  type: string
  payload: any
  correlationId?: string
  replyTo?: string
}

export interface ActorRef {
  send: (message: ActorMessage) => Promise<void>
  address: string
}

// Simplified actor behavior for BPMN integration
export interface ActorBehavior<S> {
  initialState: S
  receive: (state: S, message: ActorMessage) => Promise<readonly [S, readonly ActorEffect[]]>
}

export type ActorEffect =
  | { type: 'send'; to: ActorRef; message: ActorMessage }
  | { type: 'schedule'; delay: number; message: ActorMessage }
  | { type: 'stop' }

// BPMN Service Task Actor
export class ServiceTaskActor {
  static behavior(processId: string, taskId: string): ActorBehavior<ServiceTaskState> {
    return {
      initialState: {
        processId,
        taskId,
        status: 'idle',
        retryCount: 0
      },
      receive: async (state, message) => {
        switch (message.type) {
          case 'execute':
            return [
              { ...state, status: 'running' },
              state.supervisor ? [{ type: 'send', to: state.supervisor, message: { id: '1', type: 'task_started', payload: { processId, taskId } } }] : []
            ]

          case 'complete':
            return [
              { ...state, status: 'completed' },
              [{ type: 'send', to: state.supervisor!, message: { id: '1', type: 'task_completed', payload: { processId, taskId, result: message.payload } } }]
            ]

          case 'fail':
            const newRetryCount = state.retryCount + 1
            if (newRetryCount < 3) {
              return [
                { ...state, retryCount: newRetryCount },
                [
                  { type: 'schedule', delay: 1000 * newRetryCount, message: { id: '1', type: 'retry', payload: message.payload } },
                  { type: 'send', to: state.supervisor!, message: { id: '1', type: 'task_failed', payload: { processId, taskId, error: message.payload, retryCount: newRetryCount } } }
                ]
              ]
            } else {
              return [
                { ...state, status: 'failed' },
                [{ type: 'send', to: state.supervisor!, message: { id: '1', type: 'task_failed_final', payload: { processId, taskId, error: message.payload } } }]
              ]
            }

          default:
            return [state, []]
        }
      }
    }
  }
}

interface ServiceTaskState {
  processId: string
  taskId: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  retryCount: number
  supervisor?: ActorRef
}

// Supervisor Actor for BPMN Process Instances
export class ProcessSupervisorActor {
  static behavior(processId: string): ActorBehavior<ProcessSupervisorState> {
    return {
      initialState: {
        processId,
        status: 'running',
        activeTasks: new Set(),
        completedTasks: new Set(),
        failedTasks: new Set()
      },
      receive: async (state, message) => {
        switch (message.type) {
          case 'task_started':
            return [
              {
                ...state,
                activeTasks: new Set([...state.activeTasks, message.payload.taskId])
              },
              []
            ]

          case 'task_completed':
            const newCompletedTasks = new Set([...state.completedTasks, message.payload.taskId])
            const newActiveTasks = new Set(state.activeTasks)
            newActiveTasks.delete(message.payload.taskId)

            return [
              {
                ...state,
                activeTasks: newActiveTasks,
                completedTasks: newCompletedTasks
              },
              [
                { type: 'send', to: state.processEngine!, message: { id: '1', type: 'task_completed', payload: message.payload } }
              ]
            ]

          case 'task_failed':
            const newFailedTasks = new Set([...state.failedTasks, message.payload.taskId])
            const newActiveTasks2 = new Set(state.activeTasks)
            newActiveTasks2.delete(message.payload.taskId)

            return [
              {
                ...state,
                activeTasks: newActiveTasks2,
                failedTasks: newFailedTasks
              },
              [
                { type: 'send', to: state.processEngine!, message: { id: '1', type: 'task_failed', payload: message.payload } }
              ]
            ]

          case 'shutdown':
            return [
              { ...state, status: 'terminated' },
              [{ type: 'stop' }]
            ]

          default:
            return [state, []]
        }
      }
    }
  }
}

interface ProcessSupervisorState {
  processId: string
  status: 'running' | 'terminated'
  activeTasks: Set<string>
  completedTasks: Set<string>
  failedTasks: Set<string>
  processEngine?: ActorRef
}

// Simplified Actor System Implementation
export class EffectActorSystem {
  private actors = new Map<string, ActorRef>()
  private timeouts = new Map<string, NodeJS.Timeout>()

  spawn<S>(behavior: ActorBehavior<S>, name: string): Promise<ActorRef> {
    const mailbox: ActorMessage[] = []

    const actorRef: ActorRef = {
      address: name,
      send: async (message) => {
        mailbox.push(message)
        await processMailbox()
      }
    }

    let currentState = behavior.initialState

    const processMailbox = async (): Promise<void> => {
      while (mailbox.length > 0) {
        const message = mailbox.shift()!
        const [newState, effects] = await behavior.receive(currentState, message)

        currentState = newState

        for (const effect of effects) {
          switch (effect.type) {
            case 'send':
              await effect.to.send(effect.message)
              break
            case 'schedule':
              const timeoutId = setTimeout(() => {
                mailbox.push(effect.message)
                processMailbox()
              }, effect.delay)
              this.timeouts.set(`${name}-${message.id}`, timeoutId)
              break
            case 'stop':
              return
          }
        }
      }
    }

    this.actors.set(name, actorRef)
    return Promise.resolve(actorRef)
  }

  get(name: string): Promise<ActorRef> {
    const actor = this.actors.get(name)
    if (!actor) {
      throw new Error(`Actor ${name} not found`)
    }
    return Promise.resolve(actor)
  }

  shutdown(): Promise<void> {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout)
    }
    this.actors.clear()
    this.timeouts.clear()
    return Promise.resolve()
  }
}

// BPMN Integration
export class BPMNActorBridge {
  private system: EffectActorSystem

  constructor(system: EffectActorSystem) {
    this.system = system
  }

  async executeServiceTask(processId: string, taskId: string, serviceFn: () => Promise<any>): Promise<void> {
    try {
      const supervisor = await this.system.get(`supervisor-${processId}`)
      const taskActor = await this.system.spawn(ServiceTaskActor.behavior(processId, taskId), `task-${taskId}`)

      // Execute task
      await taskActor.send({ id: '1', type: 'execute', payload: {} })

      const result = await serviceFn()
      await taskActor.send({ id: '1', type: 'complete', payload: result })
    } catch (error) {
      const taskActor = await this.system.get(`task-${taskId}`)
      await taskActor.send({ id: '1', type: 'fail', payload: error })
    }
  }

  async startProcess(processId: string): Promise<void> {
    const supervisor = await this.system.spawn(ProcessSupervisorActor.behavior(processId), `supervisor-${processId}`)
    await supervisor.send({ id: '1', type: 'start', payload: {} })
  }
}

// Factory functions
export const createActorSystem = (): EffectActorSystem => new EffectActorSystem()

export const createBPMNBridge = (system: EffectActorSystem): BPMNActorBridge => new BPMNActorBridge(system)
