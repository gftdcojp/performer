// Merkle DAG: demo_ui -> order_page -> react_components
// Client-side UI for order processing page

"use client";

import React, { useState, useEffect } from 'react';

interface OrderData {
  id: string;
  businessKey: string;
  customerId: string;
  amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderPageProps {
  businessKey: string;
  initialData?: OrderData;
}

export default function OrderPage({ businessKey, initialData }: OrderPageProps) {
  const [orderData, setOrderData] = useState<OrderData | null>(initialData || null);
  const [processStatus, setProcessStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!orderData) {
      loadOrderData();
    }
    loadProcessStatus();
  }, [businessKey]);

  const loadOrderData = async () => {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData: OrderData = {
        id: `order-${Date.now()}`,
        businessKey,
        customerId: 'customer-123',
        amount: 750,
        status: 'submitted',
        items: [
          {
            productId: 'prod-1',
            name: 'Widget A',
            quantity: 2,
            price: 250
          },
          {
            productId: 'prod-2',
            name: 'Widget B',
            quantity: 1,
            price: 250
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setOrderData(mockData);
    } catch (error) {
      setMessage('Failed to load order data');
    }
  };

  const loadProcessStatus = async () => {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, use mock data
      const mockResult = {
        success: true,
        status: 'running',
        tasks: [
          { id: 'task-1', name: 'Validate Order', type: 'service', status: 'completed' },
          { id: 'task-2', name: 'Manager Approval', type: 'user', status: 'running', assignee: 'manager' }
        ]
      };

      setProcessStatus(mockResult);
    } catch (error) {
      console.error('Failed to load process status:', error);
    }
  };

  const handleStartOrder = async () => {
    if (!orderData) return;

    setLoading(true);
    setMessage('');

    try {
      // In a real implementation, this would make an API call
      // For now, simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResult = { success: true, message: 'Order process started successfully' };

      if (mockResult.success) {
        setMessage(mockResult.message);
        await loadProcessStatus();
      } else {
        setMessage(mockResult.message || 'Failed to start order process');
      }
    } catch (error) {
      setMessage('Failed to start order process');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (approved: boolean, comments: string = '') => {
    setLoading(true);
    setMessage('');

    try {
      // In a real implementation, this would make an API call
      // For now, simulate the action
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockResult = { message: approved ? 'Order approved successfully' : 'Order rejected' };

      setMessage(mockResult.message);
      await loadProcessStatus();
    } catch (error) {
      setMessage('Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (paymentMethod: string) => {
    setLoading(true);
    setMessage('');

    try {
      // In a real implementation, this would make an API call
      // For now, simulate the action
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockTransactionId = `txn-${Date.now()}`;
      const mockResult = {
        success: true,
        message: 'Payment processed successfully',
        data: { transactionId: mockTransactionId }
      };

      if (mockResult.success && mockResult.data) {
        setMessage(`Payment successful! Transaction ID: ${mockResult.data.transactionId}`);
        await loadProcessStatus();
      } else {
        setMessage(mockResult.message || 'Payment processing failed');
      }
    } catch (error) {
      setMessage('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Processing</h1>
              <p className="text-gray-600 mt-1">Business Key: {businessKey}</p>
            </div>
            <button
              onClick={() => {
                const navigate = (window as any).navigate;
                if (navigate) navigate('/');
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              orderData.status === 'paid' ? 'bg-green-100 text-green-800' :
              orderData.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              orderData.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {orderData.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Process Status */}
        {processStatus && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Process Status</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {processStatus.status}</p>
              <div>
                <span className="font-medium">Tasks:</span>
                <ul className="mt-1 space-y-1">
                  {processStatus.tasks.map((task: any) => (
                    <li key={task.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{task.name} ({task.type})</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Customer ID</p>
              <p className="font-medium">{orderData.customerId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium text-xl">${orderData.amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Items</h3>
            <div className="space-y-2">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Product ID: {item.productId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('success') || message.includes('successful')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            {/* Start Order Process */}
            {orderData.status === 'draft' && (
              <button
                onClick={handleStartOrder}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Order Process'}
              </button>
            )}

            {/* Manager Approval */}
            {processStatus?.tasks.some((t: any) => t.name === 'Manager Approval' && t.status === 'running') && (
              <div className="space-y-2">
                <textarea
                  placeholder="Approval comments (optional)"
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveOrder(true)}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve Order
                  </button>
                  <button
                    onClick={() => handleApproveOrder(false)}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Order
                  </button>
                </div>
              </div>
            )}

            {/* Payment Processing */}
            {processStatus?.tasks.some((t: any) => t.name === 'Payment' && t.status === 'running') && (
              <div className="space-y-2">
                <select className="w-full p-2 border rounded">
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
                <button
                  onClick={() => handleProcessPayment('credit_card')}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
