import { Form } from "@bpmn-io/form-js-viewer";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import "@bpmn-io/form-js/dist/assets/form-js.css";

// Merkle DAG: human_in_the_loop_form_viewer -> form_schema -> user_input_validation
// Human-in-the-loop form integration using Camunda FormJS
interface HumanInTheLoopPageProps {
	processId?: string;
	taskId?: string;
}

const HumanInTheLoopPage: React.FC<HumanInTheLoopPageProps> = ({
	processId,
	taskId,
}) => {
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [formSchema, setFormSchema] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const formRef = useRef<HTMLDivElement>(null);
	const formInstanceRef = useRef<Form | null>(null);

	// Sample BPMN form schema for demonstration
	const sampleFormSchema = {
		type: "default",
		components: [
			{
				type: "text",
				id: "customerName",
				label: "Customer Name",
				validate: {
					required: true,
				},
			},
			{
				type: "number",
				id: "orderAmount",
				label: "Order Amount ($)",
				validate: {
					required: true,
					min: 0,
				},
			},
			{
				type: "select",
				id: "priority",
				label: "Priority Level",
				values: [
					{ label: "Low", value: "low" },
					{ label: "Medium", value: "medium" },
					{ label: "High", value: "high" },
					{ label: "Critical", value: "critical" },
				],
				validate: {
					required: true,
				},
			},
			{
				type: "textarea",
				id: "comments",
				label: "Additional Comments",
			},
			{
				type: "checkbox",
				id: "approved",
				label: "Approve this request",
			},
		],
	};

	useEffect(() => {
		const initializeForm = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// In a real application, you would fetch the form schema from your BPMN process
				// For now, we'll use the sample schema
				setFormSchema(sampleFormSchema);

				// Initialize FormJS
				if (formRef.current && !formInstanceRef.current) {
					const form = new Form({
						container: formRef.current,
					});

					// Import the schema
					await form.importSchema(sampleFormSchema);
					formInstanceRef.current = form;

					// Set up change listener
					form.on("changed", (event: any) => {
						setFormData(event.data);
					});
				}
			} catch (err) {
				console.error("Error initializing form:", err);
				setError("Failed to initialize form");
			} finally {
				setIsLoading(false);
			}
		};

		initializeForm();

		return () => {
			// Cleanup form instance
			if (formInstanceRef.current) {
				formInstanceRef.current.destroy();
				formInstanceRef.current = null;
			}
		};
	}, [processId, taskId]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!formInstanceRef.current) {
			setError("Form not initialized");
			return;
		}

		try {
			// Validate the form
			const { isValid, data, errors } =
				await formInstanceRef.current.validate();

			if (!isValid) {
				console.error("Form validation failed:", errors);
				setError("Please correct the form errors");
				return;
			}

			console.log("Form submitted:", data);

			// In a real application, you would submit this data to your BPMN engine
			// For demonstration, we'll just log it
			alert(
				`Form submitted successfully!\n\nData: ${JSON.stringify(data, null, 2)}`,
			);

			// Reset form after successful submission
			await formInstanceRef.current.reset();
			setFormData({});
		} catch (err) {
			console.error("Error submitting form:", err);
			setError("Failed to submit form");
		}
	};

	const handleReset = async () => {
		if (formInstanceRef.current) {
			await formInstanceRef.current.reset();
			setFormData({});
			setError(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex">
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">
								Form Initialization Error
							</h3>
							<div className="mt-2 text-sm text-red-700">{error}</div>
							<div className="mt-4">
								<button
									onClick={() => window.location.reload()}
									className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
								>
									Retry
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="bg-white shadow-lg rounded-lg overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
					<h1 className="text-2xl font-bold text-white">
						Human-in-the-Loop Form
					</h1>
					<p className="text-blue-100 mt-1">
						Complete the form to continue the business process
					</p>
					{(processId || taskId) && (
						<div className="mt-3 text-sm text-blue-100">
							{processId && <div>Process ID: {processId}</div>}
							{taskId && <div>Task ID: {taskId}</div>}
						</div>
					)}
				</div>

				{/* Form Content */}
				<div className="p-6">
					<form onSubmit={handleSubmit}>
						<div ref={formRef} className="mb-6" />

						{/* Form Data Preview (for debugging) */}
						{Object.keys(formData).length > 0 && (
							<div className="mb-6 p-4 bg-gray-50 rounded-lg">
								<h3 className="text-sm font-medium text-gray-700 mb-2">
									Current Form Data:
								</h3>
								<pre className="text-xs text-gray-600 overflow-auto">
									{JSON.stringify(formData, null, 2)}
								</pre>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex justify-end space-x-4">
							<button
								type="button"
								onClick={handleReset}
								className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Reset Form
							</button>
							<button
								type="submit"
								className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Submit Form
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Instructions */}
			<div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h3 className="text-sm font-medium text-blue-800 mb-2">Instructions</h3>
				<ul className="text-sm text-blue-700 space-y-1">
					<li>• Fill out all required fields marked with an asterisk (*)</li>
					<li>• Select appropriate priority level for the request</li>
					<li>• Add any additional comments if needed</li>
					<li>• Check the approval box if you approve this request</li>
					<li>• Click "Submit Form" to complete the task</li>
				</ul>
			</div>
		</div>
	);
};

export default HumanInTheLoopPage;
