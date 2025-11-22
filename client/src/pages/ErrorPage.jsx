import { useNavigate } from "react-router-dom";
export default function ErrorPage() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const roleHomeRoutes = {
    server: "/server",
    chef: "/chef",
    head_chef: "/chef",
    receptionist: "/reception",
    storage_manager: "/storage",
    manager: "/manager",
  };
  const handleGoBack = () => {
    navigate(roleHomeRoutes[user.role] || "/");
  };
  return (
    <div className="page" style={{ textAlign: "center" }}>
      <div
        className="form"
        style={{
          maxWidth: "500px",
          padding: "30px 25px",
        }}
      >
        <h1 style={{ color: "black", marginBottom: "14px" }}>
          Page Does Not Exist!
        </h1>

        <p style={{ marginBottom: "22px", color: "#3a3a3a" }}></p>

        <button
          className="btn"
          style={{ width: "100%" }}
          onClick={handleGoBack}
        >
          Go back to your dashboard
        </button>
      </div>
    </div>
  );
}
