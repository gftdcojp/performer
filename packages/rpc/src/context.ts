// Merkle DAG: rpc_context -> ports_aggregation -> i/o_boundary
// Context and Ports aggregation - I/O boundary isolation

export type Clock = () => Date;

export interface Ports {
	clock: Clock;
	// Future: data, bus, auth, logger, etc.
}

export interface Context {
	ports: Ports;
	// Request-scoped info: tenantId, userId, correlationId, etc.
	tenantId?: string;
	userId?: string;
	correlationId?: string;
}

export function createContext(init?: Partial<Context>): Context {
	return {
		ports: {
			clock: () => new Date(),
			...(init?.ports ?? {}),
		},
		...init,
	};
}
