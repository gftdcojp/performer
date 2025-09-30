#!/usr/bin/env node
// CLI Entry Point
// Merkle DAG: cli-node -> main-entry

import { Command } from 'commander'
import chalk from 'chalk'
import { initCommand } from './commands/init.js'
import { generateCommand } from './commands/generate.js'
import { buildCommand } from './commands/build.js'
import { serveCommand } from './commands/serve.js'
import { testCommand } from './commands/test.js'

// CLI Configuration
const program = new Command()

program
  .name('performer')
  .description('Web Framework CLI with EffectTS v3 + XState Actor + Web Components + WASM')
  .version('0.1.0')

// Global options
program
  .option('-v, --verbose', 'enable verbose logging')
  .option('--config <path>', 'path to config file', 'performer.json')

// Commands
program
  .command('init')
  .description('Initialize a new Performer project')
  .option('-t, --template <template>', 'project template to use', 'basic')
  .option('--name <name>', 'project name')
  .option('--yes', 'skip prompts and use defaults')
  .action(initCommand)

program
  .command('generate')
  .alias('g')
  .description('Generate components, actors, or business logic')
  .argument('<type>', 'type of component to generate (domain|actor|ui|wasm)')
  .argument('<name>', 'name of the component')
  .option('-d, --domain <domain>', 'business domain for the component')
  .action(generateCommand)

program
  .command('build')
  .description('Build the project')
  .option('-w, --watch', 'watch for changes')
  .option('-p, --production', 'production build')
  .option('--out-dir <dir>', 'output directory', 'dist')
  .action(buildCommand)

program
  .command('serve')
  .description('Start development server')
  .option('-p, --port <port>', 'port to serve on', '3000')
  .option('-h, --host <host>', 'host to bind to', 'localhost')
  .option('--open', 'open browser automatically')
  .action(serveCommand)

program
  .command('test')
  .description('Run tests')
  .option('-w, --watch', 'watch for changes')
  .option('--coverage', 'generate coverage report')
  .option('--ci', 'run in CI mode')
  .action(testCommand)

// Error handling
program.exitOverride()

program.on('command:*', (unknownCommand) => {
  console.error(chalk.red(`Unknown command: ${unknownCommand[0]}`))
  console.log(chalk.yellow('Run "performer --help" to see available commands'))
  process.exit(1)
})

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message)
  if (program.opts().verbose) {
    console.error(error.stack)
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason)
  process.exit(1)
})

// Parse arguments
program.parse(process.argv)

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
