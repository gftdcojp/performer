// Merkle DAG: observability_core -> opentelemetry_integration -> sentry_logging -> structured_output
// OpenTelemetry, Sentry, structured logging (jsonl) for monitoring and auditing

import * as opentelemetry from "@opentelemetry/api";
import * as Sentry from "@sentry/node";

export interface ObservabilityConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  sentry?: {
    dsn: string;
    tracesSampleRate?: number;
  };
  opentelemetry?: {
    endpoint?: string;
  };
}

export class ObservabilityManager {
  private tracer: opentelemetry.Tracer;
  private meter: opentelemetry.Meter;

  constructor(private config: ObservabilityConfig) {
    // Initialize Sentry
    if (config.sentry) {
      Sentry.init({
        dsn: config.sentry.dsn,
        tracesSampleRate: config.sentry.tracesSampleRate || 1.0,
        environment: config.environment,
        release: `${config.serviceName}@${config.serviceVersion}`,
      });
    }

    // Initialize OpenTelemetry
    this.tracer = opentelemetry.trace.getTracer(
      config.serviceName,
      config.serviceVersion
    );
    this.meter = opentelemetry.metrics.getMeter(
      config.serviceName,
      config.serviceVersion
    );
  }

  // Tracing
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): opentelemetry.Span {
    return this.tracer.startSpan(name, {
      ...(attributes && { attributes }),
    });
  }

  // Metrics
  createCounter(name: string, description?: string): opentelemetry.Counter {
    return this.meter.createCounter(name, {
      ...(description && { description }),
    });
  }

  createHistogram(name: string, description?: string): opentelemetry.Histogram {
    return this.meter.createHistogram(name, {
      ...(description && { description }),
    });
  }

  // Structured logging
  log(level: "info" | "warn" | "error", message: string, context?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      environment: this.config.environment,
      ...context,
    };

    // JSONL format
    console.log(JSON.stringify(logEntry));

    // Send to Sentry if error
    if (level === "error") {
      Sentry.captureMessage(message, {
        level: "error",
        ...(context && { extra: context }),
      });
    }
  }

  // Error tracking
  captureError(error: Error, context?: Record<string, any>): void {
    Sentry.captureException(error, {
      ...(context && { extra: context }),
    });

    this.log("error", error.message, {
      stack: error.stack,
      ...context,
    });
  }

  // Performance monitoring
  measureExecutionTime<T>(
    operation: () => Promise<T>,
    operationName: string,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(operationName, attributes);
    const startTime = Date.now();

    try {
      const result = operation();
      span.setAttribute("operation.duration", Date.now() - startTime);
      span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: opentelemetry.SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
}

// Factory function
export function createObservabilityManager(config: ObservabilityConfig): ObservabilityManager {
  return new ObservabilityManager(config);
}

// Export OpenTelemetry API for convenience
export { opentelemetry };
