// PerformerClient Test
// Tests the Supabase-like interface for ActorDB

import { PerformerClient } from '../src/rpc/performer-client';
import { ActorDBClient } from '../src/rpc/client';

// Mock ActorDBClient for testing
class MockActorDBClient implements Partial<ActorDBClient> {
  private mockData: Record<string, unknown> = {
    'user_profiles': [
      { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: false },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', active: true },
    ],
    'products': [
      { id: 1, name: 'Product A', price: 100, category: 'electronics' },
      { id: 2, name: 'Product B', price: 200, category: 'books' },
      { id: 3, name: 'Product C', price: 150, category: 'electronics' },
    ],
  };

  async getProjectionState(projectionName: string): Promise<unknown> {
    return this.mockData[projectionName] || [];
  }

  // Implement other required methods as no-ops for testing
  async setToken(): Promise<void> {}
  async clearToken(): Promise<void> {}
  async writeEvent(): Promise<any> { return {}; }
  async writeEventsBatch(): Promise<any[]> { return []; }
  async readEvents(): Promise<any[]> { return []; }
  async query(): Promise<any> { return {}; }
  async executeSQL(): Promise<any> { return {}; }
  async getHealth(): Promise<any[]> { return []; }
  async getMetrics(): Promise<any> { return {}; }
  async createAggregate(): Promise<void> {}
  async getAggregateState(): Promise<any> { return {}; }
  async registerProjection(): Promise<void> {}
  async listProjections(): Promise<string[]> { return []; }
  async validateToken(): Promise<any> { return { valid: true }; }
  async request(): Promise<any> { return {}; }
}

class PerformerClientTest {
  private client: PerformerClient;

  constructor() {
    const mockActorDB = new MockActorDBClient() as ActorDBClient;
    this.client = PerformerClient.fromActorDB(mockActorDB);
  }

