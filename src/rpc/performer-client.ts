// src/rpc/performer-client.ts
// Merkle DAG: rpc-node -> performer-client
// Provides a high-level, Supabase-like client for interacting with ActorDB.

import type { ActorDBClient } from './client';

// Auth types from ActorDB Security Gateway
export interface User {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface AuthResponse {
  user: User;
  session: Session;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  tenantId?: string;
  attributes?: Record<string, unknown>;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'in';

interface Filter {
  field: string;
  operator: Operator;
  value: unknown;
}

/**
 * QueryBuilder provides a chainable interface for constructing ActorDB queries.
 * Inspired by Supabase's query builder but adapted for ActorDB projections.
 */
export class QueryBuilder<T extends Record<string, unknown> = Record<string, unknown>> {
  private actorDB: ActorDBClient;
  private projectionName: string;
  private filters: Filter[] = [];
  private selectedFields: string[] | string = '*';
  private orderField: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;

  constructor(projectionName: string, actorDB: ActorDBClient) {
    this.projectionName = projectionName;
    this.actorDB = actorDB;
  }

  /**
   * Specifies the fields to retrieve.
   * @param fields - A comma-separated string or an array of field names. Defaults to '*'.
   */
  select(fields: string | string[] = '*'): this {
    this.selectedFields = fields;
    return this;
  }

  /**
   * Filters the query with an equality condition.
   * @param field - The field to filter on.
   * @param value - The value to compare against.
   */
  eq(field: string, value: unknown): this {
    return this.filter(field, 'eq', value);
  }

  /**
   * Filters the query with a not-equal condition.
   */
  neq(field: string, value: unknown): this {
    return this.filter(field, 'neq', value);
  }

  /**
   * Filters the query with a greater-than condition.
   */
  gt(field: string, value: unknown): this {
    return this.filter(field, 'gt', value);
  }

  /**
   * Filters the query with a greater-than-or-equal condition.
   */
  gte(field: string, value: unknown): this {
    return this.filter(field, 'gte', value);
  }

  /**
   * Filters the query with a less-than condition.
   */
  lt(field: string, value: unknown): this {
    return this.filter(field, 'lt', value);
  }

  /**
   * Filters the query with a less-than-or-equal condition.
   */
  lte(field: string, value: unknown): this {
    return this.filter(field, 'lte', value);
  }

  /**
   * Filters the query with a LIKE pattern match.
   */
  like(field: string, pattern: string): this {
    return this.filter(field, 'like', pattern);
  }

  /**
   * Filters the query with an IN condition.
   */
  in(field: string, values: readonly unknown[]): this {
    return this.filter(field, 'in', values);
  }

  /**
   * Adds a custom filter condition.
   * @param field - The field to filter on.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   */
  filter(field: string, operator: Operator, value: unknown): this {
    this.filters.push({ field, operator, value });
    return this;
  }

  /**
   * Orders the results by a field.
   * @param field - The field to order by.
   * @param ascending - Whether to sort in ascending order (default: true).
   */
  order(field: string, ascending: boolean = true): this {
    this.orderField = field;
    this.orderAscending = ascending;
    return this;
  }

  /**
   * Limits the number of results.
   * @param count - The maximum number of results to return.
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  /**
   * Executes the query and returns a Promise.
   * This allows the QueryBuilder to be awaited directly.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    try {
      // Get the projection state from ActorDB
      const projectionData = await this.actorDB.getProjectionState(this.projectionName);

      // Apply client-side filtering and transformations
      let result = this.applyFilters(projectionData);
      result = this.applyOrdering(result);
      result = this.applyLimit(result);
      result = this.applyFieldSelection(result);

      // Return the result as an array (Supabase-like behavior)
      const resultArray = Array.isArray(result) ? result : [result];

      return onfulfilled ? onfulfilled(resultArray) : (resultArray as unknown as TResult1);
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Applies filters to the data (client-side filtering).
   * In a production implementation, this would be pushed to the server.
   */
  private applyFilters(data: unknown): unknown {
    if (this.filters.length === 0) return data;

    // If data is an array, filter each item
    if (Array.isArray(data)) {
      return data.filter(item => this.matchesFilters(item));
    }

    // If data is a single object, check if it matches filters
    return this.matchesFilters(data) ? data : null;
  }

  /**
   * Checks if an item matches all the applied filters.
   */
  private matchesFilters(item: unknown): boolean {
    if (typeof item !== 'object' || item === null) return false;

    const obj = item as Record<string, unknown>;

    return this.filters.every(filter => {
      const value = obj[filter.field];
      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'neq':
          return value !== filter.value;
        case 'gt':
          return typeof value === 'number' && typeof filter.value === 'number' && value > filter.value;
        case 'gte':
          return typeof value === 'number' && typeof filter.value === 'number' && value >= filter.value;
        case 'lt':
          return typeof value === 'number' && typeof filter.value === 'number' && value < filter.value;
        case 'lte':
          return typeof value === 'number' && typeof filter.value === 'number' && value <= filter.value;
        case 'like':
          return typeof value === 'string' && typeof filter.value === 'string' &&
                 new RegExp(filter.value.replace(/%/g, '.*')).test(value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        default:
          return true;
      }
    });
  }

