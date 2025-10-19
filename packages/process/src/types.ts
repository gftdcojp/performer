// Merkle DAG: process/types -> tasks/topology -> ui-safe-contracts
export const TASKS = [
	"ValidateOrder",
	"InventoryCheck",
	"CreditCheck",
	"RiskAssessment",
	"ComplianceReview",
	"ManagerApproval",
	"ExecutiveApproval",
	"AutoApprove",
	"PaymentProcessing",
	"WarehousePreparation",
	"QualityCheck",
	"ShippingArrangement",
	"FinalDocumentation",
	"SendConfirmationEmail",
	"SendRejectionEmail",
	"PaymentFailedNotification",
] as const;

export type TaskName = (typeof TASKS)[number];

export type Priority = "low" | "normal" | "high" | "critical";

export interface TaskInfo {
	category: string;
	assignee?: string;
	priority?: Priority;
}

export interface ProcessMetadata {
	id: string;
	name: string;
	categories: Record<
		string,
		{ name: string; color: string; description: string }
	>;
	tasks: Partial<Record<TaskName, TaskInfo>>;
}

export interface DashboardStats {
	totalProcesses: number;
	activeProcesses: number;
	completedToday: number;
	averageProcessingTime: string;
	slaCompliance: number;
	taskDistribution: Partial<Record<TaskName, number>>;
	categoryStats: Record<
		string,
		{ total: number; completed: number; avgTime: number }
	>;
}
