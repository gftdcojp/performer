// WebSocket Manager for Real-time Communication
// Merkle DAG: realtime-websocket-manager

import { Effect } from "effect"
import {
  WebSocketManager as WebSocketManagerInterface,
  RealtimeMessage,
  ConnectionState,
  RealtimeError,
  PresenceInfo
} from "./types"

// WebSocket Manager Implementation
export class WebSocketManager implements WebSocketManagerInterface {
  // Merkle DAG: websocket-manager-impl

  private ws: WebSocket | null = null
  private connectionState: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // ms
  private heartbeatInterval: NodeJS.Timeout | null = null
  private heartbeatIntervalMs = 30000 // 30 seconds

  private messageHandlers = new Map<string, (message: RealtimeMessage) => void>()
  private presenceCallbacks = new Set<(info: PresenceInfo) => void>()

  constructor(
    private url: string,
    private options: {
      maxReconnectAttempts?: number
      reconnectDelay?: number
      heartbeatInterval?: number
      protocols?: string[]
    } = {}
  ) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? this.maxReconnectAttempts
    this.reconnectDelay = options.reconnectDelay ?? this.reconnectDelay
    this.heartbeatIntervalMs = options.heartbeatInterval ?? this.heartbeatIntervalMs
  }

  // Connect to WebSocket server
  connect(url?: string): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.connectionState === 'connected') {
        return // Already connected
      }

      this.connectionState = 'connecting'
      const connectUrl = url || this.url

      try {
        this.ws = new WebSocket(connectUrl, this.options.protocols)

        yield* Effect.async<void>((resume) => {
          if (!this.ws) return

          this.ws.onopen = () => {
            this.connectionState = 'connected'
            this.reconnectAttempts = 0
            this.startHeartbeat()
            resume(Effect.succeed(undefined))
          }

          this.ws.onmessage = (event) => {
            try {
              const message: RealtimeMessage = JSON.parse(event.data.toString())
              this.handleMessage(message)
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error)
            }
          }

          this.ws.onclose = (event) => {
            this.connectionState = 'disconnected'
            this.stopHeartbeat()

            if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.attemptReconnect()
            }
          }

          this.ws.onerror = (error) => {
            this.connectionState = 'error'
            console.error('WebSocket error:', error)
            resume(Effect.fail(
              new RealtimeError(
                `WebSocket connection failed: ${error.message || 'Unknown error'}`,
                'CONNECTION_FAILED',
                { error }
              )
            ))
          }
        })

      } catch (error) {
        this.connectionState = 'error'
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to create WebSocket connection: ${error instanceof Error ? error.message : String(error)}`,
            'WEBSOCKET_INIT_FAILED',
            { url: connectUrl, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Disconnect from WebSocket server
  disconnect(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.ws && this.connectionState !== 'disconnected') {
        this.ws.close(1000, 'Client disconnect')
        this.ws = null
      }

      this.connectionState = 'disconnected'
      this.stopHeartbeat()
      this.reconnectAttempts = 0
    })
  }

  // Send message through WebSocket
  send(message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.connectionState !== 'connected' || !this.ws) {
        return yield* Effect.fail(
          new RealtimeError(
            'WebSocket is not connected',
            'NOT_CONNECTED'
          )
        )
      }

      try {
        const messageString = JSON.stringify(message)
        this.ws.send(messageString)
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
            'SEND_FAILED',
            { message, error }
          )
        )
      }
    })
  }

  // Get current connection state
  getConnectionState(): Effect.Effect<ConnectionState, never> {
    return Effect.succeed(this.connectionState)
  }

  // Register message handler for specific message types
  onMessage(type: string, handler: (message: RealtimeMessage) => void): void {
    this.messageHandlers.set(type, handler)
  }

  // Remove message handler
  offMessage(type: string): void {
    this.messageHandlers.delete(type)
  }

  // Subscribe to presence updates
  onPresence(callback: (info: PresenceInfo) => void): () => void {
    this.presenceCallbacks.add(callback)
    return () => {
      this.presenceCallbacks.delete(callback)
    }
  }

  // Broadcast presence information
  broadcastPresence(info: PresenceInfo): Effect.Effect<void, RealtimeError> {
    return this.send({
      type: 'presence',
      payload: info
    })
  }

  // Private methods
  private handleMessage(message: RealtimeMessage): void {
    // Handle presence messages specially
    if (message.type === 'presence') {
      for (const callback of this.presenceCallbacks) {
        try {
          callback(message.payload)
        } catch (error) {
          console.error('Presence callback error:', error)
        }
      }
    }

    // Handle other message types
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      try {
        handler(message)
      } catch (error) {
        console.error(`Message handler error for type ${message.type}:`, error)
      }
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++
    this.connectionState = 'reconnecting'

    setTimeout(() => {
      if (this.connectionState === 'reconnecting') {
        this.connect().pipe(
          Effect.runCallback((result) => {
            if (result._tag === 'Failure') {
              console.error('Reconnection failed:', result.cause)
              if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.attemptReconnect()
              }
            }
          })
        )
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)) // Exponential backoff
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send({
          type: 'heartbeat',
          payload: { timestamp: new Date() }
        }).pipe(
          Effect.runCallback((result) => {
            if (result._tag === 'Failure') {
              console.error('Heartbeat failed:', result.cause)
            }
          })
        )
      }
    }, this.heartbeatIntervalMs)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// WebSocket Server Implementation (for self-hosted scenarios)
