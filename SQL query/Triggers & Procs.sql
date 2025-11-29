-- ========================================================
-- PROCEDURE CRUD CHO NHAN VIEN 
-- ========================================================
GO
/* Triggers & Procedures */
CREATE TRIGGER trg_ChiMotQuanLyActive
ON QUANLY
FOR INSERT, UPDATE
AS
BEGIN
    -- Logic: Kiểm tra nếu có dòng vừa thêm/sửa mà NgayKetThuc IS NULL (Đang tại chức)
    IF EXISTS (SELECT 1 FROM inserted WHERE NgayKetThuc IS NULL)
    BEGIN
        -- Đếm xem có bao nhiêu người đang tại chức trong toàn bảng
        DECLARE @CountActive INT;
        SELECT @CountActive = COUNT(*) FROM QUANLY WHERE NgayKetThuc IS NULL;

        -- Nếu > 1 người -> Lỗi
        IF @CountActive > 1
        BEGIN
            RAISERROR (N'Lỗi nghiệp vụ: Tại một thời điểm chỉ được phép có 1 Quản Lý đang tại chức.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END
END;

GO
CREATE TRIGGER trg_ChiMotBepTruongActive
ON BEPTRUONG
FOR INSERT, UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted WHERE NgayKetThuc IS NULL)
    BEGIN
        DECLARE @CountActive INT;
        SELECT @CountActive = COUNT(*) FROM BEPTRUONG WHERE NgayKetThuc IS NULL;

        IF @CountActive > 1
        BEGIN
            RAISERROR (N'Lỗi nghiệp vụ: Tại một thời điểm chỉ được phép có 1 Bếp Trưởng đang tại chức.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END
END;

GO
-- PROCEDURE: thêm nhân viên
CREATE PROCEDURE sp_ThemNhanVien
    -- THÔNG TIN CƠ BẢN (Bắt buộc)
    @CCCD               VARCHAR(12),
    @HoTen              NVARCHAR(200),

    @Username           VARCHAR(50),
    @Password           VARCHAR(255),

    @NgaySinh           DATE,
    @NgayVaoLam         DATE,
    @Luong              DECIMAL(12,2),
    @DiaChi             NVARCHAR(300),
    @ChucDanh           NVARCHAR(50),
    @LoaiHinhLamViec    NVARCHAR(50),
    @SDT_Chinh          VARCHAR(20), -- SĐT đầu tiên để liên lạc
    
    @ID_GiamSat         INT = NULL,

    -- THÔNG TIN KHÁC (Không bắt buộc)
    @NgayNhanChuc       DATE = NULL,        
    @ChuyenMon          NVARCHAR(50) = NULL,
    @CaLamViec          NVARCHAR(20) = NULL,
    @NhomNguyenLieu     NVARCHAR(20) = NULL, 
    @NgoaiNgu           NVARCHAR(100) = NULL 
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- ========================================================
        -- A. VALIDATE DOMAIN & DATA INTEGRITY (Kiểm tra dữ liệu)
        -- ========================================================

        -- 1. Validate Tuổi (>= 18)
        IF (DATEDIFF(DAY, @NgaySinh, GETDATE()) / 365.25 < 18)
            THROW 50001, N'Lỗi: Nhân viên phải từ 18 tuổi trở lên.', 1;

        -- 2. Validate SĐT (Định dạng)
        IF LEN(@SDT_Chinh) < 10 OR @SDT_Chinh LIKE '%[^0-9]%'
            THROW 50002, N'Lỗi: Số điện thoại không hợp lệ.', 1;

        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE Username = @Username)
        THROW 50013, N'Lỗi: Tên đăng nhập (Username) này đã được sử dụng.', 1;
        
        -- 3. Validate Trùng SĐT (Trong bảng SDT)
        IF EXISTS (SELECT 1 FROM SDT_NHANVIEN WHERE SDT = @SDT_Chinh)
            THROW 50003, N'Lỗi: Số điện thoại này đã tồn tại trong hệ thống.', 1;

        -- 4. Validate Trùng CCCD
        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE CCCD = @CCCD)
            THROW 50004, N'Lỗi: Số CCCD này đã tồn tại.', 1;

        -- 5. Validate Lương
        IF @Luong <= 0
            THROW 50005, N'Lỗi: Lương phải lớn hơn 0.', 1;

        -- ========================================================
        -- B. VALIDATE BUSINESS LOGIC (Nghiệp vụ chức danh)
        -- ========================================================
        
        -- 1. Ngày nhận chức không được nhỏ hơn ngày vào làm
        IF @NgayNhanChuc IS NOT NULL AND @NgayNhanChuc < @NgayVaoLam
            THROW 50006, N'Lỗi: Ngày nhận chức không được trước Ngày vào làm.', 1;

        -- 2. Logic Giám sát (ID_GiamSat)
        IF @ID_GiamSat IS NOT NULL
        BEGIN
            -- Check tồn tại
            IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID_GiamSat)
                THROW 50007, N'Lỗi: ID Giám sát không tồn tại.', 1;
            
            -- Cấp cao nhất không có giám sát
            IF @ChucDanh IN (N'Quản lý', N'Bếp trưởng')
                THROW 50008, N'Lỗi: Quản lý và Bếp trưởng là cấp cao nhất, không nhập người giám sát.', 1;
        END

        -- 3. Logic riêng từng chức danh
        IF @ChucDanh = N'Phục vụ' AND @CaLamViec IS NULL
            THROW 50009, N'Lỗi: Nhân viên Phục vụ bắt buộc phải có Ca làm việc.', 1;
            
        IF @ChucDanh = N'Lễ tân' AND ISNULL(@NgoaiNgu, '') = ''
            THROW 50010, N'Lỗi: Lễ tân bắt buộc phải có thông tin Ngoại ngữ.', 1;

        -- Logic đặc biệt: Đầu bếp phải do Bếp trưởng giám sát
        IF @ChucDanh = N'Đầu bếp'
        BEGIN
            IF @ID_GiamSat IS NULL
                THROW 50011, N'Lỗi: Đầu bếp bắt buộc phải có người giám sát (Bếp trưởng).', 1;
            
            -- Kiểm tra người giám sát có phải là Bếp trưởng không
            IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID_GiamSat AND ChucDanh = N'Bếp trưởng')
                THROW 50012, N'Lỗi: Người giám sát của Đầu bếp phải là một Bếp trưởng.', 1;
        END

        -- ========================================================
        -- C. EXECUTION (Thực thi Insert)
        -- ========================================================

        -- BƯỚC 1: Insert Bảng Cha (NHANVIEN)
        DECLARE @NewID INT;
        INSERT INTO NHANVIEN (CCCD, HoTen, Username, Password, NgaySinh, NgayVaoLam, Luong, DiaChi, ChucDanh, LoaiHinhLamViec, ID_GiamSat)
        VALUES (@CCCD, @HoTen,@Username,@Password, @NgaySinh, @NgayVaoLam, @Luong, @DiaChi, @ChucDanh, @LoaiHinhLamViec, @ID_GiamSat);

        SET @NewID = SCOPE_IDENTITY();

        -- BƯỚC 2: Insert SĐT Chính
        INSERT INTO SDT_NHANVIEN (ID_NhanVien, SDT)
        VALUES (@NewID, @SDT_Chinh);

        -- BƯỚC 3: Insert Bảng Con (Phân loại chức danh)
        IF @ChucDanh = N'Quản lý'
        BEGIN
            -- Nếu không nhập ngày nhận chức, mặc định là ngày vào làm
            INSERT INTO QUANLY (ID, NgayNhanChuc) 
            VALUES (@NewID, ISNULL(@NgayNhanChuc, @NgayVaoLam));
        END
        ELSE IF @ChucDanh = N'Bếp trưởng'
        BEGIN
            INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) 
            VALUES (@NewID, @ChuyenMon, ISNULL(@NgayNhanChuc, @NgayVaoLam));
        END
        ELSE IF @ChucDanh = N'Phục vụ'
        BEGIN
            INSERT INTO PHUCVU (ID, CaLamViec) 
            VALUES (@NewID, @CaLamViec);
        END
        ELSE IF @ChucDanh = N'Lễ tân'
        BEGIN
            INSERT INTO LETAN (ID, NgoaiNgu) 
            VALUES (@NewID, @NgoaiNgu);
        END
        ELSE IF @ChucDanh = N'Quản lý kho'
        BEGIN
            INSERT INTO QUANLYKHO (ID, NhomNguyenLieu) 
            VALUES (@NewID, @NhomNguyenLieu);
        END

        -- Hoàn tất
        COMMIT TRANSACTION;
        PRINT N'Thêm nhân viên thành công! Mã nhân viên mới: ' + CAST(@NewID AS NVARCHAR(20));
        -- Lấy thông báo để in trong backend
        SELECT N'Thêm nhân viên thành công! Mã NV: ' + CAST(@NewID AS NVARCHAR(20)) AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_CapNhatNhanVien
    @ID                 INT,
    -- THÔNG TIN CHUNG (Optional - Truyền NULL nếu không sửa)
    @HoTen              NVARCHAR(200) = NULL,
    @NgaySinh           DATE = NULL,
    @Luong              DECIMAL(12,2) = NULL,
    @DiaChi             NVARCHAR(300) = NULL,
    @SDT                VARCHAR(20) = NULL, -- Update SĐT chính
    @LoaiHinhLamViec    NVARCHAR(50) = NULL,
    @ID_GiamSat         INT = NULL, -- Có thể đổi người giám sát
    
    -- CHỨC DANH (Xử lý riêng -> nếu khác chức danh cũ -> Kích hoạt logic chuyển đổi)
    @ChucDanhMoi        NVARCHAR(50) = NULL,

    -- THÔNG TIN RIÊNG (Dùng để update hoặc cung cấp cho chức danh mới)
    @NgayNhanChuc       DATE = NULL,
    @Password           VARCHAR(255) = NULL,
    @ChuyenMon          NVARCHAR(50) = NULL,
    @CaLamViec          NVARCHAR(20) = NULL,
    @NhomNguyenLieu     NVARCHAR(20) = NULL,
    @NgoaiNgu           NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- =============================================
        -- A. KIỂM TRA TỒN TẠI & DATA CŨ
        -- =============================================
        IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID)
            THROW 50001, N'Lỗi: Nhân viên không tồn tại.', 1;

        -- Lấy dữ liệu cũ để so sánh
        DECLARE @ChucDanhCu NVARCHAR(50), @NgayNghiViec DATE;
        SELECT @ChucDanhCu = ChucDanh, @NgayNghiViec = NgayNghiViec 
        FROM NHANVIEN WHERE ID = @ID;

        -- Chặn update nếu nhân viên đã nghỉ việc (Soft delete protection)
        IF @NgayNghiViec IS NOT NULL
            THROW 50002, N'Lỗi: Không thể cập nhật thông tin nhân viên đã nghỉ việc.', 1;

        -- Nếu không truyền chức danh mới, mặc định là chức danh cũ
        SET @ChucDanhMoi = ISNULL(@ChucDanhMoi, @ChucDanhCu);

        -- =============================================
        -- B. VALIDATE DỮ LIỆU
        -- =============================================
        -- Validate Lương (Nếu có update)
        IF @Luong IS NOT NULL AND @Luong < 0
            THROW 50003, N'Lỗi: Lương không được âm.', 1;

        -- Validate Giám sát (Không tự giám sát mình)
        IF @ID_GiamSat IS NOT NULL AND @ID_GiamSat = @ID
            THROW 50004, N'Lỗi: Nhân viên không thể tự giám sát chính mình.', 1;

        -- =============================================
        -- C. TRƯỜNG HỢP 1: CÓ THAY ĐỔI CHỨC DANH
        -- =============================================
        IF @ChucDanhMoi <> @ChucDanhCu
        BEGIN
            -- 1. Validate điều kiện cho chức danh MỚI
            IF @ChucDanhMoi = N'Phục vụ' AND @CaLamViec IS NULL
                 THROW 50005, N'Lỗi: Chuyển sang Phục vụ cần nhập Ca làm việc.', 1;
            
            IF @ChucDanhMoi IN (N'Quản lý', N'Bếp trưởng') AND @NgayNhanChuc IS NULL
                 THROW 50006, N'Lỗi: Chuyển sang Quản lý/Bếp trưởng cần nhập Ngày nhận chức.', 1;

            IF @ChucDanhMoi = N'Lễ tân' AND @NgoaiNgu IS NULL
                 THROW 50005, N'Lỗi: Chuyển sang Lễ tân cần nhập Ngoại ngữ.', 1;
            -- 2. Xóa dữ liệu ở bảng con CŨ
            IF @ChucDanhCu = N'Quản lý' DELETE FROM QUANLY WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Bếp trưởng' DELETE FROM BEPTRUONG WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Phục vụ' DELETE FROM PHUCVU WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Lễ tân' 
            BEGIN
                DELETE FROM LETAN_NGOAINGU WHERE ID_LeTan = @ID;
                DELETE FROM LETAN WHERE ID = @ID;
            END
            ELSE IF @ChucDanhCu = N'Quản lý kho' DELETE FROM QUANLYKHO WHERE ID = @ID;

            -- 3. Tạo dữ liệu ở bảng con MỚI
            IF @ChucDanhMoi = N'Quản lý' 
                INSERT INTO QUANLY (ID, NgayNhanChuc) VALUES (@ID, ISNULL(@NgayNhanChuc, GETDATE()));
            ELSE IF @ChucDanhMoi = N'Bếp trưởng' 
                INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) VALUES (@ID, @ChuyenMon, ISNULL(@NgayNhanChuc, GETDATE()));
            ELSE IF @ChucDanhMoi = N'Phục vụ' 
                INSERT INTO PHUCVU (ID, CaLamViec) VALUES (@ID, @CaLamViec);
            ELSE IF @ChucDanhMoi = N'Lễ tân' 
            BEGIN
                INSERT INTO LETAN (ID, NgoaiNgu) VALUES (@ID, ISNULL(@NgoaiNgu, NULL));
            END
            ELSE IF @ChucDanhMoi = N'Quản lý kho' 
                INSERT INTO QUANLYKHO (ID, NhomNguyenLieu) VALUES (@ID, ISNULL(@NhomNguyenLieu, N'Chung'));
        END
        ELSE 
        -- =============================================
        -- D. TRƯỜNG HỢP 2: KHÔNG ĐỔI CHỨC DANH (UPDATE BẢNG CON HIỆN TẠI)
        -- =============================================
        BEGIN
            IF @ChucDanhCu = N'Quản lý' 
                UPDATE QUANLY SET NgayNhanChuc = ISNULL(@NgayNhanChuc, NgayNhanChuc) WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Bếp trưởng'
            BEGIN
                UPDATE BEPTRUONG SET NgayNhanChuc = ISNULL(@NgayNhanChuc, NgayNhanChuc) WHERE ID = @ID;
                UPDATE BEPTRUONG SET ChuyenMon = ISNULL(@ChuyenMon, ChuyenMon), NgayNhanChuc = ISNULL(@NgayNhanChuc, NgayNhanChuc) WHERE ID = @ID;
            END
            ELSE IF @ChucDanhCu = N'Phục vụ'
                UPDATE PHUCVU SET CaLamViec = ISNULL(@CaLamViec, CaLamViec) WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Quản lý kho'
                UPDATE QUANLYKHO SET NhomNguyenLieu = ISNULL(@NhomNguyenLieu, NhomNguyenLieu) WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Lễ tân'
                UPDATE LETAN SET NgoaiNgu = ISNULL(@NgoaiNgu, NgoaiNgu) WHERE ID = @ID;
        END

        -- =============================================
        -- E. UPDATE BẢNG CHA & SĐT (CHUNG)
        -- =============================================
        UPDATE NHANVIEN
        SET HoTen = ISNULL(@HoTen, HoTen),
            NgaySinh = ISNULL(@NgaySinh, NgaySinh),
            Luong = ISNULL(@Luong, Luong),
            DiaChi = ISNULL(@DiaChi, DiaChi),
            LoaiHinhLamViec = ISNULL(@LoaiHinhLamViec, LoaiHinhLamViec),
            ChucDanh = @ChucDanhMoi, -- Cập nhật chức danh mới (nếu có đổi)
            ID_GiamSat = ISNULL(@ID_GiamSat, ID_GiamSat)
        WHERE ID = @ID;

        -- Update SĐT Chính (Lấy số đầu tiên tìm thấy để update nếu chưa có logic SĐT chính/phụ cụ thể)
        -- Lưu ý: Đây là xử lý đơn giản hóa. Nếu muốn chuẩn phải có ID SĐT.
        IF @SDT IS NOT NULL
        BEGIN
            UPDATE TOP(1) SDT_NHANVIEN 
            SET SDT = @SDT 
            WHERE ID_NhanVien = @ID;
        END

        COMMIT TRANSACTION;
        PRINT N'Cập nhật thông tin thành công!';
        -- Thêm để lấy về backend
        SELECT N'Cập nhật thông tin nhân viên ' + CAST(@ID AS NVARCHAR(20)) + N' thành công.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_XoaNhanVien
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- Kiểm tra ID có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID)
            THROW 50001, N'Lỗi: Nhân viên không tồn tại trong hệ thống.', 1;
        -- Kiểm tra xem nhân viên này đã nghỉ việc chưa? (Tránh xóa mềm 2 lần)
        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID AND NgayNghiViec IS NOT NULL)
            THROW 50002, N'Lỗi: Nhân viên này đã nghỉ việc rồi, không thể xóa lần nữa.', 1;

        -- Nếu nhân viên này đang giám sát người khác -> Gỡ bỏ quyền giám sát
        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE ID_GiamSat = @ID)
        BEGIN
            UPDATE NHANVIEN 
            SET ID_GiamSat = NULL 
            WHERE ID_GiamSat = @ID;
        END

        -- Thực hiện xóa mềm (Soft Delete)
        -- A. Update bảng Cha (NHANVIEN)
        UPDATE NHANVIEN
        SET NgayNghiViec = GETDATE(), 
            ID_GiamSat = NULL 
        WHERE ID = @ID;

        -- B. Update bảng Con
        IF EXISTS (SELECT 1 FROM QUANLY WHERE ID = @ID)
        BEGIN
            UPDATE QUANLY 
            SET NgayKetThuc = GETDATE() 
            WHERE ID = @ID AND NgayKetThuc IS NULL; 
        END

        IF EXISTS (SELECT 1 FROM BEPTRUONG WHERE ID = @ID)
        BEGIN
            UPDATE BEPTRUONG 
            SET NgayKetThuc = GETDATE() 
            WHERE ID = @ID AND NgayKetThuc IS NULL;
        END

        COMMIT TRANSACTION;
        PRINT N'Đã thực hiện xóa mềm (cho nghỉ việc) nhân viên thành công.';
        -- Thêm để backend lấy
        SELECT N'Đã cho nhân viên ' + CAST(@ID AS NVARCHAR(20)) + N' nghỉ việc thành công.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

