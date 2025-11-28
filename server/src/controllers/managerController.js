import sql from "mssql";
import bcrypt from "bcrypt";
import { pool, poolConnect } from "../db.js";

/* ---------------- EMPLOYEES (NHANVIEN) ---------------- */

// API thêm nhân viên sử dụng Stored Procedure
export async function addEmployee(req, res) {
  // Frontend cần gửi đủ các trường thông tin theo yêu cầu của DB mới
  const {
    cccd,
    name, // HoTen
    username, // Thay cho email cũ
    password,
    dob, // NgaySinh
    startDate, // NgayVaoLam
    salary, // Luong
    address, // DiaChi
    role, // ChucDanh (Quản lý, Bếp trưởng...)
    workType, // LoaiHinhLamViec (Fulltime/Parttime)
    phone, // SDT_Chinh
    supervisorId, // ID_GiamSat (nếu có)

    // Các field phụ tùy chức danh
    positionDate, // NgayNhanChuc
    expertise, // ChuyenMon (Bếp)
    shift, // CaLamViec (Phục vụ)
    materialGroup, // NhomNguyenLieu (Kho)
    language, // NgoaiNgu (Lễ tân)
  } = req.body;

  try {
    await poolConnect;

    // Hash password trước khi gửi vào DB
    const hash = await bcrypt.hash(password, 10);

    const request = pool.request();

    // Mapping tham số cho Stored Procedure sp_ThemNhanVien
    request.input("CCCD", sql.VarChar(12), cccd);
    request.input("HoTen", sql.NVarChar(200), name);
    request.input("Username", sql.VarChar(50), username);
    request.input("Password", sql.VarChar(255), hash);
    request.input("NgaySinh", sql.Date, dob);
    request.input("NgayVaoLam", sql.Date, startDate || new Date());
    request.input("Luong", sql.Decimal(12, 2), salary);
    request.input("DiaChi", sql.NVarChar(300), address);
    request.input("ChucDanh", sql.NVarChar(50), role);
    request.input("LoaiHinhLamViec", sql.NVarChar(50), workType);
    request.input("SDT_Chinh", sql.VarChar(20), phone);
    request.input("ID_GiamSat", sql.Int, supervisorId || null);

    // Tham số Optional (tùy chức danh)
    request.input("NgayNhanChuc", sql.Date, positionDate || null);
    request.input("ChuyenMon", sql.NVarChar(50), expertise || null);
    request.input("CaLamViec", sql.NVarChar(20), shift || null);
    request.input("NhomNguyenLieu", sql.NVarChar(20), materialGroup || null);
    request.input("NgoaiNgu", sql.NVarChar(100), language || null);

    // Gọi Stored Procedure
    const result = await request.execute("sp_ThemNhanVien");

    // Trả về kết quả thành công
    res.json({
      success: true,
      message: "Thêm nhân viên thành công",
      data: result, // Có thể custom lại tùy ý
    });
  } catch (err) {
    // QUAN TRỌNG: Lỗi từ SQL Server (RAISERROR/THROW) sẽ nằm trong err.message
    // Ví dụ: "Lỗi: Nhân viên phải từ 18 tuổi trở lên."
    res.status(400).json({
      success: false,
      error: err.message, // Trả nguyên văn lỗi từ Database
    });
  }
}

