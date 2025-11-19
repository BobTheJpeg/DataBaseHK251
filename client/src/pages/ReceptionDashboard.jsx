import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function ReceptionDashboard() {
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [form, setForm] = useState({
    guest_name: "",
    phone: "",
    table_id: "",
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

  function handleSubmit(e) {
    e.preventDefault();

    fetch("http://localhost:3000/api/reception/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(() => loadData());
  }

  return (
    <DashboardLayout>
      <h2>Reception Booking System</h2>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <input
          placeholder="Guest Name"
          onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
        />

        <input
          placeholder="Phone Number"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <select
          onChange={(e) => setForm({ ...form, table_id: e.target.value })}
        >
          <option>Select Table</option>
          {tables.map((t) => (
            <option value={t.id} key={t.id}>
              Table {t.table_number} (Seats {t.capacity})
            </option>
          ))}
        </select>

        <input
          placeholder="Guest Count"
          type="number"
          onChange={(e) => setForm({ ...form, guest_count: e.target.value })}
        />

        <input
          type="datetime-local"
          onChange={(e) => setForm({ ...form, booking_time: e.target.value })}
        />

        <button type="submit">Create Booking</button>
      </form>

      <h3 style={{ marginTop: "30px" }}>Upcoming Bookings</h3>
      <ul>
        {bookings.map((b) => (
          <li key={b.id}>
            {b.guest_name} — Table {b.table_number} at{" "}
            {new Date(b.booking_time).toLocaleString()}
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
}
