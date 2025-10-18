// Merkle DAG: demo_process_flow -> order_bpmn -> validation_approval_payment
// BPMN process definition for order -> approval -> payment workflow

import { flow } from "@pkg/process";

export const orderProcess = flow("OrderProcess", (p) => {
  p.startEvent("OrderReceived")
    .serviceTask("ValidateOrder")
    .exclusiveGateway("AmountCheck")
      .when("low", { expr: "${vars.amount <= 1000}" })
        .serviceTask("AutoApprove")
        .moveTo("Payment")
      .otherwise()
        .userTask("ManagerApproval")
        .moveTo("Payment")
    .serviceTask("Payment")
    .endEvent("Completed");
});

// Additional process metadata
export const processMetadata = {
  id: "OrderProcess",
  name: "Order Processing Workflow",
  version: "1.0.0",
  description: "Complete order processing from validation through approval to payment",
  tasks: {
    ValidateOrder: {
      type: "service",
      description: "Validate order data and business rules",
      timeout: 30000 // 30 seconds
    },
    ManagerApproval: {
      type: "user",
      description: "Manager approval for orders over $1000",
      assignee: "manager",
      priority: "high",
      dueDate: "P1D" // 1 day SLA
    },
    AutoApprove: {
      type: "service",
      description: "Automatic approval for small orders",
      timeout: 5000 // 5 seconds
    },
    Payment: {
      type: "service",
      description: "Process payment transaction",
      timeout: 60000 // 1 minute
    }
  }
};
