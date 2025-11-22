import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ReceptionDashboard() {
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingBooking, setEditingBooking] = useState(null);
  const [form, setForm] = useState({
    guest_name: "",
    phone: "",
    guest_count: "",
    booking_time: "",
  });

  function loadData() {
    fetch("http://localhost:3000/api/reception/tables")
      .then((res) => res.json())
      .then(setTables);

    fetch("http://localhost:3000/api/reception/bookings")
      .then((res) => res.json())
      .then(setBookings);
  }

  useEffect(() => {
    loadData();
  }, []);

  function validateForm() {
    const newErrors = {};

    if (!form.guest_name.trim())
      newErrors.guest_name = "Guest name is required.";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!form.guest_count) newErrors.guest_count = "Guest count is required.";
    if (!form.booking_time)
      newErrors.booking_time = "Booking time is required.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return; // ❌ Stop submit nếu lỗi
    }

    if (
      !form.guest_name ||
      !form.phone ||
      !form.guest_count ||
      !form.booking_time
    ) {
      alert("Please fill in all fields.");
      return;
    }

    // UPDATE BOOKING
    if (editingBooking) {
      fetch(`http://localhost:3000/api/reception/book/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then(() => {
        loadData();
        setShowModal(false);
        setEditingBooking(null);
      });
      return;
    }

    // CREATE BOOKING
    fetch("http://localhost:3000/api/reception/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, table_id: selectedTable.id }),
    }).then(() => {
      loadData();
      setShowModal(false);
    });
  }

  function getTableColor(status) {
    return {
      free: "#4caf50",
      booked: "#ff9800",
      occupied: "#e53935",
      unavailable: "#9e9e9e",
    }[status];
  }

  function resetForm() {
    setForm({
      guest_name: "",
      phone: "",
      guest_count: "",
      booking_time: "",
    });
    setErrors({}); // ⭐ RESET ERROR STATE
    setEditingBooking(null);
  }

  function openEditModal(booking) {
    setSelectedTable({
      id: booking.table_id,
      table_number: booking.table_number,
    });
    setEditingBooking(booking);
    setForm({
      guest_name: booking.guest_name,
      phone: booking.phone,
      guest_count: booking.guest_count,
      booking_time: booking.booking_time.slice(0, 16),
    });
    setShowModal(true);
  }

  function deleteBooking(id) {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    fetch(`http://localhost:3000/api/reception/book/${id}`, {
      method: "DELETE",
    }).then(() => loadData());
  }

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "15px" }}>
        Reception Dashboard
      </h2>

      <div style={{ display: "flex", gap: "20px", width: "100%" }}>
        {/* LEFT — TABLE OVERVIEW */}
        <div style={{ flex: 2 }}>
          <h3 style={{ color: "#5a381e", marginBottom: "10px" }}>
            Table Overview
          </h3>

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
                }}
              >
                Table {t.table_number}
                <br />
                Seats: {t.capacity}
                <br />
                <small>{t.status}</small>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — UPCOMING BOOKINGS */}
        <div className="table-wrapper" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: "10px", color: "#5a381e" }}>
            Upcoming Bookings
          </h3>

          <ul style={{ listStyle: "none" }}>
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
                  <strong>{b.guest_name}</strong> — Table {b.table_number}
                  <br />
                  <small>{new Date(b.booking_time).toLocaleString()}</small>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn"
                    style={{ background: "#b3541e", padding: "6px 10px" }}
                    onClick={() => openEditModal(b)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn"
                    style={{ background: "#c62828", padding: "6px 10px" }}
                    onClick={() => deleteBooking(b.id)}
                  >
                    Delete
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

            <h2 style={{ marginBottom: "12px" }}>
              {editingBooking
                ? `Edit Booking (Table ${editingBooking.table_number})`
                : `Book Table ${selectedTable.table_number}`}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                placeholder="Guest Name"
                value={form.guest_name}
                onChange={(e) =>
                  setForm({ ...form, guest_name: e.target.value })
                }
                style={modalStyles.input}
              />
              {errors.guest_name && (
                <div style={modalStyles.error}>{errors.guest_name}</div>
              )}

              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={modalStyles.input}
              />
              {errors.phone && (
                <div style={modalStyles.error}>{errors.phone}</div>
              )}

              <input
                placeholder="Guest Count"
                type="number"
                value={form.guest_count}
                onChange={(e) =>
                  setForm({ ...form, guest_count: e.target.value })
                }
                style={modalStyles.input}
              />
              {errors.guest_count && (
                <div style={modalStyles.error}>{errors.guest_count}</div>
              )}

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

              <button className="btn" style={{ width: "100%" }}>
                Confirm Booking
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
    padding: "12px",
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
