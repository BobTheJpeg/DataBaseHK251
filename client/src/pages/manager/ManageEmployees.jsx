import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // track editing row

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "server",
  });

  // Load employees
  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/manager/employees", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        setError("Failed to fetch employees");
        return;
      }

      const data = await res.json();
      setEmployees(data);
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Create / Update employee
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const url = editing
      ? `http://localhost:3000/api/manager/update-employee/${editing.id}`
      : `http://localhost:3000/api/manager/add-employee`;

    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to save employee");
        return;
      }

      await loadEmployees();

      setForm({
        name: "",
        email: "",
        password: "",
        role: "server",
      });
      setEditing(null);
    } catch {
      setError("Network or server error");
    }
  }

  async function deleteEmployee(id) {
    if (!confirm("Delete this employee?")) return;

    await fetch(`http://localhost:3000/api/manager/delete-employee/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + sessionStorage.getItem("token"),
      },
    });

    loadEmployees();
  }

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
        Manage Employees
      </h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "30px" }}>
        {/* LEFT: EMPLOYEE TABLE */}
        <div style={{ flex: 2 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Name</th>
                  <th style={{ width: "25%" }}>Email</th>
                  <th style={{ width: "20%" }}>Role</th>
                  <th style={{ width: "30%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">Loading...</td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.role}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ marginRight: "10px", padding: "5px 10px" }}
                          onClick={() => {
                            setEditing(emp);
                            setForm({
                              name: emp.name,
                              email: emp.email,
                              password: "",
                              role: emp.role,
                            });
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="btn"
                          style={{
                            background: "#c62828",
                            padding: "5px 10px",
                          }}
                          onClick={() => deleteEmployee(emp.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: EMPLOYEE FORM */}
        <div className="form" style={{ flex: 1 }}>
          <h3>{editing ? "Edit Employee" : "Add Employee"}</h3>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
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

            {/* SAVE BUTTON */}
            <button
              className="btn"
              style={{ width: "100%", marginTop: "10px" }}
            >
              {editing ? "Save Changes" : "Add Employee"}
            </button>

            {/* CANCEL BUTTON — ONLY SHOW WHEN EDITING */}
            {editing && (
              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  backgroundColor: "#7a4d28",
                }}
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    email: "",
                    password: "",
                    role: "server",
                  });
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
