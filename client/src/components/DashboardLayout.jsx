import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";

export default function DashboardLayout({ children }) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <h2 style={styles.role}>{user.role?.toUpperCase()}</h2>

        {/* Role-Based Links */}
        {user.role === "manager" && (
          <>
            <Link style={styles.link} to="/manager">
              Dashboard
            </Link>
            <Link style={styles.link} to="/manager/employees">
              Employees
            </Link>
            <Link style={styles.link} to="/manager/menu">
              Menu
            </Link>
            <Link style={styles.link} to="/manager/reports">
              Reports
            </Link>
          </>
        )}

        {user.role === "server" && (
          <>
            <Link style={styles.link} to="/server">
              Orders
            </Link>
            <Link style={styles.link} to="/server/tables">
              Tables
            </Link>
          </>
        )}

        {(user.role === "chef" || user.role === "head_chef") && (
          <Link style={styles.link} to="/chef">
            Kitchen Queue
          </Link>
        )}

        {user.role === "receptionist" && (
          <>
            <Link style={styles.link} to="/reception">
              Table Booking
            </Link>
            <Link style={styles.link} to="/reception/payments">
              Payments
            </Link>
          </>
        )}

        {user.role === "storage_manager" && (
          <Link style={styles.link} to="/storage">
            Inventory
          </Link>
        )}

        <div style={{ marginTop: "auto" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <h1>{user.name}</h1>
        </div>

        {children}
      </main>
    </div>
  );
}

/* ========================= */
/* INLINE STYLING OBJECT     */
/* ========================= */

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    fontFamily: "Segoe UI, sans-serif",
    background: "#f3f3f3",
    marginLeft: "240px", // ⭐ tránh bị che bởi sidebar
  },

  sidebar: {
    width: "240px",
    background: "#5a381e",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    position: "fixed", // ⭐ GIỮ NGUYÊN KHI SCROLL
    top: 0,
    left: 0,
    bottom: 0,
    height: "100vh", // luôn full cao
  },
  role: {
    marginBottom: "20px",
    fontSize: "1.4rem",
    letterSpacing: "1px",
  },

  link: {
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "6px",
    background: "#7a4d28",
    display: "block",
    transition: "0.2s",
  },

  main: {
    flex: 1,
    padding: "30px",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
};