-- ========================================================
-- Xử lý SĐT phụ
-- ========================================================
GO
CREATE PROCEDURE sp_ThemSDT_Phu
    @ID_NhanVien INT,
    @SDT_Phu     VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate: Nhân viên có tồn tại không? (Check FK)
        IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID_NhanVien)
            THROW 50020, N'Lỗi: ID Nhân viên không tồn tại.', 1;

        -- 2. Validate: Định dạng SĐT hợp lệ?
        IF LEN(@SDT_Phu) < 10 OR @SDT_Phu LIKE '%[^0-9]%'
            THROW 50021, N'Lỗi: Định dạng số điện thoại không hợp lệ (Phải là số và >= 10 ký tự).', 1;
        
        -- 3. Validate: Số điện thoại đã được sử dụng chưa? (Check Unique)
        IF EXISTS (SELECT 1 FROM SDT_NHANVIEN WHERE SDT = @SDT_Phu)
            THROW 50022, N'Lỗi: Số điện thoại này đã được sử dụng bởi một nhân viên khác.', 1;

        -- 4. Thực hiện INSERT
        INSERT INTO SDT_NHANVIEN (ID_NhanVien, SDT)
        VALUES (@ID_NhanVien, @SDT_Phu);
        
        COMMIT TRANSACTION;
        PRINT N'Đã thêm số điện thoại phụ (' + @SDT_Phu + N') thành công cho nhân viên ID ' + CAST(@ID_NhanVien AS NVARCHAR(20));
        -- Cho backend
        SELECT N'Đã thêm số ' + @SDT_Phu + N' vào danh sách liên lạc.' AS Message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_XoaSDT_Phu
    @ID_NhanVien INT,
    @SDT_Phu     VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate: Kiểm tra xem số điện thoại có tồn tại cho nhân viên này không
        IF NOT EXISTS (SELECT 1 FROM SDT_NHANVIEN WHERE ID_NhanVien = @ID_NhanVien AND SDT = @SDT_Phu)
            THROW 50024, N'Lỗi: Số điện thoại này không tồn tại cho nhân viên ID ', 1;

        -- 2. Validate: Kiểm tra nghiệp vụ - Phải có ít nhất một SĐT (ngăn xóa số cuối cùng)
        IF (SELECT COUNT(*) FROM SDT_NHANVIEN WHERE ID_NhanVien = @ID_NhanVien) = 1
            THROW 50023, N'Lỗi: Không thể xóa số điện thoại này. Nhân viên phải có ít nhất một số liên lạc.', 1;

        -- 3. Thực hiện DELETE
        DELETE FROM SDT_NHANVIEN
        WHERE ID_NhanVien = @ID_NhanVien AND SDT = @SDT_Phu;
        
        COMMIT TRANSACTION;
        PRINT N'Đã xóa số điện thoại phụ (' + @SDT_Phu + N') thành công.';
        -- Cho backend
        SELECT N'Đã xóa số ' + @SDT_Phu + N' khỏi danh sách.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

