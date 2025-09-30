// SSE (Server-Sent Events) Manager for Real-time Communication
// Merkle DAG: realtime-sse-manager
// Provides HTTP-based server-to-client streaming for real-time updates

import { Effect } from "effect"
import { IncomingMessage, ServerResponse } from "http"
import { RealtimeMessage, RealtimeError } from "./types"

// SSE Client Manager (for client-side usage)
export class SSEManager {
  // Merkle DAG: sse-manager-client

  private eventSource: EventSource | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageHandlers = new Map<string, (data: any) => void>()
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected'

  constructor(
    private url: string,
    private options: {
      withCredentials?: boolean
      reconnectInterval?: number
      maxReconnectAttempts?: number
      headers?: Record<string, string>
    } = {}
  ) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...options
    }
  }

  // Connect to SSE endpoint
  connect(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.connectionState === 'connected') {
        return // Already connected
      }

      this.connectionState = 'connecting'

      try {
        // Build URL with headers as query parameters if needed
        let connectUrl = this.url
        if (this.options.headers) {
          const params = new URLSearchParams()
          for (const [key, value] of Object.entries(this.options.headers)) {
            params.append(key, value)
          }
          connectUrl += (connectUrl.includes('?') ? '&' : '?') + params.toString()
        }

        this.eventSource = new EventSource(connectUrl, {
          withCredentials: this.options.withCredentials
        })

        yield* Effect.async<void>((resume) => {
          if (!this.eventSource) return

          this.eventSource.onopen = () => {
            this.connectionState = 'connected'
            console.log('SSE connected to:', connectUrl)
            resume(Effect.succeed(undefined))
          }

          this.eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              this.handleMessage('message', data)
            } catch (error) {
              console.error('Failed to parse SSE message:', error)
            }
          }

          this.eventSource.onerror = (error) => {
            this.connectionState = 'error'
            console.error('SSE error:', error)

            // Attempt reconnection
            this.scheduleReconnect()
          }

          // Handle custom event types
          this.eventSource.addEventListener('event', (event: any) => {
            try {
              const data = JSON.parse(event.data)
              this.handleMessage('event', data)
            } catch (error) {
              console.error('Failed to parse SSE event:', error)
            }
          })

          this.eventSource.addEventListener('sync_response', (event: any) => {
            try {
              const data = JSON.parse(event.data)
              this.handleMessage('sync_response', data)
            } catch (error) {
              console.error('Failed to parse SSE sync_response:', error)
            }
          })

          this.eventSource.addEventListener('presence', (event: any) => {
            try {
              const data = JSON.parse(event.data)
              this.handleMessage('presence', data)
            } catch (error) {
              console.error('Failed to parse SSE presence:', error)
            }
          })
        })

      } catch (error) {
        this.connectionState = 'error'
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to connect SSE: ${error instanceof Error ? error.message : String(error)}`,
            'SSE_CONNECT_FAILED',
            { url: this.url, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Disconnect from SSE
  disconnect(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      this.connectionState = 'disconnected'
    })
  }

  // Get connection state
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionState
  }

  // Register message handler
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler)
  }

  // Remove message handler
  offMessage(type: string): void {
    this.messageHandlers.delete(type)
  }

  // Private methods
  private handleMessage(type: string, data: any): void {
    const handler = this.messageHandlers.get(type)
    if (handler) {
      try {
        handler(data)
      } catch (error) {
        console.error(`SSE message handler error for type ${type}:`, error)
      }
    }

    // Also trigger generic message handler
    const genericHandler = this.messageHandlers.get('message')
    if (genericHandler && type !== 'message') {
      try {
        genericHandler(data)
      } catch (error) {
        console.error('SSE generic message handler error:', error)
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.connectionState !== 'connected') {
        console.log('Attempting SSE reconnection...')
        this.connect().pipe(
          Effect.runCallback((result) => {
            if (result._tag === 'Failure') {
              console.error('SSE reconnection failed:', result.cause)
              // Schedule another attempt if we still have attempts left
              this.scheduleReconnect()
            }
          })
        )
      }
    }, this.options.reconnectInterval)
  }
}

// SSE Server Manager (for server-side usage)
export class SSEServer {
  // Merkle DAG: sse-server

  private connections = new Map<string, ServerResponse>()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private heartbeatIntervalMs = 30000 // 30 seconds

  constructor(private options: { heartbeatInterval?: number } = {}) {
    this.heartbeatIntervalMs = options.heartbeatInterval ?? this.heartbeatIntervalMs
  }

  // Handle SSE connection request
  handleConnection(
    req: IncomingMessage,
    res: ServerResponse,
    clientId?: string
  ): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // Generate client ID if not provided
      const connectionId = clientId || this.generateClientId()

      // Store connection
      this.connections.set(connectionId, res)

      // Send initial connection event
      this.sendToConnection(connectionId, {
        type: 'connection',
        payload: { clientId: connectionId, timestamp: new Date() }
      })

      // Handle client disconnect
      req.on('close', () => {
        this.connections.delete(connectionId)
        console.log(`SSE client disconnected: ${connectionId}`)
      })

      // Start heartbeat if not already running
      if (!this.heartbeatInterval) {
        this.startHeartbeat()
      }

      console.log(`SSE client connected: ${connectionId}`)
      return connectionId
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Send message to specific client
  sendToClient(clientId: string, message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const res = this.connections.get(clientId)
      if (!res) {
        return yield* Effect.fail(
          new RealtimeError(
            `SSE client ${clientId} not found`,
            'CLIENT_NOT_FOUND',
            { clientId }
          )
        )
      }

      this.sendToConnection(clientId, message)
    })
  }

  // Broadcast message to all connected clients
  broadcast(message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const messageString = this.formatSSEMessage(message)

      for (const [clientId, res] of this.connections) {
        try {
          if (!res.destroyed) {
            res.write(messageString)
          } else {
            this.connections.delete(clientId)
          }
        } catch (error) {
          console.error(`Failed to send SSE to client ${clientId}:`, error)
          this.connections.delete(clientId)
        }
      }
    })
  }

  // Broadcast to clients subscribed to specific actor/channel
  broadcastToActor(actorId: string, message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    // In a real implementation, you'd maintain subscription mappings
    // For now, broadcast to all (same as broadcast)
    return this.broadcast(message)
  }

  // Get connection count
  getConnectionCount(): number {
    return this.connections.size
  }

  // Get connected client IDs
  getConnectedClients(): string[] {
    return Array.from(this.connections.keys())
  }

  // Disconnect specific client
  disconnectClient(clientId: string): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const res = this.connections.get(clientId)
      if (res && !res.destroyed) {
        res.end()
      }
      this.connections.delete(clientId)
    })
  }

  // Shutdown server
  shutdown(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }

      for (const [clientId, res] of this.connections) {
        try {
          if (!res.destroyed) {
            res.end()
          }
        } catch (error) {
          console.error(`Error closing SSE connection ${clientId}:`, error)
        }
      }

      this.connections.clear()
    })
  }

  // Private methods
  private sendToConnection(clientId: string, message: RealtimeMessage): void {
    const res = this.connections.get(clientId)
    if (!res || res.destroyed) return

    try {
      const messageString = this.formatSSEMessage(message)
      res.write(messageString)
    } catch (error) {
      console.error(`Failed to send SSE message to ${clientId}:`, error)
      this.connections.delete(clientId)
    }
  }

  private formatSSEMessage(message: RealtimeMessage): string {
    const data = JSON.stringify(message)
    return `event: ${message.type}\ndata: ${data}\n\n`
  }

  private generateClientId(): string {
    return `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        payload: { timestamp: new Date() }
      }).pipe(
        Effect.runCallback((result) => {
          if (result._tag === 'Failure') {
            console.error('SSE heartbeat failed:', result.cause)
          }
        })
      )
    }, this.heartbeatIntervalMs)
  }
}

