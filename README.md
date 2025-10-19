# Performer

BPMN + Actor + Neo4j Web Framework (Next.js Type Conventions × Remix Boundaries × Effect Execution)

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://npm.pkg.github.com/@gftdcojp/performer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)

## Overview

Performer is a full-stack web framework that integrates Business Process Management (BPMN), actor systems, and Neo4j database. It provides a unique architecture combining Next.js file-based routing, Remix's loader/action patterns, and Effect's functional programming.

**🚀 Key Highlights:**
- **Complete CLI Toolchain**: Next.js-style `create`, `dev`, `build` commands
- **Modern Development**: Vite + HMR, TypeScript, Tailwind CSS
- **Enterprise Ready**: BPMN process automation with graph database persistence
- **UI Components Library**: Next.js Link wrapper with active state detection
- **Modular Architecture**: Independent npm packages for flexible composition
- **Developer Experience**: Comprehensive tooling with hot reloading and optimized builds

## Key Features

- **BPMN Control Flow**: Visually define and execute business processes
- **Actor System**: Distributed execution of service tasks with fault tolerance
- **Neo4j Integration**: Flexible data management with graph database
- **RPC Framework**: Type-safe procedure calls with I/O validation, streaming, and observability
- **Auth0 Integration**: JWT-based authentication with automatic claim extraction
- **Real-time Streaming**: WebSocket and Server-Sent Events for live updates
- **UI Components Library**: Next.js Link wrapper with active state detection and type validation
- **Type Safety**: End-to-end type safety with TypeScript + Zod
- **Modular Design**: Independent components provided as npm packages
- **Next.js-style CLI**: Complete development toolchain with create, dev, build commands
- **Monorepo Support**: Turborepo integration for scalable development

## Architecture

### Technology Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **CLI & Tooling** | Custom CLI + Turborepo | Next.js-style commands, monorepo orchestration |
| **Development** | Vite + TypeScript | Hot reloading, type safety, modern tooling |
| **Routing** | File-based Router | Next.js style `app/**/{page.client.tsx|page.tsx}` + `layout(.client).tsx` composition |
| **Boundary Management** | Remix Actions | Server/client boundary with loader/action patterns |
| **Execution Foundation** | Effect | Functional programming and error handling |
| **Process Engine** | BPMN SDK | Control flow definition and execution |
| **Actor** | Effect Actor | Distributed service task execution |
| **Data** | Neo4j + Neogma | Type-safe Cypher queries |
| **UI Components** | React + Next.js Link | Enhanced navigation with active state detection |
| **UI** | React + Tailwind | Modern user interface |
| **RPC Framework** | Custom RPC Layer | Type-safe procedure calls with I/O validation |
| **Authentication** | Auth0 | RBAC/ABAC access control with JWT integration |
| **Streaming** | WebSocket + SSE | Real-time event streaming and subscriptions |
| **Monitoring** | OpenTelemetry + Sentry | Distributed tracing and error monitoring |

### Package Structure

Performer provides the following npm packages:

- `@gftdcojp/performer` - Integration package (bundles all features)
- `@gftdcojp/performer-cli` - Next.js-style CLI with create, dev, build commands
- `@gftdcojp/performer-rpc` - Thin RPC layer with I/O validation, streaming, and observability
- `@gftdcojp/performer-ui` - UI components library with Next.js Link wrapper
- `@gftdcojp/performer-actions` - Remix loader/action + Auth0 guards
- `@gftdcojp/performer-actor` - Effect-based actor system
- `@gftdcojp/performer-data` - Neo4j + Neogma adapter
- `@gftdcojp/performer-process` - BPMN SDK wrapper
- `@gftdcojp/performer-router` - Next.js style file-based router

### CLI Capabilities

The Performer CLI provides a complete development experience:

- **Project Creation**: `performer create <name>` - Generate React + TypeScript apps
- **Development Server**: `performer dev` - Vite + HMR development server
- **Production Build**: `performer build` - Turborepo-optimized builds
- **Code Generation**: `performer gen` - Generate BPMN processes, actors, models
- **Database Tools**: `performer db` - Database operations and migrations
- **System Info**: `performer info` - Environment and system diagnostics

## Quick Start

### ⚡ 1-Minute Setup

#### 1. Install CLI Globally

```bash
# Install Performer CLI globally
npm install -g @gftdcojp/performer-cli --registry=https://npm.pkg.github.com

# Or use pnpm
pnpm add -g @gftdcojp/performer-cli --registry=https://npm.pkg.github.com

# Verify installation
performer --version
```

#### 2. Create Your First App

