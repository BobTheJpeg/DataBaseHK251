import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

import ServerDashboard from "./pages/ServerDashboard";
import ChefDashboard from "./pages/ChefDashboard.jsx";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import StorageDashboard from "./pages/StorageDashboard";

function ProtectedRoute({ children, roles }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/server"
        element={
          <ProtectedRoute roles={["server"]}>
            <ServerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chef"
        element={
          <ProtectedRoute roles={["chef", "head_chef"]}>
            <ChefDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reception"
        element={
          <ProtectedRoute roles={["receptionist"]}>
            <ReceptionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/storage"
        element={
          <ProtectedRoute roles={["storage_manager"]}>
            <StorageDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
