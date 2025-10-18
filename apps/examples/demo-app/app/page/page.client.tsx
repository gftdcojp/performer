// Merkle DAG: demo_homepage -> welcome_page -> demo_navigation
// Homepage component for the demo application

"use client";

import React, { useState } from 'react';

export default function HomePage() {
  const [selectedDemo, setSelectedDemo] = useState<string>('');

  const handleStartDemo = (demoType: string) => {
    setSelectedDemo(demoType);
    // Navigate to order demo
    const navigate = (window as any).navigate;
    if (navigate) {
      navigate(`/order/demo-${Date.now()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Performer Framework
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            BPMN + Actor + Neo4j Web Framework Demo
            <br />
            Experience complete order processing workflow with business process management
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleStartDemo('order')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Start Order Demo
            </button>
            <button
              onClick={() => setSelectedDemo('about')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors text-lg font-medium"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">BPMN Processes</h3>
            <p className="text-gray-600">
              Visual business process modeling with executable workflows.
              Define complex business logic using industry-standard BPMN notation.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Actor System</h3>
            <p className="text-gray-600">
              Distributed task execution with supervision and fault tolerance.
              Automatic retry, timeout handling, and load distribution.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Neo4j Integration</h3>
            <p className="text-gray-600">
              Graph database for complex relationships and queries.
              Type-safe Cypher queries with automatic schema management.
            </p>
          </div>
        </div>

        {/* Workflow Demo */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Order Processing Workflow</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-semibold mb-2">Order Received</h3>
              <p className="text-sm text-gray-600">Customer submits order</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold mb-2">Validation</h3>
              <p className="text-sm text-gray-600">Auto-validate order data</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👔</span>
              </div>
              <h3 className="font-semibold mb-2">Approval</h3>
              <p className="text-sm text-gray-600">Manager approval if {'>'}$1000</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="font-semibold mb-2">Payment</h3>
              <p className="text-sm text-gray-600">Process payment & complete</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              This demo showcases a complete BPMN workflow with conditional logic,
              human tasks, and automated service tasks.
            </p>
            <button
              onClick={() => handleStartDemo('order')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try the Demo →
            </button>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-8">Built with Modern Technologies</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <span className="text-lg font-medium">React</span>
            <span className="text-lg font-medium">TypeScript</span>
            <span className="text-lg font-medium">Tailwind CSS</span>
            <span className="text-lg font-medium">BPMN.js</span>
            <span className="text-lg font-medium">Neo4j</span>
            <span className="text-lg font-medium">Effect</span>
            <span className="text-lg font-medium">Auth0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
