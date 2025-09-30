// Init Command
// Merkle DAG: cli-node -> init-command

import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Project templates
const templates = {
  basic: {
    name: 'Basic',
    description: 'Basic Performer project with essential components',
    files: [
      'src/domain/index.ts',
      'src/actor/index.ts',
      'src/ui/index.ts',
      'src/wasm/index.ts',
      'src/rpc/index.ts',
      'src/index.ts',
      'index.html',
      'vite.config.ts',
      'performer.json'
    ]
  },
  fullstack: {
    name: 'Full Stack',
    description: 'Complete full-stack application with all features',
    files: [
      'src/domain/index.ts',
      'src/actor/index.ts',
      'src/ui/index.ts',
      'src/wasm/index.ts',
      'src/rpc/index.ts',
      'src/server/index.ts',
      'src/index.ts',
      'index.html',
      'vite.config.ts',
      'performer.json'
    ]
  },
  api: {
    name: 'API Only',
    description: 'Backend API server without frontend',
    files: [
      'src/domain/index.ts',
      'src/actor/index.ts',
      'src/rpc/index.ts',
      'src/server/index.ts',
      'performer.json'
    ]
  }
}

// Template file contents
const templateFiles: Record<string, string> = {
  'src/domain/index.ts': `// Domain Layer
// Merkle DAG: domain-node

import * as T from "@effect-ts/core/Effect"
import { ActorDBService } from "./types"

// Business logic implementation
export const createUser = (userData: { name: string; email: string }) =>
  T.accessServiceM(ActorDBService)((db) =>
    db.writeEvent({
      entityId: crypto.randomUUID(),
      eventType: 'user_created',
      payload: userData,
      timestamp: new Date(),
      version: 1,
    })
  )

export * from "./types"
export * from "./business-logic"
`,

  'src/actor/index.ts': `// Actor Layer
// Merkle DAG: actor-node

import { ActorCoordinator } from "./business-actor"

// Actor coordinator instance
export const actorCoordinator = new ActorCoordinator()

// Create business actor
export const createBusinessActor = (id: string) => {
  // Implementation here
}

export * from "./types"
export * from "./business-actor"
`,

  'src/ui/index.ts': `// UI Layer
// Merkle DAG: ui-node

import { ComponentRegistry } from "./web-components"

// Component registry instance
export const componentRegistry = new ComponentRegistry()

// Register components
export const initializeUI = () => {
  // Register your components here
}

export * from "./web-components"
`,

  'src/wasm/index.ts': `// WASM Layer
// Merkle DAG: wasm-node

import { PerformanceComputeEngine } from "./performance-compute"

// Performance engine instance
export const computeEngine = new PerformanceComputeEngine()

export * from "./performance-compute"
`,

  'src/rpc/index.ts': `// RPC Layer
// Merkle DAG: rpc-node

import { ActorDBHttpClient } from "./actordb-client"

// RPC client configuration
export const createRPCClient = (config: {
  host: string
  port: number
  secure: boolean
  token?: string
}) => new ActorDBHttpClient(config)

export * from "./actordb-client"
`,

  'src/index.ts': `// Application Entry Point
// Merkle DAG: root-node

import { actorCoordinator } from "./actor"
import { componentRegistry, initializeUI } from "./ui"
import { computeEngine } from "./wasm"
import { createRPCClient } from "./rpc"

// Initialize application
export const initializeApp = async () => {
  console.log("Initializing Performer application...")

  // Initialize UI
  initializeUI()

  // Setup RPC connection
  const rpcClient = createRPCClient({
    host: "localhost",
    port: 9090,
    secure: false,
  })

  console.log("Application initialized!")
}

// Start application
if (typeof window !== 'undefined') {
  initializeApp()
}
`,

  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performer App</title>
</head>
<body>
  <div id="app">
    <h1>Welcome to Performer</h1>
    <business-entity entity-id="example-1" entity-type="user"></business-entity>
    <actor-state-display actor-id="main-actor"></actor-state-display>
  </div>

  <script type="module" src="/src/index.ts"></script>
</body>
</html>
`,

  'vite.config.ts': `import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@microsoft/fast-element'],
  },
})
`,

  'performer.json': `{
  "name": "my-performer-app",
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
      "modules": []
    }
  }
}`
}

interface InitOptions {
  template: string
  name?: string
  yes: boolean
}

export const initCommand = async (options: InitOptions) => {
  const spinner = ora()

  try {
    // Get project information
    let projectName: string
    let templateName: string

    if (options.yes) {
      projectName = options.name || path.basename(process.cwd())
      templateName = options.template
    } else {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: options.name || path.basename(process.cwd()),
        },
        {
          type: 'list',
          name: 'template',
          message: 'Select a template:',
          choices: Object.entries(templates).map(([key, template]) => ({
            name: `${template.name} - ${template.description}`,
            value: key,
          })),
          default: options.template,
        },
      ])

      projectName = answers.name
      templateName = answers.template
    }

    const template = templates[templateName as keyof typeof templates]
    if (!template) {
      throw new Error(`Template '${templateName}' not found`)
    }

    // Update performer.json with project name
    templateFiles['performer.json'] = templateFiles['performer.json'].replace(
      '"my-performer-app"',
      `"${projectName}"`
    )

    spinner.start(`Creating ${projectName} with ${template.name} template...`)

    // Create project directory if different from current
    const projectDir = projectName === path.basename(process.cwd())
      ? process.cwd()
      : path.join(process.cwd(), projectName)

    if (projectDir !== process.cwd()) {
      await fs.ensureDir(projectDir)
      process.chdir(projectDir)
    }

    // Create directories
    for (const file of template.files) {
      const dir = path.dirname(file)
      if (dir !== '.') {
        await fs.ensureDir(dir)
      }
    }

    // Copy template files
    for (const [filePath, content] of Object.entries(templateFiles)) {
      if (template.files.includes(filePath)) {
        await fs.writeFile(filePath, content)
      }
    }

    // Copy source files from framework
    const frameworkSrc = path.join(__dirname, '../../')
    const srcFiles = [
      'domain/types.ts',
      'domain/business-logic.ts',
      'actor/types.ts',
      'actor/business-actor.ts',
      'ui/web-components.ts',
      'wasm/performance-compute.ts',
      'rpc/actordb-client.ts',
    ]

    for (const srcFile of srcFiles) {
      const srcPath = path.join(frameworkSrc, srcFile)
      const destPath = path.join('src', srcFile)

      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath)
      }
    }

    // Create package.json for the new project
    const packageJson = {
      name: projectName,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        serve: "vite preview",
        test: "vitest",
      },
      dependencies: {
        "@effect-ts/core": "^0.60.0",
        "@effect-ts/system": "^0.57.0",
        "xstate": "^5.0.0",
        "@microsoft/fast-element": "^2.0.0-beta.26",
        "@microsoft/fast-foundation": "^3.0.0-beta.26",
        "vite": "^5.0.0",
        "typescript": "^5.0.0",
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "vitest": "^1.0.0",
        "@vitejs/plugin-react": "^4.0.0",
      },
    }

    await fs.writeJson('package.json', packageJson, { spaces: 2 })

    spinner.succeed(chalk.green(`Project ${projectName} created successfully!`))

    console.log(chalk.blue('\nNext steps:'))
    console.log(chalk.gray('  1. cd ' + (projectDir !== process.cwd() ? projectName : '.')))
    console.log(chalk.gray('  2. npm install'))
    console.log(chalk.gray('  3. npm run dev'))
    console.log(chalk.gray('  4. Open http://localhost:5173'))

  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize project'))
    console.error(error)
    process.exit(1)
  }
}