```bash
# Create a new Performer project
performer create my-app

# Navigate to the project
cd my-app

# Install dependencies
pnpm install

# Start development server
performer dev

# Open http://localhost:3000 in your browser
```

#### 3. Build for Production

```bash
# Build your app
performer build

# Preview production build
performer start
```

### 🔐 GitHub Packages Authentication

Performer packages are hosted on GitHub Packages. You'll need a Personal Access Token (PAT) with `packages:read` permission.

#### Global Setup (Recommended)

```bash
# Set your GitHub PAT globally
npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_PAT

# Or for pnpm
pnpm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_PAT
```

#### Project Setup (Alternative)

```bash
# Create .npmrc in your project root
echo "@gftdcojp:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT" >> .npmrc
```

#### Environment Variables (CI/CD)

```bash
# Set environment variable
export NPM_TOKEN=YOUR_GITHUB_PAT
echo "//npm.pkg.github.com/:_authToken=\${NPM_TOKEN}" > .npmrc
```

### Configuration

1. **Neo4j Setup**
   ```bash
   # Start Neo4j
   docker run -d -p 7474:7474 -p 7687:7687 \
     -e NEO4J_AUTH=neo4j/password \
     neo4j:5.0
   ```

2. **Auth0 Setup**
   ```typescript
   // src/config.ts
   export const auth0Config = {
     domain: 'your-domain.auth0.com',
     clientID: 'your-client-id',
     audience: 'your-api-identifier'
   }
   ```

3. **Environment Variables**
   ```bash
   # Create .env file
   echo "NEO4J_URI=bolt://localhost:7687" > .env
   echo "NEO4J_USER=neo4j" >> .env
   echo "NEO4J_PASSWORD=password" >> .env
   echo "AUTH0_DOMAIN=your-domain.auth0.com" >> .env
   echo "AUTH0_CLIENT_ID=your-client-id" >> .env
   ```

## Usage

## 📚 CLI Commands

Performer CLI provides a comprehensive development experience with Next.js-style commands.

### 🚀 Project Creation

```bash
# Quick start with default template
performer create my-app

# Full-featured setup
performer create my-bpmn-app --typescript --tailwind --neo4j --auth0

# Custom template (future feature)
performer create my-app --template enterprise

# Get help
performer create --help
```

### 🏃 Development Server

```bash
# Start with default settings
performer dev

# Custom configuration
performer dev --port 3001 --hostname 0.0.0.0 --open

# Turbo mode (future feature)
performer dev --turbo

# Help
performer dev --help
```

### 🔨 Production Build

```bash
# Standard build
performer build

# Advanced build with analysis
performer build --output dist --analyze --profile build-profile

# Verbose logging
performer build --verbose

# Help
performer build --help
```

### 🎯 Advanced Commands

```bash
# Start production server
performer start --port 8080 --hostname 0.0.0.0

# Export static site (future feature)
performer export --output out

# Code generation
performer gen process OrderProcess
performer gen actor OrderActor
performer gen model User

# Database operations
performer db migrate
performer db seed
performer db reset

# System diagnostics
performer info

# Telemetry settings
performer telemetry status
performer telemetry enable
performer telemetry disable
```

### 🛠️ CLI Architecture

**Project Templates:**
- React 18 + TypeScript + Vite
- Tailwind CSS + PostCSS + Autoprefixer
- Biome (linter + formatter)
- Hot Module Replacement (HMR)
- Optimized production builds

**Monorepo Support:**
- Turborepo integration
- Parallel builds and caching
- Workspace dependency management
- Cross-package optimizations

## 📦 Package Details

### @gftdcojp/performer-rpc

**Thin RPC layer for procedure registration and dispatch with I/O validation, streaming, and observability**

#### Features
- **Type-Safe Client SDK**: Generate type-safe fetch clients from router metadata
- **Auth0 JWT Integration**: Automatic claim extraction and context injection
- **Real-Time Streaming**: WebSocket and Server-Sent Events support
- **OpenTelemetry Metrics**: Distributed tracing and performance monitoring
- **I/O Validation**: Zod-based request/response validation
- **Error Standardization**: Structured error handling with correlation IDs

#### Usage

```typescript
import {
  createRouter,
  createHttpHandler,
  createClient,
  createContextFromRequestWithAuth
} from "@gftdcojp/performer-rpc";

// Create router with procedures
const router = createRouter<Context>()
  .add("user.create", async (ctx, input) => {
    // Business logic here
    return { id: "123", ...input };
  });

// HTTP handler with Auth0 integration
const handleRequest = createHttpHandler(router, async (req) => {
  return createContextFromRequestWithAuth(req);
});

// Type-safe client
const client = createClient(router, {
  baseUrl: "http://api.example.com/rpc"
});

const result = await client["user.create"]({
  name: "John Doe",
  email: "john@example.com"
});
```

