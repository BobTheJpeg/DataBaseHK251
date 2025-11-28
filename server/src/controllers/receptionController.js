import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* -------- GET ALL TABLES (Bàn) -------- */
export async function getTables(req, res) {
  try {
    await poolConnect;
    // Bảng BAN: ID_Ban, SucChua, TrangThai
    const result = await pool
      .request()
      .query(
        "SELECT ID_Ban as id, SucChua as capacity, TrangThai as status FROM BAN ORDER BY ID_Ban ASC"
      );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- GET ALL BOOKINGS (Đặt bàn) -------- */
export async function getBookings(req, res) {
  try {
    await poolConnect;
    // Join DATBAN, BAN và KHACHHANG để lấy tên khách
    const result = await pool.request().query(`
      SELECT 
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
  // Input: guest_name, phone, table_id, guest_count, booking_time
  const { guest_name, phone, table_id, guest_count, booking_time } = req.body;
  // Lấy ID Lễ tân từ Token (req.user do middleware auth giải mã)
  const receptionistId = req.user ? req.user.id : null;

  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // BƯỚC 1: Xử lý KHACHHANG (Vì DATBAN cần FK SDT_Khach)
      // Kiểm tra nếu khách chưa tồn tại thì tạo mới khách vãng lai (Flag_ThanhVien = 0)
      request.input("SDT", sql.VarChar(20), phone);
      request.input("HoTen", sql.NVarChar(50), guest_name);

      const checkCust = await request.query(
        "SELECT 1 FROM KHACHHANG WHERE SDT = @SDT"
      );
      if (checkCust.recordset.length === 0) {
        await request.query(`
            INSERT INTO KHACHHANG (SDT, HoTen, Flag_ThanhVien) 
            VALUES (@SDT, @HoTen, 0)
          `);
      }

      // BƯỚC 2: Kiểm tra bàn có trống không
      // Logic: Kiểm tra trong bảng DATBAN có đơn nào trùng bàn + trùng giờ + trạng thái chưa hủy không
      request.input("ID_Ban", sql.Int, table_id);
      request.input("ThoiGianDat", sql.DateTime, booking_time);

      const conflict = await request.query(`
        SELECT * FROM DATBAN
        WHERE ID_Ban = @ID_Ban
        AND TrangThai IN (N'Đã đặt', N'Đã nhận bàn')
        AND ABS(DATEDIFF(MINUTE, ThoiGianDat, @ThoiGianDat)) < 120 -- Giả sử mỗi slot ăn là 2 tiếng
      `);

      if (conflict.recordset.length > 0) {
        throw new Error("Bàn này đã được đặt trong khung giờ này.");
      }

      // BƯỚC 3: Insert DATBAN
      request.input("SoLuongKhach", sql.Int, guest_count);
      request.input("ID_LeTan", sql.Int, receptionistId);

      await request.query(`
        INSERT INTO DATBAN (SoLuongKhach, ThoiGianDat, TrangThai, ID_LeTan, SDT_Khach, ID_Ban)
        VALUES (@SoLuongKhach, @ThoiGianDat, N'Đã đặt', @ID_LeTan, @SDT, @ID_Ban)
      `);

      // BƯỚC 4: Update trạng thái Bàn
      await request.query(
        "UPDATE BAN SET TrangThai = N'Đã đặt' WHERE ID_Ban = @ID_Ban"
      );

      await transaction.commit();
      res.json({ success: true, message: "Đặt bàn thành công" });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- UPDATE TABLE STATUS -------- */
export async function updateTableStatus(req, res) {
  const { table_id, status } = req.body;
  // status gửi lên phải khớp tiếng Việt: 'Trống', 'Đã đặt', 'Đang phục vụ'

  try {
    await poolConnect;

    await pool
      .request()
      .input("id", sql.Int, table_id)
      .input("status", sql.NVarChar(20), status)
      .query("UPDATE BAN SET TrangThai = @status WHERE ID_Ban = @id");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/reception/book/:id
export async function updateBooking(req, res) {
  const { id } = req.params;
  const { guest_name, phone, guest_count, booking_time } = req.body;

  try {
    await poolConnect;

    // Cập nhật thông tin đặt bàn
    // Lưu ý: Nếu muốn cập nhật tên khách/sđt thì phải update bảng KHACHHANG hoặc link sang khách mới.
    // Ở đây ta update thông tin booking trong bảng DATBAN

    const request = pool
      .request()
      .input("ID", sql.Int, id)
      .input("SoLuongKhach", sql.Int, guest_count)
      .input("ThoiGianDat", sql.DateTime, booking_time);

    // Nếu có logic update khách hàng thì làm thêm query update KHACHHANG ở đây

    await request.query(`
        UPDATE DATBAN 
        SET SoLuongKhach = @SoLuongKhach, ThoiGianDat = @ThoiGianDat
        WHERE ID_DatBan = @ID
    `);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/reception/book/:id
export async function deleteBooking(req, res) {
  const { id } = req.params;
  try {
    await poolConnect;

    // Xóa booking (Nếu đã có order đi kèm thì nên chuyển trạng thái thành 'Đã hủy' thay vì Delete)
    // Tuy nhiên theo yêu cầu DELETE:
    await pool
      .request()
      .input("ID", sql.Int, id)
      .query("DELETE FROM DATBAN WHERE ID_DatBan = @ID");

    // Hoặc update trạng thái:
    // .query("UPDATE DATBAN SET TrangThai = N'Đã hủy' WHERE ID_DatBan = @ID");

    // Reset trạng thái bàn về 'Trống' nếu cần thiết (logic phức tạp hơn cần check trigger)

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
