// Merkle DAG: integrated_process_flow -> enterprise_bpmn -> event_driven_process_integration
// Integrated enterprise workflow that orchestrates multiple business processes

// Note: This file contains process metadata and definitions for server-side processing
// Client-side components use the metadata directly without importing server-side code

// Server-side process definition (not used in client)
// export const integratedProcess = flow("EnterpriseIntegrationProcess", (p) => {
//   p.startEvent("BusinessEvent")
//     .serviceTask("EventClassification")
//     .exclusiveGateway("ProcessRouting")
//       .when("order", { expr: "${vars.eventType == 'order'}" })
//         .serviceTask("StartOrderProcess")
//         .endEvent("OrderProcessStarted")
//       .when("return", { expr: "${vars.eventType == 'return'}" })
//         .serviceTask("StartReturnProcess")
//         .endEvent("ReturnProcessStarted")
//       .when("support", { expr: "${vars.eventType == 'support'}" })
//         .serviceTask("StartSupportProcess")
//         .endEvent("SupportProcessStarted")
//       .when("inventory", { expr: "${vars.eventType == 'inventory_alert'}" })
//         .serviceTask("StartInventoryProcess")
//         .endEvent("InventoryProcessStarted")
//       .otherwise()
//         .serviceTask("HandleUnknownEvent")
//         .endEvent("EventHandled");
//
//   // Sub-process coordination
//   p.startEvent("ProcessCompletion")
//     .serviceTask("UpdateBusinessMetrics")
//     .serviceTask("TriggerRelatedProcesses")
//     .exclusiveGateway("FollowUpRequired")
//       .when("followUp", { expr: "${vars.followUpRequired == true}" })
//         .userTask("FollowUpTask")
//         .moveTo("ProcessFinalization")
//       .otherwise()
//         .moveTo("ProcessFinalization")
//
//     .serviceTask("ProcessFinalization")
//     .serviceTask("SendNotifications")
//     .endEvent("IntegrationComplete");
// });

// Human in the Loop Process Definition
// export const humanInTheLoopProcess = flow("HumanInTheLoopProcess", (p) => {
//   p.startEvent("AutomatedTask")
//     .serviceTask("ExecuteAutomatedLogic")
//     .userTask("HumanReview")
//     .exclusiveGateway("ReviewDecision")
//       .when("approved", { expr: "${vars.humanDecision == 'approved'}" })
//         .serviceTask("ApplyApprovedChanges")
//         .endEvent("TaskCompleted")
//       .when("needsRevision", { expr: "${vars.humanDecision == 'needs_revision'}" })
//         .userTask("RevisionTask")
//         .serviceTask("ApplyRevisions")
//         .moveTo("HumanReview") // Loop back for re-review
//       .when("rejected", { expr: "${vars.humanDecision == 'rejected'}" })
//         .serviceTask("HandleRejection")
//         .endEvent("TaskRejected")
//       .otherwise()
//         .userTask("EscalationReview")
//         .moveTo("ReviewDecision"); // Loop for escalation
// });

