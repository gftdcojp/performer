// Merkle DAG: data_core -> neogma_models -> cypher_queries -> transaction_mgmt
// Effect-cypher + neogma adapter for type-safe Cypher/Tx utilities/constraints

import { Neogma, ModelFactory } from 'neogma'
import * as neo4j from 'neo4j-driver'
import { dataErrorFactory, withErrorHandling, ErrorCodes } from '@pkg/error-handling'

// Neo4j connection configuration
export interface Neo4jConfig {
  uri: string
  username: string
  password: string
  database?: string
}

// Initialize Neogma instance
export class Neo4jConnection {
  private neogma: Neogma
  private driver: neo4j.Driver
  private config: Neo4jConfig

  constructor(config: Neo4jConfig) {
    this.config = config
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      { disableLosslessIntegers: true }
    )

    this.neogma = new Neogma({
      url: config.uri,
      username: config.username,
      password: config.password,
      database: config.database
    }, {
      logger: console.log
    })
  }

  getNeogma(): Neogma {
    return this.neogma
  }

  getDriver(): neo4j.Driver {
    return this.driver
  }

  async close(): Promise<void> {
    await this.driver.close()
  }

  async verifyConnection(): Promise<void> {
    return withErrorHandling(async () => {
      const session = this.driver.session()
      try {
        await session.run('RETURN 1')
      } catch (error) {
        throw dataErrorFactory.databaseError('verifyConnection', error as Error, {
          suggestedAction: 'Check Neo4j connection parameters and server status',
          metadata: { config: { uri: this.config.uri, database: this.config.database } }
        })
      } finally {
        await session.close()
      }
    }, dataErrorFactory, 'verifyConnection')
  }
}

// Base model with common fields
export interface BaseNode {
  id: string
  createdAt: Date
  updatedAt: Date
}

// BPMN Process Instance Model
export interface ProcessInstanceNode extends BaseNode {
  processId: string
  businessKey: string
  status: 'running' | 'completed' | 'suspended' | 'terminated'
  variables: Record<string, any>
  startTime: Date
  endTime?: Date
}

// Note: ModelFactory usage simplified for basic operations
// In production, use proper neogma model definitions
export type ProcessInstanceModel = ProcessInstanceNode

// Task Model
export interface TaskNode extends BaseNode {
  taskId: string
  name: string
  type: 'user' | 'service' | 'send' | 'receive' | 'manual' | 'businessRule'
  assignee?: string
  status: 'created' | 'assigned' | 'completed' | 'failed'
  dueDate?: Date
  priority?: number
  variables: Record<string, any>
}

// Note: ModelFactory usage simplified for basic operations
export type TaskModel = TaskNode

// User Model
export interface UserNode extends BaseNode {
  userId: string
  email: string
  roles: string[]
  tenantId: string
}

// Note: ModelFactory usage simplified for basic operations
export type UserModel = UserNode

// Transaction Manager
export class TransactionManager {
  constructor(private connection: Neo4jConnection) {}

  async executeInTransaction<T>(
    operation: (tx: neo4j.ManagedTransaction) => Promise<T>
  ): Promise<T> {
    const session = this.connection.getDriver().session()

    try {
      const result = await session.executeWrite(operation)
      return result
    } finally {
      await session.close()
    }
  }

  async executeQuery(cypher: string, params: Record<string, any> = {}): Promise<any[]> {
    const session = this.connection.getDriver().session()
    try {
      const result = await session.run(cypher, params)
      return result.records.map(record => record.toObject())
    } finally {
      await session.close()
    }
  }
}

// Repository base class
export abstract class BaseRepository<T extends BaseNode> {
  constructor(
    protected connection: Neo4jConnection,
    protected txManager: TransactionManager
  ) {}

  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract update(id: string, data: Partial<T>): Promise<T>
  abstract delete(id: string): Promise<void>
}

