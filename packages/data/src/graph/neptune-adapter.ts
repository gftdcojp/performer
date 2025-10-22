import type { GraphBackendType, GraphClient, GraphRecord } from "./port";
import type { CypherResult } from "@neo4j/cypher-builder";
import { Sha256 } from "@aws-crypto/sha256-js";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { defaultProvider } from "@aws-sdk/credential-providers";

interface NeptuneAdapterConfig {
	endpoint: string;
	region: string;
	port: number;
	useIamAuth: boolean;
}

export class NeptuneAdapter implements GraphClient {
	private readonly endpoint: string;
	private readonly region: string;
	private readonly port: number;
	private readonly useIamAuth: boolean;
	private readonly signer: SignatureV4;

	constructor(config: NeptuneAdapterConfig) {
		this.endpoint = config.endpoint;
		this.region = config.region;
		this.port = config.port;
		this.useIamAuth = config.useIamAuth;
		this.signer = new SignatureV4({
			service: "neptune-db",
			region: this.region,
			sha256: Sha256,
			credentials: defaultProvider(),
		});
	}

	async verify(): Promise<void> {
		// minimal query
		await this.run("RETURN 1", {});
	}

	async close(): Promise<void> {
		// no-op
	}

	backend(): GraphBackendType { return "neptune"; }

	async run(cypher: string, params: Record<string, unknown> = {}): Promise<GraphRecord[]> {
		const url = `https://${this.endpoint}:${this.port}/openCypher`;
		const body = JSON.stringify({ query: cypher, parameters: params });
		const req = new Request(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body,
		});

		const signed = this.useIamAuth ? await this.sign(req) : req;
		const res = await fetch(signed);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Neptune error ${res.status}: ${text}`);
		}
		const data = (await res.json()) as {
			results?: GraphRecord[];
			errors?: { code: string; message: string }[];
		};
		if (data.errors && data.errors.length > 0) {
			throw new Error(`Neptune query error: ${data.errors[0].code} ${data.errors[0].message}`);
		}
		return data.results ?? [];
	}

	async runBuilder(query: CypherResult): Promise<GraphRecord[]> {
		const { cypher: cypherStr, params } = query.build();
		return this.run(cypherStr, params);
	}

	private async sign(req: Request): Promise<Request> {
		const url = new URL(req.url);
		const signed = await this.signer.sign({
			method: req.method,
			protocol: url.protocol,
			hostname: url.hostname,
			path: url.pathname,
			headers: Object.fromEntries(req.headers.entries()),
			body: await req.clone().arrayBuffer(),
		});
		return new Request(req, { headers: new Headers(signed.headers) });
	}
}


