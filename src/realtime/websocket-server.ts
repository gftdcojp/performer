// WebSocket Server for Real-time Communication
// Merkle DAG: realtime-websocket-server
// Node.js only - handles WebSocket server functionality

import { Effect } from "effect"
import WebSocket from "ws"
import {
  RealtimeMessage,
  RealtimeError
} from "./types"

// WebSocket Server Implementation (Node.js only)
export class WebSocketServer {
  // Merkle DAG: websocket-server

  private wss: WebSocket.Server | null = null
  private connections = new Map<string, WebSocket>()
  private messageHandlers = new Map<string, (ws: WebSocket, message: RealtimeMessage) => void>()

  constructor(private port: number = 8080) {}

  // Start WebSocket server
  start(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      try {
        this.wss = new WebSocket.Server({ port: this.port })

        this.wss.on('connection', (ws, request) => {
          const connectionId = this.generateConnectionId()
          this.connections.set(connectionId, ws)

          ws.on('message', (data) => {
            try {
              const message: RealtimeMessage = JSON.parse(data.toString())
              this.handleServerMessage(ws, message)
            } catch (error) {
              console.error('Failed to parse server message:', error)
            }
          })

          ws.on('close', () => {
            this.connections.delete(connectionId)
          })

          ws.on('error', (error) => {
            console.error('WebSocket server connection error:', error)
            this.connections.delete(connectionId)
          })
        })

        console.log(`WebSocket server started on port ${this.port}`)
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to start WebSocket server: ${error instanceof Error ? error.message : String(error)}`,
            'SERVER_START_FAILED',
            { port: this.port, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Stop WebSocket server
  stop(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (this.wss) {
        this.wss.close()
        this.wss = null
        this.connections.clear()
        console.log('WebSocket server stopped')
      }
    })
  }

  // Broadcast message to all connected clients
  broadcast(message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const messageString = JSON.stringify(message)

      for (const [id, ws] of this.connections) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageString)
          }
        } catch (error) {
          console.error(`Failed to send to connection ${id}:`, error)
          this.connections.delete(id)
        }
      }
    })
  }

  // Send message to specific connection
  sendTo(connectionId: string, message: RealtimeMessage): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const ws = this.connections.get(connectionId)
      if (!ws) {
        return yield* Effect.fail(
          new RealtimeError(
            `Connection ${connectionId} not found`,
            'CONNECTION_NOT_FOUND',
            { connectionId }
          )
        )
      }

      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message))
        } else {
          return yield* Effect.fail(
            new RealtimeError(
              `Connection ${connectionId} is not open`,
              'CONNECTION_NOT_OPEN',
              { connectionId, readyState: ws.readyState }
            )
          )
        }
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to send to connection ${connectionId}: ${error instanceof Error ? error.message : String(error)}`,
            'SEND_TO_FAILED',
            { connectionId, error }
          )
        )
      }
    })
  }

  // Register server message handler
  onServerMessage(type: string, handler: (ws: WebSocket, message: RealtimeMessage) => void): void {
    this.messageHandlers.set(type, handler)
  }

  // Get connection count
  getConnectionCount(): number {
    return this.connections.size
  }

  // Private methods
  private handleServerMessage(ws: WebSocket, message: RealtimeMessage): void {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      try {
        handler(ws, message)
      } catch (error) {
        console.error(`Server message handler error for type ${message.type}:`, error)
      }
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