  async runTests() {
    console.log('🧪 Starting PerformerClient Tests...\n');

    try {
      // Test 1: Basic query functionality
      console.log('📝 Test 1: Basic Query');
      await this.testBasicQuery();

      // Test 2: Filtering
      console.log('\n🔍 Test 2: Filtering');
      await this.testFiltering();

      // Test 3: Field selection
      console.log('\n📋 Test 3: Field Selection');
      await this.testFieldSelection();

      // Test 4: Ordering and limiting
      console.log('\n🔢 Test 4: Ordering and Limiting');
      await this.testOrderingAndLimiting();

      // Test 5: Complex query chaining
      console.log('\n🔗 Test 5: Complex Query Chaining');
      await this.testComplexQuery();

      // Test 6: Authentication API
      console.log('\n🔐 Test 6: Authentication API');
      await this.testAuthentication();

      // Test 7: Storage API
      console.log('\n📦 Test 7: Storage API');
      await this.testStorageAPI();

      // Test 8: Functions API
      console.log('\n⚡ Test 8: Functions API');
      await this.testFunctionsAPI();

      console.log('\n✅ All PerformerClient tests passed!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }

  async testBasicQuery() {
    const result = await this.client
      .from('user_profiles')
      .select('*');

    console.log('  ✅ Basic query result:', result);

    if (!Array.isArray(result)) {
      throw new Error('Result should be an array');
    }

    if (result.length !== 3) {
      throw new Error(`Expected 3 results, got ${result.length}`);
    }

    // Check that all expected fields are present
    const firstUser = result[0] as any;
    if (!firstUser.id || !firstUser.name || !firstUser.email) {
      throw new Error('User object missing expected fields');
    }
  }

  async testFiltering() {
    // Test equality filter
    const activeUsers = await this.client
      .from('user_profiles')
      .select('*')
      .eq('active', true);

    console.log('  ✅ Active users filter result:', activeUsers);

    if (!Array.isArray(activeUsers) || activeUsers.length !== 2) {
      throw new Error(`Expected 2 active users, got ${Array.isArray(activeUsers) ? activeUsers.length : 'not array'}`);
    }

    // Test inequality filter
    const inactiveUsers = await this.client
      .from('user_profiles')
      .select('*')
      .neq('active', true);

    console.log('  ✅ Inactive users filter result:', inactiveUsers);

    if (!Array.isArray(inactiveUsers) || inactiveUsers.length !== 1) {
      throw new Error(`Expected 1 inactive user, got ${Array.isArray(inactiveUsers) ? inactiveUsers.length : 'not array'}`);
    }
  }

  async testFieldSelection() {
    // Test single field selection
    const namesOnly = await this.client
      .from('user_profiles')
      .select('name');

    console.log('  ✅ Names only result:', namesOnly);

    if (!Array.isArray(namesOnly)) {
      throw new Error('Result should be an array');
    }

    // Check that only name field is present
    const firstUser = namesOnly[0] as any;
    if (firstUser.name === undefined) {
      throw new Error('Name field should be present');
    }
    if (firstUser.email !== undefined) {
      throw new Error('Email field should not be present');
    }

    // Test multiple field selection
    const nameAndEmail = await this.client
      .from('user_profiles')
      .select('name,email');

    console.log('  ✅ Names and emails result:', nameAndEmail);

    const firstUser2 = nameAndEmail[0] as any;
    if (!firstUser2.name || !firstUser2.email || firstUser2.id !== undefined) {
      throw new Error('Field selection not working correctly');
    }
  }

  async testOrderingAndLimiting() {
    // Test limiting
    const limited = await this.client
      .from('user_profiles')
      .select('*')
      .limit(2);

    console.log('  ✅ Limited result:', limited);

    if (!Array.isArray(limited) || limited.length !== 2) {
      throw new Error(`Expected 2 results, got ${Array.isArray(limited) ? limited.length : 'not array'}`);
    }
  }

  async testComplexQuery() {
    // Complex query: select specific fields, filter, and limit
    const result = await this.client
      .from('products')
      .select('name,price')
      .eq('category', 'electronics')
      .gt('price', 120)
      .limit(1);

    console.log('  ✅ Complex query result:', result);

    if (!Array.isArray(result) || result.length !== 1) {
      throw new Error(`Expected 1 result, got ${Array.isArray(result) ? result.length : 'not array'}`);
    }

    const product = result[0] as any;
    if (product.name !== 'Product C' || product.price !== 150) {
      throw new Error('Complex query filtering not working correctly');
    }
  }

  async testAuthentication() {
    // Test sign up
    const signUpResult = await this.client.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      tenantId: 'test-tenant',
      attributes: { name: 'Test User' },
    });

    console.log('  ✅ Sign up result:', signUpResult);

    if (!signUpResult.user || !signUpResult.session || signUpResult.error) {
      throw new Error('Sign up failed');
    }

    if (signUpResult.user.email !== 'test@example.com') {
      throw new Error('User email not set correctly');
    }

    if (signUpResult.user.tenantId !== 'test-tenant') {
      throw new Error('User tenant ID not set correctly');
    }

    // Test get user
    const currentUser = this.client.auth.getUser();
    console.log('  ✅ Current user:', currentUser);

    if (!currentUser || currentUser.email !== 'test@example.com') {
      throw new Error('Current user not set correctly');
    }

    // Test get session
    const currentSession = this.client.auth.getSession();
    console.log('  ✅ Current session:', currentSession);

    if (!currentSession || !currentSession.accessToken) {
      throw new Error('Current session not set correctly');
    }

    // Test sign in
    const signInResult = await this.client.auth.signIn({
      email: 'login@example.com',
      password: 'password123',
    });

    console.log('  ✅ Sign in result:', signInResult);

    if (!signInResult.user || !signInResult.session || signInResult.error) {
      throw new Error('Sign in failed');
    }

    // Test auth state change listener
    let authStateChangeCalled = false;
    const unsubscribe = this.client.auth.onAuthStateChange((event, session) => {
      authStateChangeCalled = true;
      console.log('  ✅ Auth state change:', event, session?.user?.email);
    });

    if (!authStateChangeCalled) {
      throw new Error('Auth state change callback not called');
    }

    // Test sign out
    await this.client.auth.signOut();
    const afterSignOutUser = this.client.auth.getUser();
    const afterSignOutSession = this.client.auth.getSession();

    console.log('  ✅ After sign out - user:', afterSignOutUser, 'session:', afterSignOutSession);

    if (afterSignOutUser !== null || afterSignOutSession !== null) {
      throw new Error('Sign out did not clear user/session');
    }

    // Cleanup
    unsubscribe();
  }

  async testStorageAPI() {
    // Test bucket creation
    const { data: bucketData, error: bucketError } = await this.client.storage.createBucket('test-bucket');
    console.log('  ✅ Create bucket result:', bucketData);

    if (bucketError || !bucketData) {
      throw new Error('Bucket creation failed');
    }

    if (bucketData.name !== 'test-bucket') {
      throw new Error('Bucket name not set correctly');
    }

    // Test bucket listing
    const { data: bucketsData, error: bucketsError } = await this.client.storage.listBuckets();
    console.log('  ✅ List buckets result:', bucketsData);

    if (bucketsError || !bucketsData) {
      throw new Error('Bucket listing failed');
    }

    // Test file upload
    const fileContent = 'Hello, World!';
    const { data: uploadData, error: uploadError } = await this.client.storage
      .from('test-bucket')
      .upload('test.txt', fileContent, { contentType: 'text/plain' });

    console.log('  ✅ Upload file result:', uploadData);

    if (uploadError || !uploadData) {
      throw new Error('File upload failed');
    }

    if (!uploadData.path.includes('test.txt')) {
      throw new Error('Upload path not set correctly');
    }

    // Test file download
    const { data: downloadData, error: downloadError } = await this.client.storage
      .from('test-bucket')
      .download('test.txt');

    console.log('  ✅ Download file result:', downloadData ? 'success' : 'failed');

    if (downloadError || !downloadData) {
      throw new Error('File download failed');
    }

    // Test file listing
    const { data: listData, error: listError } = await this.client.storage
      .from('test-bucket')
      .list();

    console.log('  ✅ List files result:', listData);

    if (listError || !listData) {
      throw new Error('File listing failed');
    }

    // Test public URL generation
    const { data: urlData, error: urlError } = this.client.storage
      .from('test-bucket')
      .getPublicUrl('test.txt');

    console.log('  ✅ Get public URL result:', urlData);

    if (urlError || !urlData) {
      throw new Error('Public URL generation failed');
    }

    if (!urlData.publicUrl.includes('test-bucket/test.txt')) {
      throw new Error('Public URL not generated correctly');
    }

    // Test signed URL creation
    const { data: signedUrlData, error: signedUrlError } = await this.client.storage
      .from('test-bucket')
      .createSignedUrl('test.txt', { expiresIn: 3600 });

    console.log('  ✅ Create signed URL result:', signedUrlData);

    if (signedUrlError || !signedUrlData) {
      throw new Error('Signed URL creation failed');
    }

    if (!signedUrlData.signedUrl.includes('signed/')) {
      throw new Error('Signed URL not generated correctly');
    }

    // Test file deletion
    const { data: deleteData, error: deleteError } = await this.client.storage
      .from('test-bucket')
      .remove(['test.txt']);

    console.log('  ✅ Delete file result:', deleteData);

    if (deleteError || !deleteData) {
      throw new Error('File deletion failed');
    }

    if (!deleteData.message.includes('deleted')) {
      throw new Error('Delete message not correct');
    }
  }

  async testFunctionsAPI() {
    // Test function deployment
    const mockWasmBytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]); // Minimal WASM header
    const { data: deployData, error: deployError } = await this.client.functions.deploy(
      'test-function',
      mockWasmBytes,
      {
        description: 'Test WASM function',
        version: '1.0.0',
        triggers: [{
          type: 'http',
          config: { method: 'POST', path: '/api/test' },
        }],
        permissions: ['read', 'write'],
      }
    );