export async function getEmployees(req, res) {
  try {
    await poolConnect;

    // Select từ bảng NHANVIEN và join bảng con nếu cần (ở đây lấy cơ bản)
    // Lưu ý: Không trả về Password và Luong (nếu nhạy cảm)
    const result = await pool.request().query(`
      SELECT 
        ID as id, 
        CCCD as cccd,
        HoTen as name, 
        Username as username, 
        ChucDanh as role,
        LoaiHinhLamViec as workType,
        SDT as phone
      FROM NHANVIEN N
      LEFT JOIN SDT_NHANVIEN S ON N.ID = S.ID_NhanVien -- Lấy tạm 1 số đt
      WHERE N.NgayNghiViec IS NULL
      ORDER BY N.ID ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/manager/update-employee/:id
export async function updateEmployee(req, res) {
  const { id } = req.params;
  const {
    name,
    username,
    password,
    dob,
    salary,
    address,
    phone,
    role,
    workType,
    supervisorId,
    // Optional fields
    positionDate,
    expertise,
    shift,
    materialGroup,
    language,
  } = req.body;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("ID", sql.Int, id);

    // Các tham số chung
    if (name) request.input("HoTen", sql.NVarChar(200), name);
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      request.input("Password", sql.VarChar(255), hash);
    }
    if (dob) request.input("NgaySinh", sql.Date, dob);
    if (salary) request.input("Luong", sql.Decimal(12, 2), salary);
    if (address) request.input("DiaChi", sql.NVarChar(300), address);
    if (phone) request.input("SDT", sql.VarChar(20), phone);
    if (workType) request.input("LoaiHinhLamViec", sql.NVarChar(50), workType);
    if (supervisorId) request.input("ID_GiamSat", sql.Int, supervisorId);

    // Tham số chức danh (Nếu đổi chức danh thì SP sẽ xử lý logic xóa bảng cũ thêm bảng mới)
    if (role) request.input("ChucDanhMoi", sql.NVarChar(50), role);

    // Tham số riêng
    if (positionDate) request.input("NgayNhanChuc", sql.Date, positionDate);
    if (expertise) request.input("ChuyenMon", sql.NVarChar(50), expertise);
    if (shift) request.input("CaLamViec", sql.NVarChar(20), shift);
    if (materialGroup)
      request.input("NhomNguyenLieu", sql.NVarChar(20), materialGroup);
    if (language) request.input("NgoaiNgu", sql.NVarChar(100), language);

    // Gọi Stored Procedure sp_CapNhatNhanVien
    await request.execute("sp_CapNhatNhanVien");

    res.json({ success: true, message: "Cập nhật nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteEmployee(req, res) {
  const { id } = req.params;
  try {
    await poolConnect;
    // Gọi SP xóa
    await pool.request().input("ID", sql.Int, id).execute("sp_XoaNhanVien");

    res.json({ success: true, message: "Đã xóa nhân viên" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- MENU (MONAN) ---------------- */

export async function addMenuItem(req, res) {
  const { name, price, category, description, unit } = req.body;

  try {
    await poolConnect;

    // Tương tác với bảng MONAN
    // Chưa tạo sp_ThemMonAn, ta dùng query trực tiếp nhưng theo schema mới
    const result = await pool
      .request()
      .input("Ten", sql.NVarChar(100), name)
      .input("DonGia", sql.Decimal(12, 0), price)
      .input("PhanLoai", sql.NVarChar(10), category) // Chay/Mặn
      .input("MoTa", sql.NVarChar(500), description || "").query(`
        INSERT INTO MONAN (Ten, DonGia, PhanLoai, MoTa, DangPhucVu, DangKinhDoanh)
        VALUES (@Ten, @DonGia, @PhanLoai, @MoTa, 1, 1);
        
        SELECT SCOPE_IDENTITY() AS id, @Ten AS name, @DonGia AS price, @PhanLoai AS category;
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    // Bắt lỗi Unique Key (Trùng tên món) từ DB
    res.status(500).json({ error: err.message });
  }
}

export async function getMenuItems(req, res) {
  try {
    await poolConnect;

    const result = await pool
      .request()
      .query("SELECT * FROM MONAN WHERE DangKinhDoanh = 1 ORDER BY ID ASC");

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/manager/update-menu-item/:id
export async function updateMenuItem(req, res) {
  const { id } = req.params;
  const { name, price, category, description } = req.body;

  try {
    await poolConnect;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .input("Ten", sql.NVarChar(100), name)
      .input("DonGia", sql.Decimal(12, 0), price)
      .input("PhanLoai", sql.NVarChar(10), category)
      .input("MoTa", sql.NVarChar(500), description).query(`
        UPDATE MONAN 
        SET Ten = @Ten, DonGia = @DonGia, PhanLoai = @PhanLoai, MoTa = @MoTa
        WHERE ID = @ID
      `);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/manager/delete-menu-item/:id
export async function deleteMenuItem(req, res) {
  const { id } = req.params;
  try {
    await poolConnect;
    // Thay vì xóa vĩnh viễn (mất lịch sử order), ta set DangKinhDoanh = 0 (Ẩn khỏi menu)
    await pool
      .request()
      .input("ID", sql.Int, id)
      .query("UPDATE MONAN SET DangKinhDoanh = 0 WHERE ID = @ID");

    res.json({ success: true, message: "Đã xóa món ăn khỏi thực đơn" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- DASHBOARD STATS ---------------- */

export async function getStats(req, res) {
  try {
    await poolConnect;

    // 1. Doanh thu hôm nay: Tính từ bảng THANHTOAN
    const revenueQuery = await pool.request().query(`
      SELECT COALESCE(SUM(ThanhTien), 0) AS revenue
      FROM THANHTOAN
      WHERE CAST(ThoiGianThanhToan AS DATE) = CAST(GETDATE() AS DATE);
    `);

    // 2. Số đơn gọi món hôm nay: Tính từ bảng DONGOIMON
    const ordersQuery = await pool.request().query(`
      SELECT COUNT(*) AS count
      FROM DONGOIMON
      WHERE CAST(ThoiGianTao AS DATE) = CAST(GETDATE() AS DATE);
    `);

    // 3. Số khách hôm nay: Tính từ bảng DATBAN (hoặc ước tính)
    const customersQuery = await pool.request().query(`
      SELECT COALESCE(SUM(SoLuongKhach), 0) AS customers
      FROM DATBAN
      WHERE CAST(ThoiGianDat AS DATE) = CAST(GETDATE() AS DATE)
      AND TrangThai != N'Đã hủy';
    `);

    res.json({
      revenueToday: revenueQuery.recordset[0].revenue,
      ordersToday: ordersQuery.recordset[0].count,
      customersToday: customersQuery.recordset[0].customers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
