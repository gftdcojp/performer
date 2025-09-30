// ActorDB RPC Client
// Merkle DAG: rpc-node -> actordb-client

import { config } from "dotenv"
import { DomainEvent, BusinessEntity } from "@/domain/types"
import { createClient, type Client } from "@libsql/client"

// Load environment variables
config()

// RPC Configuration
export interface RPCConfig {
  readonly host: string
  readonly port: number
  readonly secure: boolean
  readonly token?: string
  readonly timeout: number
}

// RPC Request/Response Types
export interface RPCRequest {
  readonly method: string
  readonly params: Record<string, unknown>
  readonly id: string
  readonly timestamp: Date
}

export interface RPCResponse<T = unknown> {
  readonly id: string
  readonly result?: T
  readonly error?: {
    code: number
    message: string
    data?: unknown
  }
  readonly timestamp: Date
}

// ActorDB API Methods
export interface ActorDBAPI {
  // Event Sourcing
  writeEvent(event: DomainEvent): Promise<void>
  readEvents(entityId: string): Promise<readonly DomainEvent[]>
  readEventsByType(eventType: string): Promise<readonly DomainEvent[]>

  // Projections
  createProjection(name: string, events: readonly DomainEvent[]): Promise<Record<string, unknown>>
  getProjection(name: string): Promise<Record<string, unknown>>
  updateProjection(name: string, updates: Record<string, unknown>): Promise<void>

  // Actors
  createActor(actorType: string, config: Record<string, unknown>): Promise<string>
  getActorState(actorId: string): Promise<Record<string, unknown>>
  sendActorMessage(actorId: string, message: Record<string, unknown>): Promise<unknown>

  // Queries
  executeQuery(query: string, params: Record<string, unknown>): Promise<unknown[]>
  createQuery(name: string, definition: Record<string, unknown>): Promise<void>
}

// Environment-based ActorDB Client Factory
export class ActorDBClientFactory {
  static createClient(): ActorDBAPI {
    const dbMode = process.env.PERFORMER_DB_MODE || 'local'

    if (dbMode === 'local') {
      // Local libSQL for development
      const dbUrl = process.env.PERFORMER_DB_URL || 'file:performer.db'
      const authToken = process.env.PERFORMER_DB_AUTH_TOKEN
      return new ActorDBLocalClient(dbUrl, authToken)
    } else if (dbMode === 'http') {
      // HTTP-based ActorDB server (dekigoto)
      const config: RPCConfig = {
        host: process.env.PERFORMER_DB_HOST || 'localhost',
        port: parseInt(process.env.PERFORMER_DB_PORT || '9090'),
        secure: process.env.PERFORMER_DB_SECURE === 'true',
        token: process.env.PERFORMER_DB_TOKEN,
        timeout: parseInt(process.env.PERFORMER_DB_TIMEOUT || '5000')
      }
      return new ActorDBHttpClient(config)
    } else if (dbMode === 'websocket') {
      // WebSocket-based ActorDB server
      const config: RPCConfig = {
        host: process.env.PERFORMER_DB_HOST || 'localhost',
        port: parseInt(process.env.PERFORMER_DB_PORT || '9090'),
        secure: process.env.PERFORMER_DB_SECURE === 'true',
        token: process.env.PERFORMER_DB_TOKEN,
        timeout: parseInt(process.env.PERFORMER_DB_TIMEOUT || '5000')
      }
      const client = new ActorDBWebSocketClient(config)
      // Note: WebSocket client needs to be connected before use
      return client
    } else {
      throw new Error(`Unknown PERFORMER_DB_MODE: ${dbMode}. Supported modes: local, http, websocket`)
    }
  }
}

// HTTP-based RPC Client
export class ActorDBHttpClient implements ActorDBAPI {
  // Merkle DAG: http-client
  private config: RPCConfig
  private baseUrl: string

  constructor(config: RPCConfig) {
    this.config = config
    this.baseUrl = `${config.secure ? 'https' : 'http'}://${config.host}:${config.port}/api/v1`
  }

