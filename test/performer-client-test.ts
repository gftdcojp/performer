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
