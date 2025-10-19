// Merkle DAG: rpc_context -> ports_aggregation -> metadata_extraction -> i/o_boundary
// Context and Ports aggregation with metadata extraction - I/O boundary isolation

export type Clock = () => Date;

// Extended ports interface for future I/O dependencies
export interface Ports {
	clock: Clock;
	// Future extensions: data, bus, auth, logger, eventRepo, etc.
	logger?: (message: string, level?: string) => void;
	eventRepo?: unknown; // Placeholder for event repository
	bus?: unknown; // Placeholder for message bus
	auth?: unknown; // Placeholder for authentication service
}

export interface Context {
	ports: Ports;
	// Request-scoped metadata
	tenantId?: string;
	userId?: string;
	correlationId?: string;
	userAgent?: string;
	ipAddress?: string;
	timestamp?: Date;
	metadata?: Record<string, unknown>;
}

// Request extraction interface for framework-agnostic metadata extraction
export interface RequestMetadataExtractor<T = unknown> {
	extractCorrelationId: (req: T) => string | undefined;
	extractTenantId: (req: T) => string | undefined;
	extractUserId: (req: T) => string | undefined;
	extractUserAgent: (req: T) => string | undefined;
	extractIpAddress: (req: T) => string | undefined;
}

// Fetch API Request extractor implementation
export const fetchRequestExtractor: RequestMetadataExtractor<Request> = {
	extractCorrelationId: (req: Request) => {
		// Check common correlation ID headers
		const correlationId =
			req.headers.get("x-request-id") ||
			req.headers.get("x-correlation-id") ||
			req.headers.get("correlation-id") ||
			req.headers.get("x-trace-id");

		// Generate if not present
		return (
			correlationId ||
			`req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		);
	},

	extractTenantId: (req: Request) => {
		// Extract from headers (JWT claims would be handled by auth service)
		return req.headers.get("x-tenant-id") || undefined;
	},

	extractUserId: (req: Request) => {
		// Extract from headers (JWT claims would be handled by auth service)
		return req.headers.get("x-user-id") || undefined;
	},

	extractUserAgent: (req: Request) => {
		return req.headers.get("user-agent") || undefined;
	},

	extractIpAddress: (req: Request) => {
		// Common proxy headers for IP extraction
		const forwardedFor = req.headers.get("x-forwarded-for");
		const realIp = req.headers.get("x-real-ip");
		const cfConnectingIp = req.headers.get("cf-connecting-ip");

		// Take first IP from forwarded-for if multiple
		const ip = forwardedFor?.split(",")[0]?.trim() || realIp || cfConnectingIp;
		return ip || undefined;
	},
};

export function createContext(
	init?: Partial<Context>,
	extractor?: RequestMetadataExtractor,
	request?: unknown,
): Context {
	// Extract metadata from request if extractor and request are provided
	const extractedMetadata: Partial<Context> = {};

	if (extractor && request) {
		const correlationId = extractor.extractCorrelationId(request);
		const tenantId = extractor.extractTenantId(request);
		const userId = extractor.extractUserId(request);
		const userAgent = extractor.extractUserAgent(request);
		const ipAddress = extractor.extractIpAddress(request);

		if (correlationId !== undefined)
			extractedMetadata.correlationId = correlationId;
		if (tenantId !== undefined) extractedMetadata.tenantId = tenantId;
		if (userId !== undefined) extractedMetadata.userId = userId;
		if (userAgent !== undefined) extractedMetadata.userAgent = userAgent;
		if (ipAddress !== undefined) extractedMetadata.ipAddress = ipAddress;
		extractedMetadata.timestamp = new Date();
	}

	// Merge extracted metadata with explicit init
	const mergedInit = { ...extractedMetadata, ...init };

	return {
		ports: {
			clock: () => new Date(),
			...(mergedInit.ports ?? {}),
		},
		// Remove ports from the merged init to avoid duplication
		...Object.fromEntries(
			Object.entries(mergedInit).filter(([key]) => key !== "ports"),
		),
	};
}

// Factory function for creating context from Fetch API Request
export function createContextFromRequest(
	req: Request,
	init?: Partial<Context>,
): Context {
	return createContext(init, fetchRequestExtractor as RequestMetadataExtractor, req);
}
