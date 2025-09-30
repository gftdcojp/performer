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

// Storage types (Supabase-like)
export interface FileObject {
  name: string;
  id: string;
  updatedAt: string;
  createdAt: string;
  lastAccessedAt: string;
  metadata: Record<string, unknown>;
}

export interface FileOptions {
  cacheControl?: string;
  contentType?: string;
  duplex?: string;
}

export interface UploadResponse {
  id: string;
  path: string;
  fullPath: string;
}

export interface DownloadResponse {
  data: Blob;
  error?: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  path: string;
  expiresIn: number;
}

export interface SignedUrlOptions {
  expiresIn?: number;
  download?: boolean;
}

export interface Bucket {
  id: string;
  name: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  public: boolean;
}

export interface StorageError {
  message: string;
  statusCode?: number;
}

// Functions types (Supabase Edge Functions + WASM)
export interface WASMFunction {
  id: string;
  name: string;
  version: string;
  description?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'error';
  runtime: 'wasm';
  triggers: FunctionTrigger[];
  permissions: string[];
}

export interface FunctionTrigger {
  type: 'http' | 'event' | 'schedule';
  config: {
    method?: string; // for http
    path?: string; // for http
    eventType?: string; // for event
    cron?: string; // for schedule
  };
}

export interface FunctionInvocation {
  functionId: string;
  invocationId: string;
  trigger: FunctionTrigger;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  executionTime: number; // in milliseconds
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}

export interface FunctionLog {
  id: string;
  functionId: string;
  invocationId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InvokeOptions {
  timeout?: number;
  retries?: number;
}

export interface InvokeResponse {
  data?: unknown;
  error?: FunctionsError;
  invocationId: string;
}

export interface FunctionsError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

// Realtime types (Supabase Realtime equivalent)
export interface RealtimeChannel {
  topic: string;
  subscribed: boolean;
  subscribe(): RealtimeChannel;
  unsubscribe(): void;
  on(event: string, callback: (payload: RealtimePayload) => void): RealtimeChannel;
  off(event: string, callback?: (payload: RealtimePayload) => void): RealtimeChannel;
  send(event: string, payload?: Record<string, unknown>): RealtimeChannel;
}

export interface RealtimePayload {
  eventType: string;
  payload: Record<string, unknown>;
  commit_timestamp: string;
  errors?: string[];
}

export interface DatabaseChangePayload extends RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export interface BroadcastPayload extends RealtimePayload {
  eventType: string;
  payload: Record<string, unknown>;
}

export interface PresencePayload extends RealtimePayload {
  eventType: 'JOIN' | 'LEAVE' | 'SYNC';
  currentPresences: Presence[];
  newPresences: Presence[];
  leftPresences: Presence[];
}

export interface Presence {
  presence_ref: string;
  presence_state: Record<string, unknown>;
}

export interface RealtimeOptions {
  events?: string[];
  schema?: string;
  table?: string;
  filter?: string;
}

export interface RealtimeError {
  message: string;
  details?: unknown;
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
 * StorageAPI provides file storage functionality similar to Supabase Storage.
 * Uses local filesystem for MVP, can be extended to S3-compatible storage.
 */
export class StorageAPI {
  private actorDB: ActorDBClient;
  private basePath: string;

  constructor(actorDB: ActorDBClient, basePath: string = './storage') {
    this.actorDB = actorDB;
    this.basePath = basePath;
  }

  /**
   * Get a bucket reference for operations.
   * @param bucketName - The name of the bucket.
   */
  from(bucketName: string): BucketAPI {
    return new BucketAPI(this.actorDB, bucketName, this.basePath);
  }

  /**
   * Create a new bucket.
   * @param bucketName - The name of the bucket to create.
   */
  async createBucket(bucketName: string): Promise<{ data: Bucket | null; error: StorageError | null }> {
    try {
      // Create bucket directory
      const bucketPath = `${this.basePath}/${bucketName}`;
      await this.ensureDirectoryExists(bucketPath);

      // Record bucket creation in ActorDB
      await this.actorDB.writeEvent({
        entityId: `bucket_${bucketName}`,
        eventType: 'bucket_created',
        payload: {
          bucketName,
          createdAt: new Date().toISOString(),
          owner: 'system', // In production, get from current user
          public: false,
        },
        timestamp: new Date(),
        version: 1,
      });

      const bucket: Bucket = {
        id: `bucket_${bucketName}`,
        name: bucketName,
        owner: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        public: false,
      };

      return { data: bucket, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Failed to create bucket' },
      };
    }
  }

