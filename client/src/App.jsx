import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

import ServerDashboard from "./pages/ServerDashboard";
import ChefDashboard from "./pages/ChefDashboard.jsx";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import StorageDashboard from "./pages/StorageDashboard";
import ManagerHome from "./pages/manager/ManagerHome";
import ManageEmployees from "./pages/manager/ManageEmployees";
import ManageMenu from "./pages/manager/ManageMenu";
import AccessDenied from "./pages/AccessDenied";

function ProtectedRoute({ children, roles }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
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
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
