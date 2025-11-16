import { useState, useEffect } from "react";

export default function ManageMenu() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({ name: "", price: 0, category: "" });

  function loadMenu() {
    fetch("http://localhost:3000/api/manager/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data));
  }

  useEffect(() => {
    loadMenu();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    fetch("http://localhost:3000/api/manager/add-menu-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(() => loadMenu());
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Menu</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Item name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Price"
          type="number"
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          placeholder="Category"
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <button>Add Item</button>
      </form>

      <h3>Menu Items</h3>
      <ul>
        {menu.map((item) => (
          <li key={item.id}>
            {item.name} — ${item.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