// Process Instance Repository
export class ProcessInstanceRepository extends BaseRepository<ProcessInstanceNode> {
  async create(data: Omit<ProcessInstanceNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProcessInstanceNode> {
    const id = `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const instance: ProcessInstanceNode = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    }

    await this.txManager.executeQuery(`
      CREATE (p:ProcessInstance {
        id: $id,
        processId: $processId,
        businessKey: $businessKey,
        status: $status,
        variables: $variables,
        startTime: datetime($startTime),
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
    `, {
      id,
      processId: data.processId,
      businessKey: data.businessKey,
      status: data.status,
      variables: JSON.stringify(data.variables),
      startTime: data.startTime.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    })

    return instance
  }

  async findById(id: string): Promise<ProcessInstanceNode | null> {
    const results = await this.txManager.executeQuery(`
      MATCH (p:ProcessInstance {id: $id})
      RETURN p
    `, { id })

    if (results.length === 0) return null

    const record = results[0].p.properties
    return {
      id: record.id,
      processId: record.processId,
      businessKey: record.businessKey,
      status: record.status,
      variables: JSON.parse(record.variables),
      startTime: new Date(record.startTime),
      endTime: record.endTime ? new Date(record.endTime) : undefined,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    }
  }

  async findByBusinessKey(businessKey: string): Promise<ProcessInstanceNode | null> {
    const results = await this.txManager.executeQuery(`
      MATCH (p:ProcessInstance {businessKey: $businessKey})
      RETURN p
    `, { businessKey })

    if (results.length === 0) return null

    const record = results[0].p.properties
    return {
      id: record.id,
      processId: record.processId,
      businessKey: record.businessKey,
      status: record.status,
      variables: JSON.parse(record.variables),
      startTime: new Date(record.startTime),
      endTime: record.endTime ? new Date(record.endTime) : undefined,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    }
  }

  async update(id: string, data: Partial<ProcessInstanceNode>): Promise<ProcessInstanceNode> {
    const updates: string[] = []
    const params: Record<string, any> = { id }

    if (data.status !== undefined) {
      updates.push('p.status = $status')
      params.status = data.status
    }

    if (data.variables !== undefined) {
      updates.push('p.variables = $variables')
      params.variables = JSON.stringify(data.variables)
    }

    if (data.endTime !== undefined) {
      updates.push('p.endTime = datetime($endTime)')
      params.endTime = data.endTime.toISOString()
    }

    updates.push('p.updatedAt = datetime($updatedAt)')
    params.updatedAt = new Date().toISOString()

    await this.txManager.executeQuery(`
      MATCH (p:ProcessInstance {id: $id})
      SET ${updates.join(', ')}
    `, params)

    const updated = await this.findById(id)
    if (!updated) throw new Error(`Process instance ${id} not found after update`)
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.txManager.executeQuery(`
      MATCH (p:ProcessInstance {id: $id})
      DETACH DELETE p
    `, { id })
  }
}

// Constraint and Index Management
export class SchemaManager {
  constructor(private connection: Neo4jConnection) {}

  async createConstraints(): Promise<void> {
    const session = this.connection.getDriver().session()

    try {
      // Unique constraints
      await session.run('CREATE CONSTRAINT process_instance_id_unique IF NOT EXISTS FOR (p:ProcessInstance) REQUIRE p.id IS UNIQUE')
      await session.run('CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE')
      await session.run('CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE')

      // Indexes
      await session.run('CREATE INDEX process_instance_business_key IF NOT EXISTS FOR (p:ProcessInstance) ON (p.businessKey)')
      await session.run('CREATE INDEX task_assignee IF NOT EXISTS FOR (t:Task) ON (t.assignee)')
      await session.run('CREATE INDEX user_tenant IF NOT EXISTS FOR (u:User) ON (u.tenantId)')
    } finally {
      await session.close()
    }
  }

  async dropConstraints(): Promise<void> {
    const session = this.connection.getDriver().session()

    try {
      await session.run('DROP CONSTRAINT process_instance_id_unique IF EXISTS')
      await session.run('DROP CONSTRAINT task_id_unique IF EXISTS')
      await session.run('DROP CONSTRAINT user_id_unique IF EXISTS')

      await session.run('DROP INDEX process_instance_business_key IF EXISTS')
      await session.run('DROP INDEX task_assignee IF EXISTS')
      await session.run('DROP INDEX user_tenant IF EXISTS')
    } finally {
      await session.close()
    }
  }
}

// Factory functions
export function createNeo4jConnection(config: Neo4jConfig): Neo4jConnection {
  return new Neo4jConnection(config)
}

export function createTransactionManager(connection: Neo4jConnection): TransactionManager {
  return new TransactionManager(connection)
}

export function createProcessInstanceRepository(connection: Neo4jConnection, txManager: TransactionManager): ProcessInstanceRepository {
  return new ProcessInstanceRepository(connection, txManager)
}

export function createSchemaManager(connection: Neo4jConnection): SchemaManager {
  return new SchemaManager(connection)
}

// Utility query functions
export const q = {
  matchNode: (alias: string, label: string, properties: Record<string, any>) => ({
    ret: (...fields: string[]) => ({
      one: async (connection: Neo4jConnection): Promise<any> => {
        const txManager = createTransactionManager(connection)
        const conditions = Object.keys(properties).map(key => `${alias}.${key} = $${key}`).join(' AND ')
        const params = properties

        const results = await txManager.executeQuery(`
          MATCH (${alias}:${label}) WHERE ${conditions}
          RETURN ${fields.map(f => `${alias}.${f}`).join(', ')}
        `, params)

        return results[0] || null
      }
    })
  })
}
