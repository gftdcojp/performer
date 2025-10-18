// Merkle DAG: admin_dashboard -> process_metrics -> real_time_stats
// Admin dashboard with process metrics and real-time statistics

"use client";

import React, { useState, useEffect } from 'react';

// Process metadata (duplicated from server-side for client use)
const processMetadata = {
  categories: {
    validation: {
      name: "Validation",
      color: "#3B82F6",
      description: "Order validation and risk assessment"
    },
    approval: {
      name: "Approval",
      color: "#F59E0B",
      description: "Multi-level approval processes"
    },
    payment: {
      name: "Payment",
      color: "#10B981",
      description: "Payment processing and confirmation"
    },
    fulfillment: {
      name: "Fulfillment",
      color: "#8B5CF6",
      description: "Warehouse and shipping operations"
    },
    communication: {
      name: "Communication",
      color: "#EF4444",
      description: "Customer notifications and updates"
    }
  }
};

interface DashboardStats {
  totalProcesses: number;
  activeProcesses: number;
  completedToday: number;
  averageProcessingTime: string;
  slaCompliance: number;
  taskDistribution: Record<string, number>;
  categoryStats: Record<string, { total: number; completed: number; avgTime: number }>;
}

interface ProcessInstance {
  id: string;
  businessKey: string;
  status: 'running' | 'completed' | 'suspended' | 'terminated';
  startTime: Date;
  endTime?: Date;
  currentTask?: string;
  category: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProcesses: 0,
    activeProcesses: 0,
    completedToday: 0,
    averageProcessingTime: "0h 0m",
    slaCompliance: 0,
    taskDistribution: {},
    categoryStats: {}
  });
  const [recentProcesses, setRecentProcesses] = useState<ProcessInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock dashboard data - in real implementation, this would call API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockStats: DashboardStats = {
        totalProcesses: 1247,
        activeProcesses: 89,
        completedToday: 156,
        averageProcessingTime: "4h 32m",
        slaCompliance: 98.2,
        taskDistribution: {
          'ManagerApproval': 12,
          'QualityCheck': 8,
          'PaymentProcessing': 15,
          'ComplianceReview': 3,
          'ExecutiveApproval': 2
        },
        categoryStats: {
          validation: { total: 89, completed: 76, avgTime: 45 },
          approval: { total: 34, completed: 28, avgTime: 180 },
          payment: { total: 156, completed: 145, avgTime: 120 },
          fulfillment: { total: 98, completed: 87, avgTime: 240 },
          communication: { total: 156, completed: 152, avgTime: 15 }
        }
      };

      const mockProcesses: ProcessInstance[] = [
        { id: 'proc-001', businessKey: 'ORD-2024-001', status: 'running', startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), currentTask: 'ManagerApproval', category: 'approval' },
        { id: 'proc-002', businessKey: 'ORD-2024-002', status: 'running', startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), currentTask: 'QualityCheck', category: 'fulfillment' },
        { id: 'proc-003', businessKey: 'ORD-2024-003', status: 'completed', startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), endTime: new Date(Date.now() - 30 * 60 * 1000), category: 'validation' },
        { id: 'proc-004', businessKey: 'ORD-2024-004', status: 'running', startTime: new Date(Date.now() - 30 * 60 * 1000), currentTask: 'PaymentProcessing', category: 'payment' },
        { id: 'proc-005', businessKey: 'ORD-2024-005', status: 'suspended', startTime: new Date(Date.now() - 6 * 60 * 60 * 1000), currentTask: 'ComplianceReview', category: 'approval' }
      ];

      setStats(mockStats);
      setRecentProcesses(mockProcesses);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Order Processing System Overview</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Admin Navigation</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const navigate = (window as any).navigate;
                if (navigate) navigate('/admin/dashboard');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => {
                const navigate = (window as any).navigate;
                if (navigate) navigate('/admin/processes');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              🔄 Process Instances
            </button>
            <button
              onClick={() => {
                const navigate = (window as any).navigate;
                if (navigate) navigate('/admin/tasks');
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
            >
              ✅ Task Management
            </button>
            <button
              onClick={() => {
                const navigate = (window as any).navigate;
                if (navigate) navigate('/');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Processes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProcesses.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Processes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProcesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageProcessingTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">SLA Compliance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.slaCompliance}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Process Categories</h2>
            <div className="space-y-4">
              {Object.entries(processMetadata.categories).map(([key, category]) => {
                const catStats = stats.categoryStats[key] || { total: 0, completed: 0, avgTime: 0 };
                const completionRate = catStats.total > 0 ? (catStats.completed / catStats.total) * 100 : 0;

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{catStats.completed}/{catStats.total}</p>
                      <p className="text-sm text-gray-600">{completionRate.toFixed(1)}% complete</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Tasks by Type</h2>
            <div className="space-y-3">
              {Object.entries(stats.taskDistribution).map(([taskName, count]) => {
                const taskInfo = processMetadata.tasks[taskName as keyof typeof processMetadata.tasks];
                if (!taskInfo) return null;

                return (
                  <div key={taskName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        taskInfo.priority === 'critical' ? 'bg-red-500' :
                        taskInfo.priority === 'high' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{taskName}</p>
                        <p className="text-sm text-gray-600">{taskInfo.assignee || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Processes */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Process Instances</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentProcesses.map((process) => (
                  <tr key={process.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {process.businessKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        process.status === 'completed' ? 'bg-green-100 text-green-800' :
                        process.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        process.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {process.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {process.currentTask || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {process.startTime.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {process.category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
