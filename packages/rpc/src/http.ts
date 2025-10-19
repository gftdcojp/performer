// Merkle DAG: rpc_http -> fetch_bridge -> server_abstraction
// HTTP handler bridge using Fetch API - framework agnostic

import type { OrpcRouter } from "./router";
import type { Context } from "./context";

type FetchLikeRequest = Request;
type FetchLikeResponse = Response;

export function createHttpHandler<C extends Context>(
	router: OrpcRouter<C>,
	ctxFactory: (req: FetchLikeRequest) => Promise<C> | C,
) {
	return async (req: FetchLikeRequest): Promise<FetchLikeResponse> => {
		if (req.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		try {
			const body = await req.json();
			const { p: procedureName, i: input } = body as { p: string; i: unknown };

			const ctx = await ctxFactory(req);
			const result = await router.call(procedureName, ctx, input);

			return new Response(JSON.stringify({ ok: true, r: result }), {
				headers: { "content-type": "application/json" },
			});
		} catch (e) {
			return new Response(JSON.stringify({ ok: false, error: String(e) }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}
	};
}