  private async makeRequest<T>(
    method: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const request: RPCRequest = {
      method,
      params,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rpcResponse: RPCResponse<T> = await response.json()

      if (rpcResponse.error) {
        throw new Error(`RPC Error ${rpcResponse.error.code}: ${rpcResponse.error.message}`)
      }

      return rpcResponse.result as T
    } catch (error) {
      throw new Error(`RPC request failed: ${error}`)
    }
  }

  async writeEvent(event: DomainEvent): Promise<void> {
    await this.makeRequest('events.write', {
      entityId: event.entityId,
      eventType: event.eventType,
      payload: event.payload,
      timestamp: event.timestamp.toISOString(),
      version: event.version,
    })
  }

  async readEvents(entityId: string): Promise<readonly DomainEvent[]> {
    const result = await this.makeRequest<DomainEvent[]>('events.read', { entityId })
    return result.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }

  async readEventsByType(eventType: string): Promise<readonly DomainEvent[]> {
    const result = await this.makeRequest<DomainEvent[]>('events.readByType', { eventType })
    return result.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }

  async createProjection(
    name: string,
    events: readonly DomainEvent[]
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('projections.create', { name, events })
  }

  async getProjection(name: string): Promise<Record<string, unknown>> {
    return this.makeRequest('projections.get', { name })
  }

  async updateProjection(
    name: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    await this.makeRequest('projections.update', { name, updates })
  }

  async createActor(
    actorType: string,
    config: Record<string, unknown>
  ): Promise<string> {
    return this.makeRequest('actors.create', { actorType, config })
  }

  async getActorState(actorId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('actors.getState', { actorId })
  }

  async sendActorMessage(
    actorId: string,
    message: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest('actors.sendMessage', { actorId, message })
  }

  async executeQuery(
    query: string,
    params: Record<string, unknown>
  ): Promise<unknown[]> {
    return this.makeRequest('queries.execute', { query, params })
  }

  async createQuery(
    name: string,
    definition: Record<string, unknown>
  ): Promise<void> {
    await this.makeRequest('queries.create', { name, definition })
  }
}

