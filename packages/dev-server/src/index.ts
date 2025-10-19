// Merkle DAG: dev_server_core -> vite_integration -> ssr_pipeline -> hmr_support
// Vite SSR dev server for .server.ts evaluation and props injection to page.client.tsx

import { createServer, ViteDevServer } from "vite";

export interface DevServerOptions {
  port?: number;
  host?: string;
  config?: string;
}

export class PerformerDevServer {
  private server: ViteDevServer | null = null;

  constructor(private options: DevServerOptions = {}) {}

  async start(): Promise<void> {
    const port = this.options.port || 3000;
    const host = this.options.host || "localhost";

    this.server = await createServer({
      server: {
        port,
        host,
        hmr: true,
      },
      // TODO: Configure for Performer framework
      // - SSR support
      // - .server.ts file handling
      // - page.client.tsx props injection
    });

    await this.server.listen();

    console.log(`Performer dev server running at http://${host}:${port}`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }

  getServer(): ViteDevServer | null {
    return this.server;
  }
}

// Factory function
export function createDevServer(options?: DevServerOptions): PerformerDevServer {
  return new PerformerDevServer(options);
}
