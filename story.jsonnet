{
  // Merkle DAG: project_story -> architecture -> packages -> applications -> workflows
  // Complete project story and process network topology

  metadata: {
    name: "Performer BPMN Order Processing Platform",
    version: "1.0.0",
    description: "Enterprise-grade BPMN process automation platform with state-space software design",
    intent: "Build scalable, maintainable BPMN process automation using domain-driven hexagonal architecture",
    lastUpdated: "2025-01-19",
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
      build: "Turborepo + tsup + pnpm",
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
      recentChanges: ["Integrated error-handling for auth failures"]
    },

    actor: {
      id: "pkg_actor",
      description: "Actor pattern implementation for concurrent processing",
      dependencies: ["error-handling"],
      provides: ["concurrency", "message-passing"],
      status: "stub",
      recentChanges: []
    },

    cli: {
      id: "pkg_cli",
      description: "Command-line interface tools",
      dependencies: ["error-handling", "process"],
      provides: ["process-management", "deployment-tools"],
      status: "stub",
      recentChanges: []
    },

    contracts: {
      id: "pkg_contracts",
      description: "API contracts and type definitions",
      dependencies: ["error-handling"],
      provides: ["api-schema", "type-safety"],
      status: "stub",
      recentChanges: []
    },

    data: {
      id: "pkg_data",
      description: "Neo4j database layer with Neogma ORM",
      dependencies: ["error-handling"],
      provides: ["data-persistence", "query-abstraction", "transactions"],
      status: "implemented",
      recentChanges: ["Added config property to Neo4jConnection class"]
    },

    'error-handling': {
      id: "pkg_error_handling",
      description: "Unified error handling and reporting system",
      dependencies: [],
      provides: ["structured-errors", "error-recovery", "logging"],
      status: "implemented",
      recentChanges: ["Complete error handling system with reporters and recovery"]
    },

    observability: {
      id: "pkg_observability",
      description: "Monitoring, logging, and metrics collection",
      dependencies: ["error-handling"],
      provides: ["metrics", "tracing", "health-checks"],
      status: "stub",
      recentChanges: []
    },

    process: {
      id: "pkg_process",
      description: "BPMN process engine with custom DSL",
      dependencies: ["error-handling", "data"],
      provides: ["process-execution", "bpmn-validation", "workflow-management"],
      status: "implemented",
      recentChanges: ["Integrated error handling for BPMN validation"]
    },

    router: {
      id: "pkg_router",
      description: "Client-side routing utilities",
      dependencies: ["error-handling"],
      provides: ["navigation", "route-guards"],
      status: "stub",
      recentChanges: []
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
      "pkg_data",
      "pkg_error_handling",
      "pkg_process",
      "app_demo"
    ],

    pendingNodes: [
      "pkg_actor",
      "pkg_cli",
      "pkg_contracts",
      "pkg_observability",
      "pkg_router"
    ],

    criticalPaths: [
      "error-handling → actions → demo-app",
      "error-handling → data → process → demo-app",
      "data → process → workflows"
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
      "Complete remaining package stubs",
      "Implement BPMN workflow execution",
      "Add comprehensive test coverage",
      "Performance optimization"
    ],

    shortTerm: [
      "Multi-tenant architecture",
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
