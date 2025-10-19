// Merkle DAG: error_handling_core -> structured_errors -> reporting -> recovery_strategies
// Unified error handling system for all packages with structured errors, reporting, and recovery

export interface ErrorContext {
  package: string
  operation: string
  userId?: string
  tenantId?: string
  correlationId?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface StructuredError {
  code: string
  message: string
  context: ErrorContext
  cause?: Error
  stack?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  suggestedAction?: string
}

// Error codes for different packages
export enum ErrorCodes {
  // Actions package
  AUTH_FAILED = 'AUTH_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ACTION_EXECUTION_FAILED = 'ACTION_EXECUTION_FAILED',

  // Data package
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  QUERY_EXECUTION_FAILED = 'QUERY_EXECUTION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Process package
  PROCESS_EXECUTION_FAILED = 'PROCESS_EXECUTION_FAILED',
  TASK_ASSIGNMENT_FAILED = 'TASK_ASSIGNMENT_FAILED',
  BPMN_VALIDATION_FAILED = 'BPMN_VALIDATION_FAILED',

  // Router package
  ROUTING_FAILED = 'ROUTING_FAILED',
  MIDDLEWARE_ERROR = 'MIDDLEWARE_ERROR',

  // Actor package
  ACTOR_EXECUTION_FAILED = 'ACTOR_EXECUTION_FAILED',
  MESSAGE_HANDLING_FAILED = 'MESSAGE_HANDLING_FAILED',

  // CLI package
  COMMAND_EXECUTION_FAILED = 'COMMAND_EXECUTION_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // General
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error recovery strategies
export interface RecoveryStrategy {
  name: string
  description: string
  execute: (error: StructuredError) => Promise<boolean>
}

// Error reporting interface
export interface ErrorReporter {
  report: (error: StructuredError) => Promise<void>
  batchReport?: (errors: StructuredError[]) => Promise<void>
}

// Console-based error reporter (for development)
export class ConsoleErrorReporter implements ErrorReporter {
  async report(error: StructuredError): Promise<void> {
    const severityColor = {
      low: '\x1b[32m',      // Green
      medium: '\x1b[33m',   // Yellow
      high: '\x1b[31m',     // Red
      critical: '\x1b[35m'  // Magenta
    }[error.severity]

    const resetColor = '\x1b[0m'

    console.error(`${severityColor}[${error.severity.toUpperCase()}] ${error.code}${resetColor}: ${error.message}`)
    console.error(`  Package: ${error.context.package}`)
    console.error(`  Operation: ${error.context.operation}`)
    console.error(`  Timestamp: ${error.context.timestamp.toISOString()}`)
    console.error(`  Correlation ID: ${error.context.correlationId || 'N/A'}`)

    if (error.context.userId) {
      console.error(`  User ID: ${error.context.userId}`)
    }

    if (error.context.tenantId) {
      console.error(`  Tenant ID: ${error.context.tenantId}`)
    }

    if (error.suggestedAction) {
      console.error(`  Suggested Action: ${error.suggestedAction}`)
    }

    if (error.stack) {
      console.error(`  Stack Trace:\n${error.stack}`)
    }

    if (error.cause) {
      console.error(`  Caused by: ${error.cause.message}`)
    }
  }

  async batchReport(errors: StructuredError[]): Promise<void> {
    console.error(`\n=== Batch Error Report (${errors.length} errors) ===`)
    for (const error of errors) {
      await this.report(error)
      console.error('---')
    }
  }
}

// In-memory error reporter (for testing)
export class MemoryErrorReporter implements ErrorReporter {
  private errors: StructuredError[] = []

  async report(error: StructuredError): Promise<void> {
    this.errors.push(error)
  }

  async batchReport(errors: StructuredError[]): Promise<void> {
    this.errors.push(...errors)
  }

  getErrors(): StructuredError[] {
    return [...this.errors]
  }

  clear(): void {
    this.errors = []
  }
}

// Error factory for creating structured errors
export class ErrorFactory {
  private packageName: string
  private reporters: ErrorReporter[] = []

  constructor(packageName: string, reporters: ErrorReporter[] = []) {
    this.packageName = packageName
    this.reporters = reporters

    // Add console reporter by default in development
    if (process.env.NODE_ENV !== 'production') {
      this.reporters.push(new ConsoleErrorReporter())
    }
  }

  createError(
    code: ErrorCodes,
    message: string,
    operation: string,
    options: {
      cause?: Error
      severity?: ErrorSeverity
      recoverable?: boolean
      suggestedAction?: string
      userId?: string
      tenantId?: string
      correlationId?: string
      metadata?: Record<string, any>
    } = {}
  ): StructuredError {
    const context: ErrorContext = {
      package: this.packageName,
      operation,
      userId: options.userId,
      tenantId: options.tenantId,
      correlationId: options.correlationId || this.generateCorrelationId(),
      timestamp: new Date(),
      metadata: options.metadata
    }

    const error: StructuredError = {
      code,
      message,
      context,
      cause: options.cause,
      stack: options.cause?.stack,
      severity: options.severity || ErrorSeverity.MEDIUM,
      recoverable: options.recoverable ?? true,
      suggestedAction: options.suggestedAction
    }

    // Report error asynchronously
    this.reportError(error)

    return error
  }

  // Convenience methods for common error types
  authFailed(operation: string, options?: Partial<Parameters<ErrorFactory['createError']>[3]>) {
    return this.createError(
      ErrorCodes.AUTH_FAILED,
      'Authentication failed',
      operation,
      { severity: ErrorSeverity.HIGH, ...options }
    )
  }

