// Generate Command
// Merkle DAG: cli-node -> generate-command

import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
// Generation templates
const templates = {
  domain: {
    description: 'Generate a business domain module',
    files: {
      'src/domain/{{name}}.ts': `// {{Name}} Domain
// Merkle DAG: domain-node -> {{name}}-domain

import * as T from "@effect-ts/core/Effect"
import { ActorDBService } from "./types"

// {{Name}} entity interface
export interface {{Name}}Entity {
  readonly id: string
  readonly name: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

// Create {{name}} business logic
export const create{{Name}} = (data: Omit<{{Name}}Entity, 'id' | 'createdAt' | 'updatedAt'>) =>
  T.accessServiceM(ActorDBService)((db) =>
    db.writeEvent({
      entityId: crypto.randomUUID(),
      eventType: '{{name}}_created',
      payload: data,
      timestamp: new Date(),
      version: 1,
    })
  )

// Update {{name}} business logic
export const update{{Name}} = (id: string, updates: Partial<{{Name}}Entity>) =>
  T.accessServiceM(ActorDBService)((db) =>
    db.writeEvent({
      entityId: id,
      eventType: '{{name}}_updated',
      payload: updates,
      timestamp: new Date(),
      version: 1,
    })
  )
`,
    },
  },

    actor: {
      description: 'Generate an Effect Actor',
    files: {
      'src/actor/{{name}}-actor.ts': `// {{Name}} Actor
// Merkle DAG: actor-node -> {{name}}-actor

import { Effect } from "effect"
import { ActorSystemUtils, Message } from "./effect-actor"

// {{Name}} actor messages
export interface {{Name}}CreatedMessage extends Message {
  readonly _tag: "{{Name}}Created"
  readonly payload: { id: string; name: string }
}

export interface {{Name}}UpdatedMessage extends Message {
  readonly _tag: "{{Name}}Updated"
  readonly payload: { id: string; updates: Record<string, unknown> }
}

// {{Name}} Actor State
export interface {{Name}}ActorState {
  readonly id: string
  readonly currentState: Record<string, unknown>
  readonly events: readonly string[]
  readonly error?: Error
}

// {{Name}} Actor Behavior
export const create{{Name}}Behavior = () => {
  return (state: {{Name}}ActorState, message: {{Name}}CreatedMessage | {{Name}}UpdatedMessage, context: any) => {
    return Effect.gen(function* () {
      switch (message._tag) {
        case "{{Name}}Created": {
          const { payload: { id, name } } = message
          const newEvent = \`{{name}}-created: \${id}\`

          return {
            ...state,
            id,
            currentState: { ...state.currentState, id, name },
            events: [...state.events, newEvent],
          }
        }

        case "{{Name}}Updated": {
          const { payload: { id, updates } } = message
          const newEvent = \`{{name}}-updated: \${id}\`

          return {
            ...state,
            currentState: { ...state.currentState, ...updates },
            events: [...state.events, newEvent],
          }
        }

        default:
          return state
      }
    })
  }
}

// {{Name}} Actor Factory
export class {{Name}}ActorFactory {
  // Merkle DAG: actor-factory
  static create{{Name}}Actor = (
    id: string
  ): Effect.Effect<any, Error, never> => {
    return Effect.gen(function* () {
      // Create actor system
      const system = yield* ActorSystemUtils.make("{{name}}-system")

      // Initial state
      const initialState: {{Name}}ActorState = {
        id,
        currentState: {},
        events: [],
      }

      // Create behavior
      const behavior = create{{Name}}Behavior()

      // Create actor
      const actorRef = yield* system.make(id, initialState, behavior)

      return actorRef
    })
  }
}
`,
    },
  },

  ui: {
    description: 'Generate a Web Component',
    files: {
      'src/ui/{{name}}-component.ts': `// {{Name}} Web Component
// Merkle DAG: ui-node -> {{name}}-component

import { FASTElement, customElement, html, css, observable } from "@microsoft/fast-element"
import { ActorCoordinator } from "@/actor/business-actor"

@customElement("{{name}}-component")
export class {{Name}}Component extends FASTElement {
  // Merkle DAG: {{name}}-component

  @observable actorCoordinator?: ActorCoordinator
  @observable {{name}}Data: Record<string, unknown> = {}

  static definition = {
    name: "{{name}}-component",
    template: html<{{Name}}Component>\`
      <div class="{{name}}-container">
        <h3>{{Name}} Component</h3>
        <div class="{{name}}-content">
          <pre>\${x => JSON.stringify(x.{{name}}Data, null, 2)}</pre>
        </div>
        <div class="{{name}}-actions">
          <button @click=\${x => x.handleAction()}>Action</button>
        </div>
      </div>
    \`,
    styles: css\`
      .{{name}}-container {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
        background: white;
      }

      .{{name}}-container h3 {
        margin: 0 0 12px 0;
        color: #333;
      }

      .{{name}}-content {
        margin-bottom: 12px;
      }

      .{{name}}-actions button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: #2196f3;
        color: white;
        cursor: pointer;
      }

      .{{name}}-actions button:hover {
        background: #1976d2;
      }
    \`
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.initializeComponent()
  }

  private initializeComponent(): void {
    // Initialize component logic here
  }

  private handleAction(): void {
    // Handle action logic here
    this.dispatchEvent(new CustomEvent('{{name}}-action', {
      detail: { data: this.{{name}}Data }
    }))
  }
}
`,
    },
  },

  wasm: {
    description: 'Generate a WASM module',
    files: {
      'src/wasm/{{name}}-compute.ts': `// {{Name}} WASM Computation
// Merkle DAG: wasm-node -> {{name}}-compute

// {{Name}} computation interface
export interface {{Name}}Computation {
  readonly name: string
  readonly execute: (input: unknown) => Promise<unknown>
  readonly validate: (input: unknown) => boolean
}

// {{Name}} computation implementation
export class {{Name}}Compute implements {{Name}}Computation {
  readonly name = '{{name}}'

  async execute(input: unknown): Promise<unknown> {
    // WASM computation logic here
    // This would typically call into a loaded WASM module
    console.log('Executing {{name}} computation with input:', input)

    // Placeholder computation
    if (typeof input === 'number') {
      return input * 2
    }
    if (typeof input === 'string') {
      return input.toUpperCase()
    }

    return { result: 'computed', input }
  }

  validate(input: unknown): boolean {
    // Validation logic here
    return input !== null && input !== undefined
  }
}

// Export instance
export const {{name}}Computation = new {{Name}}Compute()
`,
      'wasm/{{name}}.wat': `;; {{Name}} WASM Module
;; Merkle DAG: wasm-node -> {{name}}-wasm

(module
  ;; Import console.log
  (import "console" "log" (func $log (param i32)))

  ;; Memory
  (memory 1)

  ;; Data section
  (data (i32.const 0) "{{name}} computation result")

  ;; {{name}} computation function
  (func (export "{{name}}_compute") (param $input i32) (result i32)
    ;; Placeholder computation
    ;; In real implementation, this would perform actual computation
    i32.const 42  ;; Return 42 as placeholder
  )

  ;; String length function
  (func (export "strlen") (param $ptr i32) (result i32)
    (local $len i32)
    loop $loop
      local.get $ptr
      i32.load8_u
      i32.eqz
      if
        local.get $len
        return
      end
      local.get $ptr
      i32.const 1
      i32.add
      local.set $ptr
      local.get $len
      i32.const 1
      i32.add
      local.set $len
      br $loop
    end
    i32.const 0
  )
)
`,
    },
  },
}

