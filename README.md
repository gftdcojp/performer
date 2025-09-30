# Performer

Web Framework CLI with EffectTS v3 + XState Actor + Web Components + WASM

Performer is a comprehensive web framework that combines:

- **EffectTS v3** - Functional programming and effect management for business logic
- **XState Actor** - State management and actor-based architecture
- **Web Components** - Native web component standards for UI
- **WASM** - High-performance computations
- **RPC** - Communication layer integrated with ActorDB

## Features

### 🔧 Framework Components

- **Domain Layer**: EffectTS-powered business logic with type safety
- **Actor Layer**: XState-based state management and actor coordination
- **UI Layer**: Web Components with FAST Element foundation
- **WASM Layer**: Performance-critical computations
- **RPC Layer**: ActorDB integration for event sourcing and CQRS

### 🛠️ CLI Tools

- Project initialization with templates
- Component generation (domain, actor, UI, WASM)
- Build system with Vite
- Development server
- Testing framework integration

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/com-junkawasaki/performer.git
cd performer

# Install dependencies
npm install

# Build the CLI
npm run build:cli

# Link globally (optional)
npm link
```

### Create New Project

```bash
# Create a new project
performer init my-app

# Or use a specific template
performer init my-app --template fullstack

cd my-app
npm install
npm run dev
```

### Generate Components

```bash
# Generate business domain
performer generate domain user

# Generate actor
performer generate actor user-manager

# Generate UI component
performer generate ui user-profile

# Generate WASM computation
performer generate wasm data-processor
```

## Project Structure

```
my-performer-app/
├── src/
│   ├── domain/          # Business logic (EffectTS)
│   ├── actor/           # State management (XState)
│   ├── ui/              # Web Components
│   ├── wasm/            # WASM computations
│   ├── rpc/             # ActorDB communication
│   └── index.ts         # Application entry point
├── wasm/                # WASM source files
├── dist/                # Build output
├── package.json
├── performer.json       # Framework configuration
└── vite.config.ts
```

## Architecture

### Process Network Graph Model

Performer uses a process network graph model based on Merkle DAGs for:

- **Dependency Management**: Clear component relationships
- **Build Optimization**: Topological execution order
- **Error Isolation**: Component-level failure containment
- **Scalability**: Independent component scaling

### Execution Flow

1. **Domain** → Business logic and effects
2. **Actor** → State management coordination
3. **UI** → Web component rendering
4. **WASM** → Performance computations
5. **RPC** → External communication

## Configuration

### performer.json

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "framework": {
    "version": "0.1.0",
    "features": {
      "effect-ts": true,
      "xstate": true,
      "web-components": true,
      "wasm": true,
      "rpc": true
    }
  },
  "actorDb": {
    "host": "localhost",
    "port": 9090,
    "secure": false
  },
  "build": {
    "outDir": "dist",
    "wasm": {
      "enabled": true,
      "modules": ["data-processor"]
    }
  }
}
```

## Development

### Building

```bash
# Build for production
npm run build

# Build CLI only
npm run build:cli

# Watch mode
npm run build -- --watch
```

### Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test -- --watch

# With coverage
npm run test -- --coverage
```

### Serving

```bash
# Start development server
npm run serve

# Custom port
npm run serve -- --port 3001

# Open browser automatically
npm run serve -- --open
```

## Examples

### Basic Domain Logic

```typescript
// src/domain/user.ts
import * as T from "@effect-ts/core/Effect"
import { ActorDBService } from "./types"

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly createdAt: Date
}

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>) =>
  T.accessServiceM(ActorDBService)((db) =>
    db.writeEvent({
      entityId: crypto.randomUUID(),
      eventType: 'user_created',
      payload: userData,
      timestamp: new Date(),
      version: 1,
    })
  )
```

### Actor State Management

```typescript
// src/actor/user-actor.ts
import { createMachine } from "xstate"

export const userMachine = createMachine({
  id: 'user',
  initial: 'inactive',
  states: {
    inactive: {
      on: { ACTIVATE: 'active' }
    },
    active: {
      on: { DEACTIVATE: 'inactive' }
    }
  }
})
```

### Web Component

```typescript
// src/ui/user-profile.ts
import { FASTElement, customElement, html } from "@microsoft/fast-element"

@customElement("user-profile")
export class UserProfile extends FASTElement {
  @observable user: User | null = null

  template = html<UserProfile>`
    <div class="profile">
      <h2>${x => x.user?.name}</h2>
      <p>${x => x.user?.email}</p>
    </div>
  `
}
```

## Integration with ActorDB

Performer integrates seamlessly with [ActorDB](https://github.com/com-junkawasaki/dekigoto):

```typescript
import { ActorDBHttpClient } from "@/rpc/actordb-client"

const client = new ActorDBHttpClient({
  host: "localhost",
  port: 9090,
  secure: false,
  token: "your-jwt-token"
})

// Write events
await client.writeEvent({
  entityId: "user-123",
  eventType: "user_updated",
  payload: { name: "John Doe" },
  timestamp: new Date(),
  version: 2
})

// Query projections
const userProfile = await client.getProjection("user_profiles")
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache License 2.0 - see LICENSE file for details

## Related Projects

- [ActorDB](https://github.com/com-junkawasaki/dekigoto) - Event sourcing database
- [Effect-TS](https://github.com/Effect-TS/core) - Functional programming library
- [XState](https://github.com/statelyai/xstate) - State management
- [FAST](https://github.com/microsoft/fast) - Web components framework
