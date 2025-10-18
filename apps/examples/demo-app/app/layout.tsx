// Merkle DAG: demo_layout -> app_layout -> global_styles
// Root layout component for the demo app

import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>BPMN Order Processing Demo</title>
        <meta name="description" content="Demo application for BPMN + Actor + Neo4j Web Framework" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Performer Demo
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-gray-900">
                  Home
                </a>
                <a href="/order/demo-123" className="text-blue-600 hover:text-blue-800">
                  Sample Order
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main>
          {children}
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              BPMN + Actor + Neo4j Web Framework Demo
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