// Additional process metadata
export const integratedProcessMetadata = {
	id: "EnterpriseIntegrationProcess",
	name: "Enterprise Process Integration",
	version: "1.0.0",
	description:
		"Event-driven orchestration of multiple business processes with human oversight",
	processes: {
		order: {
			id: "ComplexOrderProcess",
			name: "Order Processing",
			triggerEvents: ["order_created", "order_updated"],
			description: "Complete order lifecycle from placement to fulfillment",
		},
		returns: {
			id: "ReturnsProcess",
			name: "Returns Processing",
			triggerEvents: ["return_requested", "return_submitted"],
			description: "Return request processing with inspection and refund",
		},
		support: {
			id: "CustomerSupportProcess",
			name: "Customer Support",
			triggerEvents: ["support_ticket", "customer_inquiry"],
			description: "Multi-tier customer support with escalation",
		},
		inventory: {
			id: "InventoryManagementProcess",
			name: "Inventory Management",
			triggerEvents: ["low_stock_alert", "inventory_check"],
			description: "Automated inventory monitoring and replenishment",
		},
	},
	tasks: {
		EventClassification: {
			type: "service",
			description:
				"Classify incoming business events and route to appropriate processes",
			timeout: 10000,
			category: "routing",
		},
		StartOrderProcess: {
			type: "service",
			description: "Initialize order processing workflow",
			timeout: 5000,
			category: "orchestration",
		},
		StartReturnProcess: {
			type: "service",
			description: "Initialize returns processing workflow",
			timeout: 5000,
			category: "orchestration",
		},
		StartSupportProcess: {
			type: "service",
			description: "Initialize customer support workflow",
			timeout: 5000,
			category: "orchestration",
		},
		StartInventoryProcess: {
			type: "service",
			description: "Initialize inventory management workflow",
			timeout: 5000,
			category: "orchestration",
		},
		HandleUnknownEvent: {
			type: "service",
			description: "Handle unrecognized business events",
			timeout: 5000,
			category: "exception",
		},
		UpdateBusinessMetrics: {
			type: "service",
			description: "Update business metrics and KPIs after process completion",
			timeout: 30000,
			category: "analytics",
		},
		TriggerRelatedProcesses: {
			type: "service",
			description: "Trigger related processes based on completion outcomes",
			timeout: 15000,
			category: "orchestration",
		},
		FollowUpTask: {
			type: "user",
			description:
				"Perform follow-up tasks identified during process completion",
			assignee: "process_manager",
			priority: "normal",
			dueDate: "PT24H",
			category: "followup",
		},
		SendNotifications: {
			type: "service",
			description: "Send completion notifications to relevant stakeholders",
			timeout: 10000,
			category: "communication",
		},
	},
	humanInTheLoopTasks: {
		ExecuteAutomatedLogic: {
			type: "service",
			description: "Execute automated business logic and decision making",
			timeout: 60000,
			category: "automation",
		},
		HumanReview: {
			type: "user",
			description: "Human review and approval of automated decisions",
			assignee: "reviewer",
			priority: "normal",
			dueDate: "PT4H",
			category: "review",
			loopConditions: {
				maxIterations: 3,
				timeoutHours: 24,
				escalationAfter: 2,
			},
		},
		RevisionTask: {
			type: "user",
			description: "Perform revisions based on human feedback",
			assignee: "specialist",
			priority: "high",
			dueDate: "PT8H",
			category: "revision",
		},
		EscalationReview: {
			type: "user",
			description: "Escalated review for complex or contentious decisions",
			assignee: "senior_reviewer",
			priority: "critical",
			dueDate: "PT2H",
			category: "escalation",
		},
		ApplyApprovedChanges: {
			type: "service",
			description: "Apply changes approved by human review",
			timeout: 30000,
			category: "execution",
		},
		ApplyRevisions: {
			type: "service",
			description: "Apply revisions made based on human feedback",
			timeout: 30000,
			category: "execution",
		},
		HandleRejection: {
			type: "service",
			description: "Handle rejection outcomes and cleanup",
			timeout: 15000,
			category: "exception",
		},
	},
	categories: {
		routing: {
			name: "Routing",
			color: "#3B82F6",
			description: "Event classification and routing",
		},
		orchestration: {
			name: "Orchestration",
			color: "#F59E0B",
			description: "Process orchestration and coordination",
		},
		analytics: {
			name: "Analytics",
			color: "#10B981",
			description: "Business metrics and analytics",
		},
		followup: {
			name: "Follow-up",
			color: "#8B5CF6",
			description: "Follow-up tasks and actions",
		},
		communication: {
			name: "Communication",
			color: "#EF4444",
			description: "Stakeholder notifications",
		},
		exception: {
			name: "Exception",
			color: "#EC4899",
			description: "Exception handling and cleanup",
		},
		automation: {
			name: "Automation",
			color: "#84CC16",
			description: "Automated processing",
		},
		review: {
			name: "Review",
			color: "#6366F1",
			description: "Human review processes",
		},
		revision: {
			name: "Revision",
			color: "#F97316",
			description: "Revision and improvement tasks",
		},
		escalation: {
			name: "Escalation",
			color: "#06B6D4",
			description: "Escalation processes",
		},
		execution: {
			name: "Execution",
			color: "#8B5CF6",
			description: "Task execution and application",
		},
	},
	eventTypes: {
		order_created: {
			process: "order",
			priority: "normal",
			description: "New order placed",
		},
		order_updated: {
			process: "order",
			priority: "normal",
			description: "Order modification",
		},
		return_requested: {
			process: "returns",
			priority: "normal",
			description: "Return request submitted",
		},
		return_submitted: {
			process: "returns",
			priority: "normal",
			description: "Return items received",
		},
		support_ticket: {
			process: "support",
			priority: "normal",
			description: "Support ticket created",
		},
		customer_inquiry: {
			process: "support",
			priority: "low",
			description: "General customer inquiry",
		},
		low_stock_alert: {
			process: "inventory",
			priority: "high",
			description: "Inventory below reorder point",
		},
		inventory_check: {
			process: "inventory",
			priority: "low",
			description: "Scheduled inventory review",
		},
	},
	metrics: {
		totalProcesses: 4,
		activeIntegrations: 12,
		averageResponseTime: "15 minutes",
		automationRate: "85%",
		humanInterventionRate: "15%",
		processCompletionRate: "96%",
	},
};

// Export human in the loop metadata separately
export const humanInTheLoopMetadata = {
	id: "HumanInTheLoopProcess",
	name: "Human in the Loop Workflow",
	version: "1.0.0",
	description:
		"Automated processes with human oversight and iterative improvement",
	loopPatterns: {
		reviewApproval: {
			name: "Review & Approval Loop",
			description:
				"Automated processing followed by human review with revision capability",
			maxIterations: 3,
			escalationThreshold: 2,
			timeout: "24 hours",
		},
		qualityAssurance: {
			name: "Quality Assurance Loop",
			description: "Quality checks with human intervention for issues",
			maxIterations: 2,
			escalationThreshold: 1,
			timeout: "12 hours",
		},
		exceptionHandling: {
			name: "Exception Handling Loop",
			description: "Automated exception handling with human escalation",
			maxIterations: 5,
			escalationThreshold: 3,
			timeout: "48 hours",
		},
	},
};
