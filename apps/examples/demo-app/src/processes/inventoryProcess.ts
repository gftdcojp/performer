// Merkle DAG: inventory_process_flow -> inventory_bpmn -> monitoring_replenishment_optimization
// Inventory management workflow with monitoring, replenishment, and optimization

// Note: This file contains process metadata and definitions for server-side processing
// Client-side components use the metadata directly without importing server-side code

// Server-side process definition (not used in client)
// export const inventoryProcess = flow("InventoryManagementProcess", (p) => {
//   p.startEvent("InventoryCheck")
//     .serviceTask("StockLevelAnalysis")
//     .exclusiveGateway("ReorderRequired")
//       .when("lowStock", { expr: "${vars.stockLevel < vars.reorderPoint}" })
//         .serviceTask("SupplierEvaluation")
//         .userTask("PurchaseOrderApproval")
//         .exclusiveGateway("ApprovalResult")
//           .when("approved", { expr: "${vars.approvalStatus == 'approved'}" })
//             .serviceTask("GeneratePurchaseOrder")
//             .parallelGateway("OrderProcessingSplit")
//               .path("supplier")
//                 .serviceTask("SendPurchaseOrder")
//                 .serviceTask("MonitorDelivery")
//                 .moveTo("OrderProcessingJoin")
//               .path("warehouse")
//                 .serviceTask("PrepareReceivingArea")
//                 .moveTo("OrderProcessingJoin")
//
//             .parallelGateway("OrderProcessingJoin")
//             .serviceTask("ReceiveGoods")
//             .serviceTask("QualityInspection")
//             .serviceTask("UpdateInventory")
//             .endEvent("InventoryReplenished")
//           .otherwise()
//             .serviceTask("SendRejectionNotification")
//             .endEvent("OrderCancelled")
//       .otherwise()
//         .serviceTask("InventoryOptimization")
//         .endEvent("InventoryChecked");
// });

// Additional process metadata
export const inventoryProcessMetadata = {
	id: "InventoryManagementProcess",
	name: "Inventory Management Workflow",
	version: "1.0.0",
	description:
		"Automated inventory monitoring, replenishment, and optimization",
	tasks: {
		StockLevelAnalysis: {
			type: "service",
			description:
				"Analyze current stock levels against thresholds and demand patterns",
			timeout: 30000,
			category: "analysis",
		},
		SupplierEvaluation: {
			type: "service",
			description: "Evaluate supplier performance, pricing, and lead times",
			timeout: 45000,
			category: "procurement",
		},
		PurchaseOrderApproval: {
			type: "user",
			description:
				"Review and approve purchase orders for inventory replenishment",
			assignee: "procurement_manager",
			priority: "normal",
			dueDate: "PT24H",
			category: "approval",
		},
		GeneratePurchaseOrder: {
			type: "service",
			description: "Generate purchase order document with supplier details",
			timeout: 15000,
			category: "procurement",
		},
		SendPurchaseOrder: {
			type: "service",
			description: "Send purchase order to supplier via email/API",
			timeout: 10000,
			category: "communication",
		},
		MonitorDelivery: {
			type: "service",
			description: "Monitor supplier delivery status and ETAs",
			timeout: 86400000, // 24 hours monitoring
			category: "logistics",
		},
		PrepareReceivingArea: {
			type: "service",
			description: "Prepare warehouse receiving area for incoming goods",
			timeout: 1800000, // 30 minutes
			category: "warehouse",
		},
		ReceiveGoods: {
			type: "user",
			description: "Receive and inspect incoming goods from supplier",
			assignee: "warehouse_receiving",
			priority: "normal",
			dueDate: "PT4H",
			category: "receiving",
		},
		QualityInspection: {
			type: "user",
			description: "Inspect quality of received goods against specifications",
			assignee: "quality_inspector",
			priority: "high",
			dueDate: "PT2H",
			category: "quality",
		},
		UpdateInventory: {
			type: "service",
			description: "Update inventory system with received quantities",
			timeout: 30000,
			category: "system",
		},
		InventoryOptimization: {
			type: "service",
			description:
				"Analyze inventory patterns and suggest optimization strategies",
			timeout: 60000,
			category: "optimization",
		},
		SendRejectionNotification: {
			type: "service",
			description: "Notify relevant parties of purchase order rejection",
			timeout: 15000,
			category: "communication",
		},
	},
	categories: {
		analysis: {
			name: "Analysis",
			color: "#3B82F6",
			description: "Stock level analysis and monitoring",
		},
		procurement: {
			name: "Procurement",
			color: "#F59E0B",
			description: "Supplier evaluation and ordering",
		},
		approval: {
			name: "Approval",
			color: "#10B981",
			description: "Purchase order approvals",
		},
		logistics: {
			name: "Logistics",
			color: "#8B5CF6",
			description: "Delivery monitoring and coordination",
		},
		warehouse: {
			name: "Warehouse",
			color: "#EF4444",
			description: "Warehouse operations",
		},
		receiving: {
			name: "Receiving",
			color: "#EC4899",
			description: "Goods receiving process",
		},
		quality: {
			name: "Quality",
			color: "#84CC16",
			description: "Quality inspection and control",
		},
		system: {
			name: "System",
			color: "#6366F1",
			description: "System updates and integration",
		},
		optimization: {
			name: "Optimization",
			color: "#F97316",
			description: "Inventory optimization",
		},
		communication: {
			name: "Communication",
			color: "#06B6D4",
			description: "Internal and supplier communications",
		},
	},
	metrics: {
		averageReorderTime: "2-3 days",
		stockoutRate: "1.2%",
		inventoryTurnover: "8.5 times/year",
		supplierPerformance: "4.6/5",
	},
};
