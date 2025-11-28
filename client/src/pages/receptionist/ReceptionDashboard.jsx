import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ReceptionDashboard() {
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingBooking, setEditingBooking] = useState(null);

  // Form state giữ nguyên key để map với req.body của API
  const [form, setForm] = useState({
    guest_name: "",
    phone: "",
    guest_count: "",
    booking_time: "",
  });

  function getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + sessionStorage.getItem("token"),
    };
  }

  function loadData() {
    // 1. Load danh sách bàn
    fetch("http://localhost:3000/api/reception/tables", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then(setTables)
      .catch((err) => console.error("Lỗi tải bàn:", err));

    // 2. Load danh sách đặt bàn
    fetch("http://localhost:3000/api/reception/bookings", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then(setBookings)
      .catch((err) => console.error("Lỗi tải đặt bàn:", err));
  }

  useEffect(() => {
    loadData();
  }, []);

  function validateForm() {
    const newErrors = {};

    if (!form.guest_name.trim())
      newErrors.guest_name = "Vui lòng nhập tên khách.";
    if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại.";
    if (!form.guest_count)
      newErrors.guest_count = "Vui lòng nhập số lượng khách.";
    if (!form.booking_time) newErrors.booking_time = "Vui lòng chọn thời gian.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Logic Sửa
    if (editingBooking) {
      fetch(`http://localhost:3000/api/reception/book/${editingBooking.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      }).then((res) => {
        if (res.ok) {
          loadData();
          setShowModal(false);
          setEditingBooking(null);
        } else {
          alert("Có lỗi khi cập nhật.");
        }
      });
      return;
    }

    // Logic Thêm Mới (CREATE BOOKING)
    fetch("http://localhost:3000/api/reception/book", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...form, table_id: selectedTable.id }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Đặt bàn thất bại");
        }
        alert("Đặt bàn thành công!");
        loadData();
        setShowModal(false);
        resetForm();
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  // Map màu sắc theo trạng thái
  function getTableColor(status) {
    switch (status) {
      case "Trống":
        return "#4caf50"; // Xanh lá
      case "Đã đặt":
        return "#ff9800"; // Cam
      case "Đang phục vụ":
        return "#e53935"; // Đỏ
      default:
        return "#9e9e9e"; // Xám
    }
  }

  function resetForm() {
    setForm({
      guest_name: "",
      phone: "",
      guest_count: "",
      booking_time: "",
    });
    setErrors({});
    setEditingBooking(null);
  }

  function openEditModal(booking) {
    // Lưu ý: booking object trả về từ API getBookings đang dùng camelCase (guestName, phone...)
    setSelectedTable({
      id: booking.tableId,
      table_number: booking.tableId, // Dùng ID làm số bàn
    });
    setEditingBooking(booking);

    // Format thời gian cho input datetime-local (YYYY-MM-DDTHH:mm)
    const formattedTime = booking.bookingTime
      ? booking.bookingTime.slice(0, 16)
      : "";

    setForm({
      guest_name: booking.guestName,
      phone: booking.phone,
      guest_count: booking.guestCount,
      booking_time: formattedTime,
    });
    setShowModal(true);
  }

  function deleteBooking(id) {
    if (!confirm("Bạn có chắc muốn hủy đơn đặt bàn này?")) return;

    fetch(`http://localhost:3000/api/reception/book/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(() => loadData());
  }

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "15px" }}>
        Bảng Điều Khiển Lễ Tân
      </h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          flexDirection: "row",
        }}
      >
        {/* LEFT — TABLE OVERVIEW */}
        <div style={{ flex: 2 }}>
          <h3 style={{ color: "#5a381e", marginBottom: "10px" }}>Sơ Đồ Bàn</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "15px",
            }}
          >
            {tables.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTable(t);
                  setShowModal(true);
                }}
                style={{
                  padding: "18px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  color: "white",
                  textAlign: "center",
                  fontWeight: "bold",
                  background: getTableColor(t.status),
                  border:
                    selectedTable?.id === t.id
                      ? "3px solid #b3541e"
                      : "2px solid #fff",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                Bàn {t.id}
                <br />
                <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>
                  Sức chứa: {t.capacity}
                </span>
                <br />
                <small
                  style={{
                    textTransform: "uppercase",
                    marginTop: "5px",
                    display: "block",
                  }}
                >
                  {t.status}
                </small>
              </div>
            ))}
          </div>

          {/* Legend / Chú thích màu */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "15px",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{ width: 15, height: 15, background: "#4caf50" }}
              ></div>{" "}
              Trống
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{ width: 15, height: 15, background: "#ff9800" }}
              ></div>{" "}
              Đã đặt
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{ width: 15, height: 15, background: "#e53935" }}
              ></div>{" "}
              Đang phục vụ
            </div>
          </div>
        </div>

        {/* RIGHT — UPCOMING BOOKINGS */}
        <div className="table-wrapper" style={{ flex: 1, minWidth: "350px" }}>
          <h3 style={{ marginBottom: "10px", color: "#5a381e" }}>
            Lịch Đặt Bàn Sắp Tới
          </h3>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {bookings.length === 0 && (
              <p style={{ color: "#777" }}>Chưa có lịch đặt bàn nào.</p>
            )}
            {bookings.map((b) => (
              <li
                key={b.id}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{b.guestName}</strong> — Bàn {b.tableId}
                  <br />
                  <small style={{ color: "#555" }}>
                    {new Date(b.bookingTime).toLocaleString("vi-VN")}
                    <br />
                    Khách: {b.guestCount} | {b.status}
                  </small>
                </div>

                {/* Các nút hành động (nếu backend hỗ trợ) */}
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    className="btn"
                    style={{
                      background: "#b3541e",
                      padding: "6px 10px",
                      fontSize: "12px",
                    }}
                    onClick={() => openEditModal(b)}
                  >
                    Sửa
                  </button>

                  {/* Hiện tại ẩn nút Delete để tránh lỗi nếu chưa có API */}
                  <button
                    className="btn"
                    style={{
                      background: "#c62828",
                      padding: "6px 10px",
                      fontSize: "12px",
                    }}
                    onClick={() => deleteBooking(b.id)}
                  >
                    Hủy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* POPUP MODAL */}
      {showModal && selectedTable && (
        <div
          style={modalStyles.overlay}
          onClick={() => {
            resetForm();
            setShowModal(false);
          }}
        >
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              style={modalStyles.closeBtn}
              onClick={() => {
                resetForm();
                setShowModal(false);
              }}
            >
              x
            </button>

            <h2 style={{ marginBottom: "12px", color: "#b3541e" }}>
              {editingBooking
                ? `Sửa Đặt Bàn (Bàn ${selectedTable.id})`
                : `Đặt Bàn Số ${selectedTable.id}`}
            </h2>

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                Tên Khách Hàng
              </label>
              <input
                placeholder="Nhập tên khách"
                value={form.guest_name}
                onChange={(e) =>
                  setForm({ ...form, guest_name: e.target.value })
                }
                style={modalStyles.input}
              />
              {errors.guest_name && (
                <div style={modalStyles.error}>{errors.guest_name}</div>
              )}

              <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                Số Điện Thoại
              </label>
              <input
                placeholder="Nhập SĐT liên hệ"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={modalStyles.input}
              />
              {errors.phone && (
                <div style={modalStyles.error}>{errors.phone}</div>
              )}

              <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                Số Lượng Khách
              </label>
              <input
                placeholder="Ví dụ: 4"
                type="number"
                value={form.guest_count}
                onChange={(e) =>
                  setForm({ ...form, guest_count: e.target.value })
                }
                style={modalStyles.input}
                min="1"
              />
              {errors.guest_count && (
                <div style={modalStyles.error}>{errors.guest_count}</div>
              )}

              <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                Thời Gian Đặt
              </label>
              <input
                type="datetime-local"
                value={form.booking_time}
                onChange={(e) =>
                  setForm({ ...form, booking_time: e.target.value })
                }
                style={modalStyles.input}
              />
              {errors.booking_time && (
                <div style={modalStyles.error}>{errors.booking_time}</div>
              )}

              <button
                className="btn"
                style={{ width: "100%", marginTop: "10px" }}
              >
                Xác Nhận Đặt Bàn
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* MODAL STYLES */
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    width: "400px",
    position: "relative",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    marginBottom: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  closeBtn: {
    position: "absolute",
    color: "#b3541e",
    top: "10px",
    right: "10px",
    background: "transparent",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: "0.85rem",
    marginTop: "-8px",
    marginBottom: "10px",
  },
};
