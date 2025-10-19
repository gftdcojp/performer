import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for unhandled errors and promise rejections
if (typeof window !== "undefined") {
	window.addEventListener("error", (event) => {
		console.error("Global Error:", event.error);
		// You can send this to error reporting service here
	});

	window.addEventListener("unhandledrejection", (event) => {
		console.error("Unhandled Promise Rejection:", event.reason);
		// You can send this to error reporting service here
	});
}

// Enhanced Error Boundary component for runtime error display
class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{
		hasError: boolean;
		error?: Error;
		errorInfo?: React.ErrorInfo;
		errorStack?: string;
		componentStack?: string;
	}
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = {
			hasError: false,
			errorStack: "",
			componentStack: "",
		};
	}

	static getDerivedStateFromError(error: Error): {
		hasError: boolean;
		error: Error;
	} {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Runtime Error:", error, errorInfo);

		this.setState({
			error,
			errorInfo,
			errorStack: error.stack || "",
			componentStack: errorInfo.componentStack || "",
		});

		// Send to error reporting service (optional)
		// reportError(error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "#1a1a1a",
						color: "#ffffff",
						fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
						fontSize: "14px",
						lineHeight: "1.5",
						zIndex: 9999,
						overflow: "auto",
						padding: "20px",
					}}
				>
					<div
						style={{
							maxWidth: "1200px",
							margin: "0 auto",
							backgroundColor: "#2d2d2d",
							border: "1px solid #ff4444",
							borderRadius: "8px",
							padding: "24px",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								marginBottom: "20px",
							}}
						>
							<span style={{ fontSize: "24px", marginRight: "12px" }}>🚨</span>
							<h1
								style={{
									margin: 0,
									color: "#ff6b6b",
									fontSize: "24px",
									fontWeight: "bold",
								}}
							>
								Critical Runtime Error
							</h1>
						</div>

						<div style={{ marginBottom: "20px" }}>
							<div
								style={{
									color: "#ff6b6b",
									fontWeight: "bold",
									marginBottom: "8px",
								}}
							>
								Error Message:
							</div>
							<div
								style={{
									backgroundColor: "#1a1a1a",
									padding: "12px",
									borderRadius: "4px",
									border: "1px solid #444",
									fontSize: "16px",
									fontWeight: "bold",
									color: "#ff6b6b",
								}}
							>
								{this.state.error?.message || "Unknown error"}
							</div>
						</div>

						<div style={{ marginBottom: "20px" }}>
							<div
								style={{
									color: "#ff6b6b",
									fontWeight: "bold",
									marginBottom: "8px",
								}}
							>
								Error Type:
							</div>
							<div
								style={{
									backgroundColor: "#1a1a1a",
									padding: "8px",
									borderRadius: "4px",
									border: "1px solid #444",
									color: "#ffaa00",
								}}
							>
								{this.state.error?.name || "Error"}
							</div>
						</div>

						<div style={{ marginBottom: "20px" }}>
							<div
								style={{
									color: "#4ec9b0",
									fontWeight: "bold",
									marginBottom: "8px",
								}}
							>
								Stack Trace:
							</div>
							<pre
								style={{
									backgroundColor: "#1a1a1a",
									padding: "12px",
									borderRadius: "4px",
									border: "1px solid #444",
									overflow: "auto",
									maxHeight: "300px",
									fontSize: "12px",
									lineHeight: "1.4",
									whiteSpace: "pre-wrap",
									color: "#d4d4d4",
								}}
							>
								{this.state.errorStack ||
									this.state.error?.stack ||
									"No stack trace available"}
							</pre>
						</div>

						{this.state.componentStack && (
							<div style={{ marginBottom: "20px" }}>
								<div
									style={{
										color: "#569cd6",
										fontWeight: "bold",
										marginBottom: "8px",
									}}
								>
									React Component Stack:
								</div>
								<pre
									style={{
										backgroundColor: "#1a1a1a",
										padding: "12px",
										borderRadius: "4px",
										border: "1px solid #444",
										overflow: "auto",
										maxHeight: "200px",
										fontSize: "12px",
										lineHeight: "1.4",
										whiteSpace: "pre-wrap",
										color: "#9cdcfe",
									}}
								>
									{this.state.componentStack}
								</pre>
							</div>
						)}

						<div
							style={{
								borderTop: "1px solid #444",
								paddingTop: "20px",
								marginTop: "20px",
							}}
						>
							<div style={{ marginBottom: "16px", color: "#cccccc" }}>
								<strong>What to do next:</strong>
								<ul style={{ marginTop: "8px", marginLeft: "20px" }}>
									<li>
										• Check the browser console (F12) for additional details
									</li>
									<li>
										• Look for recent code changes that might have caused this
									</li>
									<li>• Check if you're using React hooks correctly</li>
									<li>• Verify all dependencies are properly installed</li>
								</ul>
							</div>

							<div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
								<button
									onClick={() => window.location.reload()}
									style={{
										padding: "10px 20px",
										backgroundColor: "#ff6b6b",
										color: "white",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
										fontWeight: "bold",
										fontSize: "14px",
									}}
								>
									🔄 Reload Page
								</button>

								<button
									onClick={() => {
										if (window.history.length > 1) {
											window.history.back();
										} else {
											window.location.href = "/";
										}
									}}
									style={{
										padding: "10px 20px",
										backgroundColor: "#4ec9b0",
										color: "white",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
										fontWeight: "bold",
										fontSize: "14px",
									}}
								>
									← Go Back
								</button>

								<button
									onClick={() => {
										// Clear localStorage and sessionStorage
										localStorage.clear();
										sessionStorage.clear();
										window.location.reload();
									}}
									style={{
										padding: "10px 20px",
										backgroundColor: "#ffaa00",
										color: "black",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
										fontWeight: "bold",
										fontSize: "14px",
									}}
								>
									🧹 Clear Storage & Reload
								</button>
							</div>
						</div>

						<div
							style={{
								position: "absolute",
								top: "10px",
								right: "10px",
								color: "#666",
								fontSize: "12px",
							}}
						>
							Press F12 for Developer Tools
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error("Root element not found");
	document.body.innerHTML =
		'<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		</React.StrictMode>,
	);
}
