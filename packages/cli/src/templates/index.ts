// Merkle DAG: template_manager -> template_files -> project_generator
// Template management for project creation

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export interface TemplateOptions {
  name: string;
  typescript: boolean;
  tailwind: boolean;
  neo4j: boolean;
  auth0: boolean;
  template: string;
}

export interface TemplateFile {
  path: string;
  content: string;
  executable?: boolean;
}

export class TemplateManager {
  private templatesDir: string;
  private options: TemplateOptions;

  constructor(options: TemplateOptions) {
    this.templatesDir = path.join(__dirname, 'templates');
    this.options = options;
  }

  async createProject(): Promise<void> {
    const { name, template } = this.options;

    console.log(chalk.blue(`🚀 Creating Performer project: ${name}`));
    console.log(chalk.gray(`Template: ${template}`));

    // Check if directory already exists
    try {
      await fs.access(name);
      throw new Error(`Directory "${name}" already exists`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create project directory
    await fs.mkdir(name, { recursive: true });

    // Generate template files
    const files = await this.generateTemplateFiles();

    // Write files
    for (const file of files) {
      const filePath = path.join(name, file.path);
      const dirPath = path.dirname(filePath);

      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true });

      // Write file
      await fs.writeFile(filePath, file.content, 'utf-8');

      // Set executable permission if needed
      if (file.executable) {
        await fs.chmod(filePath, 0o755);
      }

      console.log(chalk.gray(`  Created: ${file.path}`));
    }

    console.log(chalk.green(`✅ Project ${name} created successfully!`));
    console.log(chalk.yellow(`\nNext steps:`));
    console.log(`  cd ${name}`);
    console.log(`  pnpm install`);
    console.log(`  performer dev`);
  }

  private async generateTemplateFiles(): Promise<TemplateFile[]> {
    const { name, typescript, tailwind, neo4j, auth0, template } = this.options;

    const files: TemplateFile[] = [];

    // package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson()
    });

    // tsconfig.json (if TypeScript)
    if (typescript) {
      files.push({
        path: 'tsconfig.json',
        content: this.generateTsConfig()
      });
    }

    // biome.json
    files.push({
      path: 'biome.json',
      content: this.generateBiomeConfig()
    });

    // README.md
    files.push({
      path: 'README.md',
      content: this.generateReadme(name)
    });

    // src directory structure
    files.push({
      path: 'src/index.tsx',
      content: this.generateMainIndex()
    });

    files.push({
      path: 'src/App.tsx',
      content: this.generateAppComponent()
    });

    files.push({
      path: 'src/server.ts',
      content: this.generateServerFile()
    });

    // Environment files
    if (neo4j) {
      files.push({
        path: '.env.example',
        content: this.generateEnvExample()
      });
    }

    // Tailwind config (if enabled)
    if (tailwind) {
      files.push({
        path: 'tailwind.config.js',
        content: this.generateTailwindConfig()
      });

      files.push({
        path: 'src/index.css',
        content: this.generateCssFile()
      });
    }

    // Vite config
    files.push({
      path: 'vite.config.ts',
      content: this.generateViteConfig()
    });

    // HTML template
    files.push({
      path: 'index.html',
      content: this.generateHtmlTemplate(name)
    });

    return files;
  }

  private generatePackageJson(): string {
    const { name, typescript, tailwind, neo4j, auth0 } = this.options;

    const dependencies: Record<string, string> = {
      '@gftdcojp/performer': '^1.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0'
    };

    const devDependencies: Record<string, string> = {
      '@biomejs/biome': '^1.8.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      'vite': '^5.0.0',
      'typescript': typescript ? '^5.0.0' : undefined,
      'tailwindcss': tailwind ? '^3.0.0' : undefined,
      'autoprefixer': tailwind ? '^10.0.0' : undefined,
      'postcss': tailwind ? '^8.0.0' : undefined,
    };

    // Remove undefined values
    Object.keys(devDependencies).forEach(key => {
      if (!devDependencies[key]) delete devDependencies[key];
    });

    return JSON.stringify({
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '0.1.0',
      description: `Performer application: ${name}`,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        lint: 'biome check .',
        format: 'biome format --write .'
      },
      dependencies,
      devDependencies
    }, null, 2);
  }

  private generateTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src']
    }, null, 2);
  }

  private generateBiomeConfig(): string {
    return JSON.stringify({
      $schema: 'https://biomejs.dev/schemas/1.8.3/schema.json',
      formatter: {
        enabled: true
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          style: {
            useConst: 'error'
          }
        }
      },
      organizeImports: {
        enabled: true
      },
      files: {
        ignore: ['node_modules', 'dist']
      },
      javascript: {
        formatter: {
          quoteStyle: 'single'
        }
      }
    }, null, 2);
  }

  private generateReadme(): string {
    const { name } = this.options;
    return `# ${name}

A Performer application.

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
\`\`\`

## Learn More

- [Performer Documentation](https://github.com/gftdcojp/performer)
`;
  }

  private generateMainIndex(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
  }

  private generateAppComponent(): string {
    const { name } = this.options;
    return `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ${name}
          </h1>
          <p className="text-gray-600">
            Welcome to your Performer application!
          </p>
          <div className="mt-4">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
`;
  }

  private generateServerFile(): string {
    return `// Server-side rendering setup
import { createServer } from '@gftdcojp/performer';

export const server = createServer({
  port: process.env.PORT || 3000,
  hostname: process.env.HOSTNAME || 'localhost'
});
`;
  }

  private generateEnvExample(): string {
    return `# Environment Variables
# Copy this file to .env and fill in your values

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Auth0 (if enabled)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Application
PORT=3000
HOSTNAME=localhost
`;
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
  }

  private generateCssFile(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
`;
  }

  private generateHtmlTemplate(): string {
    const { name } = this.options;
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
`;
  }
}

export async function createProject(options: TemplateOptions): Promise<void> {
  const manager = new TemplateManager(options);
  await manager.createProject();
}
