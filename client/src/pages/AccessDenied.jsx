import { useNavigate } from "react-router-dom";

export default function AccessDenied() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Custom message per role
  const roleMessages = {
    server: "Servers cannot access this features.",
    chef: "Chefs do not have permission to view this section.",
    head_chef: "Head Chefs cannot access this dashboard.",
    receptionist: "Receptionists are not allowed to access this page.",
    storage_manager: "Storage Managers cannot enter this page.",
    manager: "Managers only page — but you're already a manager?",
    undefined: "You do not have permission to view this page.",
  };

  const message = roleMessages[user.role] || roleMessages["undefined"];

  // Where to send them when they click "Go Back"
  const roleHomeRoutes = {
    server: "/server",
    chef: "/chef",
    head_chef: "/chef",
    receptionist: "/reception",
    storage_manager: "/storage",
    manager: "/manager",
  };

  const handleGoBack = () => {
    const target = roleHomeRoutes[user.role] || "/";
    navigate(target);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "42px", color: "red", marginBottom: "10px" }}>
        Access Denied
      </h1>

      <p
        style={{
          fontSize: "18px",
          maxWidth: "400px",
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        {message}
      </p>

      <button
        onClick={handleGoBack}
        style={{
          padding: "12px 24px",
          background: "#333",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Go back to your dashboard
      </button>
    </div>
  );
}
