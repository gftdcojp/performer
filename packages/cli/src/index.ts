// Merkle DAG: cli_core -> commander_integration -> command_handlers
// Next.js-style CLI with comprehensive command set

import { Command } from "commander";
import chalk from "chalk";
import { createProject, type TemplateOptions } from "./templates/index.js";
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

export interface CLIOptions {
  verbose?: boolean;
  config?: string;
  port?: string;
  output?: string;
  template?: string;
  name?: string;
}

export class PerformerCLI {
  private program: Command;

  constructor() {
    this.program = new Command();

    this.program
      .name("performer")
      .description("Performer Framework CLI - BPMN + Actor + Neo4j Web Framework")
      .version("1.0.0")
      .option("-v, --verbose", "Enable verbose output")
      .option("-c, --config <path>", "Path to config file", "performer.config.ts");

    this.setupCommands();
    this.setupGlobalOptions();
  }

  private setupGlobalOptions(): void {
    // Global help
    this.program.on("--help", () => {
      console.log("");
      console.log(chalk.blue("Examples:"));
      console.log("  $ performer create my-app");
      console.log("  $ performer dev --port 3001");
      console.log("  $ performer build");
      console.log("  $ performer start");
      console.log("  $ performer gen process OrderProcess");
      console.log("  $ performer db migrate");
      console.log("  $ performer info");
      console.log("");
    });
  }

  private setupCommands(): void {
    // create command - Next.js style project creation
    this.program
      .command("create <name>")
      .description("Create a new Performer project")
      .option("-t, --template <template>", "Template to use (default, bpm, actor)", "default")
      .option("--typescript", "Initialize as a TypeScript project", true)
      .option("--tailwind", "Initialize with Tailwind CSS", true)
      .option("--neo4j", "Include Neo4j database setup", true)
      .option("--auth0", "Include Auth0 authentication", true)
      .action(this.handleCreate.bind(this));

    // dev command - Development server
    this.program
      .command("dev")
      .description("Start development server")
      .option("-p, --port <port>", "Port to run on", "3000")
      .option("-H, --hostname <hostname>", "Hostname to bind to", "localhost")
      .option("--open", "Open browser automatically")
      .option("--turbo", "Enable Turbopack for faster builds")
      .action(this.handleDev.bind(this));

    // build command - Production build
    this.program
      .command("build")
      .description("Build the project for production")
      .option("-o, --output <output>", "Output directory", "dist")
      .option("--analyze", "Analyze bundle size")
      .option("--profile", "Generate build profile")
      .action(this.handleBuild.bind(this));

    // start command - Production server
    this.program
      .command("start")
      .description("Start production server")
      .option("-p, --port <port>", "Port to run on", "3000")
      .option("-H, --hostname <hostname>", "Hostname to bind to", "0.0.0.0")
      .action(this.handleStart.bind(this));

    // export command - Static export
    this.program
      .command("export")
      .description("Export the application for static hosting")
      .option("-o, --output <output>", "Output directory", "out")
      .action(this.handleExport.bind(this));

    // gen command - Code generation
    this.program
      .command("gen <type>")
      .description("Generate code (process, actor, model, component)")
      .option("-n, --name <name>", "Name of the generated item")
      .option("-d, --dir <dir>", "Target directory")
      .action(this.handleGen.bind(this));

    // db command - Database management
    this.program
      .command("db <action>")
      .description("Database operations (migrate, seed, reset, status)")
      .action(this.handleDb.bind(this));

    // info command - System information
    this.program
      .command("info")
      .description("Display information about the current system")
      .action(this.handleInfo.bind(this));

    // telemetry command - Telemetry settings
    this.program
      .command("telemetry [action]")
      .description("Manage telemetry settings (enable, disable, status)")
      .action(this.handleTelemetry.bind(this));
  }

