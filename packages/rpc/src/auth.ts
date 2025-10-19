// Merkle DAG: rpc_auth -> jwt_claims_extraction -> context_injection -> security_boundary
// Auth0 JWT integration with claim extraction and context injection

import type { Context } from "./context";

// Auth0 JWT payload structure (standard claims + custom)
export interface Auth0JwtPayload {
	// Standard JWT claims
	sub: string; // User ID
	aud: string | string[]; // Audience
	iss: string; // Issuer
	exp: number; // Expiration time
	iat: number; // Issued at
	auth_time?: number; // Authentication time

	// Auth0 specific claims
	azp?: string; // Authorized party
	scope?: string; // OAuth scope
	permissions?: string[]; // API permissions

	// Custom claims (configurable)
	tenantId?: string;
	userId?: string;
	roles?: string[];
	groups?: string[];
	organizationId?: string;

	// Additional custom claims
	[key: string]: any;
}

// Auth0 configuration
export interface Auth0Config {
	domain: string;
	audience: string;
	issuer?: string; // Defaults to https://{domain}/
	algorithms?: string[]; // Default: ['RS256']
	customClaimsNamespace?: string; // Default: https://{domain}/
}

// JWT validation result
export interface JwtValidationResult {
	valid: boolean;
	payload?: Auth0JwtPayload;
	error?: string;
}

// Simple JWT decoder (for payload extraction only)
// NOTE: This does NOT validate signatures - use proper JWT library for production
export function decodeJwt(token: string): JwtValidationResult {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return { valid: false, error: "Invalid JWT format" };
		}

		// Decode payload (base64url)
		const payload = JSON.parse(
			Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
		);

		return { valid: true, payload };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : "Failed to decode JWT"
		};
	}
}

// Extract Auth0 claims from JWT token
export function extractAuth0Claims(token: string): Auth0JwtPayload | null {
	const decoded = decodeJwt(token);
	if (!decoded.valid || !decoded.payload) {
		return null;
	}

	return decoded.payload as Auth0JwtPayload;
}

// Extract user identity from Auth0 claims
export function extractUserIdentity(claims: Auth0JwtPayload): {
	userId: string;
	tenantId?: string;
	organizationId?: string;
	roles?: string[];
	permissions?: string[];
} {
	return {
		userId: claims.sub,
		tenantId: claims.tenantId || claims.organizationId,
		organizationId: claims.organizationId,
		roles: claims.roles || [],
		permissions: claims.permissions || [],
	};
}

// Context factory with Auth0 JWT integration
export function createContextWithAuth(
	authToken?: string,
	config?: {
		customClaimsNamespace?: string;
		tenantClaim?: string; // 'tenantId' | 'organizationId' | custom
		userIdClaim?: string; // 'sub' | 'userId' | custom
	},
): Context | null {
	if (!authToken) {
		return null;
	}

	const claims = extractAuth0Claims(authToken);
	if (!claims) {
		return null;
	}

	const identity = extractUserIdentity(claims);

	// Extract additional claims based on configuration
	const customNamespace = config?.customClaimsNamespace;
	const tenantClaim = config?.tenantClaim || 'tenantId';
	const userIdClaim = config?.userIdClaim || 'sub';

	let tenantId = identity.tenantId;
	let userId = identity.userId;

	// Check custom claims
	if (customNamespace && claims[customNamespace]) {
		const customClaims = claims[customNamespace];
		if (typeof customClaims === 'object') {
			if (tenantClaim !== 'tenantId' && tenantClaim !== 'organizationId') {
				tenantId = customClaims[tenantClaim] || tenantId;
			}
			if (userIdClaim !== 'sub' && userIdClaim !== 'userId') {
				userId = customClaims[userIdClaim] || userId;
			}
		}
	}

	return {
		ports: {
			clock: () => new Date(),
		},
		correlationId: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		tenantId,
		userId,
		timestamp: new Date(),
		metadata: {
			auth: {
				provider: 'auth0',
				permissions: identity.permissions,
				roles: identity.roles,
				audience: claims.aud,
				issuer: claims.iss,
				expiresAt: new Date(claims.exp * 1000),
				issuedAt: new Date(claims.iat * 1000),
			},
		},
	};
}

// Request extractor with Auth0 support
export const auth0RequestExtractor = {
	extractCorrelationId: (req: Request) => {
		return (
			req.headers.get("x-request-id") ||
			req.headers.get("x-correlation-id") ||
			req.headers.get("correlation-id") ||
			req.headers.get("x-trace-id") ||
			`req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		);
	},

	extractTenantId: (req: Request) => {
		// Try Auth0 JWT first
		const authHeader = req.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			const context = createContextWithAuth(token);
			if (context?.tenantId) {
				return context.tenantId;
			}
		}

		// Fallback to header
		return req.headers.get("x-tenant-id") || undefined;
	},

	extractUserId: (req: Request) => {
		// Try Auth0 JWT first
		const authHeader = req.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			const context = createContextWithAuth(token);
			if (context?.userId) {
				return context.userId;
			}
		}

		// Fallback to header
		return req.headers.get("x-user-id") || undefined;
	},

	extractUserAgent: (req: Request) => {
		return req.headers.get("user-agent") || undefined;
	},

	extractIpAddress: (req: Request) => {
		const forwardedFor = req.headers.get("x-forwarded-for");
		const realIp = req.headers.get("x-real-ip");
		const cfConnectingIp = req.headers.get("cf-connecting-ip");

		const ip = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp;
		return ip || undefined;
	},

	// Extract Auth0 context
	extractAuthContext: (req: Request) => {
		const authHeader = req.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			return createContextWithAuth(token);
		}
		return null;
	},
};

// Factory function for creating context from request with Auth0
export function createContextFromRequestWithAuth(
	req: Request,
	config?: {
		customClaimsNamespace?: string;
		tenantClaim?: string;
		userIdClaim?: string;
	},
): Context {
	const baseContext = {
		ports: {
			clock: () => new Date(),
		},
		correlationId: auth0RequestExtractor.extractCorrelationId(req),
		tenantId: auth0RequestExtractor.extractTenantId(req),
		userId: auth0RequestExtractor.extractUserId(req),
		userAgent: auth0RequestExtractor.extractUserAgent(req),
		ipAddress: auth0RequestExtractor.extractIpAddress(req),
		timestamp: new Date(),
	};

	// Merge with Auth0 context if available
	const authContext = auth0RequestExtractor.extractAuthContext(req);
	if (authContext) {
		return {
			...baseContext,
			...authContext,
			// Override with Auth0 data
			tenantId: authContext.tenantId || baseContext.tenantId,
			userId: authContext.userId || baseContext.userId,
		};
	}

	return baseContext;
}