-- ========================================================
-- PROCEDURE THỐNG KÊ TỔNG ĐƠN CỦA TỪNG NHÂN VIÊN THEO THÁNG
-- ========================================================
GO
CREATE PROCEDURE sp_ThongKeHieuSuatPhucVu
    @Thang INT,
    @Nam INT,
    @DoanhThuSan    DECIMAL(18,0) -- Mức doanh thu tối thiểu để được hiển thị (KPI)
AS
BEGIN
    SET NOCOUNT ON;
    -- Truy vấn từ 2 bảng (NHANVIEN, DONGOIMON)
    SELECT 
        NV.ID,
        NV.HoTen,
        COUNT(D.ID) AS SoLuongDon, 
        SUM(TT.ThanhTien) AS TongDoanhThu,
        CAST(AVG(TT.ThanhTien) AS DECIMAL(10, 2)) AS DoanhThuTrungBinh
    FROM NHANVIEN NV
    JOIN DONGOIMON D ON NV.ID = D.ID_PhucVu 
    JOIN THANHTOAN TT ON D.ID = TT.ID_Don 
    WHERE MONTH(D.ThoiGianTao) = @Thang 
        AND YEAR(D.ThoiGianTao) = @Nam
        AND D.TrangThai = N'Đã thanh toán' 
        
    GROUP BY
        NV.ID, NV.HoTen
    HAVING 
        SUM(TT.ThanhTien) >= @DoanhThuSan 
    ORDER BY 
        TongDoanhThu DESC;
