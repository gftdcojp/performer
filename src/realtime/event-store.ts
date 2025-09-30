// Event Store for Real-time Synchronization
// Merkle DAG: realtime-event-store
// Extends ActorDB with real-time event capabilities

import { Effect } from "effect"
import { v4 as uuidv4 } from "uuid"
import {
  RealtimeEvent,
  EventEnvelope,
  ActorSnapshot,
  EventStore as EventStoreInterface,
  RealtimeError,
  CRDTState
} from "./types"

// Event Store Implementation using ActorDB
export class RealtimeEventStore implements EventStoreInterface {
  // Merkle DAG: event-store-implementation

  constructor(
    private actorDBClient: any, // ActorDB client instance
    private snapshotInterval: number = 100 // Events between snapshots
  ) {}

  // Append event to store with sequence ID generation
  appendEvent(event: RealtimeEvent): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      try {
        // Generate sequence ID for global ordering
        const sequenceId = yield* this.generateSequenceId(event.actorId)

        // Create envelope with checksum
        const envelope: EventEnvelope = {
          event,
          sequenceId,
          checksum: yield* this.calculateChecksum(event)
        }

        // Store in ActorDB
        const result = yield* Effect.tryPromise(() =>
          this.actorDBClient.writeEvent(event.actorId, 'realtime_event', {
            envelope,
            timestamp: event.timestamp
          })
        )

        // Check if snapshot should be created
        const currentVersion = yield* this.getLatestVersion(event.actorId)
        if (currentVersion > 0 && currentVersion % this.snapshotInterval === 0) {
          yield* this.createSnapshotInternal(event.actorId, currentVersion)
        }

        return result.id
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to append event: ${error instanceof Error ? error.message : String(error)}`,
            'APPEND_FAILED',
            { event, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Get events for an actor since a specific version
  getEvents(actorId: string, sinceVersion: number = 0): Effect.Effect<RealtimeEvent[], RealtimeError> {
    return Effect.gen(function* () {
      try {
        const query = {
          actorId,
          eventType: 'realtime_event',
          version: { $gt: sinceVersion }
        }

        const results = yield* Effect.tryPromise(() =>
          this.actorDBClient.queryEvents(query)
        )

        return results.map((result: any) => result.payload.envelope.event as RealtimeEvent)
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to get events: ${error instanceof Error ? error.message : String(error)}`,
            'QUERY_FAILED',
            { actorId, sinceVersion, error }
          )
        )
      }
    })
  }

  // Get specific event by ID
  getEventById(eventId: string): Effect.Effect<RealtimeEvent | undefined, RealtimeError> {
    return Effect.gen(function* () {
      try {
        const result = yield* Effect.tryPromise(() =>
          this.actorDBClient.getEvent(eventId)
        )

        return result ? result.payload.envelope.event as RealtimeEvent : undefined
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to get event: ${error instanceof Error ? error.message : String(error)}`,
            'GET_FAILED',
            { eventId, error }
          )
        )
      }
    })
  }

  // Get latest version for an actor
  getLatestVersion(actorId: string): Effect.Effect<number, RealtimeError> {
    return Effect.gen(function* () {
      try {
        const result = yield* Effect.tryPromise(() =>
          this.actorDBClient.getLatestVersion(actorId)
        )

        return result || 0
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to get latest version: ${error instanceof Error ? error.message : String(error)}`,
            'VERSION_QUERY_FAILED',
            { actorId, error }
          )
        )
      }
    })
  }

  // Create snapshot of actor state
  createSnapshotInternal(actorId: string, version: number): Effect.Effect<ActorSnapshot, RealtimeError> {
    return Effect.gen(function* () {
      try {
        // Get current state from actor
        const state = yield* this.getActorState(actorId)

        // Get last event ID
        const events = yield* this.getEvents(actorId, version - 1)
        const lastEvent = events[events.length - 1]

        const snapshot: ActorSnapshot = {
          actorId,
          state,
          version,
          lastEventId: lastEvent?.id || '',
          timestamp: new Date(),
          checksum: yield* this.calculateStateChecksum(state)
        }

        // Store snapshot
        yield* Effect.tryPromise(() =>
          this.actorDBClient.writeEvent(actorId, 'snapshot', snapshot)
        )

        return snapshot
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to create snapshot: ${error instanceof Error ? error.message : String(error)}`,
            'SNAPSHOT_FAILED',
            { actorId, version, error }
          )
        )
      }
    })
  }

  // Get latest snapshot for an actor
  getLatestSnapshot(actorId: string): Effect.Effect<ActorSnapshot | undefined, RealtimeError> {
    return Effect.gen(function* () {
      try {
        const query = {
          actorId,
          eventType: 'snapshot'
        }

        const results = yield* Effect.tryPromise(() =>
          this.actorDBClient.queryEvents(query, { limit: 1, sort: { timestamp: -1 } })
        )

        return results.length > 0 ? results[0].payload as ActorSnapshot : undefined
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to get snapshot: ${error instanceof Error ? error.message : String(error)}`,
            'SNAPSHOT_QUERY_FAILED',
            { actorId, error }
          )
        )
      }
    })
  }

  // Private helper methods
  private generateSequenceId(actorId: string): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      // Simple sequence ID generation - in production, use distributed counter
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      return `${actorId}-${timestamp}-${random}`
    })
  }

  private calculateChecksum(event: RealtimeEvent): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      // Simple checksum - in production, use cryptographic hash
      const data = JSON.stringify({
        id: event.id,
        type: event.type,
        payload: event.payload,
        actorId: event.actorId,
        version: event.version,
        timestamp: event.timestamp.toISOString()
      })

      let hash = 0
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }

      return hash.toString(16)
    })
  }

  private calculateStateChecksum(state: any): Effect.Effect<string, RealtimeError> {
    return this.calculateChecksum({
      id: '',
      type: 'state',
      payload: state,
      actorId: '',
      version: 0,
      timestamp: new Date()
    })
  }

  private getActorState(actorId: string): Effect.Effect<any, RealtimeError> {
    return Effect.gen(function* () {
      // This would integrate with the actor system to get current state
      // For now, return empty state
      return {}
    })
  }
}

