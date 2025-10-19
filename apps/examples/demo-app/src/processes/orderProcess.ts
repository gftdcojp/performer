// Merkle DAG: complex_process_flow -> order_bpmn -> multi_stage_approval_logistics
// Complex BPMN process definition with inventory, credit, approval, and logistics

// Note: This file contains process metadata and definitions for server-side processing
// Client-side components use the metadata directly without importing server-side code

// Server-side process definition (not used in client)
// export const orderProcess = flow("ComplexOrderProcess", (p) => {
//   p.startEvent("OrderReceived")
//     .serviceTask("ValidateOrder")
//     // ... complex process definition
// });

// Additional process metadata
export const processMetadata = {
	id: "ComplexOrderProcess",
	name: "Complex Order Processing Workflow",
	version: "2.0.0",
	description:
		"Advanced order processing with inventory, credit, multi-level approval, and logistics",
	tasks: {
		ValidateOrder: {
			type: "service",
			description:
				"Validate order data, customer info, and basic business rules",
			timeout: 30000,
			category: "validation",
		},
		InventoryCheck: {
			type: "service",
			description: "Check product availability in inventory",
			timeout: 45000,
			category: "validation",
		},
		CreditCheck: {
			type: "service",
			description: "Verify customer credit status and payment history",
			timeout: 60000,
			category: "validation",
		},
		RiskAssessment: {
			type: "service",
			description:
				"Calculate risk score based on order value, customer history, and market conditions",
			timeout: 15000,
			category: "validation",
		},
		ComplianceReview: {
			type: "user",
			description: "Compliance officer review for high-risk orders",
			assignee: "compliance_officer",
			priority: "critical",
			dueDate: "PT2H", // 2 hours SLA
			category: "approval",
		},
		ManagerApproval: {
			type: "user",
			description: "Manager approval for medium-value orders ($5K-$25K)",
			assignee: "manager",
			priority: "high",
			dueDate: "P1D", // 1 day SLA
			category: "approval",
		},
		ExecutiveApproval: {
			type: "user",
			description: "Executive approval for high-value orders (>$25K)",
			assignee: "executive",
			priority: "critical",
			dueDate: "P2D", // 2 days SLA
			category: "approval",
		},
		AutoApprove: {
			type: "service",
			description: "Automatic approval for low-risk, low-value orders",
			timeout: 5000,
			category: "approval",
		},
		PaymentProcessing: {
			type: "service",
			description: "Process payment through selected payment method",
			timeout: 120000, // 2 minutes
			category: "payment",
		},
		WarehousePreparation: {
			type: "service",
			description: "Prepare order items in warehouse for picking and packing",
			timeout: 180000, // 3 minutes
			category: "fulfillment",
		},
		QualityCheck: {
			type: "user",
			description: "Quality control inspection before shipping",
			assignee: "qc_specialist",
			priority: "high",
			dueDate: "PT4H", // 4 hours SLA
			category: "fulfillment",
		},
		ShippingArrangement: {
			type: "service",
			description: "Arrange shipping method and generate shipping labels",
			timeout: 90000, // 1.5 minutes
			category: "fulfillment",
		},
		FinalDocumentation: {
			type: "service",
			description: "Generate final order documents and certificates",
			timeout: 30000,
			category: "fulfillment",
		},
		SendConfirmationEmail: {
			type: "service",
			description:
				"Send order confirmation and tracking information to customer",
			timeout: 15000,
			category: "communication",
		},
		SendRejectionEmail: {
			type: "service",
			description: "Send order rejection notification with reason",
			timeout: 15000,
			category: "communication",
		},
		PaymentFailedNotification: {
			type: "service",
			description: "Notify customer of payment failure and next steps",
			timeout: 15000,
			category: "communication",
		},
	},
	categories: {
		validation: {
			name: "Validation",
			color: "#3B82F6",
			description: "Order validation and risk assessment",
		},
		approval: {
			name: "Approval",
			color: "#F59E0B",
			description: "Multi-level approval processes",
		},
		payment: {
			name: "Payment",
			color: "#10B981",
			description: "Payment processing and confirmation",
		},
		fulfillment: {
			name: "Fulfillment",
			color: "#8B5CF6",
			description: "Warehouse and shipping operations",
		},
		communication: {
			name: "Communication",
			color: "#EF4444",
			description: "Customer notifications and updates",
		},
	},
	metrics: {
		averageProcessingTime: "4-6 hours",
		slaCompliance: "98%",
		automationRate: "75%",
		customerSatisfaction: "4.8/5",
	},
};
