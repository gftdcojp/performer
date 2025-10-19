import { FormEditor } from "@bpmn-io/form-js-editor";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import "@bpmn-io/form-js/dist/assets/form-js.css";
import "@bpmn-io/form-js/dist/assets/form-js-editor.css";

// Merkle DAG: form_editor -> schema_modification -> dynamic_form_creation
// Form editor for creating and modifying BPMN forms
const FormEditorPage: React.FC = () => {
	const [currentSchema, setCurrentSchema] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const editorRef = useRef<HTMLDivElement>(null);
	const editorInstanceRef = useRef<FormEditor | null>(null);

	// Initial form schema template
	const initialSchema = {
		type: "default",
		components: [
			{
				type: "text",
				id: "field_1",
				label: "Sample Text Field",
				validate: {
					required: true,
				},
			},
		],
	};

	useEffect(() => {
		const initializeEditor = async () => {
			try {
				setIsLoading(true);
				setError(null);

				if (editorRef.current && !editorInstanceRef.current) {
					const editor = new FormEditor({
						container: editorRef.current,
					});

					// Import initial schema
					await editor.importSchema(initialSchema);
					editorInstanceRef.current = editor;

					// Listen for schema changes
					editor.on("changed", (event: any) => {
						setCurrentSchema(event.schema);
					});

					// Set initial schema state
					setCurrentSchema(initialSchema);
				}
			} catch (err) {
				console.error("Error initializing form editor:", err);
				setError("Failed to initialize form editor");
			} finally {
				setIsLoading(false);
			}
		};

		initializeEditor();

		return () => {
			if (editorInstanceRef.current) {
				editorInstanceRef.current.destroy();
				editorInstanceRef.current = null;
			}
		};
	}, []);

	const handleSaveSchema = () => {
		if (currentSchema) {
			const schemaJson = JSON.stringify(currentSchema, null, 2);
			console.log("Current schema:", schemaJson);

			// In a real application, you would save this to your backend
			// For now, we'll download it as a file
			const blob = new Blob([schemaJson], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "form-schema.json";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			alert("Schema saved and downloaded!");
		}
	};

	const handleLoadSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && editorInstanceRef.current) {
			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const schema = JSON.parse(e.target?.result as string);
					await editorInstanceRef.current?.importSchema(schema);
					setCurrentSchema(schema);
					alert("Schema loaded successfully!");
				} catch (err) {
					console.error("Error loading schema:", err);
					alert("Failed to load schema. Please check the file format.");
				}
			};
			reader.readAsText(file);
		}
	};

	const handleResetEditor = async () => {
		if (editorInstanceRef.current) {
			await editorInstanceRef.current.importSchema(initialSchema);
			setCurrentSchema(initialSchema);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-6xl mx-auto p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex">
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">
								Editor Initialization Error
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
		<div className="max-w-6xl mx-auto p-6">
			<div className="bg-white shadow-lg rounded-lg overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
					<h1 className="text-2xl font-bold text-white">Form Editor</h1>
					<p className="text-green-100 mt-1">
						Create and modify BPMN forms for human-in-the-loop processes
					</p>
				</div>

				{/* Toolbar */}
				<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<label className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								Load Schema
								<input
									type="file"
									accept=".json"
									onChange={handleLoadSchema}
									className="hidden"
								/>
							</label>
							<button
								onClick={handleResetEditor}
								className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Reset
							</button>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={handleSaveSchema}
								className="flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								Save Schema
							</button>
						</div>
					</div>
				</div>

				{/* Editor Content */}
				<div className="p-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Form Editor */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-gray-900">Form Editor</h3>
							<div
								ref={editorRef}
								className="min-h-[600px] border border-gray-300 rounded-lg bg-white"
								style={{ height: "600px" }}
							/>
						</div>

						{/* Schema Preview */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-gray-900">
								Schema Preview
							</h3>
							<div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
								<pre className="text-xs text-gray-800 overflow-auto max-h-[600px]">
									{currentSchema
										? JSON.stringify(currentSchema, null, 2)
										: "No schema loaded"}
								</pre>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Instructions */}
			<div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
				<h3 className="text-sm font-medium text-green-800 mb-2">
					Editor Instructions
				</h3>
				<ul className="text-sm text-green-700 space-y-1">
					<li>
						• Use the form editor on the left to create and modify form fields
					</li>
					<li>
						• Drag and drop field types from the palette to add new fields
					</li>
					<li>• Click on existing fields to edit their properties</li>
					<li>
						• Use the schema preview on the right to see the JSON structure
					</li>
					<li>• Save your schema as JSON to use in your BPMN processes</li>
					<li>• Load existing schemas to continue editing</li>
				</ul>
			</div>
		</div>
	);
};

export default FormEditorPage;