  validationFailed(operation: string, details?: string, options?: Partial<Parameters<ErrorFactory['createError']>[3]>) {
    return this.createError(
      ErrorCodes.VALIDATION_FAILED,
      `Validation failed${details ? `: ${details}` : ''}`,
      operation,
      { severity: ErrorSeverity.MEDIUM, ...options }
    )
  }

  databaseError(operation: string, cause: Error, options?: Partial<Parameters<ErrorFactory['createError']>[3]>) {
    return this.createError(
      ErrorCodes.QUERY_EXECUTION_FAILED,
      'Database operation failed',
      operation,
      {
        cause,
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        suggestedAction: 'Check database connection and retry',
        ...options
      }
    )
  }

  networkError(operation: string, cause: Error, options?: Partial<Parameters<ErrorFactory['createError']>[3]>) {
    return this.createError(
      ErrorCodes.NETWORK_ERROR,
      'Network operation failed',
      operation,
      {
        cause,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestedAction: 'Check network connectivity and retry',
        ...options
      }
    )
  }

  timeoutError(operation: string, timeoutMs: number, options?: Partial<Parameters<ErrorFactory['createError']>[3]>) {
    return this.createError(
      ErrorCodes.TIMEOUT_ERROR,
      `Operation timed out after ${timeoutMs}ms`,
      operation,
      {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestedAction: 'Increase timeout or check system performance',
        ...options
      }
    )
  }

  private async reportError(error: StructuredError): Promise<void> {
    try {
      await Promise.allSettled(
        this.reporters.map(reporter => reporter.report(error))
      )
    } catch (reportingError) {
      // If error reporting fails, log to console as last resort
      console.error('Error reporting failed:', reportingError)
    }
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter)
  }

  removeReporter(reporter: ErrorReporter): void {
    const index = this.reporters.indexOf(reporter)
    if (index > -1) {
      this.reporters.splice(index, 1)
    }
  }
}

// Error recovery manager
export class ErrorRecoveryManager {
  private strategies: Map<ErrorCodes, RecoveryStrategy[]> = new Map()

  registerStrategy(errorCode: ErrorCodes, strategy: RecoveryStrategy): void {
    if (!this.strategies.has(errorCode)) {
      this.strategies.set(errorCode, [])
    }
    this.strategies.get(errorCode)!.push(strategy)
  }

  async attemptRecovery(error: StructuredError): Promise<boolean> {
    if (!error.recoverable) {
      return false
    }

    const strategies = this.strategies.get(error.code as ErrorCodes) || []

    for (const strategy of strategies) {
      try {
        const success = await strategy.execute(error)
        if (success) {
          console.log(`Recovery successful using strategy: ${strategy.name}`)
          return true
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError)
      }
    }

    return false
  }
}

// Global error recovery manager instance
export const globalRecoveryManager = new ErrorRecoveryManager()

// Utility function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorFactory: ErrorFactory,
  operationName: string,
  options?: {
    retries?: number
    retryDelay?: number
    onRetry?: (attempt: number, error: StructuredError) => void
  }
): Promise<T> {
  const { retries = 0, retryDelay = 1000, onRetry } = options || {}

  let lastError: StructuredError | null = null

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = errorFactory.createError(
        ErrorCodes.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        operationName,
        {
          cause: error instanceof Error ? error : undefined,
          severity: ErrorSeverity.MEDIUM
        }
      )

      // Attempt recovery
      const recovered = await globalRecoveryManager.attemptRecovery(lastError)
      if (recovered) {
        // Try operation again after successful recovery
        try {
          return await operation()
        } catch (retryError) {
          // Recovery worked but operation still failed
          lastError = errorFactory.createError(
            ErrorCodes.UNKNOWN_ERROR,
            'Operation failed even after recovery',
            operationName,
            {
              cause: retryError instanceof Error ? retryError : undefined,
              severity: ErrorSeverity.HIGH
            }
          )
        }
      }

      // If not the last attempt, wait and retry
      if (attempt <= retries) {
        onRetry?.(attempt, lastError)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }

      // Last attempt failed, throw the error
      throw lastError
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unexpected error in withErrorHandling')
}

// Result type for operations that can fail
export type Result<T, E = StructuredError> =
  | { success: true; data: T }
  | { success: false; error: E }

// Utility function for Result-based error handling
export function createResult<T>(fn: () => T): Result<T> {
  try {
    return { success: true, data: fn() }
  } catch (error) {
    // This is a fallback for synchronous operations
    // In practice, you should use the async withErrorHandling for better error reporting
    return {
      success: false,
      error: {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        context: {
          package: 'unknown',
          operation: 'unknown',
          timestamp: new Date()
        },
        severity: ErrorSeverity.MEDIUM,
        recoverable: false
      }
    }
  }
}

// Factory function to create error factory for a package
export function createErrorFactory(packageName: string, reporters: ErrorReporter[] = []): ErrorFactory {
  return new ErrorFactory(packageName, reporters)
}

// Pre-configured error factories for each package
export const actionsErrorFactory = createErrorFactory('actions')
export const dataErrorFactory = createErrorFactory('data')
export const processErrorFactory = createErrorFactory('process')
export const routerErrorFactory = createErrorFactory('router')
export const actorErrorFactory = createErrorFactory('actor')
export const cliErrorFactory = createErrorFactory('cli')
export const observabilityErrorFactory = createErrorFactory('observability')
export const contractsErrorFactory = createErrorFactory('contracts')
export const devServerErrorFactory = createErrorFactory('dev-server')
