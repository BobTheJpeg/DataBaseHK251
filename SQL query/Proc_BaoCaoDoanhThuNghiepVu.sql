USE DB_RESTAURANT
GO

-- ===============================================================
-- THỦ TỤC MỚI: TẠO VÀ LƯU BÁO CÁO DOANH THU ĐỊNH KỲ
-- Mục đích: Đáp ứng yêu cầu của bảng BAOCAODOANHTHU
-- Logic: 
--   1. Tính Tổng Doanh Thu (từ THANHTOAN)
--   2. Tính Tổng Chi Phí (Nhập hàng + Lương nhân viên)
--   3. Lưu vào bảng BAOCAODOANHTHU
-- ===============================================================

IF OBJECT_ID('dbo.sp_TaoVaLuuBaoCao', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_TaoVaLuuBaoCao;
GO

CREATE PROCEDURE dbo.sp_TaoVaLuuBaoCao (
    @LoaiBaoCao NVARCHAR(10), -- 'Tháng', 'Quý', 'Năm'
    @Ky INT,                  -- Ví dụ: Tháng 11, Quý 4
    @Nam INT                  -- Ví dụ: 2023
)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TuNgay DATE;
    DECLARE @DenNgay DATE;
    
    -- 1. XÁC ĐỊNH KHOẢNG THỜI GIAN (TỪ NGÀY - ĐẾN NGÀY)
    IF @LoaiBaoCao = N'Tháng'
    BEGIN
        SET @TuNgay = DATEFROMPARTS(@Nam, @Ky, 1);
        SET @DenNgay = EOMONTH(@TuNgay);
    END
    ELSE IF @LoaiBaoCao = N'Quý'
    BEGIN
        SET @TuNgay = DATEFROMPARTS(@Nam, (@Ky - 1) * 3 + 1, 1);
        SET @DenNgay = EOMONTH(DATEADD(MONTH, 2, @TuNgay));
    END
    ELSE IF @LoaiBaoCao = N'Năm'
    BEGIN
        SET @TuNgay = DATEFROMPARTS(@Nam, 1, 1);
        SET @DenNgay = DATEFROMPARTS(@Nam, 12, 31);
    END
    ELSE
    BEGIN
        PRINT N'❌ Lỗi: Loại báo cáo không hợp lệ (Chỉ nhận Tháng/Quý/Năm)';
        RETURN;
    END

    -- Kiểm tra báo cáo đã tồn tại chưa (Tránh trùng lặp - Unique Constraint)
    IF EXISTS (SELECT 1 FROM BAOCAODOANHTHU WHERE LoaiBaoCao = @LoaiBaoCao AND Ky = @Ky AND Nam = @Nam)
    BEGIN
        PRINT N'⚠️ Báo cáo này đã tồn tại. Đang cập nhật lại số liệu...';
        -- Nếu muốn cập nhật thì dùng UPDATE, ở đây ta xóa cũ tạo mới hoặc update
        DELETE FROM BAOCAODOANHTHU WHERE LoaiBaoCao = @LoaiBaoCao AND Ky = @Ky AND Nam = @Nam;
    END

    -- 2. TÍNH TOÁN SỐ LIỆU
    DECLARE @TongDoanhThu DECIMAL(18, 0) = 0;
    DECLARE @TongChiPhi DECIMAL(18, 0) = 0;
    DECLARE @ChiPhiNguyenLieu DECIMAL(18, 0) = 0;
    DECLARE @ChiPhiLuong DECIMAL(18, 0) = 0;

    -- A. Tính Doanh Thu (Từ những đơn đã thanh toán trong kỳ)
    SELECT @TongDoanhThu = ISNULL(SUM(ThanhTien), 0)
    FROM THANHTOAN
    WHERE CONVERT(DATE, ThoiGianThanhToan) BETWEEN @TuNgay AND @DenNgay;

    -- B. Tính Chi Phí 1: Nhập Nguyên Liệu (Từ bảng CUNGCAP)
    SELECT @ChiPhiNguyenLieu = ISNULL(SUM(TongTien), 0)
    FROM CUNGCAP
    WHERE ThoiGian BETWEEN @TuNgay AND @DenNgay;

    -- C. Tính Chi Phí 2: Lương Nhân Viên (Giả định tính cho 1 tháng/quý/năm)
    -- Lấy tổng lương cơ bản hiện tại của toàn bộ nhân viên
    DECLARE @TongLuongCoBan DECIMAL(18, 0);
    SELECT @TongLuongCoBan = ISNULL(SUM(Luong), 0) FROM NHANVIEN WHERE NgayNghiViec IS NULL;

    -- Nhân hệ số thời gian (Tháng = 1, Quý = 3, Năm = 12)
    IF @LoaiBaoCao = N'Tháng' SET @ChiPhiLuong = @TongLuongCoBan * 1;
    IF @LoaiBaoCao = N'Quý'   SET @ChiPhiLuong = @TongLuongCoBan * 3;
    IF @LoaiBaoCao = N'Năm'   SET @ChiPhiLuong = @TongLuongCoBan * 12;

    -- Tổng Chi Phí
    SET @TongChiPhi = @ChiPhiNguyenLieu + @ChiPhiLuong;

    -- 3. LƯU VÀO BẢNG (INSERT)
    INSERT INTO BAOCAODOANHTHU (ThoiGianLap, LoaiBaoCao, Ky, Nam, TongDoanhThu, TongChiPhi)
    VALUES (SYSUTCDATETIME(), @LoaiBaoCao, @Ky, @Nam, @TongDoanhThu, @TongChiPhi);

    -- 4. HIỂN THỊ KẾT QUẢ VỪA TẠO
    PRINT N'✅ Đã tạo báo cáo thành công!';
    SELECT * FROM BAOCAODOANHTHU WHERE LoaiBaoCao = @LoaiBaoCao AND Ky = @Ky AND Nam = @Nam;
END
GO