    console.log('  ✅ Deploy function result:', deployData);

    if (deployError || !deployData) {
      throw new Error('Function deployment failed');
    }

    if (deployData.name !== 'test-function') {
      throw new Error('Function name not set correctly');
    }

    if (deployData.runtime !== 'wasm') {
      throw new Error('Function runtime not set correctly');
    }

    // Test function invocation
    const { data: invokeData, error: invokeError, invocationId } = await this.client.functions.invoke(
      'test-function',
      { message: 'Hello from test' },
      { timeout: 5000 }
    );

    console.log('  ✅ Invoke function result:', invokeData, 'invocationId:', invocationId);

    if (invokeError) {
      throw new Error('Function invocation failed');
    }

    if (!invocationId) {
      throw new Error('Invocation ID not returned');
    }

    // Test function listing
    const { data: listData, error: listError } = await this.client.functions.list();

    console.log('  ✅ List functions result:', listData);

    if (listError || !listData) {
      throw new Error('Function listing failed');
    }

    // Test function logs
    const { data: logsData, error: logsError } = await this.client.functions.getLogs('test-function-id', { limit: 10 });

    console.log('  ✅ Get function logs result:', logsData);

    if (logsError || !logsData) {
      throw new Error('Function logs retrieval failed');
    }

    // Test function deletion
    if (deployData.id) {
      const { error: deleteError } = await this.client.functions.delete(deployData.id);

      console.log('  ✅ Delete function result:', deleteError ? 'error' : 'success');

      if (deleteError) {
        throw new Error('Function deletion failed');
      }
    }
  }
}

// Test runner
async function runPerformerClientTests() {
  const tester = new PerformerClientTest();

  try {
    await tester.runTests();
    console.log('\n🎉 PerformerClient Tests Completed Successfully!');
    console.log('📊 Supabase-like query interface verified');

  } catch (error) {
    console.error('\n💥 PerformerClient Tests Failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Export for use in other tests
export { PerformerClientTest };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformerClientTests();
}
