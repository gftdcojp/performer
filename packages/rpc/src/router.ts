// Merkle DAG: rpc_router -> procedure_registration -> dispatch_layer
// Thin RPC layer for procedure registration and dispatch - no business logic

export type Proc<C, I, O> = {
	name: string;
	handler: (ctx: C, input: I) => Promise<O>;
};

export class OrpcRouter<C> {
	private procs = new Map<string, Proc<C, any, any>>();

	add<I, O>(name: string, handler: Proc<C, I, O>["handler"]): OrpcRouter<C> {
		this.procs.set(name, { name, handler } as Proc<C, any, any>);
		return this;
	}

	async call(name: string, ctx: C, input: unknown): Promise<unknown> {
		const p = this.procs.get(name);
		if (!p) {
			throw new Error(`orpc: procedure not found: ${name}`);
		}
		return p.handler(ctx, input as any);
	}

	list(): string[] {
		return [...this.procs.keys()];
	}
}

export function createRouter<C>() {
	return new OrpcRouter<C>();
}
