// Real-time Service Implementation
// Merkle DAG: realtime-service
// Integrates all real-time components for Rivet-like synchronization

import { Effect } from "effect"
import { v4 as uuidv4 } from "uuid"
import {
  RealtimeService,
  RealtimeEvent,
  ActorSnapshot,
  ChannelSubscription,
  ConflictResolutionStrategy,
  SyncMetrics,
  RealtimeError,
  ConflictError,
  SyncError
} from "./types"
import { RealtimeEventStore, CRDTStateManager } from "./event-store"
import { WebSocketManager } from "./websocket-manager"
import { SSETransport, SSEServer } from "./sse-manager"

// Real-time Service Implementation with WebSocket and SSE support
export class RealtimeServiceImpl implements RealtimeService {
  // Merkle DAG: realtime-service-impl

  private eventStore: RealtimeEventStore
  private crdtManager: CRDTStateManager
  private wsManager: WebSocketManager | null = null
  private sseTransport: SSETransport | null = null
  private subscriptions = new Map<string, ChannelSubscription>()
  private metrics: SyncMetrics = {
    eventsProcessed: 0,
    eventsBroadcast: 0,
    conflictsResolved: 0,
    syncLatency: 0,
    connectionUptime: 0,
    lastSyncTimestamp: new Date()
  }

  constructor(
    actorDBClient: any,
    options: {
      snapshotInterval?: number
      wsOptions?: any
      wsUrl?: string
      sseServer?: SSEServer
      transport?: 'websocket' | 'sse' | 'both' // Default to both for maximum compatibility
    } = {}
  ) {
    this.eventStore = new RealtimeEventStore(actorDBClient, options.snapshotInterval)
    this.crdtManager = new CRDTStateManager(this.eventStore)

    // Initialize transports based on options
    const transport = options.transport || 'both'

    if (transport === 'websocket' || transport === 'both') {
      if (options.wsUrl) {
        this.wsManager = new WebSocketManager(options.wsUrl, options.wsOptions)
        this.setupWebSocketHandlers()
      }
    }

    if (transport === 'sse' || transport === 'both') {
      if (options.sseServer) {
        this.sseTransport = new SSETransport(options.sseServer)
      }
    }
  }

