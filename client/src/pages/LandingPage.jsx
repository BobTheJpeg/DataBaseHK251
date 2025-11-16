import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      {/* Title */}
      <h1 style={{ fontSize: "32px", marginBottom: "10px", color: "#222" }}>
        Restaurant Employee Portal
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "16px",
          marginBottom: "30px",
          color: "#555",
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        Access your work dashboard, manage orders, bookings, inventory, and
        reporting. Please log in with your employee credentials.
      </p>

      {/* Button */}
      <Link
        to="/login"
        style={{
          padding: "12px 24px",
          backgroundColor: "#333",
          color: "white",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        Go to Login
      </Link>

      {/* Small footer */}
      <p style={{ marginTop: "40px", color: "#888", fontSize: "12px" }}>
        © 2025 Restaurant Management System
      </p>
    </div>
  );
}
