// Merkle DAG: admin_processes -> process_instances -> filtering_search
// Process instances management page

"use client";

import React, { useState, useEffect } from "react";

interface ProcessInstance {
	id: string;
	businessKey: string;
	processId: string;
	status: "running" | "completed" | "suspended" | "terminated" | "cancelled";
	startTime: Date;
	endTime?: Date;
	duration?: string;
	currentTask?: string;
	assignee?: string;
	priority: "low" | "normal" | "high" | "critical";
	variables: Record<string, any>;
}

interface FilterOptions {
	status: string;
	processId: string;
	assignee: string;
	priority: string;
	dateRange: string;
}

export default function ProcessInstancesPage() {
	const [processes, setProcesses] = useState<ProcessInstance[]>([]);
	const [filteredProcesses, setFilteredProcesses] = useState<ProcessInstance[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState<FilterOptions>({
		status: "",
		processId: "",
		assignee: "",
		priority: "",
		dateRange: "7", // days
	});
	const [selectedProcess, setSelectedProcess] =
		useState<ProcessInstance | null>(null);

	useEffect(() => {
		loadProcessInstances();
	}, []);

	useEffect(() => {
		applyFilters();
	}, [processes, filters]);

	const loadProcessInstances = async () => {
		try {
			// Mock data - in real implementation, this would call API
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const mockProcesses: ProcessInstance[] = [
				{
					id: "proc-001",
					businessKey: "ORD-2024-001",
					processId: "ComplexOrderProcess",
					status: "running",
					startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
					currentTask: "ManagerApproval",
					assignee: "manager",
					priority: "high",
					variables: { amount: 8500, customerId: "CUST-001" },
				},
				{
					id: "proc-002",
					businessKey: "ORD-2024-002",
					processId: "ComplexOrderProcess",
					status: "running",
					startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
					currentTask: "QualityCheck",
					assignee: "qc_specialist",
					priority: "high",
					variables: { amount: 12500, customerId: "CUST-002" },
				},
				{
					id: "proc-003",
					businessKey: "ORD-2024-003",
					processId: "ComplexOrderProcess",
					status: "completed",
					startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
					endTime: new Date(Date.now() - 30 * 60 * 1000),
					duration: "3h 30m",
					priority: "normal",
					variables: { amount: 2500, customerId: "CUST-003" },
				},
				{
					id: "proc-004",
					businessKey: "ORD-2024-004",
					processId: "ComplexOrderProcess",
					status: "running",
					startTime: new Date(Date.now() - 30 * 60 * 1000),
					currentTask: "PaymentProcessing",
					priority: "normal",
					variables: { amount: 750, customerId: "CUST-004" },
				},
				{
					id: "proc-005",
					businessKey: "ORD-2024-005",
					processId: "ComplexOrderProcess",
					status: "suspended",
					startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
					currentTask: "ComplianceReview",
					assignee: "compliance_officer",
					priority: "critical",
					variables: { amount: 45000, customerId: "CUST-005" },
				},
				{
					id: "proc-006",
					businessKey: "ORD-2024-006",
					processId: "ComplexOrderProcess",
					status: "terminated",
					startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
					endTime: new Date(Date.now() - 7 * 60 * 60 * 1000),
					duration: "1h 0m",
					priority: "high",
					variables: { amount: 30000, customerId: "CUST-006" },
				},
			];

			setProcesses(mockProcesses);
		} catch (error) {
			console.error("Failed to load process instances:", error);
		} finally {
			setLoading(false);
		}
	};

	const applyFilters = () => {
		let filtered = processes;

		if (filters.status) {
			filtered = filtered.filter((p) => p.status === filters.status);
		}

		if (filters.processId) {
			filtered = filtered.filter((p) =>
				p.processId.includes(filters.processId),
			);
		}

		if (filters.assignee) {
			filtered = filtered.filter((p) => p.assignee === filters.assignee);
		}

		if (filters.priority) {
			filtered = filtered.filter((p) => p.priority === filters.priority);
		}

		// Date range filter (simplified)
		if (filters.dateRange) {
			const days = Number.parseInt(filters.dateRange);
			const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			filtered = filtered.filter((p) => p.startTime >= cutoff);
		}

		setFilteredProcesses(filtered);
	};

	const handleFilterChange = (key: keyof FilterOptions, value: string) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "running":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "suspended":
				return "bg-yellow-100 text-yellow-800";
			case "terminated":
				return "bg-red-100 text-red-800";
			case "cancelled":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "normal":
				return "bg-blue-100 text-blue-800";
			case "low":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
					<p className="mt-4 text-gray-600">Loading process instances...</p>
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
								Process Instances
							</h1>
							<p className="text-gray-600 mt-1">
								Monitor and manage running process instances
							</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<div className="bg-white rounded-lg shadow p-6 mb-6">
					<h2 className="text-lg font-semibold mb-4">Admin Navigation</h2>
					<div className="flex flex-wrap gap-4">
						<button
							onClick={() => {
								const navigate = (window as any).navigate;
								if (navigate) navigate("/admin/dashboard");
							}}
							className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
						>
							📊 Dashboard
						</button>
						<button
							onClick={() => {
								const navigate = (window as any).navigate;
								if (navigate) navigate("/admin/processes");
							}}
							className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
						>
							🔄 Process Instances
						</button>
						<button
							onClick={() => {
								const navigate = (window as any).navigate;
								if (navigate) navigate("/admin/tasks");
							}}
							className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
						>
							✅ Task Management
						</button>
						<button
							onClick={() => {
								const navigate = (window as any).navigate;
								if (navigate) navigate("/");
							}}
							className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
						>
							← Back to Home
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-lg shadow p-6 mb-6">
					<h2 className="text-lg font-semibold mb-4">Filters</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<select
								value={filters.status}
								onChange={(e) => handleFilterChange("status", e.target.value)}
								className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">All Status</option>
								<option value="running">Running</option>
								<option value="completed">Completed</option>
								<option value="suspended">Suspended</option>
								<option value="terminated">Terminated</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Process ID
							</label>
							<input
								type="text"
								value={filters.processId}
								onChange={(e) =>
									handleFilterChange("processId", e.target.value)
								}
								placeholder="Search process ID..."
								className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Assignee
							</label>
							<select
								value={filters.assignee}
								onChange={(e) => handleFilterChange("assignee", e.target.value)}
								className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">All Assignees</option>
								<option value="manager">Manager</option>
								<option value="compliance_officer">Compliance Officer</option>
								<option value="qc_specialist">QC Specialist</option>
								<option value="executive">Executive</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Priority
							</label>
							<select
								value={filters.priority}
								onChange={(e) => handleFilterChange("priority", e.target.value)}
								className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">All Priorities</option>
								<option value="low">Low</option>
								<option value="normal">Normal</option>
								<option value="high">High</option>
								<option value="critical">Critical</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Date Range
							</label>
							<select
								value={filters.dateRange}
								onChange={(e) =>
									handleFilterChange("dateRange", e.target.value)
								}
								className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="1">Last 24 hours</option>
								<option value="7">Last 7 days</option>
								<option value="30">Last 30 days</option>
								<option value="90">Last 90 days</option>
							</select>
						</div>
					</div>
				</div>

				{/* Process Instances Table */}
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold">
							Process Instances ({filteredProcesses.length})
						</h2>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Business Key
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Current Task
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Assignee
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Priority
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Started
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Duration
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredProcesses.map((process) => (
									<tr key={process.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{process.businessKey}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(process.status)}`}
											>
												{process.status.toUpperCase()}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{process.currentTask || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{process.assignee || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(process.priority)}`}
											>
												{process.priority.toUpperCase()}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{process.startTime.toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{process.duration || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex space-x-2">
												<button
													onClick={() => setSelectedProcess(process)}
													className="text-blue-600 hover:text-blue-900"
												>
													View
												</button>
												{process.status === "running" && (
													<>
														<button className="text-yellow-600 hover:text-yellow-900">
															Suspend
														</button>
														<button className="text-red-600 hover:text-red-900">
															Terminate
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

				{/* Process Detail Modal */}
				{selectedProcess && (
					<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
						<div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-semibold">
									Process Details: {selectedProcess.businessKey}
								</h3>
								<button
									onClick={() => setSelectedProcess(null)}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div>
									<h4 className="font-medium mb-2">Process Information</h4>
									<div className="space-y-2 text-sm">
										<p>
											<span className="font-medium">ID:</span>{" "}
											{selectedProcess.id}
										</p>
										<p>
											<span className="font-medium">Process ID:</span>{" "}
											{selectedProcess.processId}
										</p>
										<p>
											<span className="font-medium">Status:</span>{" "}
											<span
												className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedProcess.status)}`}
											>
												{selectedProcess.status}
											</span>
										</p>
										<p>
											<span className="font-medium">Priority:</span>{" "}
											<span
												className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedProcess.priority)}`}
											>
												{selectedProcess.priority}
											</span>
										</p>
										<p>
											<span className="font-medium">Started:</span>{" "}
											{selectedProcess.startTime.toLocaleString()}
										</p>
										{selectedProcess.endTime && (
											<p>
												<span className="font-medium">Ended:</span>{" "}
												{selectedProcess.endTime.toLocaleString()}
											</p>
										)}
									</div>
								</div>

								<div>
									<h4 className="font-medium mb-2">Current State</h4>
									<div className="space-y-2 text-sm">
										<p>
											<span className="font-medium">Current Task:</span>{" "}
											{selectedProcess.currentTask || "None"}
										</p>
										<p>
											<span className="font-medium">Assignee:</span>{" "}
											{selectedProcess.assignee || "Unassigned"}
										</p>
										<p>
											<span className="font-medium">Duration:</span>{" "}
											{selectedProcess.duration || "N/A"}
										</p>
									</div>

									<h4 className="font-medium mb-2 mt-4">Variables</h4>
									<div className="bg-gray-50 p-3 rounded text-sm">
										<pre className="whitespace-pre-wrap">
											{JSON.stringify(selectedProcess.variables, null, 2)}
										</pre>
									</div>
								</div>
							</div>

							<div className="flex justify-end space-x-2 mt-6">
								<button
									onClick={() => setSelectedProcess(null)}
									className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
								>
									Close
								</button>
								{selectedProcess.status === "running" && (
									<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
										View BPMN Diagram
									</button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
