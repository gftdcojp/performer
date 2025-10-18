import { describe, it, expect } from 'vitest'
import { ProcessBuilder, flow, ProcessEngine } from './index'

describe('ProcessBuilder', () => {
  it('should build a simple process', () => {
    const builder = new ProcessBuilder('test-process', 'Test Process')
      .startEvent('start')
      .userTask('task1', 'First Task')
      .endEvent('end')

    const definition = builder.build()
    expect(definition.id).toBe('test-process')
    expect(definition.name).toBe('Test Process')
    expect(definition.xml).toContain('startEvent')
    expect(definition.xml).toContain('userTask')
    expect(definition.xml).toContain('endEvent')
  })
})

// Skip ProcessEngine tests in Node.js environment (requires DOM)
describe.skip('ProcessEngine', () => {
  it('should start a process instance', async () => {
    // This test requires DOM environment
  })

  it('should get tasks for instance', async () => {
    // This test requires DOM environment
  })
})

describe('flow DSL', () => {
  it('should create process definition using DSL', () => {
    const definition = flow('OrderProcess', 'Order Process', (p) => {
      return p
        .startEvent('start')
        .userTask('review', 'Review Order')
        .endEvent('end')
    })

    expect(definition.id).toBe('OrderProcess')
    expect(definition.name).toBe('Order Process')
    expect(definition.xml).toContain('OrderProcess')
  })
})
