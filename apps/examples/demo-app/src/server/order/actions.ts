"use server";

// Merkle DAG: order_actions -> process_engine -> neo4j_transaction
// Server-side actions for order processing with BPMN integration

import {
  createActions,
  createNeo4jConnection,
  createTransactionManager,
  createProcessInstanceRepository,
  ProcessBuilder
} from "@gftdcojp/performer";

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

// Database setup
const neo4jConfig = {
	uri: process.env.NEO4J_URI || "bolt://localhost:7687",
	username: process.env.NEO4J_USER || "neo4j",
	password: process.env.NEO4J_PASSWORD || "password",
};

const connection = createNeo4jConnection(neo4jConfig);
const txManager = createTransactionManager(connection);
const processRepo = createProcessInstanceRepository(connection, txManager);

const actions = createActions(auth0Config);

// BPMN Process definition
const orderProcess = new ProcessBuilder("OrderProcess", "Order Processing Workflow")
	.startEvent("OrderReceived")
	.userTask("ValidateOrder", "Validate Order Details")
	.exclusiveGateway("ApprovalCheck")
		.condition("amount <= 1000", "AutoApprove")
		.otherwise("ManagerApproval")
	.serviceTask("ProcessPayment")
	.endEvent("Completed")
	.build();

// Start order process action
export const startOrder = actions.action(
	async (input: StartOrderInput, context): Promise<ActionResponse> => {
		const { businessKey, customerId, amount, items } = input;

		try {
			// Create process instance in database
			const instance = await processRepo.create({
				processId: "OrderProcess",
				businessKey,
				status: "running",
				variables: { customerId, amount, items },
				startTime: new Date(),
			});

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
			// Find process instance by businessKey
			const instance = await processRepo.findByBusinessKey(businessKey);
			if (!instance) {
				throw new Error("Order process instance not found");
			}

			// Update process variables with approval result
			const updatedVariables = {
				...instance.variables,
				approved,
				comments: comments || "",
				approvedBy: context.user.id,
				approvedAt: new Date(),
			};

			// Update instance status based on approval
			const newStatus = approved ? "running" : "terminated";
			await processRepo.update(instance.id, {
				variables: updatedVariables,
				status: newStatus,
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
			// Find process instance by businessKey
			const instance = await processRepo.findByBusinessKey(businessKey);
			if (!instance) {
				throw new Error("Order process instance not found");
			}

			// Simulate payment processing
			const transactionId = `txn-${Date.now()}`;

			// Update process variables with payment result
			const updatedVariables = {
				...instance.variables,
				transactionId,
				paymentMethod,
				paymentDetails,
				processedBy: context.user.id,
				processedAt: new Date(),
			};

			// Complete the process instance
			await processRepo.update(instance.id, {
				variables: updatedVariables,
				status: "completed",
				endTime: new Date(),
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
	try {
		// Get all process instances (in real app, filter by user/tenant)
		// This is a simplified example - in production you'd want proper querying
		const instances = await processRepo.findById("dummy"); // This will fail, but shows the pattern

		return {
			success: true,
			status: "running",
			instances: [], // Return actual instances in real implementation
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
	} catch (error) {
		// Return mock status if database is not available
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
	}
});