  // Broadcast event to all subscribers (WebSocket and/or SSE)
  broadcastEvent(event: RealtimeEvent): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      try {
        // Append event to store first
        const eventId = yield* this.eventStore.appendEvent(event)

        // Create envelope for broadcasting
        const envelope = {
          event: { ...event, id: eventId },
          sequenceId: eventId,
          checksum: yield* this.calculateChecksum(event)
        }

        const broadcastPromises: Effect.Effect<void, RealtimeError>[] = []

        // Send via WebSocket if available
        if (this.wsManager) {
          broadcastPromises.push(
            this.wsManager.send({
              type: 'event',
              payload: envelope
            })
          )
        }

        // Send via SSE if available
        if (this.sseTransport) {
          broadcastPromises.push(
            this.sseTransport.broadcast({
              type: 'event',
              payload: envelope
            }, event.actorId)
          )
        }

        // Execute all broadcasts (continue even if some fail)
        if (broadcastPromises.length > 0) {
          yield* Effect.all(broadcastPromises, {
            concurrency: 'unbounded',
            discard: true
          }).pipe(
            Effect.catchAll(() => Effect.succeed(undefined)) // Ignore individual transport failures
          )
        }

        // Update metrics
        this.metrics.eventsProcessed++
        this.metrics.eventsBroadcast++
        this.metrics.lastSyncTimestamp = new Date()

      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to broadcast event: ${error instanceof Error ? error.message : String(error)}`,
            'BROADCAST_FAILED',
            { event, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Synchronize actor state
  syncActor(actorId: string, sinceVersion: number = 0): Effect.Effect<ActorSnapshot, RealtimeError> {
    return Effect.gen(function* () {
      try {
        const startTime = Date.now()

        // Check if we have a recent snapshot
        const snapshot = yield* this.eventStore.getLatestSnapshot(actorId)

        if (snapshot && snapshot.version >= sinceVersion) {
          // Use snapshot if available and recent enough
          this.updateSyncMetrics(Date.now() - startTime)
          return snapshot
        }

        // Otherwise, get events since the requested version
        const events = yield* this.eventStore.getEvents(actorId, sinceVersion)

        if (events.length === 0) {
          return yield* Effect.fail(
            new SyncError(
              `No events found for actor ${actorId} since version ${sinceVersion}`,
              actorId,
              sinceVersion
            )
          )
        }

        // Create snapshot from events
        const newSnapshot = yield* this.eventStore.createSnapshotInternal(actorId, events[events.length - 1].version)

        // Send sync response via available transports
        const syncPromises: Effect.Effect<void, RealtimeError>[] = []

        if (this.wsManager) {
          syncPromises.push(
            this.wsManager.send({
              type: 'sync_response',
              payload: { events, snapshot: newSnapshot }
            })
          )
        }

        if (this.sseTransport) {
          syncPromises.push(
            this.sseTransport.broadcast({
              type: 'sync_response',
              payload: { events, snapshot: newSnapshot }
            }, actorId)
          )
        }

        if (syncPromises.length > 0) {
          yield* Effect.all(syncPromises, {
            concurrency: 'unbounded',
            discard: true
          }).pipe(
            Effect.catchAll(() => Effect.succeed(undefined))
          )
        }

        this.updateSyncMetrics(Date.now() - startTime)
        return newSnapshot

      } catch (error) {
        if (error instanceof RealtimeError) {
          return yield* Effect.fail(error)
        }
        return yield* Effect.fail(
          new RealtimeError(
            `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
            'SYNC_FAILED',
            { actorId, sinceVersion, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Subscribe to channel
  subscribeChannel(subscription: ChannelSubscription): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      try {
        const subscriptionId = uuidv4()
        this.subscriptions.set(subscriptionId, subscription)

        // Send subscription request via WebSocket
        yield* this.wsManager.send({
          type: 'sync_request',
          payload: {
            actorId: subscription.actorId,
            sinceVersion: 0 // Start from beginning for new subscriptions
          }
        })

        return subscriptionId
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to subscribe to channel: ${error instanceof Error ? error.message : String(error)}`,
            'SUBSCRIBE_FAILED',
            { subscription, error }
          )
        )
      }
    })
  }

  // Unsubscribe from channel
  unsubscribeChannel(subscriptionId: string): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      if (!this.subscriptions.has(subscriptionId)) {
        return yield* Effect.fail(
          new RealtimeError(
            `Subscription ${subscriptionId} not found`,
            'SUBSCRIPTION_NOT_FOUND',
            { subscriptionId }
          )
        )
      }

      this.subscriptions.delete(subscriptionId)
    })
  }

  // Create snapshot for actor
  createSnapshot(actorId: string): Effect.Effect<ActorSnapshot, RealtimeError> {
    return Effect.gen(function* () {
      const latestVersion = yield* this.eventStore.getLatestVersion(actorId)
      return yield* this.eventStore.createSnapshotInternal(actorId, latestVersion)
    })
  }

  // Get latest snapshot for actor
  getSnapshot(actorId: string): Effect.Effect<ActorSnapshot | undefined, RealtimeError> {
    return this.eventStore.getLatestSnapshot(actorId)
  }

  // Resolve conflicts between events
  resolveConflict(events: RealtimeEvent[], strategy: ConflictResolutionStrategy): Effect.Effect<RealtimeEvent, ConflictError> {
    return Effect.gen(function* () {
      if (events.length < 2) {
        return yield* Effect.fail(
          new ConflictError(events, strategy)
        )
      }

      try {
        let resolvedEvent: RealtimeEvent

        switch (strategy) {
          case 'last_write_wins':
            // Pick the event with the latest timestamp
            resolvedEvent = events.reduce((latest, current) =>
              current.timestamp > latest.timestamp ? current : latest
            )
            break

          case 'causal_order':
            // Use vector clocks for causal ordering
            resolvedEvent = yield* this.resolveByCausalOrder(events)
            break

          case 'merge':
            // Merge event payloads
            resolvedEvent = yield* this.mergeEventPayloads(events)
            break

          default:
            return yield* Effect.fail(
              new ConflictError(events, strategy)
            )
        }

        this.metrics.conflictsResolved++
        return resolvedEvent

      } catch (error) {
        return yield* Effect.fail(
          new ConflictError(events, strategy)
        )
      }
    })
  }

  // Get synchronization metrics
  getMetrics(): Effect.Effect<SyncMetrics, never> {
    return Effect.succeed({ ...this.metrics })
  }

  // Reset metrics
  resetMetrics(): Effect.Effect<void, never> {
    return Effect.gen(function* () {
      this.metrics = {
        eventsProcessed: 0,
        eventsBroadcast: 0,
        conflictsResolved: 0,
        syncLatency: 0,
        connectionUptime: 0,
        lastSyncTimestamp: new Date()
      }
    })
  }

  // Connect to real-time service
  connect(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const connectPromises: Effect.Effect<void, RealtimeError>[] = []

      if (this.wsManager) {
        connectPromises.push(this.wsManager.connect())
      }

      // SSE doesn't need explicit connection (server handles it)

      if (connectPromises.length > 0) {
        yield* Effect.all(connectPromises, {
          concurrency: 'unbounded',
          discard: true
        })
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Disconnect from real-time service
  disconnect(): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      const disconnectPromises: Effect.Effect<void, RealtimeError>[] = []

      if (this.wsManager) {
        disconnectPromises.push(this.wsManager.disconnect())
      }

      // SSE server shutdown would be handled separately

      if (disconnectPromises.length > 0) {
        yield* Effect.all(disconnectPromises, {
          concurrency: 'unbounded',
          discard: true
        })
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Get transport information
  getTransportInfo(): {
    websocket: boolean
    sse: boolean
    sseConnections?: number
  } {
    return {
      websocket: this.wsManager !== null,
      sse: this.sseTransport !== null,
      sseConnections: this.sseTransport?.getConnectionInfo().count
    }
  }

  // Private helper methods
  private setupWebSocketHandlers(): void {
    // Handle incoming events
    this.wsManager.onMessage('event', (message) => {
      if (message.type === 'event') {
        this.handleIncomingEvent(message.payload)
      }
    })

    // Handle sync responses
    this.wsManager.onMessage('sync_response', (message) => {
      if (message.type === 'sync_response') {
        this.handleSyncResponse(message.payload)
      }
    })

    // Handle sync requests
    this.wsManager.onMessage('sync_request', (message) => {
      if (message.type === 'sync_request') {
        this.handleSyncRequest(message.payload)
      }
    })
  }

  private handleIncomingEvent(envelope: any): void {
    // Process incoming event and update local state
    const event = envelope.event as RealtimeEvent
    this.metrics.eventsProcessed++

    // Here you would typically update the local actor state
    // For now, just log the event
    console.log('Received event:', event)
  }

  private handleSyncResponse(response: any): void {
    // Process sync response with events and snapshot
    console.log('Received sync response:', response)
  }

  private handleSyncRequest(request: any): void {
    // Handle sync request from other clients
    this.syncActor(request.actorId, request.sinceVersion).pipe(
      Effect.runCallback((result) => {
        if (result._tag === 'Failure') {
          console.error('Failed to handle sync request:', result.cause)
        }
      })
    )
  }

  private resolveByCausalOrder(events: RealtimeEvent[]): Effect.Effect<RealtimeEvent, ConflictError> {
    return Effect.gen(function* () {
      // Simple causal ordering based on vector clocks
      // In a full implementation, this would be more sophisticated
      return events[0] // Placeholder - return first event
    })
  }

  private mergeEventPayloads(events: RealtimeEvent[]): Effect.Effect<RealtimeEvent, ConflictError> {
    return Effect.gen(function* () {
      // Merge event payloads using CRDT principles
      const mergedPayload = events.reduce((merged, event) => ({
        ...merged,
        ...event.payload
      }), {})

      const mergedEvent: RealtimeEvent = {
        ...events[0],
        payload: mergedPayload,
        id: uuidv4(),
        timestamp: new Date()
      }

      return mergedEvent
    })
  }

  private calculateChecksum(event: RealtimeEvent): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      // Simple checksum calculation
      const data = JSON.stringify(event)
      let hash = 0
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i)
      }
      return hash.toString(16)
    })
  }

  private updateSyncMetrics(latency: number): void {
    this.metrics.syncLatency = latency
    this.metrics.connectionUptime = Date.now() - this.metrics.lastSyncTimestamp.getTime()
  }
}

// Factory function for creating real-time service with WebSocket and/or SSE support
export function createRealtimeService(
  actorDBClient: any,
  options: {
    snapshotInterval?: number
    wsOptions?: any
    wsUrl?: string
    sseServer?: SSEServer
    transport?: 'websocket' | 'sse' | 'both'
    autoConnect?: boolean
  } = {}
): Effect.Effect<RealtimeService, RealtimeError> {
  return Effect.gen(function* () {
    const service = new RealtimeServiceImpl(actorDBClient, options)

    if (options.autoConnect !== false) {
      yield* service.connect()
    }

    return service
  })
}

// Factory function for backward compatibility (WebSocket only)
export function createRealtimeServiceWS(
  actorDBClient: any,
  wsUrl: string,
  options: {
    snapshotInterval?: number
    wsOptions?: any
  } = {}
): Effect.Effect<RealtimeService, RealtimeError> {
  return createRealtimeService(actorDBClient, {
    ...options,
    wsUrl,
    transport: 'websocket'
  })
}

// Factory function for SSE only
export function createRealtimeServiceSSE(
  actorDBClient: any,
  sseServer: SSEServer,
  options: {
    snapshotInterval?: number
  } = {}
): Effect.Effect<RealtimeService, RealtimeError> {
  return createRealtimeService(actorDBClient, {
    ...options,
    sseServer,
    transport: 'sse'
  })
}
