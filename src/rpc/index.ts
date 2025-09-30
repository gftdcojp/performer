// ActorDB TypeScript Client
// Main entry point for the client library

// Core client
export { ActorDBClient, createClient, defaultConfig } from './client';

// High-level abstractions
export { Actor, ActorManager } from './actor';

// Query building utilities
export { QueryBuilder, QueryBuilders } from './query-builder';

// Performer client (Supabase-like interface)
export { PerformerClient, createPerformerClient } from './performer-client';

// Type definitions
export type {
  Event,
  WriteResult,
  QueryRequest,
  QueryResponse,
  ProjectionDefinition,
  SourceDefinition,
  IVMConfig,
  DeltaRule,
  SecurityConfig,
  MaterializationConfig,
  ClientConfig,
  HealthStatus,
  Metrics,
} from './types';

export { ActorDBError } from './types';

// Convenience functions for quick setup
import { createClient, defaultConfig } from './client';
import { ActorManager } from './actor';
import { QueryBuilders } from './query-builder';

/**
 * Quick setup function for common use cases
 */
export function quickStart(baseURL: string, token?: string) {
  const config = {
    ...defaultConfig,
    baseURL,
    token,
  };

  const client = createClient(config);
  const actors = new ActorManager(client);
  const queries = new QueryBuilders(client);

  return {
    client,
    actors,
    queries,
  };
}

/**
 * Quick setup function for PerformerClient (Supabase-like interface)
 */
export function quickStartPerformer(baseURL: string, token?: string) {
  const config = {
    ...defaultConfig,
    baseURL,
    token,
  };

  const actorDB = createClient(config);
  const performer = PerformerClient.fromActorDB(actorDB);

  return {
    actorDB,
    performer,
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * import { quickStart, quickStartPerformer } from 'actordb-client';
 *
 * // ActorDB client usage
 * const { client, actors, queries } = quickStart('http://localhost:9090', 'your-token');
 *
 * // Create an actor
 * const user = actors.getActor('user-123', 'user');
 * await user.create();
 *
 * // Write an event
 * await user.writeEvent('user_created', { name: 'John Doe', email: 'john@example.com' });
 *
 * // Query data
 * const result = await queries.projectionState('user_profiles').execute();
 * console.log(result.data);
 *
 * // Performer client usage (Supabase-like interface)
 * const { performer } = quickStartPerformer('http://localhost:9090', 'your-token');
 *
 * // Authentication
 * const { data: authData, error } = await performer.auth.signUp({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * if (authData.user) {
 *   console.log('User signed up:', authData.user.email);
 * }
 *
 * // Query with Supabase-like syntax
 * const users = await performer
 *   .from('user_profiles')
 *   .select('name,email')
 *   .eq('active', true)
 *   .limit(10);
 *
 * console.log(users);
 * ```
 */
