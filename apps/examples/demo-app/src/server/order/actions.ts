"use server";

// Merkle DAG: order_actions -> process_engine -> neo4j_transaction
// Server-side actions for order processing with BPMN integration

import { createActions } from "@pkg/actions";
import { processEngine } from "@pkg/process";

// Type definitions
interface StartOrderInput {
	businessKey: string;
	customerId: string;
	amount: number;
	items: Array<{
		productId: string;
		name: string;
		quantity: number;
		price: number;
	}>;
}

interface ApproveOrderInput {
	businessKey: string;
	approved: boolean;
	comments?: string;
}

interface ProcessPaymentInput {
	businessKey: string;
	paymentMethod: "credit_card" | "bank_transfer" | "paypal";
	paymentDetails: Record<string, any>;
}

interface ActionResponse {
	success: boolean;
	message: string;
	data?: any;
}

// Mock Auth0 config (replace with actual config)
const auth0Config = {
	domain: "your-domain.auth0.com",
	clientID: "your-client-id",
	audience: "your-audience",
};

const actions = createActions(auth0Config);

// Start order process action
export const startOrder = actions.action(
	async (input: StartOrderInput, context): Promise<ActionResponse> => {
		const { businessKey, customerId, amount, items } = input;

		try {
			// Start BPMN process
			const instance = await processEngine.startProcess(
				"order-processing",
				businessKey,
				{ customerId, amount, items },
			);

			return {
				success: true,
				message: "Order process started successfully",
				data: { instanceId: instance.id },
			};
		} catch (error) {
			throw new Error(
				`Failed to start order process: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
);

// Approve order action
export const approveOrder = actions.action(
	async (input: ApproveOrderInput, context): Promise<ActionResponse> => {
		const { businessKey, approved, comments } = input;

		try {
			// In real implementation, find instance by businessKey
			// For now, signal with approval result
			const instances = Object.values(processEngine).filter(
				(inst: any) =>
					inst &&
					typeof inst === "object" &&
					"businessKey" in inst &&
					inst.businessKey === businessKey,
			);

			if (instances.length === 0) {
				throw new Error("Order process instance not found");
			}

			const instance = instances[0] as any;
			await processEngine.completeTask(instance.id, "manager-approval", {
				approved,
				comments: comments || "",
				approvedBy: context.user.id,
				approvedAt: new Date(),
			});

			return {
				success: true,
				message: approved ? "Order approved successfully" : "Order rejected",
				data: { approved, comments },
			};
		} catch (error) {
			throw new Error(
				`Failed to process approval: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
);

// Process payment action
export const processPayment = actions.action(
	async (input: ProcessPaymentInput, context): Promise<ActionResponse> => {
		const { businessKey, paymentMethod, paymentDetails } = input;

		try {
			// In real implementation, find instance by businessKey
			const instances = Object.values(processEngine).filter(
				(inst: any) =>
					inst &&
					typeof inst === "object" &&
					"businessKey" in inst &&
					inst.businessKey === businessKey,
			);

			if (instances.length === 0) {
				throw new Error("Order process instance not found");
			}

			const instance = instances[0] as any;

			// Simulate payment processing
			const transactionId = `txn-${Date.now()}`;

			await processEngine.completeTask(instance.id, "payment-processing", {
				transactionId,
				paymentMethod,
				paymentDetails,
				processedBy: context.user.id,
				processedAt: new Date(),
				amount: instance.variables.amount,
			});

			return {
				success: true,
				message: "Payment processed successfully",
				data: {
					transactionId,
					paymentMethod,
					amount: instance.variables.amount,
				},
			};
		} catch (error) {
			throw new Error(
				`Payment processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
);

// Get process status loader
export const getProcessStatus = actions.loader(async (context) => {
	// In real implementation, find instance by businessKey and return status
	// For now, return mock status
	return {
		success: true,
		status: "running",
		tasks: [
			{
				id: "task-1",
				name: "Validate Order",
				type: "service",
				status: "completed",
			},
			{
				id: "task-2",
				name: "Manager Approval",
				type: "user",
				status: "running",
				assignee: "manager",
			},
		],
	};
});
