// Real-time Synchronization Types for Rivet-like Architecture
// Merkle DAG: realtime-types

import { Effect } from "effect"

// Core Event Types
export interface RealtimeEvent {
  id: string
  type: string
  payload: any
  actorId: string
  version: number
  timestamp: Date
  causalDependencies?: string[] // For causal ordering
  vectorClock?: Record<string, number> // For conflict resolution
}

export interface EventEnvelope {
  event: RealtimeEvent
  sequenceId: string // Global sequence for ordering
  checksum: string // For integrity verification
}

// Actor State Synchronization
export interface ActorSnapshot {
  actorId: string
  state: any
  version: number
  lastEventId: string
  timestamp: Date
  checksum: string
}

// WebSocket Message Types
export type RealtimeMessage =
  | { type: 'event'; payload: EventEnvelope }
  | { type: 'snapshot'; payload: ActorSnapshot }
  | { type: 'sync_request'; payload: { actorId: string; sinceVersion: number } }
  | { type: 'sync_response'; payload: { events: EventEnvelope[]; snapshot?: ActorSnapshot } }
  | { type: 'presence'; payload: { userId: string; state: 'online' | 'offline'; metadata?: any } }
  | { type: 'heartbeat'; payload: { timestamp: Date } }

// Channel Subscription
export interface ChannelSubscription {
  channelId: string
  actorId: string
  filters?: {
    eventTypes?: string[]
    actorIds?: string[]
  }
}

// Conflict Resolution Strategies
export type ConflictResolutionStrategy =
  | 'last_write_wins'
  | 'merge'
  | 'causal_order'
  | 'custom'

// Actor Synchronization Configuration
export interface ActorSyncConfig {
  actorId: string
  enableRealtimeSync: boolean
  conflictResolution: ConflictResolutionStrategy
  snapshotInterval: number // Events between snapshots
  maxEventHistory: number // Maximum events to keep in memory
  enablePresenceTracking: boolean
}

// WebSocket Connection State
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

// Synchronization Metrics
export interface SyncMetrics {
  eventsProcessed: number
  eventsBroadcast: number
  conflictsResolved: number
  syncLatency: number
  connectionUptime: number
  lastSyncTimestamp: Date
}

// Error Types
export class RealtimeError extends Error {
  readonly _tag = 'RealtimeError'

  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'RealtimeError'
  }
}

export class ConflictError extends RealtimeError {
  readonly _tag = 'ConflictError'

  constructor(
    public conflictingEvents: RealtimeEvent[],
    public strategy: ConflictResolutionStrategy
  ) {
    super(
      `Conflict detected between ${conflictingEvents.length} events`,
      'CONFLICT_DETECTED',
      { conflictingEvents, strategy }
    )
  }
}

export class SyncError extends RealtimeError {
  readonly _tag = 'SyncError'

  constructor(
    message: string,
    public actorId: string,
    public lastKnownVersion: number
  ) {
    super(message, 'SYNC_FAILED', { actorId, lastKnownVersion })
  }
}

// Effect-based Service Interfaces
export interface RealtimeService {
  // Event Broadcasting
  broadcastEvent: (event: RealtimeEvent) => Effect.Effect<void, RealtimeError>

  // Actor Synchronization
  syncActor: (actorId: string, sinceVersion?: number) => Effect.Effect<ActorSnapshot, RealtimeError>

  // Channel Management
  subscribeChannel: (subscription: ChannelSubscription) => Effect.Effect<string, RealtimeError>
  unsubscribeChannel: (subscriptionId: string) => Effect.Effect<void, RealtimeError>

  // Snapshot Management
  createSnapshot: (actorId: string) => Effect.Effect<ActorSnapshot, RealtimeError>
  getSnapshot: (actorId: string) => Effect.Effect<ActorSnapshot | undefined, RealtimeError>

  // Conflict Resolution
  resolveConflict: (events: RealtimeEvent[], strategy: ConflictResolutionStrategy) => Effect.Effect<RealtimeEvent, ConflictError>

  // Metrics and Monitoring
  getMetrics: () => Effect.Effect<SyncMetrics, never>
  resetMetrics: () => Effect.Effect<void, never>
}

export interface WebSocketManager {
  connect: (url: string) => Effect.Effect<void, RealtimeError>
  disconnect: () => Effect.Effect<void, RealtimeError>
  send: (message: RealtimeMessage) => Effect.Effect<void, RealtimeError>
  getConnectionState: () => Effect.Effect<ConnectionState, never>
}

// Event Store Interface (extends existing ActorDB)
export interface EventStore {
  appendEvent: (event: RealtimeEvent) => Effect.Effect<string, RealtimeError>
  getEvents: (actorId: string, sinceVersion?: number) => Effect.Effect<RealtimeEvent[], RealtimeError>
  getEventById: (eventId: string) => Effect.Effect<RealtimeEvent | undefined, RealtimeError>
  getLatestVersion: (actorId: string) => Effect.Effect<number, RealtimeError>
}

// CRDT-like State Management
export interface CRDTState {
  actorId: string
  data: any
  vectorClock: Record<string, number>
  lastModified: Date
}

export interface CRDTMergeFunction<T = any> {
  (local: T, remote: T, vectorClock: Record<string, number>): T
}

// Presence Tracking
export interface PresenceInfo {
  userId: string
  state: 'online' | 'offline'
  lastSeen: Date
  metadata?: any
}

export interface PresenceManager {
  trackPresence: (info: PresenceInfo) => Effect.Effect<void, RealtimeError>
  getPresence: (userId: string) => Effect.Effect<PresenceInfo | undefined, RealtimeError>
  getAllPresence: () => Effect.Effect<PresenceInfo[], RealtimeError>
  subscribePresence: (callback: (info: PresenceInfo) => void) => Effect.Effect<() => void, RealtimeError>
}
