// Build Command
// Merkle DAG: cli-node -> build-command

import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'

interface BuildOptions {
  watch: boolean
  production: boolean
  outDir: string
}

export const buildCommand = async (options: BuildOptions) => {
  const spinner = ora()
  const isProduction = options.production
  const outDir = options.outDir

  try {
    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error('package.json not found. Run "performer init" first.')
    }

    const packageJson = await fs.readJson(packageJsonPath)

    // Check if performer.json exists
    const performerConfigPath = path.join(process.cwd(), 'performer.json')
    let performerConfig: any = {}
    if (await fs.pathExists(performerConfigPath)) {
      performerConfig = await fs.readJson(performerConfigPath)
    }

    spinner.start(`${isProduction ? 'Building' : 'Building (dev)'} project...`)

    // Clean output directory
    await fs.remove(outDir)
    await fs.ensureDir(outDir)

    // Build TypeScript
    if (packageJson.scripts?.build) {
      execSync('npm run build', {
        stdio: options.watch ? 'inherit' : 'pipe',
        cwd: process.cwd(),
      })
    } else {
      // Manual TypeScript compilation
      const tsConfig = {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM"],
          module: "ESNext",
          moduleResolution: "bundler",
          allowImportingTsExtensions: false,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: false,
          outDir,
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "**/*.test.ts", "**/*.spec.ts"],
      }

      await fs.writeJson('tsconfig.build.json', tsConfig)
      execSync('npx tsc --project tsconfig.build.json', {
        stdio: options.watch ? 'inherit' : 'pipe',
        cwd: process.cwd(),
      })
      await fs.remove('tsconfig.build.json')
    }

    // Build WASM modules if enabled
    if (performerConfig.build?.wasm?.enabled) {
      await buildWASMModules(performerConfig.build.wasm.modules || [])
    }

    // Bundle with Vite if available
    if (await fs.pathExists('vite.config.ts') || await fs.pathExists('vite.config.js')) {
      const viteArgs = ['build']
      if (!isProduction) {
        viteArgs.push('--mode', 'development')
      }
      if (options.watch) {
        viteArgs.push('--watch')
      }

      execSync(`npx vite ${viteArgs.join(' ')}`, {
        stdio: options.watch ? 'inherit' : 'pipe',
        cwd: process.cwd(),
      })
    }

    // Copy static assets
    await copyStaticAssets(outDir)

    spinner.succeed(chalk.green('Build completed successfully!'))

    if (!options.watch) {
      console.log(chalk.blue(`\nOutput directory: ${outDir}`))
      console.log(chalk.gray('Run "performer serve" to start the development server'))
    }

  } catch (error) {
    spinner.fail(chalk.red('Build failed'))
    console.error(error)
    process.exit(1)
  }
}

async function buildWASMModules(modules: string[]): Promise<void> {
  const spinner = ora('Building WASM modules...').start()

  for (const moduleName of modules) {
    const watPath = path.join('wasm', `${moduleName}.wat`)
    const wasmPath = path.join('dist', 'wasm', `${moduleName}.wasm`)

    if (await fs.pathExists(watPath)) {
      // Convert WAT to WASM using wabt tools
      try {
        await fs.ensureDir(path.dirname(wasmPath))
        execSync(`wat2wasm ${watPath} -o ${wasmPath}`, {
          stdio: 'pipe',
          cwd: process.cwd(),
        })
        spinner.succeed(chalk.green(`Built WASM module: ${moduleName}`))
      } catch (error) {
        spinner.warn(chalk.yellow(`Failed to build WASM module ${moduleName}: wat2wasm not found`))
        // Copy WAT file as fallback
        await fs.copy(watPath, wasmPath.replace('.wasm', '.wat'))
      }
    }
  }

  spinner.stop()
}

async function copyStaticAssets(outDir: string): Promise<void> {
  const staticAssets = [
    'index.html',
    'public/**/*',
    'assets/**/*',
    '*.ico',
    '*.png',
    '*.jpg',
    '*.svg',
  ]

  for (const asset of staticAssets) {
    const assetPath = path.join(process.cwd(), asset)
    if (await fs.pathExists(assetPath.replace('/**/*', ''))) {
      try {
        if (asset.includes('/**/*')) {
          await fs.copy(assetPath.replace('/**/*', ''), path.join(outDir, asset.split('/')[0]))
        } else {
          await fs.copy(assetPath, path.join(outDir, asset))
        }
      } catch (error) {
        // Ignore copy errors for missing assets
      }
    }
  }
}
