// Merkle DAG: router_core -> file_router -> ssr_pipeline
// Core router interfaces and implementations for file-based routing with SSR

export interface RouteMatch {
  path: string
  params: Record<string, string>
  query: Record<string, string>
  file: string
}

export interface ServerRoute {
  loader?: () => Promise<unknown>
  action?: (data: unknown) => Promise<unknown>
}

export interface ClientRoute {
  default: React.ComponentType<any>
}

export interface RouterConfig {
  basePath: string
  appDir: string
}

export class FileRouter {
  private config: RouterConfig

  constructor(config: RouterConfig) {
    this.config = config
  }

  async match(pathname: string): Promise<RouteMatch | null> {
    // Implementation for file-based routing
    // Matches app/**/page.client.tsx, loader.server.ts, actions.server.ts, process.flow.ts
    const normalizedPath = pathname.startsWith('/') ? pathname.slice(1) : pathname
    const segments = normalizedPath.split('/')

    // Basic implementation - extend for full file-based routing
    return {
      path: pathname,
      params: {},
      query: {},
      file: `${this.config.appDir}/${segments.join('/')}`
    }
  }

  async loadServerRoute(filePath: string): Promise<ServerRoute> {
    // Dynamic import of .server.ts files
    try {
      const module = await import(filePath)
      return {
        loader: module.loader,
        action: module.action
      }
    } catch {
      return {}
    }
  }

  async loadClientRoute(filePath: string): Promise<ClientRoute> {
    // Dynamic import of .client.tsx files
    try {
      const module = await import(filePath)
      return {
        default: module.default
      }
    } catch {
      return {
        default: () => null
      }
    }
  }
}

export class SSRPipeline {
  private router: FileRouter

  constructor(router: FileRouter) {
    this.router = router
  }

  async render(pathname: string): Promise<{ props: unknown; Component: React.ComponentType<any> } | null> {
    const match = await this.router.match(pathname)
    if (!match) return null

    // Load server route for SSR data
    const serverRoute = await this.router.loadServerRoute(`${match.file}.server.ts`)
    const props = serverRoute.loader ? await serverRoute.loader() : {}

    // Load client component
    const clientRoute = await this.router.loadClientRoute(`${match.file}.client.tsx`)

    return {
      props,
      Component: clientRoute.default
    }
  }
}
