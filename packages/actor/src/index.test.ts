import { describe, it, expect } from 'vitest'
import { createActorSystem, ServiceTaskActor, ProcessSupervisorActor } from './index'

describe('ActorSystem', () => {
  it('should create actor system', () => {
    const system = createActorSystem()
    expect(system).toBeDefined()
  })

  it('should spawn actors', async () => {
    const system = createActorSystem()
    const actorRef = await system.spawn(ServiceTaskActor.behavior('process-1', 'task-1'), 'test-actor')
    expect(actorRef).toBeDefined()
    expect(actorRef.address).toBe('test-actor')
  })

  it('should send messages to actors', async () => {
    const system = createActorSystem()
    const actorRef = await system.spawn(ServiceTaskActor.behavior('process-1', 'task-1'), 'test-actor')

    // Send execute message
    await actorRef.send({ id: '1', type: 'execute', payload: {} })
    expect(actorRef).toBeDefined()
  })
})

describe('ServiceTaskActor', () => {
  it('should create service task behavior', () => {
    const behavior = ServiceTaskActor.behavior('process-1', 'task-1')
    expect(behavior).toBeDefined()
    expect(behavior.initialState.processId).toBe('process-1')
    expect(behavior.initialState.taskId).toBe('task-1')
  })
})

describe('ProcessSupervisorActor', () => {
  it('should create supervisor behavior', () => {
    const behavior = ProcessSupervisorActor.behavior('process-1')
    expect(behavior).toBeDefined()
    expect(behavior.initialState.processId).toBe('process-1')
    expect(behavior.initialState.status).toBe('running')
  })
})
