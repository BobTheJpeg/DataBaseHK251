import { useEffect, useState } from "react";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "server",
  });

  function loadEmployees() {
    fetch("http://localhost:3000/api/manager/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data));
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    fetch("http://localhost:3000/api/manager/add-employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then(() => loadEmployees());
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Employees</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <input
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="server">Server</option>
          <option value="receptionist">Receptionist</option>
          <option value="chef">Chef</option>
          <option value="head_chef">Head Chef</option>
          <option value="storage_manager">Storage Manager</option>
          <option value="manager">Manager</option>
        </select>

        <button type="submit">Add Employee</button>
      </form>

      <h3 style={{ marginTop: "30px" }}>Current Employees</h3>
      <ul>
        {employees.map((emp) => (
          <li key={emp.id}>
            {emp.name} — {emp.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
