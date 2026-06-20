import { createBrowserRouter, Navigate } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import DocumentsPage from "./pages/DocumentsPage";
import ModelsPage from "./pages/ModelsPage";
import AgentsPage from "./pages/AgentsPage";
import KnowledgePage from "./pages/KnowledgePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import UsersPage from "./pages/UsersPage";
import SecurityPage from "./pages/SecurityPage";
import DeploymentPage from "./pages/DeploymentPage";
import DashboardLayout from "./components/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "chat", Component: ChatPage },
      { path: "documents", Component: DocumentsPage },
      { path: "models", Component: ModelsPage },
      { path: "agents", Component: AgentsPage },
      { path: "knowledge", Component: KnowledgePage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "users", Component: UsersPage },
      { path: "security", Component: SecurityPage },
      { path: "deployment", Component: DeploymentPage },
    ],
  },
]);
