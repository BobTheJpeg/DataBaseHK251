import "./index.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

import ServerDashboard from "./pages/ServerDashboard";
import ChefDashboard from "./pages/ChefDashboard.jsx";
import StorageDashboard from "./pages/StorageDashboard";
import { ReceptionDashboard } from "./pages/receptionist/";
import { ManageEmployees, ManagerHome, ManageMenu } from "./pages/manager/";
import AccessDenied from "./pages/AccessDenied";
import ErrorPage from "./pages/ErrorPage.jsx";

function ProtectedRoute({ children, roles }) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  if (!user.role) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/access-denied" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/error" element={<ErrorPage />} />

      {/* Wrong Role */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Server Dashboard */}
      <Route
        path="/server"
        element={
          <ProtectedRoute roles={["server"]}>
            <ServerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Chef Dashboard */}
      <Route
        path="/chef"
        element={
          <ProtectedRoute roles={["chef", "head_chef"]}>
            <ChefDashboard />
          </ProtectedRoute>
        }
      />

      {/* Receptionist Dashboard */}
      <Route
        path="/reception"
        element={
          <ProtectedRoute roles={["receptionist"]}>
            <ReceptionDashboard />
          </ProtectedRoute>
        }
      />

      {/* Storage Manager Dashboard */}
      <Route
        path="/storage"
        element={
          <ProtectedRoute roles={["storage_manager"]}>
            <StorageDashboard />
          </ProtectedRoute>
        }
      />

      {/* ---------------------- MANAGER ROUTES ---------------------- */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["manager"]}>
            <ManagerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/employees"
        element={
          <ProtectedRoute roles={["manager"]}>
            <ManageEmployees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/menu"
        element={
          <ProtectedRoute roles={["manager"]}>
            <ManageMenu />
          </ProtectedRoute>
        }
      />
      {/* -------------------------------------------------------------- */}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/error" />} />
    </Routes>
  );
}
