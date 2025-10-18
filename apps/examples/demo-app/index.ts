// Merkle DAG: demo_entry -> app_bootstrap -> framework_integration
// Main entry point for the demo application

import { createSSRApp } from 'vue'; // or React equivalent
import Layout from './app/layout';
import HomePage from './app/page/page.client';
import OrderPage from './app/order/page.client';

// This is a conceptual entry point - in a real implementation,
// this would be handled by the router package

export interface AppConfig {
  basePath: string;
  apiUrl: string;
  auth0: {
    domain: string;
    clientId: string;
    audience: string;
  };
  neo4j: {
    uri: string;
    username: string;
    password: string;
  };
}

export const defaultConfig: AppConfig = {
  basePath: '/',
  apiUrl: 'http://localhost:3000',
  auth0: {
    domain: 'demo.auth0.com',
    clientId: 'demo-client-id',
    audience: 'demo-api'
  },
  neo4j: {
    uri: 'bolt://localhost:7687',
    username: 'neo4j',
    password: 'password'
  }
};

// Route definitions
export const routes = [
  {
    path: '/',
    component: HomePage,
    loader: null
  },
  {
    path: '/order/:businessKey',
    component: OrderPage,
    loader: async ({ businessKey }: { businessKey: string }) => {
      // This would call the loader.server.ts
      return { businessKey };
    }
  }
];

// Bootstrap function
export async function bootstrap(config: AppConfig = defaultConfig) {
  console.log('🚀 Starting Performer Demo App');

  // Initialize core services
  try {
    // This would initialize Neo4j connection, actor system, etc.
    console.log('✅ Services initialized');
    console.log('🌐 Server running at http://localhost:3000');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Development helpers
export const demoHelpers = {
  createSampleOrder: () => ({
    businessKey: `demo-${Date.now()}`,
    customerId: 'customer-123',
    amount: 750,
    items: [
      { productId: 'prod-1', name: 'Widget A', quantity: 2, price: 250 },
      { productId: 'prod-2', name: 'Widget B', quantity: 1, price: 250 }
    ]
  }),

  simulateApproval: async (businessKey: string) => {
    console.log(`🎯 Simulating approval for order: ${businessKey}`);
    // This would trigger the approval action
  },

  simulatePayment: async (businessKey: string) => {
    console.log(`💳 Simulating payment for order: ${businessKey}`);
    // This would trigger the payment action
  }
};

// Export everything for use in other parts of the framework
export { Layout, HomePage, OrderPage };
export * from './app/order/process.flow';
export * from './app/order/loader.server';
export * from './app/order/actions.server';
