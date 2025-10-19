import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
function orpcPlugin() {
	return {
		name: "orpc",
		configureServer(server: any) {
			console.log("Setting up oRPC middleware");
			server.middlewares.use("/orpc", async (req: any, res: any) => {
				console.log("oRPC middleware called:", req.url);
				try {
					const url = new URL(req.url || "", "http://localhost");
					if (url.pathname !== "/orpc") {
						console.log("Not oRPC path:", url.pathname);
						return;
					}

					const chunks: Uint8Array[] = [];
					for await (const c of req) chunks.push(c as Uint8Array);
					const body = Buffer.concat(chunks);

					console.log("Received body:", body.toString());

					// Dynamic import to avoid build issues
					const { handleOrpc } = await import("@pkg/rpc");

					const resp = await handleOrpc(
						new Request("http://local/orpc", {
							method: "POST",
							headers: { "content-type": "application/json" },
							body,
						}),
					);

					res.statusCode = resp.status;
					resp.headers.forEach((v: string, k: string) => res.setHeader(k, v));
					res.end(Buffer.from(await resp.arrayBuffer()));
				} catch (error: any) {
					console.error("oRPC error:", error);
					res.statusCode = 500;
					res.setHeader("content-type", "application/json");
					res.end(JSON.stringify({ error: String(error) }));
				}
			});
		},
	};
}

export default defineConfig({
	plugins: [react(), orpcPlugin()],
	optimizeDeps: {
		exclude: [
			"classnames",
			"feelers",
			"@bpmn-io/feel-editor",
			"@codemirror/view",
			"focus-trap",
		],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./app"),
      "@pkg": resolve(__dirname, "../../../packages"),
      "@pkg/process": resolve(__dirname, "../../../packages/process/src"),
      "@pkg/rpc": resolve(__dirname, "../../../packages/rpc/src"),
		},
	},
	server: {
		port: 3001, // 3000が競合していたので3001に変更
		host: true,
		hmr: {
			overlay: false, // エラーオーバーレイを無効化
		},
	},
	configureServer(server) {
		console.log("Setting up oRPC middleware");
		// Add oRPC middleware
		server.middlewares.use("/orpc", async (req, res) => {
			console.log("oRPC middleware called:", req.url);
			try {
				const url = new URL(req.url || "", "http://localhost");
				if (url.pathname !== "/orpc") {
					console.log("Not oRPC path:", url.pathname);
					return;
				}

				const chunks: Uint8Array[] = [];
				for await (const c of req) chunks.push(c as Uint8Array);
				const body = Buffer.concat(chunks);

				console.log("Received body:", body.toString());

				// Dynamic import to avoid build issues
				const { handleOrpc } = await import("@pkg/rpc");

				const resp = await handleOrpc(
					new Request("http://local/orpc", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body,
					}),
				);

				res.statusCode = resp.status;
				resp.headers.forEach((v, k) => res.setHeader(k, v));
				res.end(Buffer.from(await resp.arrayBuffer()));
			} catch (error) {
				console.error("oRPC error:", error);
				res.statusCode = 500;
				res.setHeader("content-type", "application/json");
				res.end(JSON.stringify({ error: String(error) }));
			}
		});
	},
	build: {
		outDir: "dist",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
			},
			external: [
				"classnames",
				"feelers",
				"@bpmn-io/feel-editor",
				"@codemirror/view",
				"focus-trap",
			],
		},
	},
});
