import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* -------- KITCHEN QUEUE (DUMMY DATA) -------- */
export async function getKitchenQueue(req, res) {
  try {
    // Code dummy trả về danh sách món đang chờ nấu
    const dummyQueue = [
      {
        id: 1,
        tableName: "Bàn 5",
        dishName: "Phở Bò",
        quantity: 2,
        status: "Đang chờ",
        time: "18:30",
      },
      {
        id: 2,
        tableName: "Bàn 2",
        dishName: "Cơm Tấm",
        quantity: 1,
        status: "Đang nấu",
        time: "18:35",
      },
      {
        id: 3,
        tableName: "Bàn 8",
        dishName: "Lẩu Thái",
        quantity: 1,
        status: "Đang chờ",
        time: "18:40",
      },
    ];
    res.json(dummyQueue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  // Code dummy update
  res.json({
    success: true,
    message: `Đã cập nhật đơn #${id} sang trạng thái: ${status}`,
  });
}

/* -------- MENU REQUESTS (YÊU CẦU CẬP NHẬT THỰC ĐƠN) -------- */

// Gửi yêu cầu cập nhật
export async function submitMenuRequest(req, res) {
  const {
    chefId,
    type,
    dishId, // type: 'Thêm', 'Sửa', 'Xóa'
    name,
    price,
    category,
    description,
    reason,
  } = req.body;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("ID_BepTruong", sql.Int, chefId);
    request.input("LoaiYeuCau", sql.NVarChar(10), type);
    request.input("ID_MonAn", sql.Int, dishId || null);
    request.input("TenMon", sql.NVarChar(100), name || null);
    request.input("DonGia", sql.Decimal(12, 0), price || null);
    request.input("MoTa", sql.NVarChar(500), description || null);
    request.input("PhanLoai", sql.NVarChar(10), category || null);
    request.input("LyDo", sql.NVarChar(200), reason);

    const result = await request.execute("sp_GuiYeuCauCapNhat");

    res.json({
      success: true,
      message: result.recordset[0]?.Message,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Lấy lịch sử yêu cầu của bếp trưởng
export async function getChefRequests(req, res) {
  const { chefId } = req.params;
  try {
    await poolConnect;
    const result = await pool.request().input("ID", sql.Int, chefId).query(`
                SELECT R.*, M.Ten as TenMonHienTai
                FROM CAPNHAT_MONAN R
                LEFT JOIN MONAN M ON R.ID_MonAn = M.ID
                WHERE R.ID_BepTruong = @ID
                ORDER BY R.ThoiGianTao DESC
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
