/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManageMenu() {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
  });

  // Load all menu items
  async function loadMenu() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/manager/menu", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        setError("Failed to load menu");
        return;
      }

      const data = await res.json();
      setMenu(data);
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  // Add menu item
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        "http://localhost:3000/api/manager/add-menu-item",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            ...form,
            price: parseFloat(form.price),
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to add menu item");
        return;
      }

      await loadMenu();

      // Reset form
      setForm({ name: "", price: "", category: "" });
    } catch (err) {
      setError("Network or server error");
    }
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "20px" }}>
        <h2>Manage Menu</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <input
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min="0"
            step="0.01"
          />

          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />

          <button type="submit">Add Item</button>
        </form>

        <h3>Menu Items</h3>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {menu.map((item) => (
              <li key={item.id}>
                <b>{item.name}</b> — ${Number(item.price).toFixed(2)}
                <br />
                <small style={{ color: "gray" }}>{item.category}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
