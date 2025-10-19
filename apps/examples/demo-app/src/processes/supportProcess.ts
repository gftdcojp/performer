// Merkle DAG: support_process_flow -> support_bpmn -> triage_escalation_resolution
// Customer support workflow with triage, escalation, and resolution

// Note: This file contains process metadata and definitions for server-side processing
// Client-side components use the metadata directly without importing server-side code

// Server-side process definition (not used in client)
// export const supportProcess = flow("CustomerSupportProcess", (p) => {
//   p.startEvent("SupportRequest")
//     .serviceTask("CategorizeRequest")
//     .exclusiveGateway("PriorityAssessment")
//       .when("urgent", { expr: "${vars.priority == 'urgent'}" })
//         .userTask("ImmediateResponse")
//         .moveTo("Investigation")
//       .when("high", { expr: "${vars.priority == 'high'}" })
//         .userTask("PriorityResponse")
//         .moveTo("Investigation")
//       .otherwise()
//         .serviceTask("QueueForProcessing")
//         .moveTo("Investigation")
//
//     .serviceTask("InitialInvestigation")
//     .exclusiveGateway("ResolutionCheck")
//       .when("resolved", { expr: "${vars.resolutionStatus == 'resolved'}" })
//         .serviceTask("SendResolution")
//         .endEvent("SupportClosed")
//       .otherwise()
//         .exclusiveGateway("EscalationCheck")
//           .when("needsEscalation", { expr: "${vars.escalationRequired == true}" })
//             .userTask("EscalationReview")
//             .exclusiveGateway("EscalationDecision")
//               .when("approved", { expr: "${vars.escalationApproved == true}" })
//                 .userTask("SpecialistHandling")
//                 .moveTo("ResolutionCheck")
//               .otherwise()
//                 .serviceTask("SendEscalationDenied")
//                 .endEvent("SupportClosed")
//           .otherwise()
//             .userTask("FurtherInvestigation")
//             .moveTo("ResolutionCheck");
// });

// Additional process metadata
export const supportProcessMetadata = {
	id: "CustomerSupportProcess",
	name: "Customer Support Workflow",
	version: "1.0.0",
	description:
		"Multi-tier customer support with triage, escalation, and resolution tracking",
	tasks: {
		CategorizeRequest: {
			type: "service",
			description:
				"Automatically categorize support request based on content analysis",
			timeout: 15000,
			category: "triage",
		},
		ImmediateResponse: {
			type: "user",
			description: "Provide immediate response for urgent support requests",
			assignee: "support_lead",
			priority: "critical",
			dueDate: "PT30M",
			category: "response",
		},
		PriorityResponse: {
			type: "user",
			description: "Handle high-priority support requests within SLA",
			assignee: "senior_support",
			priority: "high",
			dueDate: "PT2H",
			category: "response",
		},
		QueueForProcessing: {
			type: "service",
			description: "Queue standard support requests for processing",
			timeout: 5000,
			category: "triage",
		},
		InitialInvestigation: {
			type: "user",
			description: "Initial investigation of customer issue",
			assignee: "support_agent",
			priority: "normal",
			dueDate: "PT4H",
			category: "investigation",
		},
		FurtherInvestigation: {
			type: "user",
			description: "Additional investigation required for complex issues",
			assignee: "support_specialist",
			priority: "normal",
			dueDate: "PT8H",
			category: "investigation",
		},
		EscalationReview: {
			type: "user",
			description: "Review request for escalation to higher tier support",
			assignee: "support_manager",
			priority: "high",
			dueDate: "PT1H",
			category: "escalation",
		},
		SpecialistHandling: {
			type: "user",
			description: "Handle escalated support requests by specialists",
			assignee: "technical_specialist",
			priority: "high",
			dueDate: "PT12H",
			category: "resolution",
		},
		SendResolution: {
			type: "service",
			description: "Send final resolution and confirmation to customer",
			timeout: 15000,
			category: "communication",
		},
		SendEscalationDenied: {
			type: "service",
			description: "Inform customer that escalation was not approved",
			timeout: 15000,
			category: "communication",
		},
	},
	categories: {
		triage: {
			name: "Triage",
			color: "#3B82F6",
			description: "Request categorization and prioritization",
		},
		response: {
			name: "Response",
			color: "#F59E0B",
			description: "Initial customer responses",
		},
		investigation: {
			name: "Investigation",
			color: "#10B981",
			description: "Issue investigation and analysis",
		},
		escalation: {
			name: "Escalation",
			color: "#8B5CF6",
			description: "Escalation management",
		},
		resolution: {
			name: "Resolution",
			color: "#EF4444",
			description: "Issue resolution and closure",
		},
		communication: {
			name: "Communication",
			color: "#EC4899",
			description: "Customer communications",
		},
	},
	metrics: {
		averageResolutionTime: "4-8 hours",
		firstResponseTime: "30 minutes",
		customerSatisfaction: "4.1/5",
		escalationRate: "15%",
	},
};