// WebSocket-based RPC Client for real-time communication
export class ActorDBWebSocketClient implements ActorDBAPI {
  // Merkle DAG: websocket-client
  private config: RPCConfig
  private ws: WebSocket | null = null
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
    timeout: NodeJS.Timeout
  }>()
  private eventListeners = new Map<string, Set<(event: DomainEvent) => void>>()

  constructor(config: RPCConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = this.config.secure ? 'wss' : 'ws'
      this.ws = new WebSocket(`${protocol}://${this.config.host}:${this.config.port}/ws`)

      this.ws.onopen = () => {
        // Send authentication if token provided
        if (this.config.token) {
          this.send({
            type: 'auth',
            token: this.config.token,
          })
        }
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        reject(new Error(`WebSocket connection failed: ${error}`))
      }

      this.ws.onclose = () => {
        this.cleanup()
      }
    })
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      throw new Error('WebSocket not connected')
    }
  }

  private handleMessage(message: any): void {
    if (message.type === 'response' && message.id) {
      const pending = this.pendingRequests.get(message.id)
      if (pending) {
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(message.id)

        if (message.error) {
          pending.reject(new Error(message.error.message || 'RPC Error'))
        } else {
          pending.resolve(message.result)
        }
      }
    } else if (message.type === 'event') {
      // Handle real-time events
      const listeners = this.eventListeners.get(message.eventType) || new Set()
      listeners.forEach(listener => {
        try {
          listener({
            ...message.event,
            timestamp: new Date(message.event.timestamp),
          })
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  private makeWebSocketRequest<T>(
    method: string,
    params: Record<string, unknown>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error('RPC request timeout'))
      }, this.config.timeout)

      this.pendingRequests.set(id, { resolve, reject, timeout })

      this.send({
        type: 'request',
        id,
        method,
        params,
        timestamp: new Date().toISOString(),
      })
    })
  }

  private cleanup(): void {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Connection closed'))
    }
    this.pendingRequests.clear()
    this.eventListeners.clear()
  }

  // Implement ActorDBAPI methods using WebSocket
  async writeEvent(event: DomainEvent): Promise<void> {
    await this.makeWebSocketRequest('events.write', {
      entityId: event.entityId,
      eventType: event.eventType,
      payload: event.payload,
      timestamp: event.timestamp.toISOString(),
      version: event.version,
    })
  }

  async readEvents(entityId: string): Promise<readonly DomainEvent[]> {
    const result = await this.makeWebSocketRequest<DomainEvent[]>('events.read', { entityId })
    return result.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }

  async readEventsByType(eventType: string): Promise<readonly DomainEvent[]> {
    const result = await this.makeWebSocketRequest<DomainEvent[]>('events.readByType', { eventType })
    return result.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }

  async createProjection(
    name: string,
    events: readonly DomainEvent[]
  ): Promise<Record<string, unknown>> {
    return this.makeWebSocketRequest('projections.create', { name, events })
  }

  async getProjection(name: string): Promise<Record<string, unknown>> {
    return this.makeWebSocketRequest('projections.get', { name })
  }

  async updateProjection(
    name: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    await this.makeWebSocketRequest('projections.update', { name, updates })
  }

  async createActor(
    actorType: string,
    config: Record<string, unknown>
  ): Promise<string> {
    return this.makeWebSocketRequest('actors.create', { actorType, config })
  }

  async getActorState(actorId: string): Promise<Record<string, unknown>> {
    return this.makeWebSocketRequest('actors.getState', { actorId })
  }

  async sendActorMessage(
    actorId: string,
    message: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeWebSocketRequest('actors.sendMessage', { actorId, message })
  }

  async executeQuery(
    query: string,
    params: Record<string, unknown>
  ): Promise<unknown[]> {
    return this.makeWebSocketRequest('queries.execute', { query, params })
  }

  async createQuery(
    name: string,
    definition: Record<string, unknown>
  ): Promise<void> {
    await this.makeWebSocketRequest('queries.create', { name, definition })
  }

  // Real-time event subscription
  subscribeToEvents(eventType: string, listener: (event: DomainEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType)
        }
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.cleanup()
  }
}

// Local libSQL-based ActorDB Client for development
export class ActorDBLocalClient implements ActorDBAPI {
  // Merkle DAG: libsql-client -> events-store
  private client: Client

  constructor(url: string, authToken?: string) {
    this.client = createClient({
      url,
      authToken,
    })
    this.initializeSchema()
  }

  private async initializeSchema(): Promise<void> {
    // Create tables for ActorDB-like functionality
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        version INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS projections (
        name TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS actors (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        config TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS queries (
        name TEXT PRIMARY KEY,
        definition TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  async writeEvent(event: DomainEvent): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO events (entity_id, event_type, payload, timestamp, version)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        event.entityId,
        event.eventType,
        JSON.stringify(event.payload),
        event.timestamp.toISOString(),
        event.version
      ]
    })
  }

  async readEvents(entityId: string): Promise<readonly DomainEvent[]> {
    const result = await this.client.execute({
      sql: `SELECT * FROM events WHERE entity_id = ? ORDER BY version ASC`,
      args: [entityId]
    })

    return result.rows.map(row => ({
      entityId: row.entity_id as string,
      eventType: row.event_type as string,
      payload: JSON.parse(row.payload as string),
      timestamp: new Date(row.timestamp as string),
      version: row.version as number
    }))
  }

  async readEventsByType(eventType: string): Promise<readonly DomainEvent[]> {
    const result = await this.client.execute({
      sql: `SELECT * FROM events WHERE event_type = ? ORDER BY timestamp ASC`,
      args: [eventType]
    })

    return result.rows.map(row => ({
      entityId: row.entity_id as string,
      eventType: row.event_type as string,
      payload: JSON.parse(row.payload as string),
      timestamp: new Date(row.timestamp as string),
      version: row.version as number
    }))
  }

