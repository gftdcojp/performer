import type { CypherResult } from "@neo4j/cypher-builder";

export type GraphBackendType = "neo4j" | "neptune";

export interface Neo4jBackendConfig {
	type: "neo4j";
	uri: string;
	username: string;
	password: string;
	database?: string;
}

export interface NeptuneBackendConfig {
	type: "neptune";
	endpoint: string; // e.g. my-cluster.cluster-xxxxxxxxxx.us-east-1.neptune.amazonaws.com
	region: string; // e.g. us-east-1
	port?: number; // default 8182
	useIamAuth?: boolean; // default true
	database?: string; // reserved for future use
}

export type GraphConfig = Neo4jBackendConfig | NeptuneBackendConfig;

export type GraphRecord = Record<string, unknown>;

export interface GraphClient {
	run(cypher: string, params?: Record<string, unknown>): Promise<GraphRecord[]>;
	runBuilder(query: CypherResult): Promise<GraphRecord[]>;
	verify(): Promise<void>;
	close(): Promise<void>;
	backend(): GraphBackendType;
}

export type GraphClientFactory = (config: GraphConfig) => GraphClient;

// Lazy local imports to avoid optional deps at import time
export const createGraphClient: GraphClientFactory = (config: GraphConfig) => {
	if (config.type === "neo4j") {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { Neo4jAdapter } = require("./neo4j-adapter");
		return new Neo4jAdapter(config);
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { NeptuneAdapter } = require("./neptune-adapter");
	return new NeptuneAdapter({
		endpoint: config.endpoint,
		region: config.region,
		port: config.port ?? 8182,
		useIamAuth: config.useIamAuth ?? true,
	});
};


