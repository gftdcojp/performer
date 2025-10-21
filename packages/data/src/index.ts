// Merkle DAG: data_core -> ontology -> neogma_models -> cypher_queries -> transaction_mgmt
// Effect-cypher + neogma adapter for type-safe Cypher/Tx utilities/constraints with ontology integration

import { Neogma, ModelFactory } from "neogma";
import * as neo4j from "neo4j-driver";
import { cypher, CypherResult } from "@neo4j/cypher-builder";
import {
    dataErrorFactory,
    withErrorHandling,
    ErrorCodes,
} from "@gftdcojp/performer-error-handling";
import { ProcessInstanceSchema, UserSchema, TenantSchema, TenantContextSchema, TenantProcessConfigSchema, PerformerSchemas } from "@gftdcojp/ai-gftd-ontology-typebox";
import { Static } from "@sinclair/typebox";

// Neo4j connection configuration
export interface Neo4jConfig {
	uri: string;
	username: string;
	password: string;
	database?: string;
}

// Initialize Neogma instance
export class Neo4jConnection {
	private neogma: Neogma;
	private driver: neo4j.Driver;
	private config: Neo4jConfig;

	constructor(config: Neo4jConfig) {
		this.config = config;
		this.driver = neo4j.driver(
			config.uri,
			neo4j.auth.basic(config.username, config.password),
			{ disableLosslessIntegers: true },
		);

		this.neogma = new Neogma(
			{
				url: config.uri,
				username: config.username,
				password: config.password,
				...(config.database && { database: config.database }),
			},
			{
				logger: console.log,
			},
		);
	}

	getNeogma(): Neogma {
		return this.neogma;
	}

	getDriver(): neo4j.Driver {
		return this.driver;
	}

	async close(): Promise<void> {
		await this.driver.close();
	}

	async verifyConnection(): Promise<void> {
		return withErrorHandling(
			async () => {
				const session = this.driver.session();
				try {
					await session.run("RETURN 1");
				} catch (error) {
					throw dataErrorFactory.databaseError(
						"verifyConnection",
						error as Error,
						{
							suggestedAction:
								"Check Neo4j connection parameters and server status",
							metadata: {
								config: {
									uri: this.config.uri,
									database: this.config.database,
								},
							},
						},
					);
				} finally {
					await session.close();
				}
			},
			dataErrorFactory,
			"verifyConnection",
		);
	}
}

// Base model with common fields (ontology-compliant)
export interface BaseNode {
	id: string;
	tenantId: string;
	userId: string;
	createdAt: string; // ISO date string for JSON-LD compatibility
	updatedAt: string;
}

// BPMN Process Instance Model (ontology-integrated)
export type ProcessInstanceNode = Static<typeof ProcessInstanceSchema>;
export type ProcessInstanceModel = ProcessInstanceNode;

// Task Model
export interface TaskNode extends BaseNode {
	taskId: string;
	name: string;
	type: "user" | "service" | "send" | "receive" | "manual" | "businessRule";
	assignee?: string;
	status: "created" | "assigned" | "completed" | "failed";
	dueDate?: Date;
	priority?: number;
	variables: Record<string, any>;
}

// Note: ModelFactory usage simplified for basic operations
export type TaskModel = TaskNode;

// User Model (ontology-integrated)
export type UserNode = Static<typeof UserSchema>;
export type UserModel = UserNode;

// Tenant Model (ontology-integrated)
export type TenantNode = Static<typeof TenantSchema>;
export type TenantModel = TenantNode;

// Tenant Context Model
export type TenantContextNode = Static<typeof TenantContextSchema>;
export type TenantContextModel = TenantContextNode;

// Tenant Process Config Model
export type TenantProcessConfigNode = Static<typeof TenantProcessConfigSchema>;
export type TenantProcessConfigModel = TenantProcessConfigNode;

// Transaction Manager (enhanced with cypher-builder and tenant isolation)
export class TransactionManager {
	constructor(private connection: Neo4jConnection, private tenantId?: string) {}

	async executeInTransaction<T>(
		operation: (tx: neo4j.ManagedTransaction) => Promise<T>,
	): Promise<T> {
		const session = this.connection.getDriver().session();

		try {
			const result = await session.executeWrite(operation);
			return result;
		} finally {
			await session.close();
		}
	}

	async executeQuery(
		cypher: string,
		params: Record<string, any> = {},
	): Promise<any[]> {
		const session = this.connection.getDriver().session();
		try {
			const result = await session.run(cypher, params);
			return result.records.map((record) => record.toObject());
		} finally {
			await session.close();
		}
	}

