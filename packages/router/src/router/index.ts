// Merkle DAG: router_core -> file_router -> ssr_pipeline
// Core router interfaces and implementations for file-based routing with SSR
import * as React from "react";

type ComponentProps = Record<string, unknown>;
const FallbackComponent: React.FC = () => null;

export interface RouteMatch {
	path: string;
	params: Record<string, string>;
	query: Record<string, string>;
	file: string;
}

export interface ServerRoute {
	loader?: () => Promise<unknown>;
	action?: (data: unknown) => Promise<unknown>;
}

export interface ClientRoute {
	default: React.ComponentType<ComponentProps>;
}

export interface RouterConfig {
	basePath: string;
	appDir: string;
}

export class FileRouter {
	private config: RouterConfig;

	constructor(config: RouterConfig) {
		this.config = config;
	}

	async match(pathname: string): Promise<RouteMatch | null> {
		// Implementation for file-based routing
		// Supports Next.js-like structure:
		// - app/**/page.client.tsx (primary) or app/**/page.tsx (fallback)
		// - app/**/layout.client.tsx (and app/**/layout.tsx fallback) discovered up the directory tree
		// - loader.server.ts and action.server.ts co-located per route
		const normalizedPath = pathname.startsWith("/")
			? pathname.slice(1)
			: pathname;
		const segments = normalizedPath.split("/");

		// Strip basePath if provided
		const base = this.config.basePath?.replace(/^\//, "").replace(/\/$/, "") || "";
		const pathSegments = base && normalizedPath.startsWith(base)
			? normalizedPath.slice(base.length).replace(/^\//, "").split("/")
			: segments;

		return {
			path: pathname,
			params: {},
			query: {},
			file: `${this.config.appDir}/${pathSegments.join("/")}`,
		};
	}

	async loadServerRoute(filePath: string): Promise<ServerRoute> {
		// Dynamic import of .server.ts files
		try {
			const module = await import(filePath);
			return {
				loader: module.loader,
				action: module.action,
			};
		} catch {
			return {};
		}
	}

	async loadClientRoute(filePath: string): Promise<ClientRoute> {
		// Dynamic import of .client.tsx files
		try {
			const module = await import(filePath);
			return {
				default: module.default,
			};
		} catch {
			return {
				default: () => null,
			};
		}
	}
}

export class SSRPipeline {
	private router: FileRouter;

	constructor(router: FileRouter) {
		this.router = router;
	}

	async render(
		pathname: string,
	): Promise<{ props: unknown; Component: React.ComponentType<ComponentProps> } | null> {
		const match = await this.router.match(pathname);
		if (!match) return null;

		// Load server route for SSR data
		const serverRoute = await this.router.loadServerRoute(
			`${match.file}.server.ts`,
		);
		const props = serverRoute.loader ? await serverRoute.loader() : {};

		// Resolve page component with fallback: page.client.tsx -> page.tsx
		const pageClientPath = `${match.file}.client.tsx`;
		const pageTsxPath = `${match.file}.tsx`;
		let pageModule = await this.router.loadClientRoute(pageClientPath);
		if (!pageModule?.default || pageModule.default === FallbackComponent) {
			pageModule = await this.router.loadClientRoute(pageTsxPath);
		}

		// Discover and compose ancestor layouts: layout.client.tsx -> layout.tsx per dir level
		const layoutComponents: React.ComponentType<ComponentProps>[] = [];
		const filePath = match.file; // e.g., app/a/b/page
		const parts = filePath.split("/");
		// Drop the trailing 'page' segment to start at route dir
		const withoutPage = parts.slice(0, -1);
		for (let i = withoutPage.length; i >= 1; i--) {
			const dir = withoutPage.slice(0, i).join("/");
			const layoutClient = await this.router.loadClientRoute(`${dir}/layout.client.tsx`);
			if (layoutClient?.default && layoutClient.default !== FallbackComponent) {
				layoutComponents.unshift(layoutClient.default);
				continue;
			}
			const layoutTsx = await this.router.loadClientRoute(`${dir}/layout.tsx`);
			if (layoutTsx?.default && layoutTsx.default !== FallbackComponent) {
				layoutComponents.unshift(layoutTsx.default);
			}
		}

		// Compose layouts around the page component
		let Composed: React.ComponentType<ComponentProps> = pageModule.default;
		for (const Layout of layoutComponents) {
			const Inner = Composed;
			Composed = (layoutProps: ComponentProps) => (
				React.createElement(
					Layout,
					layoutProps,
					React.createElement(Inner, layoutProps),
				)
			);
		}

		return {
			props,
			Component: Composed,
		};
	}
}
