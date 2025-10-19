# Performer

BPMN + Actor + Neo4j Web Framework (Next.js Type Conventions × Remix Boundaries × Effect Execution)

## Overview

Performer is a full-stack web framework that integrates Business Process Management (BPMN), actor systems, and Neo4j database. It provides a unique architecture combining Next.js file-based routing, Remix's loader/action patterns, and Effect's functional programming.

## Key Features

- **BPMN Control Flow**: Visually define and execute business processes
- **Actor System**: Distributed execution of service tasks with fault tolerance
- **Neo4j Integration**: Flexible data management with graph database
- **Type Safety**: End-to-end type safety with TypeScript + Zod
- **Modular Design**: Independent components provided as npm packages

## Architecture

### Technology Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| Routing | File-based Router | Next.js style `app/**/page.client.tsx` |
| Boundary Management | Remix Actions | Server/client boundary with loader/action patterns |
| Execution Foundation | Effect | Functional programming and error handling |
| Process Engine | BPMN SDK | Control flow definition and execution |
| Actor | Effect Actor | Distributed service task execution |
| Data | Neo4j + Neogma | Type-safe Cypher queries |
| UI | React + Tailwind | Modern user interface |
| Authentication | Auth0 | RBAC/ABAC access control |
| Monitoring | OpenTelemetry + Sentry | Distributed tracing and error monitoring |

### Package Structure

Performer provides the following npm packages:

- `@gftdcojp/performer` - Integration package (bundles all features)
- `@gftdcojp/performer-actions` - Remix loader/action + Auth0 guards
- `@gftdcojp/performer-actor` - Effect-based actor system
- `@gftdcojp/performer-data` - Neo4j + Neogma adapter
- `@gftdcojp/performer-process` - BPMN SDK wrapper
- `@gftdcojp/performer-router` - Next.js style file-based router

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neo4j 5.0+
- Auth0 account

### Installation

```bash
# Create a new project
mkdir my-performer-app
cd my-performer-app
npm init -y

# Install Performer packages
npm install @gftdcojp/performer --registry=https://npm.pkg.github.com

# Or use pnpm
pnpm add @gftdcojp/performer --registry=https://npm.pkg.github.com
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
import { createActions } from '@gftdcojp/performer-actions';
import { EffectActorSystem } from '@gftdcojp/performer-actor';
import { createNeo4jConnection } from '@gftdcojp/performer-data';
import { ProcessBuilder } from '@gftdcojp/performer-process';
import { FileRouter } from '@gftdcojp/performer-router';
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

## Version History

### v1.0.0 (Latest)
- 🎉 Initial release
- BPMN process engine integration
- Neo4j database adapter
- Effect-based actor system
- Auth0 authentication integration
- TypeScript type-safe API

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

**Performer** - BPMN + Actor + Neo4j Web Framework

[📦 npm](https://npm.pkg.github.com/@gftdcojp/performer) • [📚 Docs](https://github.com/gftdcojp/performer#readme) • [🐛 Issues](https://github.com/gftdcojp/performer/issues)

</div>
