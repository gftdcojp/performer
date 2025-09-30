// ActorDB Simulator for Testing
// Simulates ActorDB HTTP API for testing data persistence

import express from 'express';
import cors from 'cors';

class ActorDBSimulator {
  constructor(port = 9091) {
    this.port = port;
    this.app = express();
    this.events = new Map(); // entityId -> events[]
    this.projections = new Map(); // projectionName -> data
    this.actors = new Map(); // actorId -> state

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // Event Sourcing
    this.app.post('/api/v1/events.write', this.handleWriteEvent.bind(this));
    this.app.post('/api/v1/events.read', this.handleReadEvents.bind(this));
    this.app.post('/api/v1/events.readByType', this.handleReadEventsByType.bind(this));

    // Projections
    this.app.post('/api/v1/projections.create', this.handleCreateProjection.bind(this));
    this.app.post('/api/v1/projections.get', this.handleGetProjection.bind(this));
    this.app.post('/api/v1/projections.update', this.handleUpdateProjection.bind(this));

    // Actors
    this.app.post('/api/v1/actors.create', this.handleCreateActor.bind(this));
    this.app.post('/api/v1/actors.getState', this.handleGetActorState.bind(this));
    this.app.post('/api/v1/actors.sendMessage', this.handleSendActorMessage.bind(this));

    // Queries
    this.app.post('/api/v1/queries.execute', this.handleExecuteQuery.bind(this));
    this.app.post('/api/v1/queries.create', this.handleCreateQuery.bind(this));

    // Health check
    this.app.get('/health', (req, res) => res.json({ status: 'ok' }));
  }

  async handleWriteEvent(req, res) {
    try {
      const { entityId, eventType, payload, timestamp, version } = req.body.params;
      const event = {
        entityId,
        eventType,
        payload,
        timestamp: new Date(timestamp),
        version
      };

      if (!this.events.has(entityId)) {
        this.events.set(entityId, []);
      }
      this.events.get(entityId).push(event);

      console.log(`📝 [ActorDB] Event written: ${eventType} for ${entityId}`);
      res.json({ id: req.body.id, result: null });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleReadEvents(req, res) {
    try {
      const { entityId } = req.body.params;
      const events = this.events.get(entityId) || [];
      const result = events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString()
      }));

      console.log(`📖 [ActorDB] Events read for ${entityId}: ${result.length} events`);
      res.json({ id: req.body.id, result });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleReadEventsByType(req, res) {
    try {
      const { eventType } = req.body.params;
      const allEvents = [];
      for (const events of this.events.values()) {
        allEvents.push(...events.filter(e => e.eventType === eventType));
      }
      const result = allEvents.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString()
      }));

      console.log(`📖 [ActorDB] Events read by type ${eventType}: ${result.length} events`);
      res.json({ id: req.body.id, result });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleCreateProjection(req, res) {
    try {
      const { name, events } = req.body.params;
      // Simple projection: count events by type
      const projection = {};
      events.forEach(event => {
        projection[event.eventType] = (projection[event.eventType] || 0) + 1;
      });

      this.projections.set(name, projection);
      console.log(`🔍 [ActorDB] Projection created: ${name}`, projection);
      res.json({ id: req.body.id, result: projection });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleGetProjection(req, res) {
    try {
      const { name } = req.body.params;
      const projection = this.projections.get(name) || {};
      console.log(`🔍 [ActorDB] Projection retrieved: ${name}`, projection);
      res.json({ id: req.body.id, result: projection });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleUpdateProjection(req, res) {
    try {
      const { name, updates } = req.body.params;
      const current = this.projections.get(name) || {};
      const updated = { ...current, ...updates };
      this.projections.set(name, updated);
      console.log(`🔄 [ActorDB] Projection updated: ${name}`, updates);
      res.json({ id: req.body.id, result: null });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleCreateActor(req, res) {
    try {
      const { actorType, config } = req.body.params;
      const actorId = `actor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.actors.set(actorId, { type: actorType, config, state: {} });
      console.log(`🎭 [ActorDB] Actor created: ${actorId} (${actorType})`);
      res.json({ id: req.body.id, result: actorId });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleGetActorState(req, res) {
    try {
      const { actorId } = req.body.params;
      const actor = this.actors.get(actorId);
      const state = actor ? actor.state : {};
      console.log(`🎭 [ActorDB] Actor state retrieved: ${actorId}`, state);
      res.json({ id: req.body.id, result: state });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleSendActorMessage(req, res) {
    try {
      const { actorId, message } = req.body.params;
      const actor = this.actors.get(actorId);
      if (actor) {
        // Simulate actor processing
        actor.state = { ...actor.state, lastMessage: message, processedAt: new Date() };
      }
      console.log(`📨 [ActorDB] Message sent to actor: ${actorId}`, message);
      res.json({ id: req.body.id, result: { acknowledged: true } });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleExecuteQuery(req, res) {
    try {
      const { query, params } = req.body.params;
      // Simple query simulation
      let result = [];
      if (query === 'findUsers') {
        result = Array.from(this.events.entries())
          .filter(([entityId]) => entityId.startsWith('user-'))
          .map(([entityId, events]) => ({
            id: entityId,
            eventCount: events.length,
            lastEvent: events[events.length - 1]?.eventType
          }));
      }
      console.log(`🔍 [ActorDB] Query executed: ${query}`, params, `-> ${result.length} results`);
      res.json({ id: req.body.id, result });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  async handleCreateQuery(req, res) {
    try {
      const { name, definition } = req.body.params;
      console.log(`💾 [ActorDB] Query created: ${name}`, definition);
      res.json({ id: req.body.id, result: null });
    } catch (error) {
      res.status(500).json({ id: req.body.id, error: { code: 500, message: error.message } });
    }
  }

  start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 ActorDB Simulator running on http://localhost:${this.port}`);
        console.log(`📊 Events stored: ${this.events.size}`);
        console.log(`🔍 Projections stored: ${this.projections.size}`);
        console.log(`🎭 Actors stored: ${this.actors.size}`);
        resolve(this.server);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 ActorDB Simulator stopped');
    }
  }

  getStats() {
    return {
      events: this.events.size,
      projections: this.projections.size,
      actors: this.actors.size,
      totalEventCount: Array.from(this.events.values()).reduce((sum, events) => sum + events.length, 0)
    };
  }

  clear() {
    this.events.clear();
    this.projections.clear();
    this.actors.clear();
    console.log('🧹 ActorDB Simulator data cleared');
  }
}

export default ActorDBSimulator;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new ActorDBSimulator();
  simulator.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down ActorDB Simulator...');
    simulator.stop();
    process.exit(0);
  });
}
