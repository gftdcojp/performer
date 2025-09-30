// Snapshot and Replay Manager for Real-time Synchronization
// Merkle DAG: realtime-snapshot-manager
// Provides efficient state synchronization and event replay

import { Effect } from "effect"
import {
  ActorSnapshot,
  RealtimeEvent,
  SnapshotManager,
  ReplayResult,
  RealtimeError
} from "./types"
import { RealtimeEventStore } from "./event-store"

// Snapshot Manager Interface
export interface SnapshotManager {
  createSnapshot(actorId: string): Effect.Effect<ActorSnapshot, RealtimeError>
  getLatestSnapshot(actorId: string): Effect.Effect<ActorSnapshot | undefined, RealtimeError>
  replayEvents(actorId: string, fromVersion?: number, toVersion?: number): Effect.Effect<ReplayResult, RealtimeError>
  compactSnapshots(actorId: string, keepVersions: number): Effect.Effect<void, RealtimeError>
}

// Replay Result Interface
export interface ReplayResult {
  actorId: string
  fromVersion: number
  toVersion: number
  events: RealtimeEvent[]
  finalState: any
  duration: number
  checksum: string
}

// Snapshot Manager Implementation
export class SnapshotManagerImpl implements SnapshotManager {
  // Merkle DAG: snapshot-manager-impl

  constructor(
    private eventStore: RealtimeEventStore,
    private stateReducer: (state: any, event: RealtimeEvent) => any,
    private options: {
      maxReplayEvents?: number
      snapshotCompression?: boolean
      checksumValidation?: boolean
    } = {}
  ) {}