  async createProjection(name: string, events: readonly DomainEvent[]): Promise<Record<string, unknown>> {
    // Simple projection: count events by type
    const projection: Record<string, number> = {}
    events.forEach(event => {
      projection[event.eventType] = (projection[event.eventType] || 0) + 1
    })

    await this.client.execute({
      sql: `INSERT OR REPLACE INTO projections (name, data) VALUES (?, ?)`,
      args: [name, JSON.stringify(projection)]
    })

    return projection
  }

  async getProjection(name: string): Promise<Record<string, unknown>> {
    const result = await this.client.execute({
      sql: `SELECT data FROM projections WHERE name = ?`,
      args: [name]
    })

    if (result.rows.length === 0) {
      return {}
    }

    return JSON.parse(result.rows[0].data as string)
  }

  async updateProjection(name: string, updates: Record<string, unknown>): Promise<void> {
    const current = await this.getProjection(name)
    const updated = { ...current, ...updates }

    await this.client.execute({
      sql: `INSERT OR REPLACE INTO projections (name, data) VALUES (?, ?)`,
      args: [name, JSON.stringify(updated)]
    })
  }

  async createActor(actorType: string, config: Record<string, unknown>): Promise<string> {
    const actorId = `actor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await this.client.execute({
      sql: `INSERT INTO actors (id, type, config, state) VALUES (?, ?, ?, ?)`,
      args: [
        actorId,
        actorType,
        JSON.stringify(config),
        JSON.stringify({})
      ]
    })

    return actorId
  }

  async getActorState(actorId: string): Promise<Record<string, unknown>> {
    const result = await this.client.execute({
      sql: `SELECT state FROM actors WHERE id = ?`,
      args: [actorId]
    })

    if (result.rows.length === 0) {
      return {}
    }

    return JSON.parse(result.rows[0].state as string)
  }

  async sendActorMessage(actorId: string, message: Record<string, unknown>): Promise<unknown> {
    const currentState = await this.getActorState(actorId)
    const updatedState = { ...currentState, lastMessage: message, processedAt: new Date() }

    await this.client.execute({
      sql: `UPDATE actors SET state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [JSON.stringify(updatedState), actorId]
    })

    return { acknowledged: true }
  }

  async executeQuery(query: string, params: Record<string, unknown>): Promise<unknown[]> {
    // Simple query simulation for development
    if (query === 'findUsers') {
      const result = await this.client.execute({
        sql: `SELECT entity_id, COUNT(*) as event_count FROM events WHERE entity_id LIKE 'user-%' GROUP BY entity_id`,
        args: []
      })

      return result.rows.map(row => ({
        id: row.entity_id,
        eventCount: row.event_count
      }))
    }

    return []
  }

  async createQuery(name: string, definition: Record<string, unknown>): Promise<void> {
    await this.client.execute({
      sql: `INSERT OR REPLACE INTO queries (name, definition) VALUES (?, ?)`,
      args: [name, JSON.stringify(definition)]
    })
  }

  // Utility methods for local development
  async clear(): Promise<void> {
    await this.client.execute(`DELETE FROM events`)
    await this.client.execute(`DELETE FROM projections`)
    await this.client.execute(`DELETE FROM actors`)
    await this.client.execute(`DELETE FROM queries`)
  }

  async getStats(): Promise<Record<string, number>> {
    const [events, projections, actors, queries] = await Promise.all([
      this.client.execute(`SELECT COUNT(*) as count FROM events`),
      this.client.execute(`SELECT COUNT(*) as count FROM projections`),
      this.client.execute(`SELECT COUNT(*) as count FROM actors`),
      this.client.execute(`SELECT COUNT(*) as count FROM queries`)
    ])

    return {
      events: events.rows[0].count as number,
      projections: projections.rows[0].count as number,
      actors: actors.rows[0].count as number,
      queries: queries.rows[0].count as number
    }
  }
}