  /**
   * Delete a bucket.
   * @param bucketName - The name of the bucket to delete.
   */
  async deleteBucket(bucketName: string): Promise<{ data: { message: string } | null; error: StorageError | null }> {
    try {
      // Record bucket deletion in ActorDB
      await this.actorDB.writeEvent({
        entityId: `bucket_${bucketName}`,
        eventType: 'bucket_deleted',
        payload: {
          bucketName,
          deletedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
        version: 2,
      });

      // TODO: Remove bucket directory and all files
      // For now, just return success

      return { data: { message: 'Bucket deleted successfully' }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Failed to delete bucket' },
      };
    }
  }

  /**
   * List all buckets.
   */
  async listBuckets(): Promise<{ data: Bucket[] | null; error: StorageError | null }> {
    try {
      // In production, query ActorDB for bucket events
      // For MVP, return mock data
      const buckets: Bucket[] = [
        {
          id: 'bucket_default',
          name: 'default',
          owner: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          public: true,
        },
      ];

      return { data: buckets, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Failed to list buckets' },
      };
    }
  }

  /**
   * Ensure directory exists (helper method).
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    // In browser environment, this would be different
    // For Node.js environment, use fs
    try {
      // Using dynamic import for Node.js fs module
      const fs = await import('fs/promises');
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // In browser, directories don't need to be created explicitly
      console.warn('Directory creation not supported in browser environment');
    }
  }
}

/**
 * BucketAPI provides operations within a specific bucket.
 */
export class BucketAPI {
  private actorDB: ActorDBClient;
  private bucketName: string;
  private basePath: string;

  constructor(actorDB: ActorDBClient, bucketName: string, basePath: string) {
    this.actorDB = actorDB;
    this.bucketName = bucketName;
    this.basePath = basePath;
  }

  /**
   * Upload a file to the bucket.
   * @param path - The path within the bucket.
   * @param fileBody - The file content (Blob, File, ArrayBuffer, or string).
   * @param fileOptions - Upload options.
   */
  async upload(
    path: string,
    fileBody: Blob | File | ArrayBuffer | string,
    fileOptions?: FileOptions
  ): Promise<{ data: UploadResponse | null; error: StorageError | null }> {
    try {
      // Convert fileBody to Buffer/Blob for storage
      let fileData: Blob | ArrayBuffer;
      if (typeof fileBody === 'string') {
        fileData = new Blob([fileBody]);
      } else if (fileBody instanceof ArrayBuffer) {
        fileData = fileBody;
      } else {
        fileData = fileBody;
      }

      // Generate file ID
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Record file upload in ActorDB
      await this.actorDB.writeEvent({
        entityId: `file_${this.bucketName}_${path}`,
        eventType: 'file_uploaded',
        payload: {
          fileId,
          bucketName: this.bucketName,
          path,
          size: fileData.size || 0,
          contentType: fileOptions?.contentType || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          metadata: fileOptions || {},
        },
        timestamp: new Date(),
        version: 1,
      });

      // In production, store file data
      // For MVP, just record metadata

      const uploadResponse: UploadResponse = {
        id: fileId,
        path,
        fullPath: `${this.bucketName}/${path}`,
      };

      return { data: uploadResponse, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Upload failed' },
      };
    }
  }

  /**
   * Download a file from the bucket.
   * @param path - The path of the file to download.
   */
  async download(path: string): Promise<{ data: DownloadResponse | null; error: StorageError | null }> {
    try {
      // In production, retrieve file from storage
      // For MVP, return mock data
      const mockData = new Blob(['Mock file content'], { type: 'text/plain' });

      return {
        data: { data: mockData },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Download failed' },
      };
    }
  }

  /**
   * Delete a file from the bucket.
   * @param paths - Array of file paths to delete.
   */
  async remove(paths: string[]): Promise<{ data: { message: string } | null; error: StorageError | null }> {
    try {
      // Record file deletions in ActorDB
      for (const path of paths) {
        await this.actorDB.writeEvent({
          entityId: `file_${this.bucketName}_${path}`,
          eventType: 'file_deleted',
          payload: {
            bucketName: this.bucketName,
            path,
            deletedAt: new Date().toISOString(),
          },
          timestamp: new Date(),
          version: 2,
        });
      }

      return { data: { message: 'Files deleted successfully' }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Delete failed' },
      };
    }
  }

  /**
   * List files in the bucket.
   * @param path - The path prefix to list files from.
   * @param options - List options.
   */
  async list(
    path?: string,
    options?: { limit?: number; offset?: number; sortBy?: { column: string; order: 'asc' | 'desc' } }
  ): Promise<{ data: { files: FileObject[] } | null; error: StorageError | null }> {
    try {
      // In production, query ActorDB for file metadata
      // For MVP, return mock data
      const mockFiles: FileObject[] = [
        {
          name: 'example.txt',
          id: 'file_123',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          metadata: { size: 1024, contentType: 'text/plain' },
        },
      ];

      return { data: { files: mockFiles }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'List failed' },
      };
    }
  }

  /**
   * Get a public URL for a file.
   * @param path - The path of the file.
   */
  getPublicUrl(path: string): { data: { publicUrl: string } | null; error: StorageError | null } {
    try {
      // In production, generate actual public URL
      // For MVP, return mock URL
      const publicUrl = `https://storage.performer.dev/${this.bucketName}/${path}`;

      return { data: { publicUrl }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Failed to get public URL' },
      };
    }
  }

  /**
   * Create a signed URL for private file access.
   * @param path - The path of the file.
   * @param options - Signed URL options.
   */
  createSignedUrl(
    path: string,
    options?: SignedUrlOptions
  ): Promise<{ data: SignedUrlResponse | null; error: StorageError | null }> {
    return new Promise((resolve) => {
      try {
        // In production, generate actual signed URL with expiration
        // For MVP, return mock signed URL
        const expiresIn = options?.expiresIn || 3600;
        const signedUrl = `https://storage.performer.dev/signed/${this.bucketName}/${path}?token=mock_token&expires=${expiresIn}`;

        const response: SignedUrlResponse = {
          signedUrl,
          path: `${this.bucketName}/${path}`,
          expiresIn,
        };

        resolve({ data: response, error: null });
      } catch (error) {
        resolve({
          data: null,
          error: { message: error instanceof Error ? error.message : 'Failed to create signed URL' },
        });
      }
    });
  }
}

/**
 * FunctionsAPI provides serverless function execution using WASM.
 * Similar to Supabase Edge Functions but WASM-native.
 */
export class FunctionsAPI {
  private actorDB: ActorDBClient;
  private computeEngine: any; // Import from WASM layer