// SSE Transport for RealtimeService
export class SSETransport {
  // Merkle DAG: sse-transport

  constructor(
    private sseServer: SSEServer,
    private baseUrl: string = '/sse'
  ) {}

  // Get SSE endpoint URL for client
  getEndpointUrl(actorId?: string): string {
    const url = new URL(this.baseUrl, 'http://localhost') // Base URL for construction
    if (actorId) {
      url.searchParams.set('actorId', actorId)
    }
    return url.pathname + url.search
  }

  // Broadcast via SSE
  broadcast(message: RealtimeMessage, actorId?: string): Effect.Effect<void, RealtimeError> {
    if (actorId) {
      return this.sseServer.broadcastToActor(actorId, message)
    } else {
      return this.sseServer.broadcast(message)
    }
  }

  // Send to specific client
  sendToClient(clientId: string, message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    return this.sseServer.sendToClient(clientId, message)
  }

  // Get connection info
  getConnectionInfo(): { count: number; clients: string[] } {
    return {
      count: this.sseServer.getConnectionCount(),
      clients: this.sseServer.getConnectedClients()
    }
  }
}

// Factory functions
export function createSSEManager(
  url: string,
  options?: {
    withCredentials?: boolean
    reconnectInterval?: number
    maxReconnectAttempts?: number
    headers?: Record<string, string>
  }
): SSEManager {
  return new SSEManager(url, options)
}

export function createSSEServer(options?: { heartbeatInterval?: number }): SSEServer {
  return new SSEServer(options)
}

export function createSSETransport(
  sseServer: SSEServer,
  baseUrl?: string
): SSETransport {
  return new SSETransport(sseServer, baseUrl)
}
