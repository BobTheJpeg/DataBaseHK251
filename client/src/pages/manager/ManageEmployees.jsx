import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // track editing row

  const [form, setForm] = useState({
    cccd: "",
    name: "",
    username: "",
    password: "",
    dob: "",
    startDate: new Date().toISOString().split("T")[0], // Mặc định hôm nay
    salary: "",
    address: "",
    phone: "",
    role: "Phục vụ",
    workType: "Fulltime",
    supervisorId: "", // Optional
  });

  // Load employees
  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/manager/employees", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        // Đọc lỗi chi tiết từ Backend trả về
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error || res.statusText || "Lỗi không xác định";

        console.error("Lỗi API tải nhân viên:", res.status, msg);
        setError(`Lỗi ${res.status}: ${msg}`);

        // Nếu lỗi 401/403 (Hết hạn/Không quyền), có thể logout
        if (res.status === 401) {
          // sessionStorage.clear(); window.location.href = '/login';
        }
        return;
      }

      const data = await res.json();
      setEmployees(data);
    } catch {
      setError("Lỗi máy chủ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Create / Update employee
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Backend endpoint
    const url = editing
      ? `http://localhost:3000/api/manager/update-employee/${editing.id}` // Cần đảm bảo backend có route này
      : `http://localhost:3000/api/manager/add-employee`;

    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Hiển thị lỗi từ backend (vd: Lương âm, chưa đủ tuổi...)
        setError(data.error || "Lưu nhân viên thất bại");
        alert(data.error);
        return;
      }

      alert(editing ? "Cập nhật thành công!" : "Thêm nhân viên thành công!");
      await loadEmployees();
      resetForm();
    } catch {
      setError("Lỗi kết nối hoặc lỗi máy chủ");
    }
  }

  function resetForm() {
    setForm({
      cccd: "",
      name: "",
      username: "",
      password: "",
      dob: "",
      startDate: new Date().toISOString().split("T")[0],
      salary: "",
      address: "",
      phone: "",
      role: "Phục vụ",
      workType: "Fulltime",
      supervisorId: "",
    });
    setEditing(null);
  }

  async function deleteEmployee(id) {
    if (!confirm("Bạn có chắc muốn xóa nhân viên này (Cho nghỉ việc)?")) return;

    try {
      await fetch(`http://localhost:3000/api/manager/delete-employee/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });
      loadEmployees();
    } catch (err) {
      console.error(err);
      setError("Không thể xóa nhân viên");
    }
  }

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
        Quản Lý Nhân Viên
      </h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "30px" }}>
        {/* LEFT: EMPLOYEE TABLE */}
        <div style={{ flex: 2 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Họ Tên</th>
                  <th style={{ width: "20%" }}>Username</th>
                  <th style={{ width: "20%" }}>Chức Danh</th>
                  <th style={{ width: "20%" }}>SĐT</th>
                  <th style={{ width: "20%", textAlign: "center" }}>
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
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.name}</td>
                      <td>{emp.username}</td>
                      <td>{emp.role}</td>
                      <td>{emp.phone}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn"
                          style={{
                            marginRight: "5px",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => {
                            // Lưu ý: Khi edit, cần load đủ thông tin chi tiết vào form
                            // Ở đây ta giả lập fill các field có sẵn từ list
                            setEditing(emp);
                            setForm((prev) => ({
                              ...prev,
                              name: emp.name,
                              username: emp.username,
                              role: emp.role,
                              phone: emp.phone,
                              // Các trường khác nếu API getList không trả về thì phải gọi API detail hoặc để trống
                            }));
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn"
                          style={{
                            background: "#c62828",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => deleteEmployee(emp.id)}
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

        {/* RIGHT: FORM */}
        <div className="form" style={{ flex: 1, minWidth: "350px" }}>
          <h3>{editing ? "Cập Nhật Nhân Viên" : "Thêm Mới Nhân Viên"}</h3>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Nhóm thông tin đăng nhập */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <input
                placeholder="Username *"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                disabled={editing} // Không cho sửa username
              />
              <input
                placeholder={
                  editing ? "Mật khẩu mới (trống nếu giữ nguyên)" : "Mật khẩu *"
                }
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
              />
            </div>

            {/* Thông tin cá nhân */}
            <input
              placeholder="Họ và Tên *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <input
                placeholder="CCCD *"
                value={form.cccd}
                maxLength={12}
                onChange={(e) => setForm({ ...form, cccd: e.target.value })}
                required
              />
              <input
                placeholder="Số điện thoại *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <label style={{ fontSize: "12px", color: "#666" }}>
              Ngày sinh *
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
            />

            <input
              placeholder="Địa chỉ"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            {/* Thông tin công việc */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>
                  Mức Lương *
                </label>
                <input
                  type="number"
                  placeholder="VNĐ"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>
                  Ngày vào làm
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
            </div>

            <label style={{ fontSize: "12px", color: "#666" }}>
              Chức Danh & Hình thức
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="Phục vụ">Phục vụ</option>
              <option value="Lễ tân">Lễ tân</option>
              <option value="Đầu bếp">Đầu bếp</option>
              <option value="Bếp trưởng">Bếp trưởng</option>
              <option value="Quản lý kho">Quản lý kho</option>
              <option value="Quản lý">Quản lý</option>
            </select>

            <select
              value={form.workType}
              onChange={(e) => setForm({ ...form, workType: e.target.value })}
            >
              <option value="Fulltime">Toàn thời gian (Fulltime)</option>
              <option value="Parttime">Bán thời gian (Parttime)</option>
            </select>

            {/* Actions */}
            <button
              className="btn"
              style={{ width: "100%", marginTop: "10px" }}
            >
              {editing ? "Lưu Thay Đổi" : "Thêm Nhân Viên"}
            </button>

            {editing && (
              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  background: "#7a4d28",
                }}
                onClick={resetForm}
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
