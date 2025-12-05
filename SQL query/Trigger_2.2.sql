GO

CREATE OR ALTER TRIGGER trg_CapNhatTongTienDonHang
ON LANGOIMON_MON
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @AffectedOrders TABLE (ID_Don INT);

    INSERT INTO @AffectedOrders (ID_Don)
    SELECT DISTINCT L.ID_Don
    FROM (
        SELECT ID_LanGoi FROM inserted
        UNION
        SELECT ID_LanGoi FROM deleted
    ) AS ChangedRows
    JOIN LANGOIMON L ON ChangedRows.ID_LanGoi = L.ID
    WHERE L.ID_Don IS NOT NULL;

    -- Chỉ cập nhật nếu đơn hàng đó ĐÃ CÓ bản ghi trong bảng THANHTOAN. --> UPDATE bảng THANHTOAN  
    UPDATE T
    SET 
        T.TongTienMon = Calculated.NewTotal,
        T.ThoiGianThanhToan = SYSUTCDATETIME() -- Cập nhật lại thời gian (tùy chọn)
    FROM THANHTOAN T
    JOIN (
        SELECT 
            L.ID_Don,
            SUM(ISNULL(LM.SoLuong * LM.DonGiaThoiDiem, 0)) AS NewTotal
        FROM LANGOIMON L
        JOIN LANGOIMON_MON LM ON L.ID = LM.ID_LanGoi
        WHERE L.ID_Don IN (SELECT ID_Don FROM @AffectedOrders)
        GROUP BY L.ID_Don
    ) AS Calculated ON T.ID_Don = Calculated.ID_Don;
END;