  /**
   * Applies ordering to the data.
   */
  private applyOrdering(data: unknown): unknown {
    if (!this.orderField || !Array.isArray(data)) return data;

    return [...data].sort((a, b) => {
      if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return 0;

      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const aVal = aObj[this.orderField];
      const bVal = bObj[this.orderField];

      if (aVal < bVal) return this.orderAscending ? -1 : 1;
      if (aVal > bVal) return this.orderAscending ? 1 : -1;
      return 0;
    });
  }

  /**
   * Applies limit to the data.
   */
  private applyLimit(data: unknown): unknown {
    if (!this.limitCount || !Array.isArray(data)) return data;
    return data.slice(0, this.limitCount);
  }

  /**
   * Applies field selection to the data.
   */
  private applyFieldSelection(data: unknown): unknown {
    if (this.selectedFields === '*' || !this.selectedFields) return data;

    const fields = Array.isArray(this.selectedFields)
      ? this.selectedFields
      : this.selectedFields.split(',').map(f => f.trim());

    const selectFields = (item: unknown): unknown => {
      if (typeof item !== 'object' || item === null) return item;

      const obj = item as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      fields.forEach(field => {
        if (field in obj) {
          result[field] = obj[field];
        }
      });
      return result;
    };

    if (Array.isArray(data)) {
      return data.map(selectFields);
    }

    return selectFields(data);
  }
}

/**
 * AuthAPI provides authentication functionality similar to Supabase Auth.
 * Uses ActorDB's Security Gateway for JWT validation and RBAC.
 */
export class AuthAPI {
  private actorDB: ActorDBClient;
  private currentSession: Session | null = null;

  constructor(actorDB: ActorDBClient) {
    this.actorDB = actorDB;
  }

  /**
   * Sign up a new user.
   * In production, this would create a user in the database and return tokens.
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      // Mock implementation - in production, this would call ActorDB user creation API
      // For now, simulate user creation and return mock tokens
      const user: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        tenantId: data.tenantId || 'default',
        roles: ['user'],
        attributes: data.attributes || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const session: Session = {
        user,
        accessToken: `mock_jwt_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      };

      this.currentSession = session;

      return { user, session };
    } catch (error) {
      return {
        user: {} as User,
        session: {} as Session,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }

  /**
   * Sign in with email and password.
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      // Mock implementation - in production, this would validate credentials with ActorDB
      // and return real JWT tokens from the Security Gateway
      const user: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        tenantId: 'default',
        roles: ['user'],
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const session: Session = {
        user,
        accessToken: `mock_jwt_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      };

      this.currentSession = session;

      return { user, session };
    } catch (error) {
      return {
        user: {} as User,
        session: {} as Session,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<void> {
    this.currentSession = null;
  }

  /**
   * Get the current session.
   */
  getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get the current user.
   */
  getUser(): User | null {
    return this.currentSession?.user || null;
  }

  /**
   * Refresh the current session.
   */
  async refreshSession(): Promise<AuthResponse> {
    if (!this.currentSession?.refreshToken) {
      return {
        user: {} as User,
        session: {} as Session,
        error: 'No refresh token available',
      };
    }

    try {
      // Mock implementation - in production, this would call ActorDB token refresh
      const session: Session = {
        ...this.currentSession,
        accessToken: `refreshed_jwt_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      this.currentSession = session;

      return { user: session.user, session };
    } catch (error) {
      return {
        user: {} as User,
        session: {} as Session,
        error: error instanceof Error ? error.message : 'Session refresh failed',
      };
    }
  }

  /**
   * Listen to auth state changes.
   */
  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) => void): () => void {
    // Mock implementation - in production, this would subscribe to ActorDB auth events
    const currentSession = this.currentSession;
    callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);

    // Return unsubscribe function
    return () => {
      // Cleanup subscription
    };
  }
}

/**
 * The main client for interacting with the Performer backend (ActorDB).
 * Provides a high-level API inspired by Supabase.
 */
export class PerformerClient {
  private actorDB: ActorDBClient;
  private _auth: AuthAPI;

  constructor(actorDB: ActorDBClient) {
    this.actorDB = actorDB;
    this._auth = new AuthAPI(actorDB);
  }

  /**
   * Creates a new PerformerClient from an ActorDBClient.
   * @param actorDB - The ActorDB client instance.
   */
  static fromActorDB(actorDB: ActorDBClient): PerformerClient {
    return new PerformerClient(actorDB);
  }

  /**
   * Selects a projection to query from.
   * This is equivalent to Supabase's `.from()` method.
   * @param projectionName - The name of the projection (similar to a table name).
   */
  from<T extends Record<string, unknown> = Record<string, unknown>>(projectionName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(projectionName, this.actorDB);
  }

  /**
   * Authentication API - similar to Supabase Auth.
   */
  get auth(): AuthAPI {
    return this._auth;
  }

  // Placeholder for future BaaS features (Supabase-like)
  // storage: StorageAPI;
  // functions: FunctionsAPI;

  /**
   * Access to the underlying ActorDB client for advanced usage.
   */
  get actorDBClient(): ActorDBClient {
    return this.actorDB;
  }
}

// Factory function for easy client creation
export function createPerformerClient(actorDB: ActorDBClient): PerformerClient {
  return PerformerClient.fromActorDB(actorDB);
}