END;

-- ========================================================
-- PROCEDURE ĐẶT BÀN
-- ========================================================
GO
CREATE TRIGGER trg_KiemTraDatBan
ON DATBAN
FOR INSERT, UPDATE
AS
BEGIN
    -- 1. Check Thời gian đặt không được ở quá khứ (Chỉ check khi Insert mới hoặc Update giờ)
    IF EXISTS (SELECT 1 FROM inserted WHERE ThoiGianDat < GETDATE())
    BEGIN
        RAISERROR (N'Lỗi: Thời gian đặt bàn không được nhỏ hơn thời điểm hiện tại.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 2. Check Logic Chuyển đổi trạng thái hợp lệ
    IF EXISTS (
        SELECT 1 
        FROM deleted d 
        JOIN inserted i ON d.ID_DatBan = i.ID_DatBan
        WHERE (d.TrangThai = N'Đã hủy' AND i.TrangThai <> N'Đã hủy') -- Đơn đã hủy không thể chọn trạng thái khác
           OR (d.TrangThai = N'Đã nhận bàn' AND i.TrangThai = N'Đã đặt') -- Đã vào ăn thì không quay lại đặt
    )
    BEGIN
        RAISERROR (N'Lỗi: Chuyển đổi trạng thái đặt bàn không hợp lệ.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;

-- BackEnd cần xử lý thao tác sp_TaoDatBan va spNhanBan cho khách đặt trc và khách vãng lai:
--  Đặt trc: thao tác được gọi cách nhau
--  Vãng lai:2 thao tác cần được gọi tuần tự tại cùng 1 thời điểm
GO
CREATE PROCEDURE sp_TaoDatBan
    @SDT_Khach      VARCHAR(20),
    @TenKhach       NVARCHAR(50), -- Để tạo mới nếu chưa có
    @SoLuongKhach   INT,
    @ThoiGianDat    DATETIME2,
    @ID_Ban         INT = NULL, -- Optional: Nếu khách chỉ định bàn cụ thể
    @ID_LeTan       INT,
    @GhiChu         NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- VALIDATION
        -- Thời gian đặt phải ở tương lai
        -- Tuy nhiên có xử lý trường hợp tiếp khách vãng lai sẽ cho phép:
        --  thời gian đặt sẽ sớm hơn GETDATE() 10p để xử lý độ trễ thao tác
        IF @ThoiGianDat < DATEADD(MINUTE, -10, GETDATE())
            THROW 50001, N'Lỗi: Thời gian đặt phải ở tương lai', 1;

        IF @SoLuongKhach <= 0
            THROW 50002, N'Lỗi: Số lượng khách phải lớn hơn 0.', 1;

        -- Tạo khách hàng nếu khách hàng chưa tồn tại trong db
        IF NOT EXISTS (SELECT 1 FROM KHACHHANG WHERE SDT = @SDT_Khach)
        BEGIN
            -- Tự động tạo khách vãng lai nếu chưa có
            INSERT INTO KHACHHANG (SDT, HoTen, Flag_ThanhVien) 
            VALUES (@SDT_Khach, @TenKhach, 0);
        END

        -- XỬ LÝ TABLE TURNOVER
        -- Định nghĩa khung giờ bận: [ThoiGianDat - 1.5h] đến [ThoiGianDat + 1.5h]
        -- Bất kỳ đơn đặt bàn nào nằm trong khung này coi như gây xung đột.
        DECLARE @GioBatDau DATETIME2 = DATEADD(HOUR, -1.5, @ThoiGianDat);
        DECLARE @GioKetThuc DATETIME2 = DATEADD(HOUR, 1.5, @ThoiGianDat);

        -- CASE: (KHÁCH CHỈ ĐỊNH BÀN) hoặc (LỄ TÂN CHỌN BÀN)
        IF @ID_Ban IS NOT NULL
        BEGIN
            -- Check 1: Bàn có tồn tại và đủ sức chứa không?
            IF NOT EXISTS (SELECT 1 FROM BAN WHERE ID_Ban = @ID_Ban AND SucChua >= @SoLuongKhach)
                THROW 50003, N'Lỗi: Bàn không tồn tại hoặc sức chứa không đủ.', 1;

            -- Check 2: Bàn có bị trùng lịch trong khung giờ +/- 1.5 tiếng không? (không check đơn đã hủy)
            IF EXISTS (
                SELECT 1 FROM DATBAN 
                WHERE ID_Ban = @ID_Ban 
                  AND TrangThai IN (N'Đã đặt', N'Đã nhận bàn') -- Chỉ check lịch active
                  AND ThoiGianDat BETWEEN @GioBatDau AND @GioKetThuc
            )
            THROW 50004, N'Lỗi: Thời gian đặt không khả dụng', 1;
        END
        
        -- CASE: Khách không chỉ định -> Hệ thống tự gợi ý
        ELSE
        BEGIN
            -- Tìm 1 bàn thỏa mãn: Đủ sức chứa VÀ Không bị trùng lịch (ưu tiên bàn nhỏ nhất thảo đk)
            SELECT TOP(1) @ID_Ban = B.ID_Ban
            FROM BAN B
            WHERE B.SucChua >= @SoLuongKhach
              AND NOT EXISTS (
                  SELECT 1 FROM DATBAN DB
                  WHERE DB.ID_Ban = B.ID_Ban
                    AND DB.TrangThai IN (N'Đã đặt', N'Đã nhận bàn')
                    AND DB.ThoiGianDat BETWEEN @GioBatDau AND @GioKetThuc
              )
            ORDER BY B.SucChua ASC;

            IF @ID_Ban IS NULL
                THROW 50005, N'Lỗi: Không còn bàn trống khả dụng.', 1;
        END

        -- =============================================
        -- TẠO ĐƠN ĐẶT BÀN
        -- =============================================
        INSERT INTO DATBAN (SoLuongKhach, ThoiGianDat, TrangThai, GhiChu, ID_LeTan, SDT_Khach, ID_Ban)
        VALUES (@SoLuongKhach, @ThoiGianDat, N'Đã đặt', @GhiChu, @ID_LeTan, @SDT_Khach, @ID_Ban);
        
        UPDATE BAN SET TrangThai = N'Đã đặt' WHERE ID_Ban = @ID_Ban;
        COMMIT TRANSACTION;
        PRINT N'Đặt bàn thành công! Mã bàn: ' + CAST(@ID_Ban AS NVARCHAR(10));

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_NhanBan
    @ID_DatBan INT,
    @ID_LeTan  INT,
    @ID_PhucVu INT -- Cần thiết để khởi tạo đon gọi món
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate
        IF NOT EXISTS (SELECT 1 FROM DATBAN WHERE ID_DatBan = @ID_DatBan AND TrangThai = N'Đã đặt')
            THROW 50001, N'Lỗi: Phiếu đặt bàn không tồn tại hoặc trạng thái không hợp lệ.', 1;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DATBAN WHERE ID_DatBan = @ID_DatBan;

        -- 2. Update DATBAN -> Đã nhận
        UPDATE DATBAN 
        SET TrangThai = N'Đã nhận bàn' 
        WHERE ID_DatBan = @ID_DatBan;

        -- 3. Update BAN -> Đang phục vụ (Real-time status)
        UPDATE BAN 
        SET TrangThai = N'Đang phục vụ' 
        WHERE ID_Ban = @ID_Ban;

        -- 4. Tự động tạo DONGOIMON (Mở bill)
        -- ID_PhucVu tạm thời NULL hoặc gán đại diện, sau này cập nhật khi gọi món
        INSERT INTO DONGOIMON (ThoiGianTao, TrangThai, ID_Ban, ID_PhucVu)
        VALUES (SYSUTCDATETIME(), N'Đang phục vụ', @ID_Ban, @ID_PhụcVu);

        COMMIT TRANSACTION;
        PRINT N'Khách đã nhận bàn. Đơn gọi món đã được tạo.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
CREATE PROCEDURE sp_HuyDatBan
    @ID_DatBan INT,
    @GhiChuHuy NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM DATBAN WHERE ID_DatBan = @ID_DatBan AND TrangThai = N'Đã đặt')
            THROW 50001, N'Lỗi: Chỉ có thể hủy các đơn ở trạng thái Đã đặt.', 1;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DATBAN WHERE ID_DatBan = @ID_DatBan;

        -- 1. Update DATBAN -> Đã hủy
        UPDATE DATBAN 
        SET TrangThai = N'Đã hủy',
            GhiChu = ISNULL(GhiChu, '') + N' | Lý do hủy: ' + ISNULL(@GhiChuHuy, N'Khách hủy')
        WHERE ID_DatBan = @ID_DatBan;

        -- 2. Trả trạng thái BAN về Trống (Nếu trước đó set là đã đặt)
        UPDATE BAN 
        SET TrangThai = N'Trống' 
        WHERE ID_Ban = @ID_Ban AND TrangThai = N'Đã đặt';

        COMMIT TRANSACTION;
        PRINT N'Đã hủy đặt bàn thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- ========================================================
-- TRIGGER DONGOIMON 
-- ========================================================

-- NOTE: các PROC tạo cập nhật đon gọi món sẽ được xử lý bên trong việc đặt bàn và khi dóng đơn
GO
CREATE TRIGGER trg_KiemTraDonGoiMon
ON DONGOIMON
FOR INSERT, UPDATE
AS
BEGIN
    -- 1. Chặn việc chuyển trạng thái ngược (Đã thanh toán -> Đang phục vụ)
    IF EXISTS (
        SELECT 1 
        FROM deleted d 
        JOIN inserted i ON d.ID = i.ID
        WHERE d.TrangThai = N'Đã thanh toán' AND i.TrangThai = N'Đang phục vụ'
    )
    BEGIN
        RAISERROR (N'Lỗi: Không thể chuyển đơn từ "Đã thanh toán" sang "Đang phục vụ".', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 2. Chặn việc tạo đơn mới trên Bàn đang bận (Chỉ check khi Insert)
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        JOIN DONGOIMON d ON i.ID_Ban = d.ID_Ban
        WHERE i.ID <> d.ID -- Khác chính nó
          AND d.TrangThai = N'Đang phục vụ' -- Đơn cũ chưa đóng
          AND i.TrangThai = N'Đang phục vụ' -- Đơn mới định mở
    )
    BEGIN
        RAISERROR (N'Lỗi: Bàn này đang có đơn hàng chưa thanh toán. Vui lòng thanh toán đơn cũ trước khi mở đơn mới.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;

-- ========================================================
-- PROCEDURE CHO NGHIỆP VỤ ORDERING
-- ========================================================
GO
CREATE PROCEDURE sp_TaoLanGoiMon
    @ID_Don     INT,
    @GhiChu     NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @ThoiDiemGoi DATETIME2 = SYSUTCDATETIME();

        -- VALIDATION
        -- Phải tồn tại và đang phục vụ
        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ')
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã thanh toán.', 1;

        -- 2. VALIDATE ĐƠN HÀNG & LẤY DỮ LIỆU CẦN THIẾT (Gộp Query)
        DECLARE @ID_PhucVu INT;
        DECLARE @ThoiGianTaoDon DATETIME2;

        SELECT 
            @ID_PhucVu = ID_PhucVu,
            @ThoiGianTaoDon = ThoiGianTao
        FROM DONGOIMON 
        WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ';

        IF @ThoiGianTaoDon IS NULL
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã thanh toán.', 1;
        IF @ThoiDiemGoi < @ThoiGianTaoDon
            THROW 50002, N'Lỗi logic: Thời điểm gọi món không thể xảy ra trước khi đơn hàng được tạo.', 1;
        -- Lấy thông tin bếp trưởng
        DECLARE @ID_BepTruongActive INT;
        SELECT TOP(1) @ID_BepTruongActive = ID 
        FROM BEPTRUONG 
        WHERE NgayKetThuc IS NULL;
        -- 4. Tạo Lần Gọi Món mới
        IF @ID_BepTruongActive IS NULL
            PRINT N'Cảnh báo: Hiện tại hệ thống không tìm thấy Bếp trưởng đang tại chức.';

        INSERT INTO LANGOIMON (ID_Don, ThoiDiemGoi, TrangThai, GhiChu, ID_PhucVu, ID_BepTruong)
        VALUES (@ID_Don, @ThoiDiemGoi, N'Đang xử lý', @GhiChu, @ID_PhucVu, @ID_BepTruongActive);

        -- Trả về ID Lần gọi để Backend dùng tiếp cho việc add món
        DECLARE @NewID INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- Return kết quả
        SELECT @NewID AS ID_LanGoiMoi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_ThemMonVaoLanGoi
    @ID_LanGoi  INT,
    @ID_MonAn   INT,
    @SoLuong    INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- VALDATION
        -- Chỉ được thêm món vào các lần gọi đang 'Đang xử lý' (Chưa nấu xong)
        IF NOT EXISTS (SELECT 1 FROM LANGOIMON WHERE ID = @ID_LanGoi AND TrangThai = N'Đang xử lý')
            THROW 50001, N'Lỗi: Lần gọi món này đã hoàn tất hoặc không tồn tại.', 1;

        IF @SoLuong <= 0
            THROW 50002, N'Lỗi: Số lượng phải lớn hơn 0.', 1;

        -- Validate Món ăn & Tình trạng phục vụ
        DECLARE @DonGiaHienTai DECIMAL(12,0);
        DECLARE @DangPhucVu BIT;
        DECLARE @DangKinhDoanh BIT;

        SELECT 
            @DonGiaHienTai = DonGia, 
            @DangPhucVu = DangPhucVu,
            @DangKinhDoanh = DangKinhDoanh
        FROM MONAN 
        WHERE ID = @ID_MonAn;

        -- Check tồn tại
        IF @DonGiaHienTai IS NULL
            THROW 50003, N'Lỗi: Món ăn không tồn tại.', 1;

        -- Check Soft Delete (Đã xóa khỏi menu)
        IF @DangKinhDoanh = 0
            THROW 50004, N'Lỗi: Món ăn này đã ngừng kinh doanh (Xóa khỏi thực đơn).', 1;

        -- Check Availability (Hết hàng tạm thời)
        IF @DangPhucVu = 0
            THROW 50005, N'Lỗi: Món ăn này hiện đang tạm ngưng phục vụ (Hết nguyên liệu).', 1;

        -- Upsert Món ăn (Nếu món đó đã có trong lần gọi này thì cộng dồn số lượng, chưa có thì thêm mới)
        IF EXISTS (SELECT 1 FROM LANGOIMON_MON WHERE ID_LanGoi = @ID_LanGoi AND ID_MonAn = @ID_MonAn)
        BEGIN
            UPDATE LANGOIMON_MON
            SET SoLuong = SoLuong + @SoLuong
            WHERE ID_LanGoi = @ID_LanGoi AND ID_MonAn = @ID_MonAn;
        END
        ELSE
        BEGIN
            INSERT INTO LANGOIMON_MON (ID_LanGoi, ID_MonAn, SoLuong, DonGiaThoiDiem)
            VALUES (@ID_LanGoi, @ID_MonAn, @SoLuong, @DonGiaHienTai);
        END

        PRINT N'Đã thêm món thành công.';

    END TRY
    BEGIN CATCH
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_CapNhatTrangThaiLanGoi
    @ID_LanGoi      INT,
    @TrangThaiMoi   NVARCHAR(20), -- 'Sẵn sàng phục vụ' hoặc 'Đã phục vụ'
    @ID_NhanVien    INT -- Người thực hiện (Bếp trưởng hoặc Phục vụ)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Lấy trạng thái hiện tại
        DECLARE @TrangThaiCu NVARCHAR(20);
        SELECT @TrangThaiCu = TrangThai FROM LANGOIMON WHERE ID = @ID_LanGoi;

        IF @TrangThaiCu IS NULL
            THROW 50001, N'Lỗi: Lần gọi món không tồn tại.', 1;

        -- Xử lý Logic chuyển trạng thái
        
        -- CASE 1: Bếp xác nhận nấu xong (Đang xử lý -> Sẵn sàng)
        IF @TrangThaiMoi = N'Sẵn sàng phục vụ'
        BEGIN
            IF @TrangThaiCu <> N'Đang xử lý'
                THROW 50002, N'Lỗi: Chỉ có thể xác nhận sẵn sàng cho các đơn đang xử lý.', 1;
            UPDATE LANGOIMON 
            SET TrangThai = @TrangThaiMoi, 
                ID_BepTruong = @ID_NhanVien 
            WHERE ID = @ID_LanGoi;
        END

        -- CASE 2: Phục vụ xác nhận đã bưng ra (Sẵn sàng -> Đã phục vụ)
        ELSE IF @TrangThaiMoi = N'Đã phục vụ'
        BEGIN
            -- Cho phép chuyển từ 'Đang xử lý' luôn (trường hợp món nguội ko cần nấu như Nước ngọt)
            --  hoặc từ 'Sẵn sàng phục vụ'
            UPDATE LANGOIMON 
            SET TrangThai = @TrangThaiMoi 
            WHERE ID = @ID_LanGoi;
        END

        ELSE
        BEGIN
            ;THROW 50003, N'Lỗi: Trạng thái không hợp lệ.', 1;
        END

        COMMIT TRANSACTION;
        PRINT N'Cập nhật trạng thái thành công: ' + @TrangThaiMoi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;


-- ========================================================
-- PROCEDURE THANH TOÁN
-- ========================================================
GO
CREATE PROCEDURE sp_ThanhToan
    @ID_Don         INT,
    @Username_LeTan VARCHAR(50), -- Dùng Username extract ID
    @PhuongThuc     NVARCHAR(50),
    
    -- Các tham số Giảm giá (Optional)
    @SDT_Khach      VARCHAR(20) = NULL, -- Khách thành viên (để tích/trừ điểm)
    @DiemSuDung     INT = 0,            -- Số điểm khách muốn dùng để giảm giá
    @LuongGiamGia   DECIMAL(12,0) = 0,  -- Giảm giá tiền mặt trực tiếp (Voucher)
    @PhanTram       FLOAT = 0           -- Giảm giá theo % (VD: 10 = 10%)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- EXTRACT ID LỄ TÂN
        DECLARE @ID_LeTan INT;
        SELECT @ID_LeTan = ID FROM NHANVIEN WHERE Username = @Username_LeTan;
        IF @ID_LeTan IS NULL THROW 50000, N'Lỗi: Tài khoản không tồn tại.', 1;

        -- VALIDATE ĐƠN HÀNG
        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ')
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã được thanh toán.', 1;

        -- TÍNH TỔNG TIỀN MÓN
        DECLARE @TongTienMon DECIMAL(18,0) = 0;
        
        SELECT @TongTienMon = ISNULL(SUM(CT.ThanhTien), 0)
        FROM LANGOIMON_MON CT
        JOIN LANGOIMON L ON CT.ID_LanGoi = L.ID
        WHERE L.ID_Don = @ID_Don;

        IF @TongTienMon = 0
            PRINT N'Cảnh báo: Đơn hàng có giá trị 0 đồng.';

        -- CHECK Thời gian thanh toán (Hiện tại) > Thời gian gọi món cuối cùng
        DECLARE @LanGoiCuoi DATETIME2;
        SELECT @LanGoiCuoi = MAX(ThoiDiemGoi) FROM LANGOIMON WHERE ID_Don = @ID_Don;

        IF @LanGoiCuoi IS NOT NULL AND SYSUTCDATETIME() < @LanGoiCuoi
            THROW 50002, N'Lỗi logic: Thời gian thanh toán không được xảy ra trước lần gọi món cuối cùng.', 1;

        -- XỬ LÝ GIẢM GIÁ
        DECLARE @TongGiamGia DECIMAL(18,0) = 0;
        DECLARE @GiamGiaTuDiem DECIMAL(18,0) = 0;
        DECLARE @GiamGiaTuPercent DECIMAL(18,0) = 0;
        -- a. Xử lý Điểm tích lũy (Nếu có SDT và dùng điểm)
        IF @SDT_Khach IS NOT NULL AND @DiemSuDung > 0
        BEGIN
            DECLARE @DiemHienCo INT;
            SELECT @DiemHienCo = DiemTichLuy 
            FROM KHACHHANG 
            WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1; -- Chỉ check thành viên

            IF @DiemHienCo IS NULL 
                THROW 50003, N'Lỗi: Khách hàng không phải thành viên hoặc không tồn tại.', 1;
            
            IF @DiemHienCo < @DiemSuDung
                THROW 50004, N'Lỗi: Điểm tích lũy của khách không đủ.', 1;

            -- Quy đổi: 1 Điểm = 1.000 VNĐ
            SET @GiamGiaTuDiem = @DiemSuDung * 1000;
            
            -- Trừ điểm ngay lập tức
            UPDATE KHACHHANG SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE SDT = @SDT_Khach;
        END

        -- b. Xử lý Phần trăm
        IF @PhanTramGiam > 0
        BEGIN
            SET @GiamGiaTuPercent = @TongTienMon * (@PhanTramGiam / 100.0);
        END

        -- Tổng hợp giảm giá
        SET @TongGiamGia = @VoucherCode + @GiamGiaTuDiem + @GiamGiaTuPercent;

        -- Check: Giảm giá không được vượt quá tổng tiền
        IF @TongGiamGia > @TongTienMon
            SET @TongGiamGia = @TongTienMon; -- Cập nhật lại bằng tổng tiền (Miễn phí)

        -- INSERT BẢNG THANH TOÁN
        -- ThanhTien sẽ được tự động tính bởi cột Computed Column
        INSERT INTO THANHTOAN (ID_Don, ID_LeTan, SDT_Khach, ThoiGianThanhToan, PhuongThuc, TongTienMon, GiamGia)
        VALUES (@ID_Don, @ID_LeTan, @SDT_Khach, SYSUTCDATETIME(), @PhuongThuc, @TongTienMon, @TongGiamGia);

        -- TÍCH ĐIỂM (Sau khi đã trừ giảm giá)
        IF @SDT_Khach IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM KHACHHANG WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1)
            BEGIN
                DECLARE @ThanhTienThucTe DECIMAL(18,0) = @TongTienMon - @TongGiamGia;
                DECLARE @DiemCong INT = FLOOR(@ThanhTienThucTe / 100000);
                
                IF @DiemCong > 0
                BEGIN
                    UPDATE KHACHHANG 
                    SET DiemTichLuy = DiemTichLuy + @DiemCong 
                    WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1;
                END
            END
        END

        -- ĐÓNG ĐƠN & GIẢI PHÓNG BÀN
        UPDATE DONGOIMON SET TrangThai = N'Đã thanh toán' WHERE ID = @ID_Don;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DONGOIMON WHERE ID = @ID_Don;
        IF @ID_Ban IS NOT NULL
            UPDATE BAN SET TrangThai = N'Trống' WHERE ID_Ban = @ID_Ban;

        COMMIT TRANSACTION;
        PRINT N'Thanh toán thành công. Tổng tiền: ' + CAST(@TongTienMon AS NVARCHAR(20)) + N'. Thực thu: ' + CAST((@TongTienMon - @TongGiamGia) AS NVARCHAR(20));

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO