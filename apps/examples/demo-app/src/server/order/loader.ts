"use server";

// Merkle DAG: order_loader -> neo4j_query -> type_validation
// Server-side loader for order data with Neo4j integration

import { createActions } from "@gftdcojp/performer";

// Type definitions
interface LoaderParams {
	businessKey: string;
}

interface OrderData {
	id: string;
	businessKey: string;
	customerId: string;
	amount: number;
	status: "draft" | "submitted" | "approved" | "rejected" | "paid";
	items: Array<{
		productId: string;
		name: string;
		quantity: number;
		price: number;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

// Mock Auth0 config (replace with actual config)
const auth0Config = {
	domain: "your-domain.auth0.com",
	clientID: "your-client-id",
	audience: "your-audience",
};

const actions = createActions(auth0Config);

// Loader function
export const loader = actions.loader(async (context) => {
	// In a real implementation, this would extract businessKey from URL params
	// For now, return mock data
	const orderData: OrderData = {
		id: `order-${Date.now()}`,
		businessKey: "demo-123", // This would come from URL params in real implementation
		customerId: "customer-123",
		amount: 750,
		status: "submitted",
		items: [
			{
				productId: "prod-1",
				name: "Widget A",
				quantity: 2,
				price: 250,
			},
			{
				productId: "prod-2",
				name: "Widget B",
				quantity: 1,
				price: 250,
			},
		],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return orderData;
});
