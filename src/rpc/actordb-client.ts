// ActorDB RPC Client
// Merkle DAG: rpc-node -> actordb-client

import { DomainEvent, BusinessEntity } from "@/domain/types"

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
