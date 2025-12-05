import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* -------- GET TABLES WITH STATUS BY TIME (Lọc bàn theo giờ) -------- */
export async function getTables(req, res) {
  try {
    await poolConnect;

    // Nhận tham số date (YYYY-MM-DD) và hour (0-23) từ query string
    // Nếu không có thì lấy thời gian hiện tại
    const now = new Date();
    const date = req.query.date || now.toISOString().split("T")[0];
    const hour =
      req.query.hour !== undefined ? parseInt(req.query.hour) : now.getHours();

    const request = pool.request();
    request.input("Date", sql.Date, date);
    request.input("Hour", sql.Int, hour);

    // Query: Lấy tất cả bàn, Join với DATBAN để xem trong giờ đó có đơn nào không
    // Chỉ lấy đơn chưa hủy
    const query = `
      SELECT 
        B.ID_Ban as id, 
        B.SucChua as capacity, 
        CASE 
            WHEN D.TrangThai IS NOT NULL THEN D.TrangThai 
            ELSE N'Trống' 
        END as status,
        D.ID_DatBan as bookingId,
        K.HoTen as guestName
      FROM BAN B
      LEFT JOIN DATBAN D ON B.ID_Ban = D.ID_Ban 
        AND D.TrangThai <> N'Đã hủy'
        AND CAST(D.ThoiGianDat AS DATE) = @Date
        AND DATEPART(HOUR, D.ThoiGianDat) = @Hour
      LEFT JOIN KHACHHANG K ON D.SDT_Khach = K.SDT
      ORDER BY B.ID_Ban ASC
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- GET ALL BOOKINGS (Giữ nguyên hoặc lọc theo ngày nếu muốn) -------- */
export async function getBookings(req, res) {
  try {
    await poolConnect;
    // Lấy danh sách đặt bàn (Sắp xếp đơn mới nhất lên đầu)
    const result = await pool.request().query(`
      SELECT TOP 50
        D.ID_DatBan as id,
        D.ThoiGianDat as bookingTime,
        D.SoLuongKhach as guestCount,
        D.TrangThai as status,
        D.GhiChu as note,
        B.ID_Ban as tableId,
        K.HoTen as guestName,
        K.SDT as phone
      FROM DATBAN D
      LEFT JOIN BAN B ON D.ID_Ban = B.ID_Ban
      LEFT JOIN KHACHHANG K ON D.SDT_Khach = K.SDT
      ORDER BY D.ThoiGianDat ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- CREATE A BOOKING -------- */
export async function createBooking(req, res) {
  const { guest_name, phone, table_id, guest_count, booking_time, note } =
    req.body;
  const receptionistId = req.user ? req.user.id : null;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("SDT_Khach", sql.VarChar(20), phone);
    request.input("TenKhach", sql.NVarChar(50), guest_name);
    request.input("SoLuongKhach", sql.Int, guest_count);
    request.input("ThoiGianDat", sql.DateTime2, booking_time); // Thời gian này do Frontend ghép từ Date+Hour
    request.input("ID_Ban", sql.Int, table_id || null);
    request.input("ID_LeTan", sql.Int, receptionistId);
    request.input("GhiChu", sql.NVarChar(500), note || "");

    await request.execute("sp_TaoDatBan");

    res.json({ success: true, message: "Đặt bàn thành công!" });
  } catch (err) {
    console.error("Lỗi đặt bàn:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
}

/* -------- CHECK-IN -------- */
export async function checkInBooking(req, res) {
  const { id } = req.params;
  const { server_id } = req.body;
  const receptionistId = req.user ? req.user.id : null;

  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID_DatBan", sql.Int, id);
    request.input("ID_LeTan", sql.Int, receptionistId);
    request.input("ID_PhucVu", sql.Int, server_id);

    await request.execute("sp_NhanBan");
    res.json({
      success: true,
      message: "Nhận bàn thành công. Đơn gọi món đã được tạo.",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* -------- CANCEL BOOKING -------- */
export async function cancelBooking(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID_DatBan", sql.Int, id);
    request.input(
      "GhiChuHuy",
      sql.NVarChar(200),
      reason || "Khách yêu cầu hủy"
    );

    await request.execute("sp_HuyDatBan");
    res.json({ success: true, message: "Đã hủy đặt bàn." });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateTableStatus(req, res) {
  res.json({ success: true });
}

export async function updateBooking(req, res) {
  // Logic update booking nếu cần (hiện tại chưa dùng tới trong UI mới)
  res.json({ success: true });
}

export async function deleteBooking(req, res) {
  // Logic delete cứng (ít dùng, thường dùng cancel)
  const { id } = req.params;
  try {
    await poolConnect;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .query("DELETE FROM DATBAN WHERE ID_DatBan = @ID");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
