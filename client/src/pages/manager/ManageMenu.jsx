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
    category: "Mặn", // Mặc định là Mặn để khớp Constraint
    description: "",
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
        setError("Không thể tải thực đơn");
        return;
      }

      const data = await res.json();
      setMenu(data);
    } catch {
      setError("Lỗi máy chủ");
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
      ? `http://localhost:3000/api/manager/update-menu-item/${editing.id}` // Cần đảm bảo backend có
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
        setError(errData.error || "Lỗi khi lưu món ăn");
        return;
      }

      await loadMenu();

      // RESET Form
      setForm({ name: "", price: "", category: "Mặn", description: "" });
      setEditing(null);
    } catch {
      setError("Lỗi kết nối");
    }
  }

  // Delete menu item
  async function deleteItem(id) {
    if (!confirm("Bạn có chắc muốn xóa món này?")) return;

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
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
        Quản Lý Thực Đơn
      </h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "30px" }}>
        {/* LEFT: MENU TABLE */}
        <div style={{ flex: 2 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Tên Món</th>
                  <th style={{ width: "20%" }}>Đơn Giá</th>
                  <th style={{ width: "20%" }}>Phân Loại</th>
                  <th style={{ width: "30%", textAlign: "center" }}>
                    Hành Động
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">Đang tải...</td>
                  </tr>
                ) : (
                  menu.map((item) => (
                    <tr key={item.ID || item.id}>
                      <td>{item.Ten || item.name}</td>
                      <td>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(item.DonGia || item.price)}
                      </td>
                      <td>{item.PhanLoai || item.category}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ marginRight: "10px", padding: "5px 10px" }}
                          onClick={() => {
                            setEditing(item);
                            setForm({
                              name: item.Ten || item.name,
                              price: item.DonGia || item.price,
                              category: item.PhanLoai || item.category,
                              description: item.MoTa || item.description || "",
                            });
                          }}
                        >
                          Sửa
                        </button>

                        <button
                          className="btn"
                          style={{
                            background: "#c62828",
                            padding: "5px 10px",
                          }}
                          onClick={() => deleteItem(item.ID || item.id)}
                        >
                          Xóa
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
          <h3>{editing ? "Sửa Món Ăn" : "Thêm Món Mới"}</h3>

          <form onSubmit={handleSubmit}>
            <label>Tên món</label>
            <input
              placeholder="Ví dụ: Phở bò"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <label>Đơn giá (VNĐ)</label>
            <input
              placeholder="0"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              min="0"
            />

            <label>Phân loại</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Mặn">Mặn</option>
              <option value="Chay">Chay</option>
            </select>

            <label>Mô tả (Nguyên liệu/Ghi chú)</label>
            <textarea
              placeholder="Ví dụ: Nạm, gầu, gân..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
              rows={3}
            />

            {/* SAVE BUTTON */}
            <button
              className="btn"
              style={{ width: "100%", marginTop: "10px" }}
            >
              {editing ? "Lưu Thay Đổi" : "Thêm Món"}
            </button>

            {/* CANCEL BUTTON */}
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
                  setForm({
                    name: "",
                    price: "",
                    category: "Mặn",
                    description: "",
                  });
                }}
              >
                Hủy Bỏ
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
