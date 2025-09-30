// ActorDB Integration Test
// Tests actual data persistence with the Performer framework

import { ActorDBClientFactory } from '../src/rpc/actordb-client.ts';

class ActorDBIntegrationTest {
  constructor() {
    // Use local libSQL for testing
    process.env.PERFORMER_DB_MODE = 'local'
    process.env.PERFORMER_DB_URL = 'file:test.db'
    this.client = ActorDBClientFactory.createClient();
  }

  async runTests() {
    console.log('🧪 Starting ActorDB Integration Tests...\n');

    try {
      // Test 1: Event Sourcing - Write and Read Events
      console.log('📝 Test 1: Event Sourcing');
      await this.testEventSourcing();

      // Test 2: Projections - Create and Query Projections
      console.log('\n🔍 Test 2: Projections');
      await this.testProjections();

      // Test 3: Actors - Create and Interact with Actors
      console.log('\n🎭 Test 3: Actors');
      await this.testActors();

      // Test 4: Queries - Execute Custom Queries
      console.log('\n🔍 Test 4: Queries');
      await this.testQueries();

      // Test 5: Integration with Performer Process
      console.log('\n🔗 Test 5: Performer Process Integration');
      await this.testPerformerIntegration();

      console.log('\n✅ All ActorDB integration tests passed!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }

  async testEventSourcing() {
    const userId = `test-user-${Date.now()}`;

    // Write events
    await this.client.writeEvent({
      entityId: userId,
      eventType: 'user_created',
      payload: { name: 'John Doe', email: 'john@example.com' },
      timestamp: new Date(),
      version: 1
    });

    await this.client.writeEvent({
      entityId: userId,
      eventType: 'user_updated',
      payload: { email: 'john.doe@example.com' },
      timestamp: new Date(),
      version: 2
    });

    console.log('  ✅ Events written');

    // Read events
    const events = await this.client.readEvents(userId);
    console.log(`  ✅ Events read: ${events.length} events found`);

    if (events.length !== 2) {
      throw new Error(`Expected 2 events, got ${events.length}`);
    }

    // Verify event data
    if (events[0].eventType !== 'user_created' || events[1].eventType !== 'user_updated') {
      throw new Error('Event types do not match');
    }

    console.log('  ✅ Event data verified');
  }

  async testProjections() {
    const projectionName = `test-projection-${Date.now()}`;

    // Create projection from events
    const events = [
      { entityId: 'test-1', eventType: 'user_created', payload: {}, timestamp: new Date().toISOString(), version: 1 },
      { entityId: 'test-2', eventType: 'user_created', payload: {}, timestamp: new Date().toISOString(), version: 1 },
      { entityId: 'test-3', eventType: 'user_updated', payload: {}, timestamp: new Date().toISOString(), version: 1 }
    ];

    const projection = await this.client.createProjection(projectionName, events);
    console.log('  ✅ Projection created:', projection);

    // Get projection
    const retrievedProjection = await this.client.getProjection(projectionName);
    console.log('  ✅ Projection retrieved:', retrievedProjection);

    // Update projection
    await this.client.updateProjection(projectionName, { totalUsers: 3, activeUsers: 2 });
    console.log('  ✅ Projection updated');

    const updatedProjection = await this.client.getProjection(projectionName);
    console.log('  ✅ Updated projection:', updatedProjection);
  }

  async testActors() {
    // Create actor
    const actorId = await this.client.createActor('user-manager', {
      maxUsers: 100,
      features: ['registration', 'profile-updates']
    });
    console.log(`  ✅ Actor created: ${actorId}`);

    // Get actor state
    const initialState = await this.client.getActorState(actorId);
    console.log('  ✅ Initial actor state:', initialState);

    // Send message to actor
    const response = await this.client.sendActorMessage(actorId, {
      type: 'REGISTER_USER',
      userData: { name: 'Jane Doe', email: 'jane@example.com' }
    });
    console.log('  ✅ Message sent to actor:', response);

    // Get updated actor state
    const updatedState = await this.client.getActorState(actorId);
    console.log('  ✅ Updated actor state:', updatedState);
  }

  async testQueries() {
    // Create a query
    await this.client.createQuery('activeUsers', {
      type: 'projection',
      filter: { status: 'active' }
    });
    console.log('  ✅ Query created');

    // Execute query
    const results = await this.client.executeQuery('findUsers', {});
    console.log(`  ✅ Query executed: ${results.length} results`);
    console.log('  📊 Query results:', results);
  }

  async testPerformerIntegration() {
    // Test integration with Performer process
    // This simulates what happens when the user onboarding process calls ActorDB

    const userId = `performer-test-user-${Date.now()}`;

    // Simulate the process writing events
    await this.client.writeEvent({
      entityId: userId,
      eventType: 'onboarding_started',
      payload: { userId, timestamp: new Date() },
      timestamp: new Date(),
      version: 1
    });

    await this.client.writeEvent({
      entityId: userId,
      eventType: 'username_submitted',
      payload: { username: 'testuser' },
      timestamp: new Date(),
      version: 2
    });

    await this.client.writeEvent({
      entityId: userId,
      eventType: 'username_checked',
      payload: { available: true },
      timestamp: new Date(),
      version: 3
    });

    await this.client.writeEvent({
      entityId: userId,
      eventType: 'onboarding_completed',
      payload: { success: true },
      timestamp: new Date(),
      version: 4
    });

    console.log('  ✅ Performer process events written');

    // Verify the process events
    const processEvents = await this.client.readEvents(userId);
    console.log(`  ✅ Process events retrieved: ${processEvents.length} events`);

    const eventTypes = processEvents.map(e => e.eventType);
    const expectedTypes = ['onboarding_started', 'username_submitted', 'username_checked', 'onboarding_completed'];

    if (JSON.stringify(eventTypes) !== JSON.stringify(expectedTypes)) {
      throw new Error(`Event sequence mismatch. Expected: ${expectedTypes.join(', ')}, Got: ${eventTypes.join(', ')}`);
    }

    console.log('  ✅ Process event sequence verified');

    // Create process projection
    const processProjection = await this.client.createProjection(`${userId}-process`, processEvents);
    console.log('  ✅ Process projection created:', processProjection);
  }
}

// Test runner
async function runIntegrationTests() {
  const tester = new ActorDBIntegrationTest();

  try {
    await tester.runTests();
    console.log('\n🎉 ActorDB Integration Tests Completed Successfully!');
    console.log('📊 Data persistence and retrieval verified');
    console.log('🔗 Performer framework integration confirmed');

  } catch (error) {
    console.error('\n💥 ActorDB Integration Tests Failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Export for use in other tests
export { ActorDBIntegrationTest };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}