export const generateCommand = async (
  type: string,
  name: string
) => {
  try {
    const template = templates[type as keyof typeof templates]
    if (!template) {
      console.error(chalk.red(`Unknown type: ${type}`))
      console.log(chalk.yellow('Available types: domain, actor, ui, wasm'))
      process.exit(1)
    }

    console.log(chalk.blue(`Generating ${type}: ${name}`))

    // Process template variables
    const processTemplate = (content: string): string => {
      return content
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{Name\}\}/g, name.charAt(0).toUpperCase() + name.slice(1))
        .replace(/\{\{NameUpper\}\}/g, name.toUpperCase())
    }

    // Generate files
    for (const [filePath, content] of Object.entries(template.files)) {
      const processedPath = processTemplate(filePath)
      const processedContent = processTemplate(content)

      const fullPath = path.join(process.cwd(), processedPath)
      await fs.ensureDir(path.dirname(fullPath))
      await fs.writeFile(fullPath, processedContent)

      console.log(chalk.green(`  ✓ Created ${processedPath}`))
    }

    // Update index files if they exist
    const indexFiles = {
      domain: 'src/domain/index.ts',
      actor: 'src/actor/index.ts',
      ui: 'src/ui/index.ts',
      wasm: 'src/wasm/index.ts',
    }

    const indexPath = indexFiles[type as keyof typeof indexFiles]
    if (indexPath) {
      const fullIndexPath = path.join(process.cwd(), indexPath)
      if (await fs.pathExists(fullIndexPath)) {
        const indexContent = await fs.readFile(fullIndexPath, 'utf-8')
        const exportStatement = `export * from "./${name}${type === 'domain' ? '' : `-${type}`}"`

        if (!indexContent.includes(exportStatement)) {
          const updatedContent = indexContent + `\n${exportStatement}\n`
          await fs.writeFile(fullIndexPath, updatedContent)
          console.log(chalk.green(`  ✓ Updated ${indexPath}`))
        }
      }
    }

    console.log(chalk.green(`\n${type} ${name} generated successfully!`))

  } catch (error) {
    console.error(chalk.red('Failed to generate component:'), error)
    process.exit(1)
  }
}
