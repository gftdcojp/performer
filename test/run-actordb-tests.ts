// ActorDB Test Runner
// Starts simulator, runs tests, and reports results

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function runActorDBTests() {
  console.log('🚀 Starting ActorDB Integration Tests...\n');

  let simulatorProcess = null;
  let testProcess = null;

  try {
    // Step 1: Start ActorDB Simulator
    console.log('📡 Starting ActorDB Simulator...');
    simulatorProcess = spawn('npx', ['tsx', 'test/actordb-simulator.ts'], {
      stdio: ['inherit', 'inherit', 'inherit'],
      cwd: process.cwd()
    });

    // Wait for simulator to start
    await setTimeout(2000);

    // Check if simulator is running
    try {
      const response = await fetch('http://localhost:9090/health');
      if (response.ok) {
        console.log('✅ ActorDB Simulator is running');
      } else {
        throw new Error('Simulator health check failed');
      }
    } catch (error) {
      console.error('❌ Failed to start ActorDB Simulator:', error.message);
      throw error;
    }

    console.log('\n🧪 Running integration tests...\n');

    // Step 2: Run Integration Tests
    testProcess = spawn('npx', ['tsx', 'test/actordb-integration-test.ts'], {
      stdio: ['inherit', 'inherit', 'inherit'],
      cwd: process.cwd()
    });

    // Wait for test completion
    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        reject(error);
      });
    });

    console.log('\n✅ All ActorDB integration tests passed!');

  } catch (error) {
    console.error('\n💥 ActorDB tests failed:', error.message);
    process.exit(1);

  } finally {
    // Cleanup: Stop simulator
    if (simulatorProcess) {
      console.log('\n🛑 Stopping ActorDB Simulator...');
      simulatorProcess.kill('SIGINT');

      // Wait for graceful shutdown
      await setTimeout(1000);
    }
  }
}

// Export for programmatic usage
export { runActorDBTests };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  runActorDBTests().catch(console.error);
}