#### Streaming Support

```typescript
import { createWebSocketHandler, globalEventBroker } from "@gftdcojp/performer-rpc";

const wsHandler = createWebSocketHandler(router, globalEventBroker);

// WebSocket connection enables:
// - RPC calls over WebSocket
// - Real-time event subscriptions
// - Automatic reconnection and heartbeats
```

## 🎮 Examples & Demos

### Demo Applications

Explore Performer with our example applications:

#### BPMN Order Processing Demo
```bash
# Clone and run the demo
cd apps/examples/demo-app
pnpm install
pnpm dev
```

#### CLI-Created App Demo
```bash
# The CLI creates apps like this demo
cd apps/examples/npm-pkg-demo-app/my-app
pnpm install
pnpm dev
```

### 📖 Learning Resources

- **Quick Start Guide**: Above setup instructions
- **API Documentation**: Comprehensive package docs
- **BPMN Tutorials**: Process modeling guides
- **Migration Guide**: From other frameworks

### Basic Usage Example

```typescript
// src/index.ts
import {
  createUser,
  createProcessInstance,
  generateId,
  VERSION
} from '@gftdcojp/performer';

console.log('Performer version:', VERSION);

// Create user
const user = createUser('user-123', 'user@example.com', ['admin']);
console.log('Created user:', user);

// Create process instance
const processInstance = createProcessInstance('order-process', 'business-123');
console.log('Created process:', processInstance);

// Generate ID
const newId = generateId('order');
console.log('Generated ID:', newId);
```

### BPMN Process Definition

```typescript
// src/processes/orderProcess.ts
import { ProcessBuilder } from "@gftdcojp/performer";

export const orderProcess = new ProcessBuilder("OrderProcess", "Order Processing")
  .startEvent("OrderReceived")
  .userTask("ReviewOrder", "Review Order Details")
  .exclusiveGateway("ApprovalCheck")
    .condition("amount <= 1000", "AutoApprove")
    .otherwise("ManagerApproval")
  .serviceTask("ProcessPayment")
  .endEvent("Completed")
  .build();
```

### Database Operations

```typescript
// src/database/setup.ts
import {
  createNeo4jConnection,
  createTransactionManager,
  createSchemaManager
} from '@gftdcojp/performer';

// Neo4j connection setup
const connection = createNeo4jConnection({
  uri: process.env.NEO4J_URI!,
  username: process.env.NEO4J_USER!,
  password: process.env.NEO4J_PASSWORD!
});

// Transaction manager
const txManager = createTransactionManager(connection);

// Schema manager
const schemaManager = createSchemaManager(connection);

// Create schema
await schemaManager.createConstraints();
```

### Actor System

```typescript
// src/actors/orderActor.ts
import {
  EffectActorSystem,
  createBPMNBridge,
  ServiceTaskActor
} from '@gftdcojp/performer';

// Create actor system
const system = new EffectActorSystem();

// Create BPMN bridge
const bridge = createBPMNBridge(system);

// Execute service task
await bridge.executeServiceTask(
  'order-123',
  'validate-payment',
  async () => {
    // Payment validation logic
    return { status: 'approved' };
  }
);
```

### Error Handling

```typescript
// src/errorHandling/setup.ts
import {
  createErrorFactory,
  globalRecoveryManager
} from '@gftdcojp/performer';

// Create error factory
const errorFactory = createErrorFactory('my-app');

// Register recovery strategy
globalRecoveryManager.registerStrategy('NETWORK_ERROR', {
  name: 'retry-network',
  description: 'Network error retry strategy',
  execute: async (error) => {
    // Retry logic
    return true;
  }
});

// Generate error
const error = errorFactory.networkError('api-call', new Error('Connection failed'));
```

### Authentication and Actions

```typescript
// src/actions/auth.ts
import { createActions } from '@gftdcojp/performer';

// Auth0 configuration
const auth0Config = {
  domain: 'your-domain.auth0.com',
  clientID: 'your-client-id',
  audience: 'your-api-identifier'
};

// Create action builder
export const actions = createActions(auth0Config);

// Define role-based actions
export const secureActions = actions.roles('admin', 'manager');
```

### Routing

```typescript
// src/router/setup.ts
import { FileRouter, SSRPipeline } from '@gftdcojp/performer';

// Router configuration
const routerConfig = {
  basePath: '/app',
  appDir: './src/pages'
};

// Create file router
const router = new FileRouter(routerConfig);

// Create SSR pipeline
const ssrPipeline = new SSRPipeline(router);

// Render page
const result = await ssrPipeline.render('/orders/123');
```