// CRDT State Manager for conflict resolution
export class CRDTStateManager {
  // Merkle DAG: crdt-state-manager

  constructor(private eventStore: RealtimeEventStore) {}

  // Merge states using CRDT principles
  mergeStates(
    localState: CRDTState,
    remoteState: CRDTState,
    mergeFunction?: (local: any, remote: any, vectorClock: Record<string, number>) => any
  ): Effect.Effect<CRDTState, RealtimeError> {
    return Effect.gen(function* () {
      // Compare vector clocks to determine causality
      const comparison = this.compareVectorClocks(localState.vectorClock, remoteState.vectorClock)

      if (comparison === 'concurrent') {
        // States are concurrent - need to merge
        const mergedData = mergeFunction
          ? mergeFunction(localState.data, remoteState.data, { ...localState.vectorClock, ...remoteState.vectorClock })
          : { ...localState.data, ...remoteState.data } // Simple merge

        const mergedClock = this.mergeVectorClocks(localState.vectorClock, remoteState.vectorClock)

        return {
          actorId: localState.actorId,
          data: mergedData,
          vectorClock: mergedClock,
          lastModified: new Date(Math.max(localState.lastModified.getTime(), remoteState.lastModified.getTime()))
        }
      } else if (comparison === 'local_newer') {
        return localState
      } else {
        return remoteState
      }
    })
  }

  // Compare vector clocks
  private compareVectorClocks(
    clock1: Record<string, number>,
    clock2: Record<string, number>
  ): 'concurrent' | 'clock1_newer' | 'clock2_newer' {
    let clock1Newer = false
    let clock2Newer = false

    const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)])

    for (const key of allKeys) {
      const val1 = clock1[key] || 0
      const val2 = clock2[key] || 0

      if (val1 > val2) {
        clock1Newer = true
      } else if (val2 > val1) {
        clock2Newer = true
      }
    }

    if (clock1Newer && clock2Newer) {
      return 'concurrent'
    } else if (clock1Newer) {
      return 'clock1_newer'
    } else if (clock2Newer) {
      return 'clock2_newer'
    } else {
      return 'concurrent' // Equal clocks
    }
  }

  // Merge vector clocks
  private mergeVectorClocks(
    clock1: Record<string, number>,
    clock2: Record<string, number>
  ): Record<string, number> {
    const merged: Record<string, number> = {}

    const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)])

    for (const key of allKeys) {
      merged[key] = Math.max(clock1[key] || 0, clock2[key] || 0)
    }

    return merged
  }
}
