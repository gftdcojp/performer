// Real-time Chat Server Demo
// Merkle DAG: demo-realtime-chat-server
// Demonstrates Rivet-like real-time synchronization with Performer

import { WebSocketServer } from '../../src/realtime/websocket-manager'
import { RealtimeEventStore, CRDTStateManager } from '../../src/realtime/event-store'
import { RealtimeServiceImpl } from '../../src/realtime/realtime-service'
import { createSnapshotManager } from '../../src/realtime/snapshot-manager'
import { createConflictResolver } from '../../src/realtime/conflict-resolver'

// Mock ActorDB client for demo
class MockActorDBClient {
  private events: any[] = []
  private snapshots: any[] = []

  async writeEvent(actorId: string, eventType: string, payload: any) {
    const event = {
      id: `event-${Date.now()}-${Math.random()}`,
      actorId,
      eventType,
      payload,
      timestamp: new Date()
    }
    this.events.push(event)
    return event
  }

  async queryEvents(query: any) {
    return this.events.filter(event =>
      (!query.actorId || event.actorId === query.actorId) &&
      (!query.eventType || event.eventType === query.eventType)
    )
  }

  async getEvent(eventId: string) {
    return this.events.find(event => event.id === eventId)
  }

  async getLatestVersion(actorId: string) {
    const actorEvents = this.events.filter(event => event.actorId === actorId)
    return actorEvents.length
  }
}

// Chat room state reducer
function chatRoomReducer(state: any, event: any) {
  switch (event.type) {
    case 'user_joined':
      return {
        ...state,
        users: [...(state.users || []), event.payload.userId],
        messages: [...(state.messages || []), {
          id: event.id,
          type: 'system',
          content: `${event.payload.userId} joined the room`,
          timestamp: event.timestamp
        }]
      }

    case 'user_left':
      return {
        ...state,
        users: (state.users || []).filter((id: string) => id !== event.payload.userId),
        messages: [...(state.messages || []), {
          id: event.id,
          type: 'system',
          content: `${event.payload.userId} left the room`,
          timestamp: event.timestamp
        }]
      }

    case 'message_sent':
      return {
        ...state,
        messages: [...(state.messages || []), {
          id: event.id,
          type: 'user',
          userId: event.payload.userId,
          content: event.payload.content,
          timestamp: event.timestamp
        }]
      }

    default:
      return state
  }
}

// Chat room actor
class ChatRoomActor {
  constructor(
    private actorId: string,
    private realtimeService: RealtimeServiceImpl
  ) {}

  async joinRoom(userId: string) {
    const event = {
      id: `join-${Date.now()}`,
      type: 'user_joined',
      payload: { userId },
      actorId: this.actorId,
      version: 0, // Will be set by event store
      timestamp: new Date()
    }

    await this.realtimeService.broadcastEvent(event)
  }

  async leaveRoom(userId: string) {
    const event = {
      id: `leave-${Date.now()}`,
      type: 'user_left',
      payload: { userId },
      actorId: this.actorId,
      version: 0,
      timestamp: new Date()
    }

    await this.realtimeService.broadcastEvent(event)
  }

  async sendMessage(userId: string, content: string) {
    const event = {
      id: `msg-${Date.now()}`,
      type: 'message_sent',
      payload: { userId, content },
      actorId: this.actorId,
      version: 0,
      timestamp: new Date()
    }

    await this.realtimeService.broadcastEvent(event)
  }

  async getRoomState() {
    return await this.realtimeService.syncActor(this.actorId)
  }
}

// Main server application
async function startChatServer() {
  console.log('🚀 Starting Performer Real-time Chat Server...')

  // Initialize components
  const mockActorDB = new MockActorDBClient()
  const eventStore = new RealtimeEventStore(mockActorDB, 50) // Snapshot every 50 events
  const conflictResolver = createConflictResolver({
    defaultStrategy: 'last_write_wins',
    enableVectorClocks: true
  })
  const snapshotManager = createSnapshotManager(eventStore, chatRoomReducer)

  // Create real-time service
  const realtimeService = new RealtimeServiceImpl(
    mockActorDB,
    'ws://localhost:8080', // WebSocket URL for clients
    { snapshotInterval: 50 }
  )

  // Start WebSocket server
  const wsServer = new WebSocketServer(8080)

  // Set up WebSocket message handlers
  wsServer.onServerMessage('sync_request', async (ws, message) => {
    console.log('📥 Sync request received:', message.payload)

    try {
      const snapshot = await realtimeService.syncActor(message.payload.actorId)
      wsServer.sendTo(ws, {
        type: 'sync_response',
        payload: {
          events: [], // Simplified - in real app would get recent events
          snapshot
        }
      })
    } catch (error) {
      console.error('❌ Sync request failed:', error)
    }
  })

  wsServer.onServerMessage('broadcast', async (ws, message) => {
    console.log('📤 Broadcast message received:', message.payload)

    // Broadcast to all connected clients
    await wsServer.broadcast(message)
  })

  // Start the server
  await wsServer.start()

  // Create chat room actor
  const chatRoom = new ChatRoomActor('chat-room-1', realtimeService)

  console.log('✅ Chat server started successfully!')
  console.log('🌐 WebSocket server listening on ws://localhost:8080')
  console.log('💬 Chat room ID: chat-room-1')

  // Demo: Simulate some activity
  setTimeout(async () => {
    console.log('\n🎭 Starting demo activity...')

    await chatRoom.joinRoom('alice')
    await chatRoom.joinRoom('bob')

    setTimeout(async () => {
      await chatRoom.sendMessage('alice', 'Hello, everyone!')
    }, 1000)

    setTimeout(async () => {
      await chatRoom.sendMessage('bob', 'Hi Alice! Welcome to Performer real-time chat!')
    }, 2000)

    setTimeout(async () => {
      const state = await chatRoom.getRoomState()
      console.log('🏠 Current room state:', JSON.stringify(state.state, null, 2))
    }, 3000)

  }, 2000)

  return {
    wsServer,
    realtimeService,
    chatRoom,
    eventStore,
    snapshotManager,
    conflictResolver
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down chat server...')
  process.exit(0)
})

// Export for use in other files
export { startChatServer, ChatRoomActor }

// Run server if called directly
if (require.main === module) {
  startChatServer().catch(console.error)
}
