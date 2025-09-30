// Serve Command
// Merkle DAG: cli-node -> serve-command

import { spawn } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { createServer } from 'http'
import { parse } from 'url'
import { networkInterfaces } from 'os'

interface ServeOptions {
  port: string
  host: string
  open: boolean
}

export const serveCommand = async (options: ServeOptions) => {
  const spinner = ora()
  const port = parseInt(options.port)
  const host = options.host

  try {
    // Check if dist directory exists
    const distPath = path.join(process.cwd(), 'dist')
    if (!(await fs.pathExists(distPath))) {
      spinner.warn(chalk.yellow('Build directory not found. Building project first...'))
      await buildProject()
    }

    spinner.start(`Starting development server on ${host}:${port}...`)

    // Try Vite dev server first
    if (await fs.pathExists('vite.config.ts') || await fs.pathExists('vite.config.js')) {
      const viteProcess = spawn('npx', ['vite', '--host', host, '--port', port.toString()], {
        stdio: 'inherit',
        cwd: process.cwd(),
        shell: true,
      })

      viteProcess.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.yellow('Vite not available, starting simple HTTP server...'))
          startSimpleServer(port, host)
        }
      })

      viteProcess.on('error', () => {
        startSimpleServer(port, host)
      })

      // Wait a bit to see if Vite starts successfully
      setTimeout(() => {
        spinner.succeed(chalk.green(`Server running at http://${host}:${port}`))

        if (options.open) {
          openBrowser(`http://${host}:${port}`)
        }

        console.log(chalk.gray('\nPress Ctrl+C to stop the server'))
      }, 2000)

    } else {
      // Start simple HTTP server
      startSimpleServer(port, host)
      spinner.succeed(chalk.green(`Server running at http://${host}:${port}`))

      if (options.open) {
        openBrowser(`http://${host}:${port}`)
      }
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to start server'))
    console.error(error)
    process.exit(1)
  }
}

function startSimpleServer(port: number, host: string): void {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '/')
      let pathname = parsedUrl.pathname || '/'

      // Default to index.html for root path
      if (pathname === '/') {
        pathname = '/index.html'
      }

      const filePath = path.join(process.cwd(), 'dist', pathname)

      // Check if file exists
      if (await fs.pathExists(filePath)) {
        const stat = await fs.stat(filePath)
        const ext = path.extname(filePath)

        // Set content type
        const contentTypes: Record<string, string> = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.wasm': 'application/wasm',
        }

        res.writeHead(200, {
          'Content-Type': contentTypes[ext] || 'text/plain',
          'Content-Length': stat.size,
        })

        const stream = fs.createReadStream(filePath)
        stream.pipe(res)
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('File not found')
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal server error')
    }
  })

  server.listen(port, host, () => {
    const addresses = getNetworkAddresses(host, port)
    console.log(chalk.blue('\nAvailable at:'))
    addresses.forEach(address => {
      console.log(chalk.gray(`  ${address}`))
    })
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down server...'))
    server.close(() => {
      process.exit(0)
    })
  })
}

function getNetworkAddresses(host: string, port: number): string[] {
  const addresses: string[] = []

  if (host === '0.0.0.0' || host === 'localhost') {
    addresses.push(`http://localhost:${port}`)
  }

  const interfaces = networkInterfaces()
  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(`http://${net.address}:${port}`)
      }
    }
  }

  return addresses
}

function openBrowser(url: string): void {
  const { platform } = process
  let command: string
  let args: string[]

  switch (platform) {
    case 'darwin':
      command = 'open'
      args = [url]
      break
    case 'win32':
      command = 'cmd'
      args = ['/c', 'start', url]
      break
    default:
      command = 'xdg-open'
      args = [url]
      break
  }

  try {
    spawn(command, args, { stdio: 'ignore' })
  } catch (error) {
    console.log(chalk.gray(`Could not open browser automatically. Please visit ${url}`))
  }
}

async function buildProject(): Promise<void> {
  const { buildCommand } = await import('./build.js')
  await buildCommand({ watch: false, production: false, outDir: 'dist' })
}
