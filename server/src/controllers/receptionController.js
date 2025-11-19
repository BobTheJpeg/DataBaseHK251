import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* -------- GET ALL TABLES -------- */
export async function getTables(req, res) {
  await poolConnect;
  const result = await pool
    .request()
    .query("SELECT * FROM tables ORDER BY table_number ASC");
  res.json(result.recordset);
}

/* -------- GET ALL BOOKINGS -------- */
export async function getBookings(req, res) {
  await poolConnect;
  const result = await pool
    .request()
    .query(
      "SELECT b.*, t.table_number FROM bookings b JOIN tables t ON b.table_id = t.id ORDER BY booking_time ASC"
    );
  res.json(result.recordset);
}

/* -------- CREATE A BOOKING -------- */
export async function createBooking(req, res) {
  const { guest_name, phone, table_id, guest_count, booking_time } = req.body;

  try {
    await poolConnect;

    // Check if table is available
    const conflict = await pool
      .request()
      .input("table_id", sql.Int, table_id)
      .input("booking_time", sql.DateTime, booking_time).query(`
        SELECT * FROM bookings
        WHERE table_id = @table_id
        AND CAST(booking_time AS DATE) = CAST(@booking_time AS DATE)
      `);

    if (conflict.recordset.length > 0)
      return res
        .status(400)
        .json({ error: "This table is already booked for that time." });

    // Insert booking
    await pool
      .request()
      .input("guest_name", sql.VarChar, guest_name)
      .input("phone", sql.VarChar, phone)
      .input("guest_count", sql.Int, guest_count)
      .input("table_id", sql.Int, table_id)
      .input("booking_time", sql.DateTime, booking_time).query(`
        INSERT INTO bookings (guest_name, phone, table_id, guest_count, booking_time)
        VALUES (@guest_name, @phone, @table_id, @guest_count, @booking_time);
      `);

    // Update table status
    await pool
      .request()
      .input("table_id", sql.Int, table_id)
      .query("UPDATE tables SET status='booked' WHERE id=@table_id");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- UPDATE TABLE STATUS -------- */
export async function updateTableStatus(req, res) {
  const { table_id, status } = req.body;

  await poolConnect;

  await pool
    .request()
    .input("table_id", sql.Int, table_id)
    .input("status", sql.VarChar, status)
    .query("UPDATE tables SET status=@status WHERE id=@table_id");

  res.json({ success: true });
}
