// Merkle DAG: rpc_http -> i/o_validation -> error_standardization -> fetch_bridge
// HTTP handler bridge using Fetch API with I/O validation and standardized errors

import {
	ErrorCodes,
	createErrorFactory,
} from "@gftdcojp/performer-error-handling";
import { z } from "zod";
import type { Context } from "./context";
import type { OrpcRouter } from "./router";
import { HttpRequestBodySchema } from "./schemas";

type FetchLikeRequest = Request;
type FetchLikeResponse = Response;

const errorFactory = createErrorFactory("rpc");

export function createHttpHandler<C extends Context>(
	router: OrpcRouter<C>,
	ctxFactory: (req: FetchLikeRequest) => Promise<C> | C,
) {
	return async (req: FetchLikeRequest): Promise<FetchLikeResponse> => {
		let correlationId: string | undefined;

		try {
			// Method validation
			if (req.method !== "POST") {
				return new Response(
					JSON.stringify({
						ok: false,
						error: {
							code: "METHOD_NOT_ALLOWED",
							message: "Only POST method is allowed",
						},
					}),
					{
						status: 405,
						headers: { "content-type": "application/json", allow: "POST" },
					},
				);
			}

			// Content-Type validation
			const contentType = req.headers.get("content-type");
			if (!contentType?.includes("application/json")) {
				return new Response(
					JSON.stringify({
						ok: false,
						error: {
							code: "UNSUPPORTED_MEDIA_TYPE",
							message: "Content-Type must be application/json",
						},
					}),
					{
						status: 415,
						headers: { "content-type": "application/json" },
					},
				);
			}

			// Parse and validate request body
			let body: unknown;
			try {
				body = await req.json();
			} catch (parseError) {
				return new Response(
					JSON.stringify({
						ok: false,
						error: {
							code: "BAD_REQUEST",
							message: "Invalid JSON in request body",
						},
					}),
					{
						status: 400,
						headers: { "content-type": "application/json" },
					},
				);
			}

			// Zod validation
			const validationResult = HttpRequestBodySchema.safeParse(body);
			if (!validationResult.success) {
				return new Response(
					JSON.stringify({
						ok: false,
						error: {
							code: "VALIDATION_FAILED",
							message: "Invalid request format",
							details: validationResult.error.format(),
						},
					}),
					{
						status: 422,
						headers: { "content-type": "application/json" },
					},
				);
			}

			const { p: procedureName, i: input } = validationResult.data;

			// Create context with correlation ID extraction
			const ctx = await ctxFactory(req);
			correlationId = ctx.correlationId;

			// Execute procedure
			const result = await router.call(procedureName, ctx, input);

			// Success response
			return new Response(JSON.stringify({ ok: true, r: result }), {
				headers: { "content-type": "application/json" },
			});
		} catch (e) {
			// Standardized error handling
			let errorResponse: {
				code: string;
				message: string;
				correlationId?: string;
				details?: unknown;
			};

			if (e instanceof z.ZodError) {
				// Zod validation error
				errorResponse = {
					code: "VALIDATION_FAILED",
					message: "Input validation failed",
					correlationId,
					details: e.format(),
				};
			} else if (
				e instanceof Error &&
				e.message.includes("procedure not found")
			) {
				// Procedure not found
				errorResponse = {
					code: "PROCEDURE_NOT_FOUND",
					message: "Requested procedure does not exist",
					correlationId,
				};
			} else {
				// Generic error - create structured error
				const structuredError = errorFactory.createError(
					ErrorCodes.UNKNOWN_ERROR,
					e instanceof Error ? e.message : String(e),
					"http_handler",
					{
						correlationId,
						cause: e instanceof Error ? e : undefined,
						severity:
							e instanceof Error && e.message.includes("procedure")
								? "medium"
								: "high",
					},
				);

				errorResponse = {
					code: structuredError.code,
					message: structuredError.message,
					correlationId: structuredError.context.correlationId,
				};
			}

			// Determine HTTP status code based on error type
			let statusCode = 500;
			if (errorResponse.code === "PROCEDURE_NOT_FOUND") statusCode = 404;
			else if (errorResponse.code === "VALIDATION_FAILED") statusCode = 422;
			else if (errorResponse.code === "BAD_REQUEST") statusCode = 400;
			else if (errorResponse.code === "METHOD_NOT_ALLOWED") statusCode = 405;
			else if (errorResponse.code === "UNSUPPORTED_MEDIA_TYPE")
				statusCode = 415;

			return new Response(JSON.stringify({ ok: false, error: errorResponse }), {
				status: statusCode,
				headers: { "content-type": "application/json" },
			});
		}
	};
}
