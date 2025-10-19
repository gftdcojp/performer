import React, { useState, useEffect } from "react";
import Layout from "./components/layout/Layout";
import AdminDashboard from "./pages/admin/dashboard/AdminDashboard";
import IntegratedProcessManagementPage from "./pages/admin/integrated/IntegratedProcessManagementPage";
import ProcessInstancesPage from "./pages/admin/processes/ProcessInstancesPage";
import TaskManagementPage from "./pages/admin/tasks/TaskManagementPage";
import HomePage from "./pages/home/HomePage";
import FormEditorPage from "./pages/human-in-the-loop/FormEditorPage";
import HumanInTheLoopPage from "./pages/human-in-the-loop/HumanInTheLoopPage";
import TaskInboxPage from "./pages/human-in-the-loop/TaskInboxPage";
import OrderPage from "./pages/order/OrderPage";

function App() {
	const [currentPath, setCurrentPath] = useState(
		window?.location?.pathname || "/",
	);
	const [routeParams, setRouteParams] = useState<Record<string, string>>({});

	useEffect(() => {
		const handlePopState = () => {
			setCurrentPath(window?.location?.pathname || "/");
			parseRoute(window?.location?.pathname || "/");
		};

		if (typeof window !== "undefined") {
			window.addEventListener("popstate", handlePopState);
			// Initial route parsing
			parseRoute(window.location.pathname);
		}

		return () => {
			if (typeof window !== "undefined") {
				window.removeEventListener("popstate", handlePopState);
			}
		};
	}, []);

	const parseRoute = (path: string) => {
		const params: Record<string, string> = {};

		// Handle /order/:businessKey route
		if (path.startsWith("/order/")) {
			const parts = path.split("/");
			if (parts.length >= 3) {
				params.businessKey = parts[2];
			}
		}

		// Handle /human-in-the-loop/form routes with query parameters
		if (path.startsWith("/human-in-the-loop/form")) {
			const urlParams = new URLSearchParams(window.location.search);
			params.processId = urlParams.get("processId") || "";
			params.taskId = urlParams.get("taskId") || "";
		}

		setRouteParams(params);
	};

	const navigate = (path: string) => {
		if (typeof window !== "undefined") {
			window.history.pushState({}, "", path);
			setCurrentPath(path);
			parseRoute(path);
		}
	};

	// Make navigate available globally for components
	if (typeof window !== "undefined") {
		(window as any).navigate = navigate;
	}

	const renderPage = () => {
		if (currentPath === "/" || currentPath === "") {
			return <HomePage />;
		}

		if (currentPath.startsWith("/order/")) {
			return <OrderPage businessKey={routeParams.businessKey} />;
		}

		if (currentPath === "/admin/dashboard") {
			return <AdminDashboard />;
		}

		if (currentPath === "/admin/processes") {
			return <ProcessInstancesPage />;
		}

		if (currentPath === "/admin/tasks") {
			return <TaskManagementPage />;
		}

		if (currentPath === "/admin/integrated") {
			return <IntegratedProcessManagementPage />;
		}

		// Human-in-the-loop routes
		if (currentPath === "/human-in-the-loop/tasks") {
			return <TaskInboxPage />;
		}

		if (currentPath === "/human-in-the-loop/form") {
			return (
				<HumanInTheLoopPage
					processId={routeParams.processId}
					taskId={routeParams.taskId}
				/>
			);
		}

		if (currentPath === "/human-in-the-loop/editor") {
			return <FormEditorPage />;
		}

		return <HomePage />;
	};

	return <Layout>{renderPage()}</Layout>;
}

export default App;
