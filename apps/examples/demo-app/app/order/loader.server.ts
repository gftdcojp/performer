// Merkle DAG: demo_loader -> server_data_fetch -> order_query
// Server-side data loading for order page

"use server";

import { q } from "@pkg/data";
import { z } from "zod";

// Input validation schema
const LoaderParamsSchema = z.object({
  businessKey: z.string().min(1, "Business key is required")
});

export type LoaderParams = z.infer<typeof LoaderParamsSchema>;

export interface OrderData {
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

export async function loader(params: LoaderParams): Promise<OrderData | null> {
  try {
    // Validate input parameters
    const validatedParams = LoaderParamsSchema.parse(params);

    // Query order data from Neo4j
    const connection = {
      getDriver: () => ({ /* mock driver */ }),
      getNeogma: () => ({ /* mock neogma */ })
    } as any;

    // In real implementation, this would connect to actual Neo4j instance
    // For demo purposes, return mock data
    const mockOrder: OrderData = {
      id: `order-${Date.now()}`,
      businessKey: validatedParams.businessKey,
      customerId: "customer-123",
      amount: 750,
      status: 'submitted',
      items: [
        {
          productId: "prod-1",
          name: "Widget A",
          quantity: 2,
          price: 250
        },
        {
          productId: "prod-2",
          name: "Widget B",
          quantity: 1,
          price: 250
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return mockOrder;
  } catch (error) {
    console.error('Failed to load order data:', error);
    return null;
  }
}

// Additional loader for process instances
export async function loadProcessInstance(businessKey: string) {
  try {
    // In real implementation, query process instance from Neo4j
    // For demo purposes, return mock data
    return {
      id: `process-${Date.now()}`,
      processId: "OrderProcess",
      businessKey,
      status: 'running',
      variables: { amount: 750, customerId: "customer-123" },
      startTime: new Date(),
      tasks: [
        {
          id: "task-1",
          name: "Validate Order",
          type: "service",
          status: "completed"
        },
        {
          id: "task-2",
          name: "Manager Approval",
          type: "user",
          status: "running",
          assignee: "manager"
        }
      ]
    };
  } catch (error) {
    console.error('Failed to load process instance:', error);
    return null;
  }
}
