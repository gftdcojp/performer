// Merkle DAG: actions_core -> auth_guard -> type_validation -> remix_actions
// Remix-style loader/action implementation with Auth0 guard and TypeScript validation

import * as auth0 from "auth0-js";
import {
	actionsErrorFactory,
	withErrorHandling,
	ErrorCodes,
} from "@gftdcojp/performer-error-handling";

export interface User {
	id: string;
	email: string;
	roles: string[];
}

export interface ActionContext {
	user: User;
	request: Request;
}

export type LoaderResult<T> = T;
export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

// Auth0 configuration
export interface Auth0Config {
	domain: string;
	clientID: string;
	audience: string;
}

export class AuthGuard {
	private auth0: auth0.WebAuth;
	private config: Auth0Config;

	constructor(config: Auth0Config) {
		this.config = config;
		this.auth0 = new auth0.WebAuth({
			domain: config.domain,
			clientID: config.clientID,
			audience: config.audience,
			responseType: "token id_token",
			scope: "openid profile email",
		});
	}

	async authorize(requiredRoles: string[] = []): Promise<User> {
		return withErrorHandling(
			async () => {
				// Simplified auth check - in real implementation, validate JWT token
				// This would integrate with Auth0 SDK for proper token validation
				const mockUser: User = {
					id: "user-123",
					email: "user@example.com",
					roles: ["user"],
				};

				// Check roles
				const hasRequiredRoles = requiredRoles.every((role) =>
					mockUser.roles.includes(role),
				);
				if (!hasRequiredRoles) {
					throw actionsErrorFactory.authFailed("authorize", {
						suggestedAction: `Required roles: ${requiredRoles.join(", ")}`,
						metadata: { requiredRoles, userRoles: mockUser.roles },
					});
				}

				return mockUser;
			},
			actionsErrorFactory,
			"authorize",
			{ retries: 1 },
		);
	}

	async getToken(): Promise<string> {
		// Return cached token or refresh
		return "mock-jwt-token";
	}
}

// Type validation helpers
export class TypeValidator {
	static validate<T>(data: unknown): T {
		// Basic type validation - in production, implement proper validation
		return data as T;
	}

	static safeValidate<T>(
		data: unknown,
	): { success: true; data: T } | { success: false; error: Error } {
		try {
			return { success: true, data: data as T };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error : new Error("Validation failed"),
			};
		}
	}
}

// Remix-style action function type
export type LoaderFunction<T = unknown> = (
	context: ActionContext,
) => Promise<LoaderResult<T>>;
export type ActionFunction<TInput = unknown, TOutput = unknown> = (
	input: TInput,
	context: ActionContext,
) => Promise<ActionResult<TOutput>>;

// Action builder with auth and validation
export class ActionBuilder {
	private authGuard: AuthGuard;
	private requiredRoles: string[] = [];

	constructor(authGuard: AuthGuard) {
		this.authGuard = authGuard;
	}

	roles(...roles: string[]): ActionBuilder {
		this.requiredRoles = roles;
		return this;
	}

	loader<T>(
		handler: (context: ActionContext) => Promise<LoaderResult<T>>,
	): LoaderFunction<T> {
		return async (context: ActionContext) => {
			const user = await this.authGuard.authorize(this.requiredRoles);
			const validatedContext = { ...context, user };

			return handler(validatedContext);
		};
	}

	action<TInput, TOutput>(
		handler: (input: TInput, context: ActionContext) => Promise<TOutput>,
	): ActionFunction<TInput, TOutput> {
		return async (input: TInput, context: ActionContext) => {
			try {
				const user = await this.authGuard.authorize(this.requiredRoles);
				const validatedContext = { ...context, user };
				const result = await handler(input, validatedContext);

				return { success: true, data: result };
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		};
	}
}

// Factory function
export function createActions(auth0Config: Auth0Config): ActionBuilder {
	const authGuard = new AuthGuard(auth0Config);
	return new ActionBuilder(authGuard);
}
