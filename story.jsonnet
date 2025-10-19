{
  // Merkle DAG: project_story -> architecture -> packages -> applications -> workflows
  // Complete project story and process network topology

  metadata: {
    name: "Performer BPMN Order Processing Platform",
    version: "1.0.0",
    description: "Enterprise-grade BPMN process automation platform with state-space software design",
    intent: "Build scalable, maintainable BPMN process automation using domain-driven hexagonal architecture",
    lastUpdated: "2025-10-19",
    status: "active"
  },

  // Architecture Overview (Merkle DAG root)
  architecture: {
    paradigm: "State-Space Software Design + Hexagonal Architecture + Domain-Driven Design",
    philosophy: "Everything is a state transition. Boundaries are sacred. Entropy must be minimized.",

    layers: {
      // L0: Philosophy - State Space Ontology
      philosophy: {
        principles: [
          "x' = A x + B u (state transitions are linear and observable)",
          "Boundaries prevent entropy leakage",
          "Domain logic is pure and side-effect free",
          "Ports/Adapters isolate external dependencies"
        ]
      },

      // L1: Strategic - Domain Decomposition
      strategic: {
        domains: ["OrderProcessing", "InventoryManagement", "CustomerSupport", "ReturnsProcessing"],
        contexts: {
          order: "Order lifecycle management",
          inventory: "Stock and supply chain",
          support: "Customer service processes",
          returns: "Return and refund workflows"
        }
      },

      // L2: Structural - Hexagonal Architecture
      structural: {
        core: "Pure domain logic + business rules",
        ports: "Abstract interfaces for external communication",
        adapters: "Concrete implementations (Neo4j, Auth0, BPMN.js)"
      },

      // L3: Tactical - Implementation Patterns
      tactical: {
        entities: "Domain objects with invariants",
        services: "Application services orchestrating use cases",
        repositories: "Data access abstractions",
        factories: "Object creation and error handling"
      }
    },

    technology: {
      frontend: "React 18 + Vite + TypeScript + Tailwind CSS",
      backend: "Effect + Node.js + TypeScript",
      database: "Neo4j + Neogma ORM",
      process: "BPMN.js + Custom DSL",
      auth: "Auth0 v3",
      build: "Turborepo + tsup + pnpm (GitHub Packages)",
      quality: "Biome + Vitest + Playwright"
    }
  },

  // Package Network Topology (Merkle DAG nodes)
  packages: {
    // Core domain packages
    actions: {
      id: "pkg_actions",
      description: "Remix-style actions with Auth0 authentication",
      dependencies: ["error-handling"],
      provides: ["authentication", "authorization", "action-validation"],
      status: "implemented",
      recentChanges: ["Integrated error-handling for auth failures", "Renamed to @gftdcojp/performer-actions and added publishConfig.registry"]
    },

    actor: {
      id: "pkg_actor",
      description: "Actor pattern implementation for concurrent processing",
      dependencies: ["error-handling"],
      provides: ["concurrency", "message-passing"],
      status: "implemented",
      recentChanges: ["Renamed to @gftdcojp/performer-actor and added publishConfig.registry"]
    },

    cli: {
      id: "pkg_cli",
      description: "Next.js-style CLI with create, dev, build commands",
      dependencies: ["error-handling", "process"],
      provides: ["project-creation", "development-server", "build-tools", "code-generation"],
      status: "implemented",
      recentChanges: [
        "Implemented complete Next.js-style CLI with create, dev, build, start, gen, db, info, telemetry commands",
        "Added Vite + HMR development server integration with auto-detection",
        "Added Turborepo build system integration for monorepo support",
        "Added project template system with React + TypeScript + Tailwind CSS",
        "✅ Published as public package @gftdcojp/performer-cli on GitHub Packages",
        "✅ Ready for global installation with npm/pnpm install -g",
        "✅ Successfully published v1.0.0 to GitHub Packages registry"
      ]
    },

    contracts: {
      id: "pkg_contracts",
      description: "API contracts and type definitions",
      dependencies: ["error-handling"],
      provides: ["api-schema", "type-safety"],
      status: "internal",
      recentChanges: ["Marked private, DTS build disabled due to @ts-rest/core types"]
    },

    data: {
      id: "pkg_data",
      description: "Neo4j database layer with Neogma ORM",
      dependencies: ["error-handling"],
      provides: ["data-persistence", "query-abstraction", "transactions"],
      status: "implemented",
      recentChanges: ["Added config property to Neo4jConnection class", "Renamed to @gftdcojp/performer-data and added publishConfig.registry"]
    },

    'error-handling': {
      id: "pkg_error_handling",
      description: "Unified error handling and reporting system",
      dependencies: [],
      provides: ["structured-errors", "error-recovery", "logging"],
      status: "implemented",
      recentChanges: ["Complete error handling system with reporters and recovery", "Marked private, strict typing adjustments for d.ts"]
    },

    observability: {
      id: "pkg_observability",
      description: "Monitoring, logging, and metrics collection",
      dependencies: ["error-handling"],
      provides: ["metrics", "tracing", "health-checks"],
      status: "internal",
      recentChanges: ["Marked private, added src and tsup config"]
    },

    process: {
      id: "pkg_process",
      description: "BPMN process engine with custom DSL",
      dependencies: ["error-handling", "data"],
      provides: ["process-execution", "bpmn-validation", "workflow-management"],
      status: "implemented",
      recentChanges: ["Integrated error handling for BPMN validation", "Renamed to @gftdcojp/performer-process and added publishConfig.registry"]
    },

    router: {
      id: "pkg_router",
      description: "Client-side routing utilities",
      dependencies: ["error-handling"],
      provides: ["navigation", "route-guards"],
      status: "implemented",
      recentChanges: ["Renamed to @gftdcojp/performer-router and added publishConfig.registry"]
    },

    ui: {
      id: "pkg_ui",
      description: "UI components library with Next.js Link wrapper",
      dependencies: ["error-handling"],
      provides: ["ui-components", "navigation-components", "link-component"],
      status: "implemented",
      recentChanges: ["Created new UI components package with Next.js Link wrapper", "Added Link component with active state detection", "Implemented type-safe props validation with Zod"]
    }
  },

  // Application Network Topology
  applications: {
    'demo-app': {
      id: "app_demo",
      description: "BPMN Order Processing Demo Application",
      type: "frontend",
      port: 8100,
      dependencies: [
        "actions", "actor", "cli", "contracts", "data",
        "error-handling", "observability", "process", "router"
      ],
      features: {
        orderProcessing: "Complete order-to-payment workflow",
        adminDashboard: "Process monitoring and management",
        errorHandling: "Enhanced runtime error display",
        responsiveUI: "Mobile-first design with Tailwind CSS"
      },
      status: "implemented",
      recentChanges: [
        "Enhanced error boundary with detailed error display",
        "Changed default port to 8100",
        "Integrated error-handling package"
      ]
    }
  },

  // Process Network Topology (Workflows)
  workflows: {
    orderProcessing: {
      id: "wf_order",
      description: "Order → Approval → Payment → Fulfillment workflow",
      steps: [
        "OrderSubmission",
        "RiskAssessment",
        "ManagerApproval",
        "PaymentProcessing",
        "InventoryCheck",
        "ShippingArrangement",
        "CustomerNotification"
      ],
      actors: ["Customer", "RiskAnalyst", "Manager", "PaymentService", "Warehouse"],
      status: "designed"
    },

    inventoryManagement: {
      id: "wf_inventory",
      description: "Inventory monitoring and replenishment",
      steps: [
        "StockLevelMonitoring",
        "ReorderPointCheck",
        "SupplierEvaluation",
        "PurchaseOrderCreation",
        "ApprovalWorkflow",
        "GoodsReceipt",
        "QualityInspection"
      ],
      actors: ["InventoryManager", "ProcurementOfficer", "Supplier", "QualityInspector"],
      status: "designed"
    },

    customerSupport: {
      id: "wf_support",
      description: "Customer service ticket processing",
      steps: [
        "TicketCreation",
        "InitialAssessment",
        "EscalationCheck",
        "Investigation",
        "Resolution",
        "CustomerResponse",
        "Closure"
      ],
      actors: ["Customer", "SupportAgent", "Supervisor", "Specialist"],
      status: "designed"
    }
  },

  // Quality Gates and Metrics
  quality: {
    testing: {
      unit: "Vitest for all packages",
      integration: "Playwright for E2E",
      coverage: "Target >80%",
      status: "partial"
    },

    linting: {
      tool: "Biome",
      rules: "strict",
      formatting: "consistent",
      status: "active"
    },

    building: {
      tool: "Turborepo + tsup",
      optimization: "tree-shaking, minification",
      status: "active"
    },

    monitoring: {
      errors: "Structured error reporting",
      performance: "Bundle analysis",
      dependencies: "Security audits",
      status: "implementing"
    }
  },

  // Current Process Network State
  processState: {
    activeNodes: [
      "pkg_actions",
      "pkg_actor",
      "pkg_cli",
      "pkg_data",
      "pkg_error_handling",
      "pkg_process",
      "pkg_router",
      "pkg_ui",
      "app_demo"
    ],

    pendingNodes: [
      "pkg_contracts",
      "pkg_observability"
    ],

    criticalPaths: [
      "error-handling → actions → demo-app",
      "error-handling → data → process → demo-app",
      "error-handling → process → cli → development-tools",
      "data → process → workflows",
      "cli → project-templates → demo-app"
    ],

    bottlenecks: [
      "BPMN validation performance",
      "Neo4j connection pooling",
      "Error recovery strategies"
    ]
  },

  // Roadmap and Next Steps
  roadmap: {
    immediate: [
      "Adopt Changesets for versioning",
      "CI: build/test and dry-run publish for all public packages",
      "Implement BPMN workflow execution",
      "Add comprehensive test coverage",
      "Performance optimization",
      "✅ CLI development toolchain completed (create, dev, build, gen commands)",
      "✅ Vite + HMR development server integrated",
      "✅ Turborepo build system integration completed",
      "✅ Project template system with React + TypeScript implemented"
    ],

    shortTerm: [
      "Multi-tenant architecture",
      "CI: automated publish to GitHub Packages on tagged releases",
      "Real-time process monitoring",
      "Advanced error recovery",
      "API documentation"
    ],

    longTerm: [
      "Cloud-native deployment",
      "AI-powered process optimization",
      "Advanced analytics dashboard",
      "Third-party integrations"
    ]
  }
}
