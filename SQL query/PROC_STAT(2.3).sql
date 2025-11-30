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
