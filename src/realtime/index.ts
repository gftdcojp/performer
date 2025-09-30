// Real-time Synchronization Module
// Merkle DAG: realtime-module

// Core types
export type {
  RealtimeEvent,
  EventEnvelope,
  ActorSnapshot,
  RealtimeMessage,
  ChannelSubscription,
  ConflictResolutionStrategy,
  SyncMetrics,
  ConnectionState,
  ActorSyncConfig,
  CRDTState,
  CRDTMergeFunction,
  PresenceInfo,
  RealtimeService,
  WebSocketManager,
  EventStore,
  PresenceManager,
  VectorClock,
  CausalDependencies,
  ConsistencyLevel
} from './types'

// Error types
export {
  RealtimeError,
  ConflictError,
  SyncError
} from './types'

// Core services
export {
  RealtimeServiceImpl,
  createRealtimeService,
  createRealtimeServiceWS,
  createRealtimeServiceSSE
} from './realtime-service'

// Event store
export {
  RealtimeEventStore,
  CRDTStateManager
} from './event-store'

// WebSocket management
export { WebSocketManager } from './websocket-manager'

// Node.js only WebSocket server
export { WebSocketServer } from './websocket-server'

// Snapshot and replay
export {
  SnapshotManager,
  ReplayResult,
  SnapshotManagerImpl,
  OptimizedReplayManager,
  createSnapshotManager,
  createOptimizedReplayManager
} from './snapshot-manager'

// Conflict resolution
export {
  ConflictResolver,
  ConflictResolverImpl,
  OperationalTransformer,
  ConsistencyLevel,
  createConflictResolver,
  createOperationalTransformer,
  incrementVectorClock,
  mergeVectorClocks
} from './conflict-resolver'

// SSE (Server-Sent Events)
export {
  SSEManager,
  SSEServer,
  SSETransport,
  createSSEManager,
  createSSEServer,
  createSSETransport
} from './sse-manager'

// Convenience functions
import { createRealtimeService } from './realtime-service'

/**
 * Quick setup function for real-time synchronization
 */
export function quickStartRealtime(
  actorDBClient: any,
  wsUrl: string,
  options: {
    snapshotInterval?: number
    wsOptions?: any
  } = {}
) {
  return createRealtimeService(actorDBClient, wsUrl, options)
}

/**
 * Example usage:
 *
 * ```typescript
 * import { quickStartRealtime } from 'performer/realtime';
 *
 * // Create real-time service
 * const realtimeService = await quickStartRealtime(actorDBClient, 'ws://localhost:8080');
 *
 * // Subscribe to actor channel
 * const subscriptionId = await realtimeService.subscribeChannel({
 *   channelId: 'room-1',
 *   actorId: 'user-123',
 *   filters: { eventTypes: ['user_joined', 'user_left'] }
 * });
 *
 * // Broadcast event
 * await realtimeService.broadcastEvent({
 *   id: 'event-1',
 *   type: 'user_joined',
 *   payload: { userId: 'user-123', username: 'john' },
 *   actorId: 'user-123',
 *   version: 1,
 *   timestamp: new Date()
 * });
 *
 * // Sync actor state
 * const snapshot = await realtimeService.syncActor('user-123', 0);
 * console.log('Actor state:', snapshot.state);
 *
 * // Handle conflicts
 * const resolvedEvent = await realtimeService.resolveConflict(
 *   conflictingEvents,
 *   'last_write_wins'
 * );
 *
 * // Get metrics
 * const metrics = await realtimeService.getMetrics();
 * console.log('Sync metrics:', metrics);
 * ```
 */