	// Execute CypherQuery using cypher-builder
	async executeCypherQuery(query: CypherResult): Promise<any[]> {
		const session = this.connection.getDriver().session();
		try {
			const { cypher, params } = query.build();
			const result = await session.run(cypher, params);
			return result.records.map((record) => record.toObject());
		} finally {
			await session.close();
		}
	}

	// Tenant-aware query execution - automatically adds tenant isolation
	async executeTenantQuery(
		cypher: string,
		params: Record<string, any> = {},
		tenantId?: string,
	): Promise<any[]> {
		const effectiveTenantId = tenantId || this.tenantId;
		if (!effectiveTenantId) {
			throw new Error("Tenant ID is required for tenant-aware queries");
		}

		// Add tenant filter to query
		const tenantQuery = `${cypher} AND n.tenantId = $tenantId`;
		const tenantParams = { ...params, tenantId: effectiveTenantId };

		return this.executeQuery(tenantQuery, tenantParams);
	}

	// Tenant-aware CypherQuery execution
	async executeTenantCypherQuery(query: CypherResult, tenantId?: string): Promise<any[]> {
		const effectiveTenantId = tenantId || this.tenantId;
		if (!effectiveTenantId) {
			throw new Error("Tenant ID is required for tenant-aware queries");
		}

		// Modify query to include tenant filter
		const tenantQuery = query.where(cypher.param("tenantId").equals(cypher.param("effectiveTenantId")));
		const { cypher: cypherStr, params } = tenantQuery.build();
		const tenantParams = { ...params, effectiveTenantId };

		const session = this.connection.getDriver().session();
		try {
			const result = await session.run(cypherStr, tenantParams);
			return result.records.map((record) => record.toObject());
		} finally {
			await session.close();
		}
	}
}

// Repository base class
export abstract class BaseRepository<T extends BaseNode> {
	constructor(
		protected connection: Neo4jConnection,
		protected txManager: TransactionManager,
	) {}

	abstract create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
	abstract findById(id: string): Promise<T | null>;
	abstract update(id: string, data: Partial<T>): Promise<T>;
	abstract delete(id: string): Promise<void>;
}

