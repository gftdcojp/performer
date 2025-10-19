// Merkle DAG: admin_integrated -> process_orchestration -> enterprise_workflow_management
// Integrated process orchestration and enterprise workflow management

"use client";

import React, { useState, useEffect } from "react";

interface IntegratedProcess {
	id: string;
	name: string;
	status: "active" | "inactive" | "error";
	instances: number;
	successRate: number;
	averageDuration: string;
	lastExecuted: Date;
	dependencies: string[];
}

interface BusinessEvent {
	id: string;
	type: string;
	source: string;
	timestamp: Date;
	payload: Record<string, any>;
	status: "processed" | "processing" | "failed";
	targetProcess?: string;
}

interface HumanInTheLoopCase {
	id: string;
	processId: string;
	taskName: string;
	status:
		| "pending_review"
		| "under_revision"
		| "approved"
		| "rejected"
		| "escalated";
	iterations: number;
	maxIterations: number;
	assignee: string;
	dueDate: Date;
	priority: "low" | "normal" | "high" | "critical";
	lastUpdated: Date;
}

export default function IntegratedProcessManagementPage() {
	const [processes, setProcesses] = useState<IntegratedProcess[]>([]);
	const [events, setEvents] = useState<BusinessEvent[]>([]);
	const [humanCases, setHumanCases] = useState<HumanInTheLoopCase[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedTab, setSelectedTab] = useState<
		"processes" | "events" | "human"
	>("processes");

	useEffect(() => {
		loadIntegratedData();
	}, []);

	const loadIntegratedData = async () => {
		try {
			// Mock data - in real implementation, this would call API
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const mockProcesses: IntegratedProcess[] = [
				{
					id: "ComplexOrderProcess",
					name: "Order Processing",
					status: "active",
					instances: 1247,
					successRate: 96.2,
					averageDuration: "4h 32m",
					lastExecuted: new Date(Date.now() - 30 * 60 * 1000),
					dependencies: [],
				},
				{
					id: "ReturnsProcess",
					name: "Returns Processing",
					status: "active",
					instances: 89,
					successRate: 94.8,
					averageDuration: "2h 15m",
					lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
					dependencies: ["ComplexOrderProcess"],
				},
				{
					id: "CustomerSupportProcess",
					name: "Customer Support",
					status: "active",
					instances: 234,
					successRate: 91.5,
					averageDuration: "4h 8m",
					lastExecuted: new Date(Date.now() - 15 * 60 * 1000),
					dependencies: [],
				},
				{
					id: "InventoryManagementProcess",
					name: "Inventory Management",
					status: "active",
					instances: 45,
					successRate: 98.7,
					averageDuration: "1h 45m",
					lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000),
					dependencies: ["ComplexOrderProcess"],
				},
			];

			const mockEvents: BusinessEvent[] = [
				{
					id: "evt-001",
					type: "order_created",
					source: "ecommerce_platform",
					timestamp: new Date(Date.now() - 5 * 60 * 1000),
					payload: { orderId: "ORD-2024-001", amount: 1250 },
					status: "processed",
					targetProcess: "ComplexOrderProcess",
				},
				{
					id: "evt-002",
					type: "support_ticket",
					source: "customer_portal",
					timestamp: new Date(Date.now() - 12 * 60 * 1000),
					payload: { ticketId: "SUP-001", priority: "high" },
					status: "processing",
					targetProcess: "CustomerSupportProcess",
				},
				{
					id: "evt-003",
					type: "low_stock_alert",
					source: "inventory_system",
					timestamp: new Date(Date.now() - 25 * 60 * 1000),
					payload: { productId: "PROD-001", currentStock: 5 },
					status: "processed",
					targetProcess: "InventoryManagementProcess",
				},
			];

			const mockHumanCases: HumanInTheLoopCase[] = [
				{
					id: "hitl-001",
					processId: "ComplexOrderProcess",
					taskName: "ManagerApproval",
					status: "pending_review",
					iterations: 1,
					maxIterations: 3,
					assignee: "manager",
					dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
					priority: "high",
					lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
				},
				{
					id: "hitl-002",
					processId: "ReturnsProcess",
					taskName: "ProductInspection",
					status: "under_revision",
					iterations: 2,
					maxIterations: 3,
					assignee: "inspector",
					dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
					priority: "normal",
					lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
				},
				{
					id: "hitl-003",
					processId: "CustomerSupportProcess",
					taskName: "EscalationReview",
					status: "escalated",
					iterations: 3,
					maxIterations: 3,
					assignee: "support_manager",
					dueDate: new Date(Date.now() + 30 * 60 * 1000),
					priority: "critical",
					lastUpdated: new Date(Date.now() - 45 * 60 * 1000),
				},
			];

			setProcesses(mockProcesses);
			setEvents(mockEvents);
			setHumanCases(mockHumanCases);
		} catch (error) {
			console.error("Failed to load integrated data:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "inactive":
				return "bg-gray-100 text-gray-800";
			case "error":
				return "bg-red-100 text-red-800";
			case "processed":
				return "bg-blue-100 text-blue-800";
			case "processing":
				return "bg-yellow-100 text-yellow-800";
			case "failed":
				return "bg-red-100 text-red-800";
			case "pending_review":
				return "bg-yellow-100 text-yellow-800";
			case "under_revision":
				return "bg-orange-100 text-orange-800";
			case "approved":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			case "escalated":
				return "bg-purple-100 text-purple-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
					<p className="mt-4 text-gray-600">
						Loading integrated process data...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto py-8 px-4">
				{/* Header */}
				<div className="mb-8">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Process Integration Hub
							</h1>
							<p className="text-gray-600 mt-1">
								Orchestrate and monitor integrated enterprise workflows
							</p>
						</div>
						<button
							onClick={() => {
								const navigate = (window as any).navigate;
								if (navigate) navigate("/admin/dashboard");
							}}
							className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
						>
							← Back to Dashboard
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className="bg-white rounded-lg shadow mb-6">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8 px-6">
							{[
								{ id: "processes", label: "Process Orchestration", icon: "🔗" },
								{ id: "events", label: "Business Events", icon: "📡" },
								{ id: "human", label: "Human in the Loop", icon: "👤" },
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setSelectedTab(tab.id as any)}
									className={`py-4 px-1 border-b-2 font-medium text-sm ${
										selectedTab === tab.id
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									}`}
								>
									<span className="mr-2">{tab.icon}</span>
									{tab.label}
								</button>
							))}
						</nav>
					</div>
				</div>

				{/* Process Orchestration Tab */}
				{selectedTab === "processes" && (
					<div className="space-y-6">
						{/* Process Flow Visualization */}
						<div className="bg-white rounded-lg shadow p-6">
							<h2 className="text-xl font-semibold mb-4">
								Enterprise Process Flow
							</h2>
							<div className="bg-gray-50 rounded-lg p-6">
								<div className="text-center text-gray-600 mb-4">
									<div className="flex justify-center items-center space-x-8 mb-8">
										<div className="text-center">
											<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
												📋
											</div>
											<p className="font-medium">Order</p>
											<p className="text-sm">Created</p>
										</div>
										<div className="text-4xl text-gray-400">→</div>
										<div className="text-center">
											<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
												🔄
											</div>
											<p className="font-medium">Router</p>
											<p className="text-sm">Event-driven</p>
										</div>
										<div className="text-4xl text-gray-400">→</div>
										<div className="text-center">
											<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
												🎯
											</div>
											<p className="font-medium">Target</p>
											<p className="text-sm">Process</p>
										</div>
									</div>
									<p className="text-sm">
										Business events automatically trigger appropriate processes
									</p>
								</div>
							</div>
						</div>

						{/* Process Status Table */}
						<div className="bg-white rounded-lg shadow overflow-hidden">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-lg font-semibold">Integrated Processes</h2>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Process
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Instances
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Success Rate
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Avg Duration
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Dependencies
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{processes.map((process) => (
											<tr key={process.id}>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-medium text-gray-900">
														{process.name}
													</div>
													<div className="text-sm text-gray-500">
														{process.id}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(process.status)}`}
													>
														{process.status.toUpperCase()}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{process.instances.toLocaleString()}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{process.successRate}%
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{process.averageDuration}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{process.dependencies.length > 0
														? process.dependencies.join(", ")
														: "None"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div className="flex space-x-2">
														<button className="text-blue-600 hover:text-blue-900">
															View
														</button>
														<button className="text-yellow-600 hover:text-yellow-900">
															{process.status === "active" ? "Pause" : "Resume"}
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{/* Business Events Tab */}
				{selectedTab === "events" && (
					<div className="space-y-6">
						<div className="bg-white rounded-lg shadow p-6">
							<h2 className="text-xl font-semibold mb-4">
								Business Event Stream
							</h2>
							<div className="space-y-4">
								{events.map((event) => (
									<div
										key={event.id}
										className="border border-gray-200 rounded-lg p-4"
									>
										<div className="flex justify-between items-start mb-2">
											<div className="flex items-center space-x-3">
												<span className="text-lg">
													{event.type.includes("order")
														? "📦"
														: event.type.includes("support")
															? "🎧"
															: event.type.includes("inventory")
																? "📊"
																: "📡"}
												</span>
												<div>
													<p className="font-medium text-gray-900">
														{event.type.replace("_", " ").toUpperCase()}
													</p>
													<p className="text-sm text-gray-600">
														Source: {event.source}
													</p>
												</div>
											</div>
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}
											>
												{event.status.toUpperCase()}
											</span>
										</div>
										<div className="text-sm text-gray-600">
											<p>Target Process: {event.targetProcess || "N/A"}</p>
											<p>Timestamp: {event.timestamp.toLocaleString()}</p>
											<div className="mt-2">
												<p className="font-medium">Payload:</p>
												<pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
													{JSON.stringify(event.payload, null, 2)}
												</pre>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Human in the Loop Tab */}
				{selectedTab === "human" && (
					<div className="space-y-6">
						<div className="bg-white rounded-lg shadow p-6">
							<h2 className="text-xl font-semibold mb-4">
								Human in the Loop Cases
							</h2>
							<div className="mb-4 p-4 bg-blue-50 rounded-lg">
								<h3 className="font-medium text-blue-900 mb-2">
									Human Intervention Patterns
								</h3>
								<ul className="text-sm text-blue-800 space-y-1">
									<li>
										• <strong>Review & Approval Loop:</strong> Automated
										processing → Human review → Revisions (max 3 iterations)
									</li>
									<li>
										• <strong>Quality Assurance Loop:</strong> Quality checks →
										Human inspection → Corrections (max 2 iterations)
									</li>
									<li>
										• <strong>Exception Handling Loop:</strong> Error detection
										→ Human analysis → Resolution (max 5 iterations)
									</li>
								</ul>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Case
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Iterations
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Assignee
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Priority
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Due Date
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{humanCases.map((case_) => (
											<tr key={case_.id}>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-medium text-gray-900">
														{case_.taskName}
													</div>
													<div className="text-sm text-gray-500">
														{case_.processId}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(case_.status)}`}
													>
														{case_.status.replace("_", " ").toUpperCase()}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{case_.iterations}/{case_.maxIterations}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{case_.assignee}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
															case_.priority === "critical"
																? "bg-red-100 text-red-800"
																: case_.priority === "high"
																	? "bg-orange-100 text-orange-800"
																	: case_.priority === "normal"
																		? "bg-blue-100 text-blue-800"
																		: "bg-gray-100 text-gray-800"
														}`}
													>
														{case_.priority.toUpperCase()}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{case_.dueDate.toLocaleDateString()}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div className="flex space-x-2">
														<button className="text-blue-600 hover:text-blue-900">
															Review
														</button>
														{case_.status === "pending_review" && (
															<>
																<button className="text-green-600 hover:text-green-900">
																	Approve
																</button>
																<button className="text-yellow-600 hover:text-yellow-900">
																	Request Changes
																</button>
															</>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
