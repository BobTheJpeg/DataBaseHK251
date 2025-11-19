/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "server",
  });

  // Load employees from backend
  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/manager/employees", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        setError("Failed to fetch employees");
        return;
      }

      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Submit new employee
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        "http://localhost:3000/api/manager/add-employee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to add employee");
        return;
      }

      // Refresh list
      await loadEmployees();

      // Reset form
      setForm({
        name: "",
        email: "",
        password: "",
        role: "server",
      });
    } catch (err) {
      setError("Network or server error");
    }
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "20px" }}>
        <h2>Manage Employees</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            required
          />

          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="server">Server</option>
            <option value="receptionist">Receptionist</option>
            <option value="chef">Chef</option>
            <option value="head_chef">Head Chef</option>
            <option value="storage_manager">Storage Manager</option>
            <option value="manager">Manager</option>
          </select>

          <button type="submit">Add Employee</button>
        </form>

        {/* Employees List */}
        <h3 style={{ marginTop: "30px" }}>Current Employees</h3>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {employees.map((emp) => (
              <li key={emp.id}>
                {emp.name} — <b>{emp.role}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