  constructor(actorDB: ActorDBClient) {
    this.actorDB = actorDB;
    // Initialize WASM compute engine
    this.initializeComputeEngine();
  }

  private async initializeComputeEngine() {
    try {
      // Dynamic import of WASM compute engine
      const { computeEngine } = await import('../wasm/index.js');
      this.computeEngine = computeEngine;
    } catch (error) {
      console.warn('WASM compute engine not available, using fallback mode');
      this.computeEngine = null;
    }
  }

  /**
   * Deploy a WASM function.
   * @param name - Function name.
   * @param wasmBytes - WASM module bytes.
   * @param metadata - Function metadata and triggers.
   */
  async deploy(
    name: string,
    wasmBytes: Uint8Array,
    metadata: {
      description?: string;
      version?: string;
      triggers?: FunctionTrigger[];
      permissions?: string[];
    } = {}
  ): Promise<{ data: WASMFunction | null; error: FunctionsError | null }> {
    try {
      const functionId = `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Load WASM module into compute engine
      if (this.computeEngine) {
        await this.computeEngine.manager.loadModule(functionId, wasmBytes);
        await this.computeEngine.manager.instantiateModule(functionId, {
          // WASM imports for serverless functions
          env: {
            log_info: (ptr: number, len: number) => this.logFunction(functionId, 'info', ptr, len),
            log_warn: (ptr: number, len: number) => this.logFunction(functionId, 'warn', ptr, len),
            log_error: (ptr: number, len: number) => this.logFunction(functionId, 'error', ptr, len),
          },
        });
      }

      // Record function deployment in ActorDB
      await this.actorDB.writeEvent({
        entityId: `function_${functionId}`,
        eventType: 'function_deployed',
        payload: {
          functionId,
          name,
          version: metadata.version || '1.0.0',
          description: metadata.description,
          author: 'current_user', // In production, get from auth context
          triggers: metadata.triggers || [],
          permissions: metadata.permissions || [],
          deployedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
        version: 1,
      });

      const wasmFunction: WASMFunction = {
        id: functionId,
        name,
        version: metadata.version || '1.0.0',
        description: metadata.description,
        author: 'current_user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        runtime: 'wasm',
        triggers: metadata.triggers || [],
        permissions: metadata.permissions || [],
      };

      return { data: wasmFunction, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Function deployment failed' },
      };
    }
  }

  /**
   * Invoke a function by name.
   * @param functionName - Name of the function to invoke.
   * @param payload - Input payload for the function.
   * @param options - Invocation options.
   */
  async invoke(
    functionName: string,
    payload: Record<string, unknown> = {},
    options: InvokeOptions = {}
  ): Promise<InvokeResponse> {
    const invocationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Find function by name (in production, query ActorDB)
      // For MVP, assume functionId = functionName
      const functionId = functionName;

      // Record function invocation start
      await this.actorDB.writeEvent({
        entityId: `invocation_${invocationId}`,
        eventType: 'function_invoked',
        payload: {
          functionId,
          invocationId,
          input: payload,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
        version: 1,
      });

      let result: unknown;

      if (this.computeEngine) {
        // Execute WASM function
        result = await this.computeEngine.executeComputation(functionId, 'main', payload);
      } else {
        // Fallback: mock execution
        result = { message: 'Function executed successfully', input: payload };
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate execution time
      }

      const executionTime = Date.now() - startTime;

      // Record successful completion
      await this.actorDB.writeEvent({
        entityId: `invocation_${invocationId}`,
        eventType: 'function_completed',
        payload: {
          functionId,
          invocationId,
          output: result,
          executionTime,
          completedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
        version: 2,
      });

      return {
        data: result,
        invocationId,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record function failure
      await this.actorDB.writeEvent({
        entityId: `invocation_${invocationId}`,
        eventType: 'function_failed',
        payload: {
          invocationId,
          error: error instanceof Error ? error.message : 'Function execution failed',
          executionTime,
          failedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
        version: 2,
      });

      return {
        error: {
          message: error instanceof Error ? error.message : 'Function execution failed',
          statusCode: 500,
        },
        invocationId,
      };
    }
  }

  /**
   * List all deployed functions.
   */
  async list(): Promise<{ data: WASMFunction[] | null; error: FunctionsError | null }> {
    try {
      // In production, query ActorDB for deployed functions
      // For MVP, return mock data
      const functions: WASMFunction[] = [
        {
          id: 'func_example',
          name: 'example-function',
          version: '1.0.0',
          description: 'Example WASM function',
          author: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          runtime: 'wasm',
          triggers: [{
            type: 'http',
            config: { method: 'POST', path: '/api/example' },
          }],
          permissions: ['read'],
        },
      ];

      return { data: functions, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Failed to list functions' },
      };
    }
  }

  /**
   * Get function logs.
   * @param functionId - ID of the function.
   * @param options - Query options.
   */
  async getLogs(
    functionId: string,
    options: { limit?: number; since?: string } = {}
  ): Promise<{ data: FunctionLog[] | null; error: FunctionsError | null }> {
    try {
      // In production, query ActorDB for function logs
      // For MVP, return mock data
      const logs: FunctionLog[] = [
        {
          id: 'log_1',
          functionId,
          invocationId: 'inv_123',
          level: 'info',
          message: 'Function executed successfully',
          timestamp: new Date().toISOString(),
        },
      ];

      return { data: logs, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Failed to get logs' },
      };
    }
  }

  /**
   * Delete a function.
   * @param functionId - ID of the function to delete.
   */
  async delete(functionId: string): Promise<{ error: FunctionsError | null }> {
    try {
      // Record function deletion
      await this.actorDB.writeEvent({
        entityId: `function_${functionId}`,
        eventType: 'function_deleted',
        payload: {
          functionId,
          deletedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
        version: 3,
      });

      // Clean up WASM instance
      if (this.computeEngine) {
        // Dispose WASM instance
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Failed to delete function' },
      };
    }
  }

  /**
   * Helper method to log from WASM functions.
   */
  private logFunction(functionId: string, level: 'info' | 'warn' | 'error', ptr: number, len: number): void {
    // In a real implementation, this would read from WASM memory
    // For MVP, just log to console
    console.log(`[${level.toUpperCase()}] Function ${functionId}: WASM log message`);
  }
}

/**
 * RealtimeAPI provides WebSocket-based real-time communication.
 * Similar to Supabase Realtime but integrated with ActorDB event streaming.
 */
export class RealtimeAPI {
  private actorDB: ActorDBClient;
  private wsClient: any; // ActorDBWebSocketClient
  private channels = new Map<string, RealtimeChannelImpl>();

  constructor(actorDB: ActorDBClient) {
    this.actorDB = actorDB;
    this.initializeWebSocketClient();
  }

  private async initializeWebSocketClient() {
    try {
      // Import ActorDBWebSocketClient dynamically
      const { ActorDBWebSocketClient } = await import('./actordb-client');
      this.wsClient = new ActorDBWebSocketClient({
        host: 'localhost', // In production, get from config
        port: 9091,
        secure: false,
        timeout: 30000,
        token: 'mock_token', // In production, get from auth
      });
    } catch (error) {
      console.warn('WebSocket client not available, using fallback mode');
      this.wsClient = null;
    }
  }

  /**
   * Create a new realtime channel.
   * @param topic - The channel topic/name.
   */
  channel(topic: string): RealtimeChannel {
    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    const channel = new RealtimeChannelImpl(topic, this.actorDB, this.wsClient);
    this.channels.set(topic, channel);
    return channel;
  }

  /**
   * Remove a channel.
   * @param topic - The channel topic to remove.
   */
  removeChannel(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(topic);
    }
  }

  /**
   * Get all active channels.
   */
  getChannels(): RealtimeChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Disconnect all channels and cleanup.
   */
  disconnect(): void {
    for (const channel of this.channels.values()) {
      channel.unsubscribe();
    }
    this.channels.clear();
  }
}

/**
 * RealtimeChannel implementation.
 */
export class RealtimeChannelImpl implements RealtimeChannel {
  private _topic: string;
  private actorDB: ActorDBClient;
  private wsClient: any;
  private _subscribed: boolean = false;
  private eventListeners = new Map<string, Set<(payload: RealtimePayload) => void>>();
  private presenceState: Map<string, Presence> = new Map();
  private presenceRef: string;

  constructor(topic: string, actorDB: ActorDBClient, wsClient: any) {
    this._topic = topic;
    this.actorDB = actorDB;
    this.wsClient = wsClient;
    this.presenceRef = `presence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  get topic(): string {
    return this._topic;
  }

  get subscribed(): boolean {
    return this._subscribed;
  }

  /**
   * Subscribe to the channel.
   */
  subscribe(): RealtimeChannel {
    if (this._subscribed) return this;

    this._subscribed = true;

    // Connect to WebSocket if available
    if (this.wsClient) {
      this.connectWebSocket();
    }

    // Emit join event for presence
    this.emitPresenceEvent('JOIN', {
      presence_ref: this.presenceRef,
      presence_state: { user_id: 'current_user' }, // In production, get from auth
    });

    return this;
  }

  /**
   * Unsubscribe from the channel.
   */
  unsubscribe(): void {
    if (!this._subscribed) return;

    this._subscribed = false;

    // Emit leave event for presence
    this.emitPresenceEvent('LEAVE', {
      presence_ref: this.presenceRef,
      presence_state: {},
    });

    // Disconnect WebSocket
    if (this.wsClient) {
      this.disconnectWebSocket();
    }

    // Clear all listeners
    this.eventListeners.clear();
  }

  /**
   * Listen to events on the channel.
   * @param event - The event type to listen for.
   * @param callback - The callback function.
   */
  on(event: string, callback: (payload: RealtimePayload) => void): RealtimeChannel {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return this;
  }

  /**
   * Stop listening to events on the channel.
   * @param event - The event type to stop listening for.
   * @param callback - The specific callback to remove (optional).
   */
  off(event: string, callback?: (payload: RealtimePayload) => void): RealtimeChannel {
    if (!this.eventListeners.has(event)) return this;

    const listeners = this.eventListeners.get(event)!;
    if (callback) {
      listeners.delete(callback);
    } else {
      listeners.clear();
    }

    if (listeners.size === 0) {
      this.eventListeners.delete(event);
    }

    return this;
  }

  /**
   * Send a message to the channel.
   * @param event - The event type.
   * @param payload - The payload to send.
   */
  send(event: string, payload: Record<string, unknown> = {}): RealtimeChannel {
    if (!this._subscribed) return this;

    const broadcastPayload: BroadcastPayload = {
      eventType: event,
      payload,
      commit_timestamp: new Date().toISOString(),
    };

    // Emit to local listeners
    this.emitEvent(event, broadcastPayload);

    // Send via WebSocket if available
    if (this.wsClient) {
      this.sendWebSocketMessage({
        type: 'broadcast',
        topic: this._topic,
        event,
        payload,
      });
    }

    return this;
  }

  /**
   * Track presence state.
   * @param state - The presence state to track.
   */
  track(state: Record<string, unknown>): RealtimeChannel {
    this.presenceState.set(this.presenceRef, {
      presence_ref: this.presenceRef,
      presence_state: state,
    });

    this.emitPresenceEvent('SYNC', {
      presence_ref: this.presenceRef,
      presence_state: state,
    });

    return this;
  }

  /**
   * Untrack presence state.
   */
  untrack(): RealtimeChannel {
    this.presenceState.delete(this.presenceRef);

    this.emitPresenceEvent('LEAVE', {
      presence_ref: this.presenceRef,
      presence_state: {},
    });

    return this;
  }

  private emitEvent(event: string, payload: RealtimePayload): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in realtime event listener:', error);
        }
      });
    }
  }

