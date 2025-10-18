// Merkle DAG: admin_tasks -> task_management -> user_assignments
// Task management and assignment page

"use client";

import React, { useState, useEffect } from 'react';

// Process metadata for task categorization (client-side copy)
const processMetadata = {
  tasks: {
    ValidateOrder: { category: "validation" },
    InventoryCheck: { category: "validation" },
    CreditCheck: { category: "validation" },
    RiskAssessment: { category: "validation" },
    ComplianceReview: { category: "approval" },
    ManagerApproval: { category: "approval" },
    ExecutiveApproval: { category: "approval" },
    AutoApprove: { category: "approval" },
    PaymentProcessing: { category: "payment" },
    WarehousePreparation: { category: "fulfillment" },
    QualityCheck: { category: "fulfillment" },
    ShippingArrangement: { category: "fulfillment" },
    FinalDocumentation: { category: "fulfillment" },
    SendConfirmationEmail: { category: "communication" },
    SendRejectionEmail: { category: "communication" },
    PaymentFailedNotification: { category: "communication" }
  }
};

interface Task {
  id: string;
  name: string;
  type: 'user' | 'service' | 'send' | 'receive' | 'manual' | 'businessRule';
  processInstanceId: string;
  businessKey: string;
  assignee?: string;
  dueDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  description: string;
  variables: Record<string, any>;
  category: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    assignee: '',
    priority: '',
    type: '',
    category: ''
  });

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadTasks = async () => {
    try {
      // Mock data - in real implementation, this would call API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTasks: Task[] = [
        {
          id: 'task-001',
          name: 'ManagerApproval',
          type: 'user',
          processInstanceId: 'proc-001',
          businessKey: 'ORD-2024-001',
          assignee: 'manager',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'high',
          status: 'assigned',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          description: 'Approve order over $5,000',
          variables: { amount: 8500, customerId: 'CUST-001' },
          category: 'approval'
        },
        {
          id: 'task-002',
          name: 'QualityCheck',
          type: 'user',
          processInstanceId: 'proc-002',
          businessKey: 'ORD-2024-002',
          assignee: 'qc_specialist',
          dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
          priority: 'high',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          description: 'Inspect product quality before shipping',
          variables: { amount: 12500, items: ['WIDGET-A', 'WIDGET-B'] },
          category: 'fulfillment'
        },
        {
          id: 'task-003',
          name: 'ComplianceReview',
          type: 'user',
          processInstanceId: 'proc-005',
          businessKey: 'ORD-2024-005',
          assignee: 'compliance_officer',
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
          priority: 'critical',
          status: 'assigned',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          description: 'High-risk order compliance review',
          variables: { amount: 45000, riskScore: 85 },
          category: 'approval'
        },
        {
          id: 'task-004',
          name: 'PaymentProcessing',
          type: 'service',
          processInstanceId: 'proc-004',
          businessKey: 'ORD-2024-004',
          priority: 'normal',
          status: 'created',
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          description: 'Process credit card payment',
          variables: { amount: 750, paymentMethod: 'credit_card' },
          category: 'payment'
        },
        {
          id: 'task-005',
          name: 'ExecutiveApproval',
          type: 'user',
          processInstanceId: 'proc-006',
          businessKey: 'ORD-2024-006',
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          priority: 'critical',
          status: 'created',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          description: 'Executive approval for order over $25,000',
          variables: { amount: 30000, customerId: 'CUST-006' },
          category: 'approval'
        }
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Mock users data
      const mockUsers: User[] = [
        { id: 'manager', name: 'John Manager', email: 'john@company.com', role: 'Manager', department: 'Sales' },
        { id: 'compliance_officer', name: 'Sarah Compliance', email: 'sarah@company.com', role: 'Compliance Officer', department: 'Legal' },
        { id: 'qc_specialist', name: 'Mike Quality', email: 'mike@company.com', role: 'QC Specialist', department: 'Operations' },
        { id: 'executive', name: 'Jane Executive', email: 'jane@company.com', role: 'Executive', department: 'Management' },
        { id: 'clerk', name: 'Bob Clerk', email: 'bob@company.com', role: 'Clerk', department: 'Operations' }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const applyFilters = () => {
    let filtered = tasks;

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.assignee) {
      filtered = filtered.filter(t => t.assignee === filters.assignee);
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    setFilteredTasks(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, assignee: assigneeId, status: 'assigned' as const }
          : task
      ));

      setShowAssignModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to assign task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'completed' as const }
          : task
      ));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'service': return '⚙️';
      case 'send': return '📤';
      case 'receive': return '📥';
      case 'manual': return '✋';
      case 'businessRule': return '📊';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
              <p className="text-gray-600 mt-1">Assign, monitor, and complete workflow tasks</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Admin Navigation</h2>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="created">Created</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assignees</option>
                <option value="manager">Manager</option>
                <option value="compliance_officer">Compliance Officer</option>
                <option value="qc_specialist">QC Specialist</option>
                <option value="executive">Executive</option>
                <option value="clerk">Clerk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="user">User Task</option>
                <option value="service">Service Task</option>
                <option value="send">Send Task</option>
                <option value="receive">Receive Task</option>
                <option value="manual">Manual Task</option>
                <option value="businessRule">Business Rule</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="validation">Validation</option>
                <option value="approval">Approval</option>
                <option value="payment">Payment</option>
                <option value="fulfillment">Fulfillment</option>
                <option value="communication">Communication</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Tasks ({filteredTasks.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(task.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.name}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.businessKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assignee || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.dueDate ? task.dueDate.toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {task.type === 'user' && task.status !== 'completed' && (
                          <>
                            {!task.assignee && (
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowAssignModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Assign
                              </button>
                            )}
                            {task.assignee && task.status !== 'completed' && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Complete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Detail Modal */}
        {selectedTask && !showAssignModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Task Details: {selectedTask.name}</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Task Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ID:</span> {selectedTask.id}</p>
                    <p><span className="font-medium">Business Key:</span> {selectedTask.businessKey}</p>
                    <p><span className="font-medium">Type:</span> {selectedTask.type}</p>
                    <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedTask.status)}`}>{selectedTask.status}</span></p>
                    <p><span className="font-medium">Priority:</span> <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedTask.priority)}`}>{selectedTask.priority}</span></p>
                    <p><span className="font-medium">Assignee:</span> {selectedTask.assignee || 'Unassigned'}</p>
                    <p><span className="font-medium">Due Date:</span> {selectedTask.dueDate ? selectedTask.dueDate.toLocaleString() : 'N/A'}</p>
                    <p><span className="font-medium">Created:</span> {selectedTask.createdAt.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description & Variables</h4>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">{selectedTask.description}</p>

                    <div>
                      <h5 className="font-medium text-sm mb-1">Variables:</h5>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(selectedTask.variables, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Task Modal */}
        {showAssignModal && selectedTask && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Assign Task: {selectedTask.name}</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTask(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Assignee</label>
                <select
                  id="assignee-select"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role} ({user.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const selectElement = document.getElementById('assignee-select') as HTMLSelectElement;
                    const assigneeId = selectElement.value;
                    if (assigneeId && selectedTask) {
                      handleAssignTask(selectedTask.id, assigneeId);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Assign Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
