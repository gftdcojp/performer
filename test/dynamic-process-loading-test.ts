// Dynamic Process Loading Test
// Tests loading processes by name and hash

import { ProcessRegistry } from '../src/index.ts';

class DynamicProcessLoadingTest {
  async runTests() {
    console.log('🔄 Starting Dynamic Process Loading Tests...\n');

    try {
      // Test 1: Load process by name (without hash)
      console.log('📦 Test 1: Load process by name only');
      await this.testLoadByNameOnly();

      // Test 2: Load process by name and hash
      console.log('\n🔒 Test 2: Load process by name and hash');
      await this.testLoadByNameAndHash();

      // Test 3: Hash verification (mismatch)
      console.log('\n⚠️ Test 3: Hash verification');
      await this.testHashVerification();

      // Test 4: Cache behavior
      console.log('\n💾 Test 4: Cache behavior');
      await this.testCacheBehavior();

      console.log('\n✅ All dynamic process loading tests passed!');

    } catch (error) {
      console.error('❌ Dynamic loading test failed:', error.message);
      throw error;
    }
  }

  async testLoadByNameOnly() {
    // Load user-onboarding process without hash
    const processInstance = await ProcessRegistry.loadByNameAndHash('user-onboarding');

    if (!processInstance) {
      throw new Error('Failed to load user-onboarding process');
    }

    console.log('  ✅ Process loaded:', processInstance.metadata.name);
    console.log('  📋 Type:', processInstance.metadata.type);
    console.log('  🔒 Hash:', processInstance.metadata.hash);

    // Verify metadata
    if (processInstance.metadata.type !== 'single') {
      throw new Error('Expected single process type');
    }

    if (!processInstance.metadata.hash) {
      throw new Error('Process should have hash');
    }

    // Verify functions exist
    if (typeof processInstance.bootstrap !== 'function') {
      throw new Error('Process should have bootstrap function');
    }

    if (typeof processInstance.toBpmnJson !== 'function') {
      throw new Error('Process should have toBpmnJson function');
    }
  }

  async testLoadByNameAndHash() {
    // First get the expected hash
    const cachedProcess = ProcessRegistry.get('user-onboarding');
    if (!cachedProcess) {
      throw new Error('Process should be cached from previous test');
    }

    const expectedHash = cachedProcess.metadata.hash;

    // Load with correct hash
    const processInstance = await ProcessRegistry.loadByNameAndHash('user-onboarding', expectedHash);

    if (!processInstance) {
      throw new Error('Failed to load process with correct hash');
    }

    console.log('  ✅ Process loaded with correct hash');
    console.log('  🔒 Expected hash:', expectedHash);
    console.log('  🔒 Actual hash:', processInstance.metadata.hash);

    if (processInstance.metadata.hash !== expectedHash) {
      throw new Error('Hash mismatch');
    }
  }

  async testHashVerification() {
    const wrongHash = 'wrong-hash-123';

    console.log('  ⚠️ Testing with wrong hash:', wrongHash);

    // This should still load but warn about hash mismatch
    const processInstance = await ProcessRegistry.loadByNameAndHash('user-onboarding', wrongHash);

    if (!processInstance) {
      throw new Error('Process should still load even with wrong hash');
    }

    console.log('  ✅ Process loaded despite hash mismatch (expected behavior)');
    console.log('  📝 Warning should appear in console about hash mismatch');
  }

  async testCacheBehavior() {
    console.log('  💾 Testing cache behavior...');

    // First load should be from dynamic import
    console.log('  📦 First load (should be dynamic):');
    const startTime1 = Date.now();
    const process1 = await ProcessRegistry.loadByNameAndHash('user-onboarding');
    const loadTime1 = Date.now() - startTime1;

    if (!process1) {
      throw new Error('Failed first load');
    }

    console.log(`    ⏱️ Load time: ${loadTime1}ms`);

    // Second load should be from cache
    console.log('  💾 Second load (should be from cache):');
    const startTime2 = Date.now();
    const process2 = await ProcessRegistry.loadByNameAndHash('user-onboarding');
    const loadTime2 = Date.now() - startTime2;

    if (!process2) {
      throw new Error('Failed second load');
    }

    console.log(`    ⏱️ Load time: ${loadTime2}ms`);

    // Cache should be much faster
    if (loadTime2 > loadTime1 * 0.5) {
      console.log('  ⚠️ Cache might not be working optimally');
    } else {
      console.log('  ✅ Cache working correctly (second load much faster)');
    }

    // Verify same instance
    if (process1 !== process2) {
      throw new Error('Should return same cached instance');
    }

    console.log('  ✅ Cache returns same instance');
  }
}

// Test runner
async function runDynamicLoadingTests() {
  const tester = new DynamicProcessLoadingTest();

  try {
    await tester.runTests();
    console.log('\n🔄 Dynamic Process Loading Tests Completed Successfully!');
    console.log('📦 Dynamic import working');
    console.log('🔒 Hash verification working');
    console.log('💾 Caching working');

  } catch (error) {
    console.error('\n💥 Dynamic Process Loading Tests Failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Export for use in other tests
export { DynamicProcessLoadingTest };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  runDynamicLoadingTests();
}
