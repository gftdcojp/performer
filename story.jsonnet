{
  // Process Network Graph Model for Web Framework CLI
  // Based on ActorDB (dekigoto) + EffectTS v3 + Effect Actor

  nodes: {
    // Core Infrastructure Nodes
    cli: {
      type: 'executable',
      deps: ['build', 'domain'],
      provides: ['command-interface'],
      description: 'Command Line Interface for project generation and management'
    },

    build: {
      type: 'process',
      deps: ['domain', 'actor', 'ui', 'wasm', 'rpc', 'realtime'],
      provides: ['compilation', 'bundling'],
      description: 'Build system for TypeScript, WASM, Web Components, and real-time modules'
    },

    // Business Logic Layer
    domain: {
      type: 'effect-ts-module',
      deps: [],
      provides: ['business-logic', 'effects'],
      description: 'Business domain logic using EffectTS v3'
    },

    // State Management Layer
    actor: {
      type: 'effect-actor',
      deps: ['domain'],
      provides: ['state-management', 'actors', 'supervision'],
      description: 'State management using Effect Actor with supervision and fault tolerance'
    },

    // UI Layer
    ui: {
      type: 'web-components',
      deps: ['actor'],
      provides: ['user-interface'],
      description: 'UI components using Web Components standard'
    },

    // Performance Layer
    wasm: {
      type: 'wasm-module',
      deps: ['domain'],
      provides: ['high-performance-computation'],
      description: 'WASM components for performance-critical operations'
    },

    // Communication Layer
    rpc: {
      type: 'rpc-client',
      deps: ['domain'],
      provides: ['remote-communication'],
      description: 'RPC communication layer for ActorDB integration'
    },

    // Persistence Layer
    persistence: {
      type: 'libsql-database',
      deps: [],
      provides: ['data-persistence', 'event-store', 'projection-store', 'actor-store'],
      description: 'Local libSQL database for event sourcing, projections, and actor state persistence'
    },

    // Real-time Synchronization Layer (Rivet-like + SSE)
    realtime: {
      type: 'websocket-sse-eventsourcing',
      deps: ['rpc', 'actor'],
      provides: ['realtime-sync', 'event-broadcast', 'conflict-resolution', 'sse-streaming', 'dual-transport'],
      description: 'Real-time synchronization with WebSocket/SSE dual transport, eventsourcing, actor state management, and CRDT-like conflict resolution'
    },

    // Quality Assurance
    test: {
      type: 'test-suite',
      deps: ['domain', 'actor', 'ui', 'wasm', 'rpc', 'realtime'],
      provides: ['quality-assurance'],
      description: 'Comprehensive test suite including real-time synchronization tests'
    }
  },

  // Execution Order (Topological Sort)
  execution_order: [
    'persistence', // Foundation: Data persistence
    'domain',      // Foundation: Business logic
    'rpc',         // Communication setup
    'realtime',    // Real-time synchronization
    'actor',       // State management
    'wasm',        // Performance components
    'ui',          // User interface
    'build',       // Compilation
    'test',        // Quality assurance
    'cli'          // CLI interface
  ],

  // Merkle DAG Structure
  merkle_dag: {
    root: 'persistence',
    branches: {
      foundation: ['persistence', 'domain'],
      business: ['domain'],
      communication: ['rpc', 'realtime'],
      presentation: ['actor', 'ui'],
      performance: ['wasm'],
      tooling: ['build', 'test', 'cli']
    }
  },

  // Configuration
  config: {
    framework_name: 'Performer',
    version: '0.1.0',
    base_dependencies: [
      '@effect-ts/core',
      '@effect-ts/system',
      '@effect-ts/actors-v3',    // Effect Actor for state management
      'effect',                  // Effect v3
      '@microsoft/fast-element',  // Web Components
      '@types/web',              // Web APIs types
      'vite',                    // Build tool
      'typescript',
      'ws',                      // WebSocket library for real-time communication
      'uuid',                    // UUID generation for event IDs
      '@libsql/client',          // libSQL client for local persistence
      'dotenv'                   // Environment variable management
    ],
    actor_db_integration: true,
    wasm_support: true,
    realtime_support: true,
    persistence: {
      default_mode: 'local',     // 'local' (libSQL), 'http' (ActorDB server), 'websocket'
      local_db_url: 'file:performer.db',
      supported_backends: ['libsql', 'postgresql', 'sqlite']
    },
    cli_commands: [
      'init',
      'generate:domain',
      'generate:actor',
      'generate:ui',
      'generate:wasm',
      'generate:realtime',
      'build',
      'serve',
      'test'
    ]
  }
}