// Process Instance Repository
export class ProcessInstanceRepository extends BaseRepository<ProcessInstanceNode> {
	async create(
		data: Omit<ProcessInstanceNode, "id" | "createdAt" | "updatedAt">,
	): Promise<ProcessInstanceNode> {
		// Validate tenant context
		if (!data.tenantId) {
			throw new Error("Tenant ID is required for process instance creation");
		}
		if (!data.userId) {
			throw new Error("User ID is required for process instance creation");
		}

		const id = `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = new Date().toISOString();

		const instance: ProcessInstanceNode = {
			...data,
			id,
			createdAt: now,
			updatedAt: now,
		};

		// Use tenant-aware cypher-builder for type-safe queries
		const query = cypher
			.create([
				cypher.node("p", "ProcessInstance", {
					id,
					processId: data.processId,
					businessKey: data.businessKey,
					tenantId: data.tenantId,
					userId: data.userId,
					status: data.status,
					variables: JSON.stringify(data.variables),
					startTime: data.startTime,
					createdAt: now,
					updatedAt: now,
				}),
			])
			.return("p");

		await this.txManager.executeTenantCypherQuery(query, data.tenantId);
		return instance;
	}

	async findById(id: string): Promise<ProcessInstanceNode | null> {
		const results = await this.txManager.executeQuery(
			`
      MATCH (p:ProcessInstance {id: $id})
      RETURN p
    `,
			{ id },
		);

		if (results.length === 0) return null;

		const record = results[0].p.properties;
		return {
			id: record.id,
			processId: record.processId,
			businessKey: record.businessKey,
			status: record.status,
			variables: JSON.parse(record.variables),
			startTime: new Date(record.startTime),
			...(record.endTime && { endTime: new Date(record.endTime) }),
			createdAt: new Date(record.createdAt),
			updatedAt: new Date(record.updatedAt),
		};
	}

	async findByBusinessKey(
		businessKey: string,
	): Promise<ProcessInstanceNode | null> {
		const results = await this.txManager.executeQuery(
			`
      MATCH (p:ProcessInstance {businessKey: $businessKey})
      RETURN p
    `,
			{ businessKey },
		);

		if (results.length === 0) return null;

		const record = results[0].p.properties;
		return {
			id: record.id,
			processId: record.processId,
			businessKey: record.businessKey,
			status: record.status,
			variables: JSON.parse(record.variables),
			startTime: new Date(record.startTime),
			...(record.endTime && { endTime: new Date(record.endTime) }),
			createdAt: new Date(record.createdAt),
			updatedAt: new Date(record.updatedAt),
		};
	}

	async update(
		id: string,
		data: Partial<ProcessInstanceNode>,
	): Promise<ProcessInstanceNode> {
		const updates: string[] = [];
		const params: Record<string, any> = { id };

		if (data.status !== undefined) {
			updates.push("p.status = $status");
			params.status = data.status;
		}

		if (data.variables !== undefined) {
			updates.push("p.variables = $variables");
			params.variables = JSON.stringify(data.variables);
		}

		if (data.endTime !== undefined) {
			updates.push("p.endTime = datetime($endTime)");
			params.endTime = data.endTime.toISOString();
		}

		updates.push("p.updatedAt = datetime($updatedAt)");
		params.updatedAt = new Date().toISOString();

		await this.txManager.executeQuery(
			`
      MATCH (p:ProcessInstance {id: $id})
      SET ${updates.join(", ")}
    `,
			params,
		);

		const updated = await this.findById(id);
		if (!updated)
			throw new Error(`Process instance ${id} not found after update`);
		return updated;
	}

	async delete(id: string): Promise<void> {
		await this.txManager.executeQuery(
			`
      MATCH (p:ProcessInstance {id: $id})
      DETACH DELETE p
    `,
			{ id },
		);
	}
}

// Constraint and Index Management
export class SchemaManager {
	constructor(private connection: Neo4jConnection) {}

	async createConstraints(): Promise<void> {
		const session = this.connection.getDriver().session();

		try {
			// Unique constraints
			await session.run(
				"CREATE CONSTRAINT process_instance_id_unique IF NOT EXISTS FOR (p:ProcessInstance) REQUIRE p.id IS UNIQUE",
			);
			await session.run(
				"CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE",
			);
			await session.run(
				"CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
			);

			// Indexes
			await session.run(
				"CREATE INDEX process_instance_business_key IF NOT EXISTS FOR (p:ProcessInstance) ON (p.businessKey)",
			);
			await session.run(
				"CREATE INDEX task_assignee IF NOT EXISTS FOR (t:Task) ON (t.assignee)",
			);
			await session.run(
				"CREATE INDEX user_tenant IF NOT EXISTS FOR (u:User) ON (u.tenantId)",
			);
		} finally {
			await session.close();
		}
	}

	async dropConstraints(): Promise<void> {
		const session = this.connection.getDriver().session();

		try {
			await session.run("DROP CONSTRAINT process_instance_id_unique IF EXISTS");
			await session.run("DROP CONSTRAINT task_id_unique IF EXISTS");
			await session.run("DROP CONSTRAINT user_id_unique IF EXISTS");

			await session.run("DROP INDEX process_instance_business_key IF EXISTS");
			await session.run("DROP INDEX task_assignee IF EXISTS");
			await session.run("DROP INDEX user_tenant IF EXISTS");
		} finally {
			await session.close();
		}
	}
}

// Factory functions
export function createNeo4jConnection(config: Neo4jConfig): Neo4jConnection {
	return new Neo4jConnection(config);
}

export function createTransactionManager(
	connection: Neo4jConnection,
): TransactionManager {
	return new TransactionManager(connection);
}

export function createProcessInstanceRepository(
	connection: Neo4jConnection,
	txManager: TransactionManager,
): ProcessInstanceRepository {
	return new ProcessInstanceRepository(connection, txManager);
}

export function createSchemaManager(
	connection: Neo4jConnection,
): SchemaManager {
	return new SchemaManager(connection);
}

// Tenant Repository
export class TenantRepository extends BaseRepository<TenantNode> {
	async create(
		data: Omit<TenantNode, "id" | "createdAt" | "updatedAt">,
	): Promise<TenantNode> {
		const id = `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = new Date().toISOString();

		const tenant: TenantNode = {
			...data,
			id,
			createdAt: now,
			updatedAt: now,
		};

		const query = cypher
			.create([
				cypher.node("t", "Tenant", {
					id,
					name: data.name,
					domain: data.domain,
					settings: JSON.stringify(data.settings),
					createdAt: now,
					updatedAt: now,
				}),
			])
			.return("t");

		await this.txManager.executeCypherQuery(query);
		return tenant;
	}

	async findById(id: string): Promise<TenantNode | null> {
		const results = await this.txManager.executeQuery(
			`
      MATCH (t:Tenant {id: $id})
      RETURN t
    `,
			{ id },
		);

		if (results.length === 0) return null;

		const record = results[0].t.properties;
		return {
			id: record.id,
			name: record.name,
			domain: record.domain,
			settings: JSON.parse(record.settings),
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
		};
	}

