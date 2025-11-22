import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManageMenu() {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);

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
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        setError("Failed to load menu");
        return;
      }

      const data = await res.json();
      setMenu(data);
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  // Create / Update menu item
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const url = editing
      ? `http://localhost:3000/api/manager/update-menu-item/${editing.id}`
      : "http://localhost:3000/api/manager/add-menu-item";

    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to save menu item");
        return;
      }

      await loadMenu();

      // RESET AFTER SAVE — return to Add mode
      setForm({ name: "", price: "", category: "" });
      setEditing(null);
    } catch {
      setError("Network or server error");
    }
  }

  // Delete menu item
  async function deleteItem(id) {
    if (!confirm("Delete this menu item?")) return;

    await fetch(`http://localhost:3000/api/manager/delete-menu-item/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + sessionStorage.getItem("token"),
      },
    });

    loadMenu();
  }

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>Manage Menu</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "30px" }}>
        {/* LEFT: MENU TABLE */}
        <div style={{ flex: 2 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Name</th>
                  <th style={{ width: "20%" }}>Price</th>
                  <th style={{ width: "20%" }}>Category</th>
                  <th style={{ width: "30%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">Loading...</td>
                  </tr>
                ) : (
                  menu.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>${Number(item.price).toFixed(2)}</td>
                      <td>{item.category}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ marginRight: "10px", padding: "5px 10px" }}
                          onClick={() => {
                            setEditing(item);
                            setForm({
                              name: item.name,
                              price: item.price,
                              category: item.category,
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
                          onClick={() => deleteItem(item.id)}
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

        {/* RIGHT: MENU FORM */}
        <div className="form" style={{ flex: 1 }}>
          <h3>{editing ? "Edit Menu Item" : "Add Menu Item"}</h3>

          <form onSubmit={handleSubmit}>
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

            {/* SAVE BUTTON */}
            <button
              className="btn"
              style={{ width: "100%", marginTop: "10px" }}
            >
              {editing ? "Save Changes" : "Add Item"}
            </button>

            {/* CANCEL BUTTON (only in edit mode) */}
            {editing && (
              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  background: "#7a4d28",
                }}
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", price: "", category: "" });
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
