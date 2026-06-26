import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
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
import RequireAuth, { RequireAdmin } from "./components/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    Component: RequireAuth,
    children: [
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
          { path: "security", Component: SecurityPage },
          { path: "deployment", Component: DeploymentPage },
          {
            Component: RequireAdmin,
            children: [{ path: "users", Component: UsersPage }],
          },
        ],
      },
    ],
  },
]);
