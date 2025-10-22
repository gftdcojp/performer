import type { GraphClient, Neo4jBackendConfig, GraphRecord, GraphBackendType } from "./port";
import * as neo4j from "neo4j-driver";
import type { CypherResult } from "@neo4j/cypher-builder";

export class Neo4jAdapter implements GraphClient {
	private readonly driver: neo4j.Driver;
	private readonly database?: string;

	constructor(private readonly config: Neo4jBackendConfig) {
		this.database = config.database;
		this.driver = neo4j.driver(
			config.uri,
			neo4j.auth.basic(config.username, config.password),
			{ disableLosslessIntegers: true },
		);
	}

	async verify(): Promise<void> {
		const session = this.driver.session({ database: this.database });
		try {
			await session.run("RETURN 1");
		} finally {
			await session.close();
		}
	}

	async close(): Promise<void> {
		await this.driver.close();
	}

	backend(): GraphBackendType { return "neo4j"; }

	async run(cypher: string, params: Record<string, unknown> = {}): Promise<GraphRecord[]> {
		const session = this.driver.session({ database: this.database });
		try {
			const result = await session.run(cypher, params);
			return result.records.map((r) => r.toObject());
		} finally {
			await session.close();
		}
	}

	async runBuilder(query: CypherResult): Promise<GraphRecord[]> {
		const { cypher: cypherStr, params } = query.build();
		return this.run(cypherStr, params);
	}
}