#### File structure and resolution

```
app/
  layout.tsx               // optional root layout (or layout.client.tsx)
  orders/
    layout.client.tsx      // optional nested layout (preferred client version)
    page.client.tsx        // preferred page entry
    page.tsx               // fallback page entry when client file is absent
    loader.server.ts       // optional SSR data loader (returns props)
    action.server.ts       // optional server action
```

- Page resolution: `page.client.tsx` → fallback to `page.tsx` if not present
- Layout discovery: ascend directories and compose `layout.client.tsx` → fallback to `layout.tsx`
- Composition order: root layout → nested layouts → page

### UI Components

```typescript
// src/components/Navigation.tsx
import { Link, createActiveChecker } from '@gftdcojp/performer-ui';

function Navigation() {
  const isActive = createActiveChecker('/dashboard');

  return (
    <nav>
      <Link href="/dashboard" activeClassName="active" isActive={isActive}>
        <a>Dashboard</a>
      </Link>
      <Link href="/orders" className="nav-link">
        <a>Orders</a>
      </Link>
      <Link href="/settings" className="nav-link" prefetch={false}>
        <a>Settings</a>
      </Link>
    </nav>
  );
}
```

## API Reference

### Main Exports

```typescript
import {
  // Version information
  VERSION,
  FRAMEWORK_NAME,

  // Basic types
  User,
  ProcessInstance,

  // Factory functions
  createUser,
  createProcessInstance,
  generateId,
  isCompleted,
  isRunning,

  // Actions & Authentication
  createActions,
  AuthGuard,
  ActionBuilder,

  // Actor system
  EffectActorSystem,
  createBPMNBridge,
  ServiceTaskActor,

  // BPMN processes
  ProcessBuilder,
  ProcessEngine,
  processEngine,

  // Neo4j database
  createNeo4jConnection,
  createTransactionManager,
  createProcessInstanceRepository,
  createSchemaManager,

  // Routing
  FileRouter,
  SSRPipeline
} from '@gftdcojp/performer';

// Individual packages can also be imported separately:
import { Link, createActiveChecker } from '@gftdcojp/performer-ui';
import { createActions } from '@gftdcojp/performer-actions';
import { EffectActorSystem } from '@gftdcojp/performer-actor';
import { createNeo4jConnection } from '@gftdcojp/performer-data';
import { ProcessBuilder } from '@gftdcojp/performer-process';
import { FileRouter } from '@gftdcojp/performer-router';

// CLI commands (when installed globally)
import { runCLI } from '@gftdcojp/performer-cli';
```

### Package Design and Publishing Best Practices

- Naming: `@gftdcojp/performer-*` に統一。統合用 `@gftdcojp/performer` は再エクスポートを提供。
- Exports: `exports` フィールドで `types`/`import`/`require` を明示し、深い import を防止。
- Peer Dependencies: React/Vite/Next 等のホスト依存は `peerDependencies` として宣言。
- Build: tsup で ESM/CJS/d.ts を生成、`sideEffects: false` でツリーシェイク前提。
- Files: `files` で公開物を `dist` 等に限定。
- Registry: 公開先が GitHub Packages の場合、各 `package.json` に `publishConfig.registry` を設定。

#### Release Flow (recommended)

1. Changesets で変更を記述（SemVer準拠）
2. PR マージで CI が version bump + tag
3. CI が `pnpm -r build` → `pnpm -r publish`（dry-run → 本番）
4. `latest` と `next` タグを使い分けて安定性を担保

#### Dry-run publish check

```bash
# 作業ツリーがクリーンでない場合は --no-git-checks
pnpm publish --dry-run --filter @gftdcojp/performer-actions --no-git-checks
```

## Project Templates

Templates to quickly start new Performer projects:

```bash
# Use template (coming soon)
npx create-performer-app my-app
cd my-app
npm install
npm run dev
```

## Troubleshooting

### Common Issues

**GitHub Packages Authentication Error**
```bash
# Set PAT
npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN
```
または `.npmrc` に以下を追加:

```ini
@gftdcojp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Neo4j Connection Error**
```bash
# Check connection info
docker ps | grep neo4j
curl http://localhost:7474
```

**BPMN Process Execution Error**
```typescript
// Enable error handling
import { createErrorFactory } from '@gftdcojp/performer';
const errorFactory = createErrorFactory('my-app');
```

## Documentation

Detailed documentation can be found at:

- [GitHub Repository](https://github.com/gftdcojp/performer)
- [API Reference](https://github.com/gftdcojp/performer#readme)
- [Sample Code](https://github.com/gftdcojp/performer/tree/main/apps/examples)

## Contributing

If you'd like to contribute to Performer development:

1. Report bugs or request features via [GitHub Issues](https://github.com/gftdcojp/performer/issues)
2. Ask questions and discuss via [GitHub Discussions](https://github.com/gftdcojp/performer/discussions)
3. Submit code improvements via Pull Request

### Development Environment Setup

```bash
# Clone repository
git clone https://github.com/gftdcojp/performer.git
cd performer

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build packages
pnpm build
```

## 🤝 Contributing

We welcome contributions to Performer! Here's how you can help:

### Development Setup

```bash
# Clone the repository
git clone https://github.com/gftdcojp/performer.git
cd performer

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
```

### 📝 Contribution Guidelines

1. **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/gftdcojp/performer/issues)
2. **Discussions**: Join community discussions on [GitHub Discussions](https://github.com/gftdcojp/performer/discussions)
3. **Pull Requests**: Submit improvements via PR with clear descriptions
4. **Documentation**: Help improve docs and examples

### 🏗️ Architecture

Performer follows **State-Space Software Design** principles:
- **Domain-Driven Design**: Bounded contexts with clear boundaries
- **Hexagonal Architecture**: Ports/adapters for clean separation
- **Functional Programming**: Effect-based error handling and composition
- **Type Safety**: End-to-end TypeScript with Zod validation

### 📚 Resources

- **Documentation**: Comprehensive API docs and guides
- **Examples**: Working demo applications in `apps/examples/`
- **Architecture**: State-space design principles in `story.jsonnet`

## 📋 Version History

### v1.0.0 (Latest) - Complete Framework Release 🚀
- 🎉 **Production Ready**: Enterprise-grade BPMN process automation platform
- 🏗️ **State-Space Architecture**: Domain-driven hexagonal architecture implementation
- ⚡ **Next.js-Style CLI**: Full development toolchain (create/dev/build/start/gen/db/info/telemetry)
- 🚀 **Modern Development Stack**: Vite + HMR, TypeScript 5.9, Tailwind CSS, Biome
- 📦 **Modular Package Ecosystem**: 9 npm packages published to GitHub Packages
- 🔄 **Monorepo Excellence**: Turborepo integration with parallel builds and caching
- 🎨 **Automated Project Generation**: React 18 + TypeScript app templates
- 🗄️ **Graph Database Integration**: Neo4j with type-safe Cypher queries via Neogma
- 🎭 **Distributed Actor System**: Effect-based service task execution with fault tolerance
- 🔐 **Enterprise Authentication**: Auth0 RBAC/ABAC with Remix-style actions
- 📡 **RPC Framework**: Type-safe procedure calls with I/O validation, streaming, and observability
- 📊 **Observability**: OpenTelemetry + Sentry distributed tracing and monitoring
- 🎯 **BPMN Process Engine**: Complete business process automation with custom DSL
- 🎨 **UI Components**: Next.js Link wrapper with active state detection and Zod validation

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Acknowledgments

Performer is built on top of these excellent open source projects:

- [Next.js](https://nextjs.org/) - File-based routing inspiration
- [Remix](https://remix.run/) - Loader/action pattern reference
- [Effect](https://effect.website/) - Functional programming foundation
- [BPMN.io](https://bpmn.io/) - BPMN processing library
- [Neo4j](https://neo4j.com/) - Graph database
- [Auth0](https://auth0.com/) - Authentication and authorization service

---

<div align="center">

## 🌟 Performer Framework

**Enterprise-Grade BPMN Process Automation Platform**

### 📦 Installation
```bash
# CLI (recommended)
npm install -g @gftdcojp/performer-cli --registry=https://npm.pkg.github.com
performer create my-app

# Or individual packages
npm install @gftdcojp/performer --registry=https://npm.pkg.github.com
```

### 🔗 Links
- [📚 Documentation](https://github.com/gftdcojp/performer#readme)
- [🐛 Issues](https://github.com/gftdcojp/performer/issues)
- [💬 Discussions](https://github.com/gftdcojp/performer/discussions)
- [📦 GitHub Packages](https://npm.pkg.github.com/@gftdcojp/performer)

### 🏗️ Architecture
**State-Space Software Design × Domain-Driven Design × Hexagonal Architecture**

Built with ❤️ using TypeScript, Effect, Neo4j, and modern web technologies.

---

*Performer v1.0.0 - Production Ready BPMN Process Automation Framework*

</div>