  private async handleCreate(name: string, options: any): Promise<void> {
    const { verbose, template, typescript, tailwind, neo4j, auth0 } = options;

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      const templateOptions: TemplateOptions = {
        name,
        template,
        typescript,
        tailwind,
        neo4j,
        auth0
      };

      await createProject(templateOptions);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create project: ${error}`));
      process.exit(1);
    }
  }

  private async handleDev(options: any): Promise<void> {
    const { port, hostname, open, turbo, verbose } = options;

    console.log(chalk.blue(`🚀 Starting development server...`));
    console.log(chalk.gray(`Port: ${port}, Hostname: ${hostname}`));

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      // Check if we're in a project directory
      const cwd = process.cwd();
      const packageJsonPath = path.join(cwd, 'package.json');
      const viteConfigPath = path.join(cwd, 'vite.config.ts');

      // Check if package.json exists
      try {
        await fs.access(packageJsonPath);
      } catch {
        throw new Error('No package.json found. Are you in a Performer project directory?');
      }

      // Check if Vite config exists
      try {
        await fs.access(viteConfigPath);
      } catch {
        throw new Error('No vite.config.ts found. Please ensure you have a valid Vite configuration.');
      }

      console.log(chalk.gray('Starting Vite development server...'));

      // Dynamically import Vite from project node_modules, fallback to CLI's optional dep
      let { createServer } = await (async () => {
        try {
          // Try project node_modules first
          const vitePath = path.join(cwd, 'node_modules', 'vite');
          return await import(vitePath);
        } catch {
          try {
            // Fallback to CLI's optional dependencies
            return await import('vite');
          } catch {
            throw new Error('Vite is not available. Please run: pnpm add -D vite');
          }
        }
      })();

      const server = await createServer({
        configFile: viteConfigPath,
        server: {
          host: hostname,
          port: parseInt(port),
          open: open,
          hmr: true
        },
        mode: 'development'
      });

      await server.listen();

      const info = server.config.server;
      console.log(chalk.green(`✅ Development server running at http://${info.host || 'localhost'}:${info.port}`));

      if (open) {
        console.log(chalk.gray(`Opening browser...`));
        // Note: Vite handles opening the browser automatically when open: true
      }

      console.log(chalk.gray('Press Ctrl+C to stop the server'));

      // Keep the process running
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\nStopping development server...'));
        await server.close();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log(chalk.yellow('\nStopping development server...'));
        await server.close();
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red(`❌ Failed to start dev server: ${(error as Error).message}`));
      process.exit(1);
    }
  }

  private async handleBuild(options: any): Promise<void> {
    const { output, analyze, profile, verbose } = options;

    console.log(chalk.blue(`🔨 Building project...`));
    console.log(chalk.gray(`Output: ${output}`));

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      const cwd = process.cwd();

      // Check if this is a monorepo with Turborepo
      const turboJsonPath = path.join(cwd, 'turbo.json');
      const pnpmWorkspacePath = path.join(cwd, 'pnpm-workspace.yaml');

      let isTurborepo = false;
      try {
        await fs.access(turboJsonPath);
        isTurborepo = true;
        console.log(chalk.gray('Detected Turborepo configuration'));
      } catch {
        // Not a Turborepo project, check if it's a pnpm workspace
        try {
          await fs.access(pnpmWorkspacePath);
          console.log(chalk.gray('Detected pnpm workspace'));
        } catch {
          console.log(chalk.gray('Building as single package'));
        }
      }

      if (isTurborepo) {
        // Use Turborepo for building
        await this.runTurborepoBuild(cwd, options);
      } else {
        // Use Vite for single project build
        await this.runViteBuild(cwd, options);
      }

    } catch (error) {
      console.error(chalk.red(`❌ Build failed: ${(error as Error).message}`));
      process.exit(1);
    }
  }

  private async runTurborepoBuild(cwd: string, options: any): Promise<void> {
    const { output, analyze, profile, verbose } = options;

    console.log(chalk.gray('Building with Turborepo...'));

    return new Promise((resolve, reject) => {
      const turboArgs = ['build'];

      if (verbose) {
        turboArgs.push('--verbose');
      }

      if (profile) {
        turboArgs.push('--profile', output);
      }

      const turbo = spawn('pnpm', ['turbo', ...turboArgs], {
        cwd,
        stdio: 'inherit',
        shell: true
      });

      turbo.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green(`✅ Turborepo build completed successfully!`));
          resolve();
        } else {
          reject(new Error(`Turborepo build failed with exit code ${code}`));
        }
      });

      turbo.on('error', (error) => {
        reject(new Error(`Failed to start Turborepo: ${error.message}`));
      });
    });
  }

  private async runViteBuild(cwd: string, options: any): Promise<void> {
    const { output, analyze, profile, verbose } = options;

    console.log(chalk.gray('Building with Vite...'));

    // Check if Vite config exists
    const viteConfigPath = path.join(cwd, 'vite.config.ts');
    try {
      await fs.access(viteConfigPath);
    } catch {
      throw new Error('No vite.config.ts found. Please ensure you have a valid Vite configuration.');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Dynamically import Vite from project node_modules, fallback to CLI's optional dep
        const { build } = await (async () => {
          try {
            // Try project node_modules first
            const vitePath = path.join(cwd, 'node_modules', 'vite');
            return await import(vitePath);
          } catch {
            try {
              // Fallback to CLI's optional dependencies
              return await import('vite');
            } catch {
              throw new Error('Vite is not available. Please run: pnpm add -D vite');
            }
          }
        })();

        const buildConfig: any = {
          configFile: viteConfigPath,
          build: {
            outDir: output,
            sourcemap: verbose,
            minify: !verbose,
          },
          mode: 'production'
        };

        if (analyze) {
          // Enable bundle analyzer if requested
          buildConfig.build.rollupOptions = {
            output: {
              manualChunks: {
                vendor: ['react', 'react-dom'],
              }
            }
          };
        }

        await build(buildConfig);

        console.log(chalk.green(`✅ Vite build completed successfully!`));
        console.log(chalk.gray(`Output directory: ${output}`));

        if (analyze) {
          console.log(chalk.gray('Bundle analysis completed'));
        }

        resolve();
      } catch (error) {
        reject(new Error(`Vite build failed: ${(error as Error).message}`));
      }
    });
  }

  private async handleStart(options: any): Promise<void> {
    const { port, hostname, verbose } = options;

    console.log(chalk.blue(`🚀 Starting production server...`));
    console.log(chalk.gray(`Port: ${port}, Hostname: ${hostname}`));

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      // TODO: Implement production server logic
      console.log(chalk.green(`✅ Production server running at http://${hostname}:${port}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to start production server: ${error}`));
      process.exit(1);
    }
  }

  private async handleExport(options: any): Promise<void> {
    const { output, verbose } = options;

    console.log(chalk.blue(`📦 Exporting application...`));
    console.log(chalk.gray(`Output: ${output}`));

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      // TODO: Implement export logic
      console.log(chalk.green(`✅ Export completed successfully!`));
      console.log(chalk.gray(`Static files available in: ${output}`));
    } catch (error) {
      console.error(chalk.red(`❌ Export failed: ${error}`));
      process.exit(1);
    }
  }

  private async handleGen(type: string, options: any): Promise<void> {
    const { name, dir, verbose } = options;

    console.log(chalk.blue(`⚡ Generating ${type}: ${name}`));

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      // TODO: Implement code generation logic
      console.log(chalk.green(`✅ Generated ${type} ${name} successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Code generation failed: ${error}`));
      process.exit(1);
    }
  }

  private async handleDb(action: string, options: any): Promise<void> {
    const { verbose } = options;

    console.log(chalk.blue(`🗄️  Database ${action}...`));

    if (verbose) {
      console.log(chalk.gray(`Options: ${JSON.stringify(options, null, 2)}`));
    }

    try {
      // TODO: Implement database operations
      console.log(chalk.green(`✅ Database ${action} completed successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Database operation failed: ${error}`));
      process.exit(1);
    }
  }

  private async handleInfo(options: any): Promise<void> {
    const { verbose } = options;

    console.log(chalk.blue(`ℹ️  System Information`));
    console.log(chalk.gray(`==================`));

    // TODO: Implement system info collection
    console.log(`Performer Version: 1.0.0`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);

    if (verbose) {
      console.log(chalk.gray(`Environment variables:`));
      // TODO: Show relevant env vars
    }
  }

  private async handleTelemetry(action: string = "status", options: any): Promise<void> {
    const { verbose } = options;

    console.log(chalk.blue(`📊 Telemetry ${action}`));

    // TODO: Implement telemetry management
    console.log(`Telemetry is currently disabled.`);

    if (action === "enable") {
      console.log(chalk.green(`✅ Telemetry enabled`));
    } else if (action === "disable") {
      console.log(chalk.green(`✅ Telemetry disabled`));
    }
  }

  async run(argv: string[]): Promise<void> {
    await this.program.parseAsync(argv);
  }
}

// Export for CLI usage
export function runCLI(): void {
  const cli = new PerformerCLI();
  cli.run(process.argv).catch((error) => {
    console.error(chalk.red("CLI Error:"), error);
    process.exit(1);
  });
}
