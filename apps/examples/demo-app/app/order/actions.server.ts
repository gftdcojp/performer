// Merkle DAG: demo_actions -> order_actions -> process_integration
// Server actions for order processing workflow

"use server";

import { z } from "zod";
import { createActions } from "@pkg/actions";
import { processEngine } from "@pkg/process";
import { createActorSystem, createBPMNBridge } from "@pkg/actor";

// Auth0 configuration (mock for demo)
const auth0Config = {
  domain: 'demo.auth0.com',
  clientID: 'demo-client-id',
  audience: 'demo-api'
};

const { roles, action } = createActions(auth0Config);

// Input validation schemas
const StartOrderSchema = z.object({
  businessKey: z.string().min(1, "Business key is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  amount: z.number().positive("Amount must be positive"),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })).min(1, "At least one item is required")
});

const ApproveOrderSchema = z.object({
  businessKey: z.string().min(1, "Business key is required"),
  approved: z.boolean("Approval decision is required"),
  comments: z.string().optional()
});

const ProcessPaymentSchema = z.object({
  businessKey: z.string().min(1, "Business key is required"),
  paymentMethod: z.enum(["credit_card", "bank_transfer", "paypal"]),
  paymentDetails: z.record(z.any())
});

// Start order process
export const startOrder = action(
  StartOrderSchema,
  z.object({ success: z.boolean(), processId: z.string(), message: z.string() })
).roles("order:create").build(async (input, context) => {
  try {
    // Initialize actor system and BPMN bridge
    const actorSystem = createActorSystem();
    const bpmnBridge = createBPMNBridge(actorSystem);

    // Start BPMN process
    const processInstance = await processEngine.startProcess(
      "OrderProcess",
      input.businessKey,
      {
        amount: input.amount,
        customerId: input.customerId,
        items: input.items,
        startedBy: context.user.id
      }
    );

    // Execute initial validation task via actor
    await bpmnBridge.executeServiceTask(
      processInstance.id,
      "validate-task",
      async () => {
        // Business logic for order validation
        if (input.amount <= 0) {
          throw new Error("Invalid order amount");
        }
        if (input.items.length === 0) {
          throw new Error("Order must have at least one item");
        }

        // Validate total amount matches items
        const calculatedTotal = input.items.reduce(
          (sum, item) => sum + (item.quantity * item.price),
          0
        );

        if (Math.abs(calculatedTotal - input.amount) > 0.01) {
          throw new Error("Order amount does not match item totals");
        }

        return { valid: true, total: calculatedTotal };
      }
    );

    return {
      success: true,
      processId: processInstance.id,
      message: "Order process started successfully"
    };
  } catch (error) {
    console.error('Failed to start order process:', error);
    return {
      success: false,
      processId: "",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
});

// Approve order (manager action)
export const approveOrder = action(
  ApproveOrderSchema,
  z.object({ success: z.boolean(), message: z.string() })
).roles("order:approve").build(async (input, context) => {
  try {
    // Check if user has manager role
    if (!context.user.roles.includes('manager')) {
      throw new Error("Only managers can approve orders");
    }

    // Signal BPMN process with approval decision
    await processEngine.signalProcess(
      input.businessKey, // Using businessKey as process instance ID for demo
      input.approved ? "approved" : "rejected",
      {
        approvedBy: context.user.id,
        approvedAt: new Date().toISOString(),
        comments: input.comments
      }
    );

    return {
      success: true,
      message: `Order ${input.approved ? 'approved' : 'rejected'} successfully`
    };
  } catch (error) {
    console.error('Failed to approve order:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
});

// Process payment
export const processPayment = action(
  ProcessPaymentSchema,
  z.object({ success: z.boolean(), transactionId: z.string(), message: z.string() })
).roles("payment:process").build(async (input, context) => {
  try {
    // Initialize actor system for payment processing
    const actorSystem = createActorSystem();
    const bpmnBridge = createBPMNBridge(actorSystem);

    // Execute payment task via actor
    const result = await bpmnBridge.executeServiceTask(
      input.businessKey,
      "payment-task",
      async () => {
        // Mock payment processing
        const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock payment success (90% success rate for demo)
        if (Math.random() > 0.1) {
          return {
            transactionId,
            status: 'completed',
            processedAt: new Date().toISOString(),
            paymentMethod: input.paymentMethod
          };
        } else {
          throw new Error("Payment processing failed");
        }
      }
    );

    // Complete BPMN process
    await processEngine.signalProcess(
      input.businessKey,
      "payment_completed",
      { transactionId: result.transactionId }
    );

    return {
      success: true,
      transactionId: result.transactionId,
      message: "Payment processed successfully"
    };
  } catch (error) {
    console.error('Failed to process payment:', error);

    // Signal payment failure
    await processEngine.signalProcess(
      input.businessKey,
      "payment_failed",
      { error: error instanceof Error ? error.message : "Unknown error" }
    );

    return {
      success: false,
      transactionId: "",
      message: error instanceof Error ? error.message : "Payment processing failed"
    };
  }
});

// Get process status
export const getProcessStatus = action(
  z.object({ businessKey: z.string() }),
  z.object({
    success: z.boolean(),
    status: z.string(),
    tasks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      status: z.string(),
      assignee: z.string().optional()
    }))
  })
).roles("order:read").build(async (input, context) => {
  try {
    // Get process instance status
    const instance = processEngine.getInstance(input.businessKey);

    if (!instance) {
      throw new Error("Process instance not found");
    }

    const tasks = processEngine.getTasks(instance.id);

    return {
      success: true,
      status: instance.status,
      tasks: tasks.map(task => ({
        id: task.id,
        name: task.name,
        type: task.type,
        status: 'running', // Mock status
        assignee: task.assignee
      }))
    };
  } catch (error) {
    console.error('Failed to get process status:', error);
    return {
      success: false,
      status: "error",
      tasks: []
    };
  }
});