	async findByDomain(domain: string): Promise<TenantNode | null> {
		const results = await this.txManager.executeQuery(
			`
      MATCH (t:Tenant {domain: $domain})
      RETURN t
    `,
			{ domain },
		);

		if (results.length === 0) return null;

		const record = results[0].t.properties;
		return {
			id: record.id,
			name: record.name,
			domain: record.domain,
			settings: JSON.parse(record.settings),
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
		};
	}

	async update(
		id: string,
		data: Partial<TenantNode>,
	): Promise<TenantNode> {
		const updates: string[] = [];
		const params: Record<string, any> = { id };

		if (data.name !== undefined) {
			updates.push("t.name = $name");
			params.name = data.name;
		}

		if (data.domain !== undefined) {
			updates.push("t.domain = $domain");
			params.domain = data.domain;
		}

		if (data.settings !== undefined) {
			updates.push("t.settings = $settings");
			params.settings = JSON.stringify(data.settings);
		}

		updates.push("t.updatedAt = datetime($updatedAt)");
		params.updatedAt = new Date().toISOString();

		await this.txManager.executeQuery(
			`
      MATCH (t:Tenant {id: $id})
      SET ${updates.join(", ")}
    `,
			params,
		);

		const updated = await this.findById(id);
		if (!updated) throw new Error(`Tenant ${id} not found after update`);
		return updated;
	}

	async delete(id: string): Promise<void> {
		await this.txManager.executeQuery(
			`
      MATCH (t:Tenant {id: $id})
      DETACH DELETE t
    `,
			{ id },
		);
	}
}

// Tenant Context Manager
export class TenantContextManager {
	constructor(private connection: Neo4jConnection) {}

	async getTenantContext(tenantId: string, userId: string): Promise<TenantContextNode | null> {
		const txManager = createTransactionManager(this.connection);
		const tenantRepo = createTenantRepository(this.connection, txManager);

		const tenant = await tenantRepo.findById(tenantId);
		if (!tenant) return null;

		// Get user information (simplified - in real implementation, get from user service)
		const userResults = await txManager.executeQuery(
			`
      MATCH (u:User {id: $userId, tenantId: $tenantId})
      RETURN u
    `,
			{ userId, tenantId },
		);

		if (userResults.length === 0) return null;

		const user = userResults[0].u.properties;

		return {
			tenantId,
			tenantName: tenant.name,
			tenantDomain: tenant.domain,
			userId,
			userRoles: user.roles || [],
			permissions: user.permissions || [],
			settings: tenant.settings,
		};
	}

	async validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
		const txManager = createTransactionManager(this.connection);
		const results = await txManager.executeQuery(
			`
      MATCH (u:User {id: $userId, tenantId: $tenantId})
      RETURN count(u) > 0 as hasAccess
    `,
			{ userId, tenantId },
		);

		return results[0]?.hasAccess || false;
	}
}

// Factory functions for multi-tenancy
export function createTenantRepository(
	connection: Neo4jConnection,
	txManager: TransactionManager,
): TenantRepository {
	return new TenantRepository(connection, txManager);
}

export function createTenantContextManager(
	connection: Neo4jConnection,
): TenantContextManager {
	return new TenantContextManager(connection);
}

// Tenant-aware factory functions
export function createTenantAwareTransactionManager(
	connection: Neo4jConnection,
	tenantId: string,
): TransactionManager {
	return new TransactionManager(connection, tenantId);
}

export function createTenantAwareProcessInstanceRepository(
	connection: Neo4jConnection,
	tenantId: string,
): ProcessInstanceRepository {
	const txManager = createTenantAwareTransactionManager(connection, tenantId);
	return new ProcessInstanceRepository(connection, txManager);
}

// Utility query functions
export const q = {
	matchNode: (
		alias: string,
		label: string,
		properties: Record<string, any>,
	) => ({
		ret: (...fields: string[]) => ({
			one: async (connection: Neo4jConnection): Promise<any> => {
				const txManager = createTransactionManager(connection);
				const conditions = Object.keys(properties)
					.map((key) => `${alias}.${key} = $${key}`)
					.join(" AND ");
				const params = properties;

				const results = await txManager.executeQuery(
					`
          MATCH (${alias}:${label}) WHERE ${conditions}
          RETURN ${fields.map((f) => `${alias}.${f}`).join(", ")}
        `,
					params,
				);

				return results[0] || null;
			},
		}),
	}),
};