  private emitPresenceEvent(eventType: 'JOIN' | 'LEAVE' | 'SYNC', presence: Presence): void {
    const payload: PresencePayload = {
      eventType,
      payload: {},
      commit_timestamp: new Date().toISOString(),
      currentPresences: Array.from(this.presenceState.values()),
      newPresences: eventType === 'JOIN' ? [presence] : [],
      leftPresences: eventType === 'LEAVE' ? [presence] : [],
    };

    this.emitEvent('presence', payload);
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.wsClient) {
      console.warn('WebSocket client not available, using local-only mode');
      return;
    }

    try {
      await this.wsClient.connect();

      // Subscribe to database changes for this topic
      this.wsClient.send({
        type: 'subscribe',
        topic: this._topic,
        events: ['database_changes', 'broadcast', 'presence'],
      });

      // Set up message handler
      this.wsClient.subscribeToEvents('*', (event: any) => {
        this.handleWebSocketMessage(event);
      });

    } catch (error) {
      console.warn('Failed to connect WebSocket for realtime, falling back to local mode:', error);
    }
  }

  private disconnectWebSocket(): void {
    if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) return;

    this.wsClient.send({
      type: 'unsubscribe',
      topic: this._topic,
    });
  }

  private sendWebSocketMessage(message: Record<string, unknown>): void {
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      this.wsClient.send(message);
    }
  }

  private handleWebSocketMessage(event: any): void {
    // Handle incoming WebSocket messages
    if (event.eventType === 'database_change') {
      const payload: DatabaseChangePayload = {
        eventType: event.payload.eventType,
        new: event.payload.new,
        old: event.payload.old,
        schema: event.payload.schema,
        table: event.payload.table,
        commit_timestamp: event.payload.commit_timestamp,
        payload: event.payload,
      };
      this.emitEvent('postgres_changes', payload);
    } else if (event.eventType === 'broadcast') {
      const payload: BroadcastPayload = {
        eventType: event.payload.event,
        payload: event.payload.payload,
        commit_timestamp: new Date().toISOString(),
      };
      this.emitEvent('broadcast', payload);
    }
  }
}

