import type React from "react";
import { useEffect, useState } from "react";

// Merkle DAG: task_inbox -> process_tasks -> human_interaction_queue
// Task inbox for managing human-in-the-loop tasks
interface Task {
	id: string;
	name: string;
	description: string;
	processId: string;
	processName: string;
	assignee?: string;
	priority: "low" | "medium" | "high" | "critical";
	status: "pending" | "in_progress" | "completed" | "cancelled";
	createdAt: Date;
	dueDate?: Date;
	formSchema?: any;
}

const TaskInboxPage: React.FC = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [filter, setFilter] = useState<
		"all" | "pending" | "in_progress" | "completed"
	>("all");
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Sample tasks for demonstration
	const sampleTasks: Task[] = [
		{
			id: "task_1",
			name: "Approve Order Request",
			description:
				"Review and approve customer order request for high-value items",
			processId: "process_123",
			processName: "Order Approval Process",
			assignee: "john.doe",
			priority: "high",
			status: "pending",
			createdAt: new Date("2024-01-15T10:00:00Z"),
			dueDate: new Date("2024-01-16T17:00:00Z"),
			formSchema: {
				type: "default",
				components: [
					{ type: "text", id: "customerName", label: "Customer Name" },
					{ type: "number", id: "orderAmount", label: "Order Amount ($)" },
					{ type: "select", id: "priority", label: "Priority" },
					{ type: "textarea", id: "comments", label: "Comments" },
					{ type: "checkbox", id: "approved", label: "Approve" },
				],
			},
		},
		{
			id: "task_2",
			name: "Review Contract Terms",
			description: "Legal review of contract terms and conditions",
			processId: "process_456",
			processName: "Contract Review Process",
			assignee: "jane.smith",
			priority: "critical",
			status: "in_progress",
			createdAt: new Date("2024-01-14T14:30:00Z"),
			dueDate: new Date("2024-01-15T12:00:00Z"),
			formSchema: {
				type: "default",
				components: [
					{ type: "textarea", id: "contractText", label: "Contract Text" },
					{ type: "select", id: "riskLevel", label: "Risk Assessment" },
					{ type: "textarea", id: "reviewComments", label: "Review Comments" },
					{ type: "checkbox", id: "approved", label: "Legal Approval" },
				],
			},
		},
		{
			id: "task_3",
			name: "Quality Inspection",
			description: "Inspect product quality before shipment",
			processId: "process_789",
			processName: "Quality Control Process",
			priority: "medium",
			status: "pending",
			createdAt: new Date("2024-01-16T09:15:00Z"),
			formSchema: {
				type: "default",
				components: [
					{ type: "text", id: "productId", label: "Product ID" },
					{ type: "select", id: "qualityGrade", label: "Quality Grade" },
					{
						type: "textarea",
						id: "inspectionNotes",
						label: "Inspection Notes",
					},
					{ type: "checkbox", id: "passed", label: "Quality Check Passed" },
				],
			},
		},
	];

	useEffect(() => {
		// Simulate API call to fetch tasks
		const fetchTasks = async () => {
			setIsLoading(true);
			// In a real application, this would be an API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setTasks(sampleTasks);
			setIsLoading(false);
		};

		fetchTasks();
	}, []);

	const filteredTasks = tasks.filter((task) => {
		if (filter === "all") return true;
		return task.status === filter;
	});

	const handleTaskAction = (
		taskId: string,
		action: "start" | "complete" | "cancel",
	) => {
		setTasks((prevTasks) =>
			prevTasks.map((task) => {
				if (task.id === taskId) {
					switch (action) {
						case "start":
							return { ...task, status: "in_progress" as const };
						case "complete":
							return { ...task, status: "completed" as const };
						case "cancel":
							return { ...task, status: "cancelled" as const };
						default:
							return task;
					}
				}
				return task;
			}),
		);

		if (selectedTask?.id === taskId) {
			setSelectedTask(null);
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			case "low":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-gray-100 text-gray-800";
			case "in_progress":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600" />
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="bg-white shadow-lg rounded-lg overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
					<h1 className="text-2xl font-bold text-white">Task Inbox</h1>
					<p className="text-purple-100 mt-1">
						Manage your human-in-the-loop tasks
					</p>
				</div>

				{/* Filters */}
				<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
					<div className="flex items-center space-x-4">
						<span className="text-sm font-medium text-gray-700">Filter:</span>
						{(["all", "pending", "in_progress", "completed"] as const).map(
							(status) => (
								<button
									key={status}
									onClick={() => setFilter(status)}
									className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
										filter === status
											? "bg-purple-600 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
								>
									{status.replace("_", " ")}
								</button>
							),
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
					{/* Task List */}
					<div className="lg:col-span-1">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Tasks ({filteredTasks.length})
						</h3>
						<div className="space-y-3">
							{filteredTasks.map((task) => (
								<div
									key={task.id}
									onClick={() => setSelectedTask(task)}
									className={`p-4 border rounded-lg cursor-pointer transition-colors ${
										selectedTask?.id === task.id
											? "border-purple-500 bg-purple-50"
											: "border-gray-200 hover:border-gray-300"
									}`}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="font-medium text-gray-900">{task.name}</h4>
											<p className="text-sm text-gray-600 mt-1">
												{task.processName}
											</p>
											<div className="flex items-center space-x-2 mt-2">
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
												>
													{task.priority}
												</span>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
												>
													{task.status.replace("_", " ")}
												</span>
											</div>
											<p className="text-xs text-gray-500 mt-1">
												Created: {task.createdAt.toLocaleDateString()}
											</p>
											{task.dueDate && (
												<p className="text-xs text-red-600 mt-1">
													Due: {task.dueDate.toLocaleDateString()}
												</p>
											)}
										</div>
									</div>
								</div>
							))}
							{filteredTasks.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No tasks found for the selected filter.
								</div>
							)}
						</div>
					</div>

					{/* Task Details */}
					<div className="lg:col-span-2">
						{selectedTask ? (
							<div className="space-y-6">
								<div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										{selectedTask.name}
									</h3>
									<p className="text-gray-600 mb-4">
										{selectedTask.description}
									</p>

									<div className="grid grid-cols-2 gap-4 mb-4">
										<div>
											<span className="text-sm font-medium text-gray-500">
												Process:
											</span>
											<p className="text-sm text-gray-900">
												{selectedTask.processName}
											</p>
										</div>
										<div>
											<span className="text-sm font-medium text-gray-500">
												Assignee:
											</span>
											<p className="text-sm text-gray-900">
												{selectedTask.assignee || "Unassigned"}
											</p>
										</div>
										<div>
											<span className="text-sm font-medium text-gray-500">
												Priority:
											</span>
											<span
												className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${getPriorityColor(selectedTask.priority)}`}
											>
												{selectedTask.priority}
											</span>
										</div>
										<div>
											<span className="text-sm font-medium text-gray-500">
												Status:
											</span>
											<span
												className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(selectedTask.status)}`}
											>
												{selectedTask.status.replace("_", " ")}
											</span>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex space-x-3">
									{selectedTask.status === "pending" && (
										<button
											onClick={() => handleTaskAction(selectedTask.id, "start")}
											className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
										>
											Start Task
										</button>
									)}
									{selectedTask.status === "in_progress" && (
										<>
											<button
												onClick={() =>
													handleTaskAction(selectedTask.id, "complete")
												}
												className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
											>
												Complete Task
											</button>
											<button
												onClick={() =>
													handleTaskAction(selectedTask.id, "cancel")
												}
												className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
											>
												Cancel Task
											</button>
										</>
									)}
									<button
										onClick={() => {
											// Navigate to form page
											const navigate = (window as any).navigate;
											if (navigate) {
												navigate(
													`/human-in-the-loop/form?taskId=${selectedTask.id}`,
												);
											}
										}}
										className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
									>
										Open Form
									</button>
								</div>

								{/* Form Schema Preview */}
								{selectedTask.formSchema && (
									<div>
										<h4 className="text-md font-medium text-gray-900 mb-2">
											Form Schema
										</h4>
										<div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
											<pre className="text-xs text-gray-800 overflow-auto max-h-40">
												{JSON.stringify(selectedTask.formSchema, null, 2)}
											</pre>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center justify-center h-full text-gray-500">
								<div className="text-center">
									<svg
										className="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">
										No task selected
									</h3>
									<p className="mt-1 text-sm text-gray-500">
										Select a task from the list to view details.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TaskInboxPage;
