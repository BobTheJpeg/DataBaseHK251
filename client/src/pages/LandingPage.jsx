import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="page">
      {/* Title */}
      <h1 style={{ marginTop: "40px" }}>Restaurant Employee Portal</h1>

      {/* Subtitle */}
      <p>
        Access your work dashboard, manage orders, bookings, inventory, and
        reporting. Please log in with your employee credentials.
      </p>

      {/* Button */}
      <Link to="/login">
        <button style={{ marginTop: "120px", marginBottom: "20px" }}>
          Go to Login
        </button>
      </Link>

      {/* Small footer */}
      <p>©2025 Group_4_L08 Restaurant Management System</p>
    </div>
  );
}
