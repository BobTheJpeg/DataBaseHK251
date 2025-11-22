import DashboardLayout from "../../components/DashboardLayout";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ManagerHome() {
  const [stats, setStats] = useState({
    revenueToday: 0,
    ordersToday: 0,
    customersToday: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("http://localhost:3000/api/manager/stats", {
          headers: {
            Authorization: "Bearer " + sessionStorage.getItem("token"),
          },
        });

        if (!res.ok) {
          setError("Failed to load stats.");
          return;
        }

        const data = await res.json();
        setStats(data);
      } catch {
        setError("Server error");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "40px" }}>
        <h1 style={{ color: "#5a381e" }}>Manager Dashboard</h1>
        <p style={{ color: "#666" }}>Overview of today's performance</p>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && <p>Loading statistics...</p>}

        {/* STATS */}
        {!loading && !error && (
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <div style={cardStyle}>
              <h3>Revenue Today</h3>
              <p style={statValue}>${stats.revenueToday.toFixed(2)}</p>
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
        )}

        {/* MANAGEMENT LINKS */}
        <h2 style={{ marginTop: "35px", color: "#5a381e" }}>
          Management Tools
        </h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginTop: "15px",
          }}
        >
          <Link to="/manager/employees" style={actionButton}>
            Manage Employees
          </Link>

          <Link to="/manager/menu" style={actionButton}>
            Manage Menu
          </Link>

          <Link to="/manager/reports" style={actionButton}>
            View Reports (Coming soon)
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

const cardStyle = {
  background: "white",
  padding: "25px",
  minWidth: "250px",
  borderRadius: "12px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
};

const statValue = {
  fontSize: "32px",
  fontWeight: "bold",
  marginTop: "8px",
};

const actionButton = {
  padding: "16px 24px",
  background: "#b3541e",
  color: "white",
  borderRadius: "10px",
  textDecoration: "none",
  fontSize: "18px",
  fontWeight: "bold",
  textAlign: "center",
  minWidth: "230px",
  transition: "0.2s",
};