  // Create a new snapshot of actor state
  createSnapshot(actorId: string): Effect.Effect<ActorSnapshot, RealtimeError> {
    return Effect.gen(function* () {
      try {
        // Get latest version
        const latestVersion = yield* this.eventStore.getLatestVersion(actorId)

        if (latestVersion === 0) {
          return yield* Effect.fail(
            new RealtimeError(
              `No events found for actor ${actorId}`,
              'NO_EVENTS_FOR_SNAPSHOT',
              { actorId }
            )
          )
        }

        // Replay all events to build current state
        const replayResult = yield* this.replayEvents(actorId, 1, latestVersion)

        // Create snapshot
        const snapshot: ActorSnapshot = {
          actorId,
          state: replayResult.finalState,
          version: latestVersion,
          lastEventId: replayResult.events[replayResult.events.length - 1]?.id || '',
          timestamp: new Date(),
          checksum: yield* this.calculateStateChecksum(replayResult.finalState)
        }

        // Store snapshot
        yield* this.eventStore.createSnapshotInternal(actorId, latestVersion)

        return snapshot
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to create snapshot: ${error instanceof Error ? error.message : String(error)}`,
            'SNAPSHOT_CREATION_FAILED',
            { actorId, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Get the latest available snapshot
  getLatestSnapshot(actorId: string): Effect.Effect<ActorSnapshot | undefined, RealtimeError> {
    return this.eventStore.getLatestSnapshot(actorId)
  }

  // Replay events for an actor within a version range
  replayEvents(
    actorId: string,
    fromVersion: number = 1,
    toVersion?: number
  ): Effect.Effect<ReplayResult, RealtimeError> {
    return Effect.gen(function* () {
      const startTime = Date.now()

      try {
        // Get events in range
        const events = yield* this.eventStore.getEvents(actorId, fromVersion - 1)

        // Filter events by version range
        const filteredEvents = events.filter(event =>
          event.version >= fromVersion &&
          (!toVersion || event.version <= toVersion)
        )

        // Limit events if configured
        const maxEvents = this.options.maxReplayEvents
        const replayEvents = maxEvents && filteredEvents.length > maxEvents
          ? filteredEvents.slice(-maxEvents)
          : filteredEvents

        // Replay events to build state
        let currentState = {}
        for (const event of replayEvents) {
          currentState = this.stateReducer(currentState, event)
        }

        const finalVersion = replayEvents.length > 0
          ? replayEvents[replayEvents.length - 1].version
          : fromVersion

        const result: ReplayResult = {
          actorId,
          fromVersion,
          toVersion: finalVersion,
          events: replayEvents,
          finalState: currentState,
          duration: Date.now() - startTime,
          checksum: yield* this.calculateStateChecksum(currentState)
        }

        return result
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to replay events: ${error instanceof Error ? error.message : String(error)}`,
            'EVENT_REPLAY_FAILED',
            { actorId, fromVersion, toVersion, error }
          )
        )
      }
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Compact old snapshots to save space
  compactSnapshots(actorId: string, keepVersions: number): Effect.Effect<void, RealtimeError> {
    return Effect.gen(function* () {
      try {
        // This is a simplified implementation
        // In a real system, you would:
        // 1. Get all snapshots for the actor
        // 2. Keep the most recent N snapshots
        // 3. Delete older snapshots
        // 4. Ensure event history is preserved for replay

        console.log(`Compacting snapshots for ${actorId}, keeping ${keepVersions} versions`)

        // Placeholder implementation
        return undefined
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to compact snapshots: ${error instanceof Error ? error.message : String(error)}`,
            'SNAPSHOT_COMPACTION_FAILED',
            { actorId, keepVersions, error }
          )
        )
      }
    })
  }

  // Private helper methods
  private calculateStateChecksum(state: any): Effect.Effect<string, RealtimeError> {
    return Effect.gen(function* () {
      try {
        const data = JSON.stringify(state, Object.keys(state).sort())
        let hash = 0

        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convert to 32-bit integer
        }

        return hash.toString(16)
      } catch (error) {
        return yield* Effect.fail(
          new RealtimeError(
            `Failed to calculate checksum: ${error instanceof Error ? error.message : String(error)}`,
            'CHECKSUM_CALCULATION_FAILED',
            { error }
          )
        )
      }
    })
  }
}

// Optimized Replay with Snapshots
export class OptimizedReplayManager {
  // Merkle DAG: optimized-replay-manager

  constructor(
    private snapshotManager: SnapshotManager,
    private eventStore: RealtimeEventStore,
    private stateReducer: (state: any, event: RealtimeEvent) => any
  ) {}

  // Replay from latest snapshot + recent events
  replayFromLatestSnapshot(actorId: string): Effect.Effect<ReplayResult, RealtimeError> {
    return Effect.gen(function* () {
      const startTime = Date.now()

      // Get latest snapshot
      const snapshot = yield* this.snapshotManager.getLatestSnapshot(actorId)

      let baseState: any = {}
      let baseVersion = 0

      if (snapshot) {
        // Validate snapshot if checksum validation is enabled
        const isValid = yield* this.validateSnapshot(snapshot)
        if (!isValid) {
          console.warn(`Snapshot validation failed for ${actorId}, replaying from beginning`)
        } else {
          baseState = snapshot.state
          baseVersion = snapshot.version
        }
      }

      // Get events since snapshot
      const recentEvents = yield* this.eventStore.getEvents(actorId, baseVersion)

      // Apply recent events
      let currentState = { ...baseState }
      for (const event of recentEvents) {
        currentState = this.stateReducer(currentState, event)
      }

      const result: ReplayResult = {
        actorId,
        fromVersion: baseVersion + 1,
        toVersion: baseVersion + recentEvents.length,
        events: recentEvents,
        finalState: currentState,
        duration: Date.now() - startTime,
        checksum: '' // Calculate if needed
      }

      return result
    }).pipe(
      Effect.provideService(Effect.context(), this)
    )
  }

  // Incremental sync from a known version
  incrementalSync(
    actorId: string,
    knownVersion: number,
    maxEvents: number = 100
  ): Effect.Effect<{ events: RealtimeEvent[]; hasMore: boolean; nextVersion: number }, RealtimeError> {
    return Effect.gen(function* () {
      // Get events since known version, limited by maxEvents
      const allEvents = yield* this.eventStore.getEvents(actorId, knownVersion)
      const events = allEvents.slice(0, maxEvents)
      const hasMore = allEvents.length > maxEvents
      const nextVersion = hasMore ? knownVersion + maxEvents : knownVersion + allEvents.length

      return {
        events,
        hasMore,
        nextVersion
      }
    })
  }

  private validateSnapshot(snapshot: ActorSnapshot): Effect.Effect<boolean, RealtimeError> {
    return Effect.gen(function* () {
      // In a real implementation, you would:
      // 1. Recalculate checksum from state
      // 2. Compare with stored checksum
      // 3. Return validation result

      // Placeholder - always return true
      return true
    })
  }
}

// Factory function for creating snapshot manager
export function createSnapshotManager(
  eventStore: RealtimeEventStore,
  stateReducer: (state: any, event: RealtimeEvent) => any,
  options: {
    maxReplayEvents?: number
    snapshotCompression?: boolean
    checksumValidation?: boolean
  } = {}
): SnapshotManager {
  return new SnapshotManagerImpl(eventStore, stateReducer, options)
}

// Factory function for creating optimized replay manager
export function createOptimizedReplayManager(
  snapshotManager: SnapshotManager,
  eventStore: RealtimeEventStore,
  stateReducer: (state: any, event: RealtimeEvent) => any
): OptimizedReplayManager {
  return new OptimizedReplayManager(snapshotManager, eventStore, stateReducer)
}
