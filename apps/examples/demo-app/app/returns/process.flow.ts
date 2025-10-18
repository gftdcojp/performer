// Merkle DAG: returns_process_flow -> return_bpmn -> inspection_approval_refund
// Return processing workflow with inspection, approval, and refund

// Note: This file contains process metadata and definitions for server-side processing
// Client-side components use the metadata directly without importing server-side code

// Server-side process definition (not used in client)
// export const returnsProcess = flow("ReturnsProcess", (p) => {
//   p.startEvent("ReturnRequested")
//     .serviceTask("ValidateReturnRequest")
//     .exclusiveGateway("ReturnEligibility")
//       .when("ineligible", { expr: "${vars.returnEligibility == 'denied'}" })
//         .serviceTask("SendDenialNotification")
//         .endEvent("ReturnRejected")
//       .otherwise()
//         .parallelGateway("ReturnProcessingSplit")
//           .path("inspection")
//             .userTask("ProductInspection")
//             .exclusiveGateway("InspectionResult")
//               .when("damaged", { expr: "${vars.inspectionResult == 'damaged'}" })
//                 .serviceTask("SendInspectionReport")
//                 .endEvent("ReturnRejected")
//               .otherwise()
//                 .moveTo("ReturnProcessingJoin")
//           .path("refund")
//             .serviceTask("CalculateRefund")
//             .userTask("RefundApproval")
//             .moveTo("ReturnProcessingJoin")
//
//         .parallelGateway("ReturnProcessingJoin")
//         .serviceTask("ProcessRefund")
//         .parallelGateway("ReturnCompletionSplit")
//           .path("warehouse")
//             .serviceTask("RestockItems")
//             .moveTo("ReturnCompletionJoin")
//           .path("customer")
//             .serviceTask("SendRefundConfirmation")
//             .moveTo("ReturnCompletionJoin")
//
//         .parallelGateway("ReturnCompletionJoin")
//         .endEvent("ReturnCompleted");
// });

// Additional process metadata
export const returnsProcessMetadata = {
  id: "ReturnsProcess",
  name: "Returns Processing Workflow",
  version: "1.0.0",
  description: "Comprehensive return processing with inspection, approval, and refund",
  tasks: {
    ValidateReturnRequest: {
      type: "service",
      description: "Validate return request against policy and order history",
      timeout: 30000,
      category: "validation"
    },
    ProductInspection: {
      type: "user",
      description: "Inspect returned product condition and packaging",
      assignee: "inspector",
      priority: "normal",
      dueDate: "PT4H",
      category: "inspection"
    },
    CalculateRefund: {
      type: "service",
      description: "Calculate refund amount based on return policy and product condition",
      timeout: 15000,
      category: "refund"
    },
    RefundApproval: {
      type: "user",
      description: "Approve refund amount and processing",
      assignee: "finance_manager",
      priority: "high",
      dueDate: "PT8H",
      category: "approval"
    },
    ProcessRefund: {
      type: "service",
      description: "Process refund through original payment method",
      timeout: 90000,
      category: "refund"
    },
    RestockItems: {
      type: "service",
      description: "Restock returned items to inventory",
      timeout: 60000,
      category: "warehouse"
    },
    SendDenialNotification: {
      type: "service",
      description: "Send return denial notification to customer",
      timeout: 15000,
      category: "communication"
    },
    SendRefundConfirmation: {
      type: "service",
      description: "Send refund confirmation and processing details",
      timeout: 15000,
      category: "communication"
    },
    SendInspectionReport: {
      type: "service",
      description: "Send detailed inspection report to customer",
      timeout: 15000,
      category: "communication"
    }
  },
  categories: {
    validation: {
      name: "Validation",
      color: "#3B82F6",
      description: "Return request validation"
    },
    inspection: {
      name: "Inspection",
      color: "#F59E0B",
      description: "Product inspection and evaluation"
    },
    approval: {
      name: "Approval",
      color: "#10B981",
      description: "Refund approval processes"
    },
    refund: {
      name: "Refund",
      color: "#8B5CF6",
      description: "Refund processing and calculation"
    },
    warehouse: {
      name: "Warehouse",
      color: "#EF4444",
      description: "Inventory restocking operations"
    },
    communication: {
      name: "Communication",
      color: "#EC4899",
      description: "Customer notifications"
    }
  },
  metrics: {
    averageProcessingTime: "2-4 hours",
    slaCompliance: "95%",
    automationRate: "60%",
    customerSatisfaction: "4.2/5"
  }
};
