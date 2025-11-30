import { useState, useEffect } from "react";
// [FIX] Thêm đuôi .jsx vào đường dẫn import
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function ChefDashboard() {
  const [activeTab, setActiveTab] = useState("queue"); // 'queue' or 'menu_request'

  return (
    <DashboardLayout>
      <div style={{ marginBottom: "20px", borderBottom: "1px solid #ddd" }}>
        <button
          style={{
            ...styles.tab,
            borderBottom: activeTab === "queue" ? "3px solid #b3541e" : "none",
          }}
          onClick={() => setActiveTab("queue")}
        >
          👩‍🍳 Hàng Đợi Bếp
        </button>
        <button
          style={{
            ...styles.tab,
            borderBottom:
              activeTab === "menu_request" ? "3px solid #b3541e" : "none",
          }}
          onClick={() => setActiveTab("menu_request")}
        >
          📝 Đề Xuất Thực Đơn
        </button>
      </div>

      {activeTab === "queue" ? <KitchenQueue /> : <MenuRequestForm />}
    </DashboardLayout>
  );
}

// --- SUB COMPONENT 1: KITCHEN QUEUE (DUMMY) ---
function KitchenQueue() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    // Gọi API lấy dummy data
    fetch("http://localhost:3000/api/chef/queue", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then(setOrders)
      .catch((err) => console.error(err));
  }, []);

  const updateStatus = (id, newStatus) => {
    alert(`(Dummy) Đã chuyển đơn #${id} sang trạng thái: ${newStatus}`);
    // Logic update state giả lập
    setOrders(
      orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "20px",
      }}
    >
      {orders.map((order) => (
        <div key={order.id} style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, color: "#b3541e" }}>{order.tableName}</h3>
            <span style={{ color: "#666" }}>{order.time}</span>
          </div>
          <h2 style={{ margin: "10px 0" }}>{order.dishName}</h2>
          <p>
            Số lượng: <strong>{order.quantity}</strong>
          </p>
          <p>
            Trạng thái:{" "}
            <span
              style={{
                fontWeight: "bold",
                color: order.status === "Đang nấu" ? "#e65100" : "#2e7d32",
              }}
            >
              {order.status}
            </span>
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={() => updateStatus(order.id, "Đang nấu")}
              style={{ ...styles.btn, background: "#ff9800" }}
            >
              Nấu
            </button>
            <button
              onClick={() => updateStatus(order.id, "Sẵn sàng")}
              style={{ ...styles.btn, background: "#4caf50" }}
            >
              Xong
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- SUB COMPONENT 2: MENU REQUEST FORM ---
function MenuRequestForm() {
  const [requestType, setRequestType] = useState("Thêm");
  const [menuItems, setMenuItems] = useState([]); // Để chọn món khi Sửa/Xóa
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [form, setForm] = useState({
    dishId: "",
    name: "",
    price: "",
    category: "Mặn",
    description: "",
    reason: "",
  });

  // Load danh sách món ăn để chọn nếu Sửa/Xóa
  useEffect(() => {
    if (requestType !== "Thêm") {
      const token = sessionStorage.getItem("token");
      fetch("http://localhost:3000/api/manager/menu", {
        // Tận dụng API get menu
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then(setMenuItems)
        .catch(console.error);
    }
  }, [requestType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/chef/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
        body: JSON.stringify({
          chefId: user.id,
          type: requestType,
          ...form,
        }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (res.ok)
        setForm({
          dishId: "",
          name: "",
          price: "",
          category: "Mặn",
          description: "",
          reason: "",
        });
    } catch {
      alert("Lỗi kết nối");
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#5a381e" }}>
        Gửi Yêu Cầu Cập Nhật Thực Đơn
      </h3>

      <div style={{ marginBottom: "15px" }}>
        <label style={styles.label}>Loại yêu cầu:</label>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Thêm", "Sửa", "Xóa"].map((type) => (
            <label key={type} style={{ cursor: "pointer" }}>
              <input
                type="radio"
                checked={requestType === type}
                onChange={() => setRequestType(type)}
              />{" "}
              {type} món
            </label>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        {requestType !== "Thêm" && (
          <div>
            <label style={styles.label}>Chọn món ăn:</label>
            <select
              style={styles.input}
              value={form.dishId}
              onChange={(e) => {
                const id = e.target.value;
                const item = menuItems.find((i) => i.ID == id);
                setForm({
                  ...form,
                  dishId: id,
                  name: item?.Ten || "",
                  price: item?.DonGia || "",
                  category: item?.PhanLoai || "Mặn",
                  description: item?.MoTa || "",
                });
              }}
              required
            >
              <option value="">-- Chọn món --</option>
              {menuItems.map((i) => (
                <option key={i.ID} value={i.ID}>
                  {i.Ten}
                </option>
              ))}
            </select>
          </div>
        )}

        {requestType !== "Xóa" && (
          <>
            <div>
              <label style={styles.label}>Tên món đề xuất:</label>
              <input
                style={styles.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={styles.label}>Đơn giá:</label>
                <input
                  type="number"
                  style={styles.input}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Phân loại:</label>
                <select
                  style={styles.input}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="Mặn">Mặn</option>
                  <option value="Chay">Chay</option>
                </select>
              </div>
            </div>
            <div>
              <label style={styles.label}>Mô tả:</label>
              <textarea
                style={styles.input}
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </>
        )}

        <div>
          <label style={styles.label}>Lý do ({requestType}):</label>
          <input
            style={styles.input}
            placeholder="VD: Món mới theo mùa / Hết nguyên liệu..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
        </div>

        <button style={styles.submitBtn}>Gửi Yêu Cầu</button>
      </form>
    </div>
  );
}

const styles = {
  tab: {
    padding: "15px 20px",
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#555",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    borderLeft: "5px solid #b3541e",
  },
  btn: {
    flex: 1,
    padding: "8px",
    border: "none",
    borderRadius: "5px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  label: { fontWeight: "bold", fontSize: "14px", color: "#333" },
  submitBtn: {
    padding: "12px",
    background: "#b3541e",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