/**
 * The main client for interacting with the Performer backend (ActorDB).
 * Provides a high-level API inspired by Supabase.
 */
export class PerformerClient {
  private actorDB: ActorDBClient;
  private _auth: AuthAPI;
  private _storage: StorageAPI;
  private _functions: FunctionsAPI;
  private _realtime: RealtimeAPI;

  constructor(actorDB: ActorDBClient, storagePath: string = './storage') {
    this.actorDB = actorDB;
    this._auth = new AuthAPI(actorDB);
    this._storage = new StorageAPI(actorDB, storagePath);
    this._functions = new FunctionsAPI(actorDB);
    this._realtime = new RealtimeAPI(actorDB);
  }

  /**
   * Creates a new PerformerClient from an ActorDBClient.
   * @param actorDB - The ActorDB client instance.
   * @param storagePath - The base path for file storage.
   */
  static fromActorDB(actorDB: ActorDBClient, storagePath: string = './storage'): PerformerClient {
    return new PerformerClient(actorDB, storagePath);
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

  /**
   * Storage API - similar to Supabase Storage.
   */
  get storage(): StorageAPI {
    return this._storage;
  }

  /**
   * Functions API - WASM-based serverless functions (Supabase Edge Functions equivalent).
   */
  get functions(): FunctionsAPI {
    return this._functions;
  }

  /**
   * Realtime API - WebSocket-based real-time communication (Supabase Realtime equivalent).
   */
  get realtime(): RealtimeAPI {
    return this._realtime;
  }

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
