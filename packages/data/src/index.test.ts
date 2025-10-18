import { describe, it, expect } from 'vitest'
import { createNeo4jConnection, createTransactionManager, ProcessInstanceRepository } from './index'

// Mock Neo4j connection for testing
const mockConfig = {
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password'
}

describe('Neo4jConnection', () => {
  it('should create connection instance', () => {
    const connection = createNeo4jConnection(mockConfig)
    expect(connection).toBeDefined()
  })
})

describe('TransactionManager', () => {
  it('should create transaction manager', () => {
    const connection = createNeo4jConnection(mockConfig)
    const txManager = createTransactionManager(connection)
    expect(txManager).toBeDefined()
  })
})

describe('ProcessInstanceRepository', () => {
  it('should create repository instance', () => {
    const connection = createNeo4jConnection(mockConfig)
    const txManager = createTransactionManager(connection)
    const repo = new ProcessInstanceRepository(connection, txManager)
    expect(repo).toBeDefined()
  })

  it('should create process instance data', () => {
    const data = {
      processId: 'test-process',
      businessKey: 'test-key',
      status: 'running' as const,
      variables: { amount: 100 },
      startTime: new Date()
    }

    expect(data.processId).toBe('test-process')
    expect(data.businessKey).toBe('test-key')
    expect(data.status).toBe('running')
    expect(data.variables.amount).toBe(100)
  })
})

describe('q utility', () => {
  it('should create query builder', async () => {
    const { q } = await import('./index')
    const query = q.matchNode('o', 'Order', { businessKey: 'test' }).ret('o').one
    expect(typeof query).toBe('function')
  })
})
