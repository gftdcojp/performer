// RPC Layer
// Merkle DAG: rpc-node

import { ActorDBHttpClient } from "./actordb-client"

// RPC client configuration
export const createRPCClient = (config: {
  host: string
  port: number
  secure: boolean
  token?: string
}) => new ActorDBHttpClient(config)

export * from "./actordb-client"
