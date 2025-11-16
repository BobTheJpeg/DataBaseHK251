import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ManagerHome() {
  const [stats, setStats] = useState({
    revenueToday: 0,
    ordersToday: 0,
    customersToday: 0,
  });

  useEffect(() => {
    fetch("http://localhost:3000/api/manager/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* TITLE */}
      <h1 style={{ marginBottom: "10px" }}>Manager Dashboard</h1>
      <p style={{ color: "#666" }}>
        Overview of today's restaurant performance.
      </p>

      {/* STATS SECTION */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={cardStyle}>
          <h3>Revenue Today</h3>
          <p style={statValue}>${stats.revenueToday}</p>
        </div>

        <div style={cardStyle}>
          <h3>Orders Today</h3>
          <p style={statValue}>{stats.ordersToday}</p>
        </div>

        <div style={cardStyle}>
          <h3>Customers Today</h3>
          <p style={statValue}>{stats.customersToday}</p>
        </div>
      </div>

      {/* ACTION SECTION */}
      <h2 style={{ marginTop: "30px" }}>Management Tools</h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Link to="/manager/employees" style={actionButton}>
          👤 Manage Employees
        </Link>

        <Link to="/manager/menu" style={actionButton}>
          🍽 Manage Menu
        </Link>

        <Link to="/manager/reports" style={actionButton}>
          📊 View Reports (Coming soon)
        </Link>
      </div>
    </div>
  );
}

/* Styles */
const cardStyle = {
  background: "white",
  padding: "20px",
  width: "250px",
  borderRadius: "10px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

const statValue = {
  fontSize: "32px",
  fontWeight: "bold",
  marginTop: "10px",
};

const actionButton = {
  padding: "16px 24px",
  background: "#333",
  color: "white",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "18px",
  fontWeight: "bold",
  textAlign: "center",
  minWidth: "220px",
};
