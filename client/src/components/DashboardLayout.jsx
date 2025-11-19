import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";

export default function DashboardLayout({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "240px",
          background: "#222",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>{user.role.toUpperCase()}</h2>

        {/* Role-Based Links */}
        {user.role === "manager" && (
          <>
            <Link style={navLink} to="/manager">
              📊 Dashboard
            </Link>
            <Link style={navLink} to="/manager/employees">
              👤 Employees
            </Link>
            <Link style={navLink} to="/manager/menu">
              🍽 Menu
            </Link>
            <Link style={navLink} to="/manager/reports">
              📈 Reports
            </Link>
          </>
        )}

        {user.role === "server" && (
          <>
            <Link style={navLink} to="/server">
              🧾 Orders
            </Link>
            <Link style={navLink} to="/server/tables">
              🍽 Tables
            </Link>
          </>
        )}

        {user.role === "chef" ||
          (user.role === "head_chef" && (
            <>
              <Link style={navLink} to="/chef">
                🍳 Kitchen Queue
              </Link>
            </>
          ))}

        {user.role === "receptionist" && (
          <>
            <Link style={navLink} to="/reception">
              🪑 Table Booking
            </Link>
            <Link style={navLink} to="/reception/payments">
              💳 Payments
            </Link>
          </>
        )}

        {user.role === "storage_manager" && (
          <>
            <Link style={navLink} to="/storage">
              📦 Inventory
            </Link>
          </>
        )}

        <div style={{ marginTop: "auto" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "30px", background: "#f3f3f3" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h1>{user.name}</h1>
        </div>

        {children}
      </main>
    </div>
  );
}

const navLink = {
  color: "white",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "6px",
  background: "#333",
  display: "block",
};
