import "./index.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

import ServerDashboard from "./pages/ServerDashboard";
import HeadChefDashboard from "./pages/head_chef/HeadChefDashboard.jsx";
import ChefDashboard from "./pages/chef/ChefDashboard.jsx";
import StorageDashboard from "./pages/StorageDashboard";
import { ReceptionDashboard } from "./pages/receptionist/";
import {
  ManageEmployees,
  ManagerHome,
  ManageMenu,
  ManagerMenuRequests,
} from "./pages/manager/";
import AccessDenied from "./pages/AccessDenied";
import ErrorPage from "./pages/ErrorPage.jsx";

// Component bảo vệ route: Kiểm tra role của user
function ProtectedRoute({ children, roles }) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Chưa đăng nhập -> Về trang login
  if (!user.role) return <Navigate to="/login" />;

  // Role không nằm trong danh sách cho phép -> Về trang từ chối truy cập
  if (!roles.includes(user.role)) return <Navigate to="/access-denied" />;

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Các trang Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/error" element={<ErrorPage />} />

      {/* Trang thông báo lỗi quyền hạn */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* ------------------ PHÂN QUYỀN (ROLE-BASED ROUTING) ------------------ */}

      {/* 1. Trang Phục vụ (Server) */}
      <Route
        path="/server"
        element={
          <ProtectedRoute roles={["Phục vụ"]}>
            <ServerDashboard />
          </ProtectedRoute>
        }
      />

      {/* 2. Trang Bếp (Chef) - Chỉ gồm đầu bếp */}
      <Route
        path="/chef"
        element={
          <ProtectedRoute roles={["Đầu bếp", "Bếp trưởng"]}>
            <ChefDashboard />
          </ProtectedRoute>
        }
      />

      {/* 2.1 Trang Bếp Trưởng (Head Chef) */}
      <Route
        path="/head-chef"
        element={
          <ProtectedRoute roles={["Bếp trưởng"]}>
            <HeadChefDashboard />
          </ProtectedRoute>
        }
      />

      {/* 3. Trang Lễ tân (Receptionist) */}
      <Route
        path="/reception"
        element={
          <ProtectedRoute roles={["Lễ tân"]}>
            <ReceptionDashboard />
          </ProtectedRoute>
        }
      />

      {/* 4. Trang Kho (Storage) */}
      <Route
        path="/storage"
        element={
          <ProtectedRoute roles={["Quản lý kho"]}>
            <StorageDashboard />
          </ProtectedRoute>
        }
      />

      {/* 5. Trang Quản lý (Manager) */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManagerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/employees"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManageEmployees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/menu"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManageMenu />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/requests"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManagerMenuRequests />
          </ProtectedRoute>
        }
      />

      {/* --------------------------------------------------------------------- */}

      {/* Fallback: Route không tồn tại -> Chuyển hướng về trang lỗi */}
      <Route path="*" element={<Navigate to="/error" />} />
    </Routes>
  );
}
