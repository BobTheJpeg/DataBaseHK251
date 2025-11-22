/************************************************************
 SQL Server schema & sample data for Restaurant Management
************************************************************/

USE DB_RESTAURANT

CREATE TABLE NHANVIEN (
    ID              INT IDENTITY(1000,1)    PRIMARY KEY,
    CCCD            NVARCHAR(12)            NOT NULL UNIQUE,   
    HoTen           NVARCHAR(200)           NOT NULL,
    NgaySinh        DATE                    NOT NULL,
    NgayVaoLam      DATE                    NOT NULL,
    Luong           DECIMAL(12,2)           NOT NULL CHECK (Luong > 0),
    DiaChi          NVARCHAR(300),
    ChucDanh        NVARCHAR(50)            NOT NULL CHECK (ChucDanh IN (N'Quản lý',N'Bếp trưởng',N'Đầu bếp',N'Phục vụ',N'Lễ tân',N'Quản lý kho')),
    LoaiHinhLamViec NVARCHAR(50)            NULL,
    ID_GiamSat      INT                     NULL,
    CONSTRAINT CK_NHANVIEN_CCCD CHECK (LEN(CCCD) = 12 AND CCCD NOT LIKE '%[^0-9]%'),
    CONSTRAINT CK_NHANVIEN_AGE CHECK (DATEDIFF(YEAR, NgaySinh, GETDATE()) >= 18),
    CONSTRAINT CK_NHANVIEN_NGAYVAOLAM CHECK (NgayVaoLam <= CONVERT(date, GETDATE()))
);

CREATE TABLE SDT_NHANVIEN (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_NhanVien     INT                 NOT NULL,
    SDT             VARCHAR(20)         UNIQUE NOT NULL
);

CREATE TABLE KHACHHANG (
    SDT             VARCHAR(20)        PRIMARY KEY,
    HoTen           NVARCHAR(50)        NOT NULL,
    Flag_ThanhVien  BIT                 NOT NULL DEFAULT 0,
    Email           NVARCHAR(100),
    NgaySinh        DATE                NULL,
    GioiTinh        NVARCHAR(10)        NULL CHECK (GioiTinh IN (N'Nam',N'Nữ',N'Khác')),
    HangThanhVien   NVARCHAR(20)        NULL CHECK (HangThanhVien IN (N'Thành viên',N'VIP')),
    DiemTichLuy     INT                 NOT NULL DEFAULT 0 CHECK (DiemTichLuy >= 0)
);

CREATE TABLE BAN (
    ID_Ban          INT IDENTITY(1,1)   PRIMARY KEY,
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Trống',N'Đã đặt',N'Đang phục vụ')),
    SucChua         INT                 NOT NULL CHECK (SucChua > 0)
);

CREATE TABLE MONAN (
    ID              INT IDENTITY(5000,1) PRIMARY KEY,
    Ten             NVARCHAR(100)       NOT NULL UNIQUE,
    PhanLoai        NVARCHAR(10)        NOT NULL CHECK (PhanLoai IN (N'Chay',N'Mặn')),
    MoTa            NVARCHAR(500),
    DonGia          DECIMAL(12,0)       NOT NULL CHECK (DonGia > 0),
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Còn',N'Hết'))
);

CREATE TABLE NGUYENLIEU (
    ID              INT IDENTITY(10000,1) PRIMARY KEY,
    Ten             NVARCHAR(500)       NOT NULL,
    DonViTinh       NVARCHAR(50)        NOT NULL,
    SoLuong         DECIMAL(12,0)       NOT NULL CHECK (SoLuong >= 0),
    DonGia          DECIMAL(12,0)       NOT NULL CHECK (DonGia >= 0),
    ID_QuanLyKho    INT                 NULL
);

CREATE TABLE NHACUNGCAP (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    Ten             NVARCHAR(200)       NOT NULL,
    Email           NVARCHAR(100),
    DiaChi          NVARCHAR(300)
);

CREATE TABLE SDT_NHACUNGCAP (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_Nha_Cung_Cap INT                 NOT NULL,
    SDT             VARCHAR(20)         NOT NULL
);

CREATE TABLE CUNGCAP (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_NhaCungCap   INT                 NOT NULL,
    ID_NguyenLieu   INT                 NOT NULL,
    NgayCungCap     DATE                NOT NULL,
    SoLuong         DECIMAL(12,0)       NOT NULL CHECK (SoLuong >= 0),
    DonGia          DECIMAL(12,0)       NOT NULL CHECK (DonGia >= 0),
    TongTien        AS (SoLuong * DonGia) PERSISTED
);

CREATE TABLE KIEMKE (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_QuanLyKho    INT                 NOT NULL,
    ID_NguyenLieu   INT                 NOT NULL,
    Ngay            DATE                NOT NULL,
    Gio             TIME                NULL,
    TinhTrang       NVARCHAR(200)       NULL
);

CREATE TABLE BAOCAODOANHTHU (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ThoiGianLap     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    KyBaoCao        NVARCHAR(10)        NOT NULL CHECK (KyBaoCao IN (N'Tuần',N'Tháng',N'Năm')),
    TongDoanhThu    DECIMAL(18,2)       NOT NULL DEFAULT 0,
    ChiPhi          DECIMAL(18,2)       NOT NULL DEFAULT 0,
    LoiNhuan        AS (TongDoanhThu - ChiPhi),
    ID_QuanLy       INT NULL
);

/* Child tables to NHANVIEN */

CREATE TABLE QUANLY (
    ID              INT                 PRIMARY KEY,
    NgayNhanChuc    DATE                NULL
);

CREATE TABLE BEPTRUONG (
    ID              INT                 PRIMARY KEY,
    ChuyenMon       NVARCHAR(50)        NULL
);

CREATE TABLE DAUBEP (
    ID              INT                 PRIMARY KEY,
    ChuyenMon       NVARCHAR(50)        NULL
);

CREATE TABLE PHUCVU (
    ID              INT                 PRIMARY KEY,
    KhuVucPhucVu    NVARCHAR(50)        NULL
);

CREATE TABLE LETAN (
    ID              INT                 PRIMARY KEY
);

CREATE TABLE LETAN_NGOAINGU (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_LeTan        INT                 NOT NULL,
    NgoaiNgu        NVARCHAR(100)       NOT NULL
);

CREATE TABLE QUANLYKHO (
    ID INT PRIMARY KEY,
    TanSuatKiemKe NVARCHAR(100) NULL
);

/* Operation */

CREATE TABLE DATBAN (
    ID_DatBan       INT IDENTITY(1,1)   PRIMARY KEY,
    SoLuongKhach    INT                 NOT NULL CHECK (SoLuongKhach > 0),
    NgayPhucVu      DATE                NOT NULL,
    GioPhucVu       TIME                NOT NULL,
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đã đặt',N'Đã xác nhận',N'Đã đến',N'Đã hủy')),
    GhiChu          NVARCHAR(500),
    ID_LeTan        INT                 NULL,
    SDT_Khach       VARCHAR(20)         NULL,
    ID_Ban INT      NULL
);

CREATE TABLE DONGOIMON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ThoiGianTao     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    NgayTao         DATE                NOT NULL,
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đang phục vụ', N'Đã thanh toán')),
    ID_Ban          INT                 NULL,
    ID_PhucVu       INT                 NULL
);

CREATE TABLE LANGOIMON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_Don          INT                 NOT NULL,
    ThoiDiemGoi     DATETIME2           NOT NULL,
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đang xử lý', N'Sẵn sàng phục vụ', N'Đã phục vụ')),
    GhiChu          NVARCHAR(500),
    ID_PhucVu       INT                 NULL,
    ID_BepTruong    INT                 NULL
);

CREATE TABLE LANGOIMON_MON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_LanGoi       INT                 NOT NULL,
    ID_MonAn        INT                 NOT NULL,
    SoLuong         INT                 NOT NULL CHECK (SoLuong > 0),
    DonGiaThoiDiem  DECIMAL(12,0)       NOT NULL CHECK (DonGiaThoiDiem >= 0),
    ThanhTien AS (SoLuong * DonGiaThoiDiem) PERSISTED
);

CREATE TABLE THANHTOAN (
    ID              INT                 IDENTITY(1,1) PRIMARY KEY,
    ID_Don          INT                 NOT NULL,
    ID_LeTan        INT                 NULL,
    SDT_Khach       VARCHAR(20)         NULL,
    NgayThanhToan   DATE                NOT NULL,
    GioThanhToan    TIME                NOT NULL,
    PhuongThucThanhToan NVARCHAR(50)    NOT NULL,
    GiamGia         DECIMAL(12,0)       NOT NULL DEFAULT 0 CHECK (GiamGia >= 0),
    TongTien        DECIMAL(18,0)       NOT NULL CHECK (TongTien >= 0)
);

CREATE TABLE CAPNHAT_MONAN (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_BepTruong    INT                 NULL,
    ID_QuanLy       INT                 NULL,
    NgayCapNhat     DATETIME2           NOT NULL,
    Lan             INT                 NOT NULL,
    PhanLoai        NVARCHAR(20)        NOT NULL CHECK (PhanLoai IN (N'Thêm',N'Xóa',N'Sửa')),
    ID_MonAn        INT                 NULL
);

/*-----------------Example Data-----------------*/

INSERT INTO NHANVIEN VALUES
('012345678901',N'Nguyễn Văn A','1990-05-10','2020-01-01',15000000,N'1 Lê Lợi, TP.HCM',N'Quản lý','Full-time',NULL),
('326531453435',N'Trần Thị B','1992-03-22','2021-02-15',12000000,N'2 Trần Hưng Đạo, TP.HCM',N'Bếp trưởng','Full-time',1000),
('840582802314',N'Lê Trọng C','1995-07-05','2022-06-01',9000000,N'3 Nguyễn Huệ, TP.HCM',N'Đầu bếp','Full-time',1001),
('342355645441',N'Phạm Thị D','1998-11-30','2023-01-10',7000000,N'4 Phạm Ngũ Lão, TP.HCM',N'Phục vụ','Part-time',1000),
('838237941743',N'Hoàng Văn E','1997-08-19','2022-12-01',6500000,N'5 Pasteur, TP.HCM',N'Lễ tân','Part-time',1003),
('124830843085',N'Vũ Ngọc F','1994-12-02','2021-05-20',8000000,N'6 Nguyễn Văn Trôi, TP.HCM',N'Quản lý kho','Full-time',1008),
('240850384764',N'Bùi Trường G','1993-02-14','2020-09-01',8500000,N'7 Sông Hanh, TP.HCM',N'Phục vụ','Full-time',100),
('092838234352',N'Đỗ Như H','1996-04-18','2021-03-03',9200000,N'8 Lê Duẩn, TP.HCM',N'Đầu bếp','Full-time',1001),
('423803048853',N'Nguyễn Thị Kim K','1999-06-25','2024-01-01',6000000,N'9 Võ Văn Kiệt, TP.HCM',N'Phục vụ','Part-time',1000),
('654879567456',N'Lâm Trần N','1995-09-10','2024-04-01',9500000,N'10 Cách Mạng Tháng 8, TP.HCM',N'Đầu bếp','Part-time',1001),
('742034832485',N'Trần Văn L','1988-10-10','2019-11-11',14000000,N'10 Nguyễn Trãi, TP.HCM',N'Quản lý','Full-time',NULL),
('123456789012',N'Nguyễn Gia H','1990-05-12','2023-03-01',15000000, N'Q.1, TP.HCM', N'Bếp trưởng', N'Full-time',1010),
('234567890123',N'Phạm Quốc T','1992-08-21','2023-04-15',14000000,N'Q.5, TP.HCM',N'Đầu bếp',N'Full-time',1011),
('345678901234',N'Lê Hùng M','1988-03-08','2022-10-01',16000000,N'Bình Thạnh, TP.HCM',N'Quản lý kho',N'Full-time',1010),
('456789012345',N'Trần Thị Quế A','1999-11-20','2024-01-10',9000000,N'Tân Bình, TP.HCM', N'Lễ tân',N'Part-time',1015),
('567890123456',N'Đỗ Minh T','2001-06-30','2024-02-05',8000000,N'Thủ Đức, TP.HCM',N'Phục vụ',N'Part-time',1013);

INSERT INTO SDT_NHANVIEN VALUES
(1000,'0900000001'),(1000,'0900000002'),
(1001,'0900000003'),
(1002,'0900000004'),
(1003,'0900000005'),(1003,'0900000006'),
(1004,'0904658037'),
(1005,'0900000007'),
(1006,'0900000008'),
(1007,'0900000009'),
(1008,'0900000010'),
(1009,'0900000011'),
(1010,'0900000012'),
(1011,'0966565609'),(1011,'0963453564'),
(1012,'0900000013'),
(1013,'0900000014'),
(1014,'0900000015'),
(1015,'0900000016');

INSERT INTO QUANLY VALUES
(1000,'2020-01-01'),
(1010,'2019-11-11');

INSERT INTO BEPTRUONG VALUES
(1001, N'Món Việt, món Âu'),
(1011, N'Món Á, món tráng miệng');

INSERT INTO DAUBEP VALUES
(1002, N'Món Nhật'),
(1007, N'Món Việt'),
(1009, N'Món Âu'),
(1012, N'Món Ý');

INSERT INTO PHUCVU VALUES
(1003, N'Khu A'), 
(1006, N'Khu B'),
(1008, N'Khu C'),
(1015, N'Khu D');

INSERT INTO LETAN VALUES (1004), (1014);

INSERT INTO QUANLYKHO VALUES
(1005, N'Hàng ngày'),
(1013, N'Hàng ngày');
--(1033, N'Hàng ngày'),
--(1043, N'Hàng tuần'),
--1069, N'Hàng tuần');

INSERT INTO LETAN_NGOAINGU VALUES
(1004, N'Anh'),(1004, N'Pháp'),(1004, N'Trung'),(1004, N'Nhật'),(1004, N'Đức'),(1004, N'Việt'),
(1014, N'Anh'),(1014, N'Nhật'),(1004, N'Hàn'),(1004, N'TBN'),(1004, N'Nga');

INSERT INTO KHACHHANG VALUES
('0910000001','Khach A',1,'a@example.com','1990-01-01',N'Nam',N'Thành viên',120),
('0910000002','Khach B',0,NULL,NULL,NULL,NULL,0),
('0910000003','Khach C',1,'c@example.com','1992-06-06',N'Nam',N'VIP',300),
('0910000004','Khach D',0,NULL,NULL,NULL,NULL,0),
('0910000005','Khach E',1,'e@example.com','1980-05-05',N'Nữ',N'Thành viên',50),
('0910000006','Khach F',0,NULL,NULL,NULL,NULL,0),
('0910000007','Khach G',1,'g@example.com','1975-12-12',N'Nữ',N'Thành viên',200),
('0910000008','Khach H',0,NULL,NULL,NULL,NULL,0),
('0910000009','Khach I',1,'i@example.com','1994-09-09',N'Nữ',N'VIP',500),
('0910000010','Khach J',0,NULL,NULL,NULL,NULL,0);

INSERT INTO BAN VALUES
(N'Trống',4),(N'Đã đặt',6),(N'Đang phục vụ',2),(N'Trống',8),
(N'Trống',10),(N'Đã đặt',4),(N'Đang phục vụ',6),(N'Trống',3),
(N'Đã đặt',5),(N'Trống',2);

INSERT INTO MONAN VALUES
(N'Phở Bò',N'Mặn',N'Phở bò truyền thống',70000,N'Còn'),
(N'Bún Chả',N'Mặn',N'Bún chả Hà Nội',85000,N'Còn'),
(N'Gỏi Cuốn',N'Chay',N'Gỏi cuốn rau',50000,N'Còn'),
(N'Bánh Mì',N'Mặn',N'Bánh mì đặc biệt',40000,N'Còn'),
(N'Cà Phê Sữa',N'Mặn',N'Cà phê phin',35000,N'Còn'),
(N'Salad Trái Cây',N'Chay',N'Salad tươi',60000,N'Còn'),
(N'Bún Riêu',N'Mặn',N'Bún riêu cua',80000,N'Còn'),
(N'Cơm Tấm',N'Mặn',N'Cơm tấm sườn bì',65000,N'Còn'),
(N'Mì Xào',N'Mặn',N'Mì xào hải sản',90000,N'Còn'),
(N'Trái Cây Nước Ép',N'Chay',N'Nước ép tươi',45000,N'Còn');

INSERT INTO NGUYENLIEU VALUES
(N'Bột',N'kg',100,20000,6),
(N'Thịt bò',N'kg',50,150000,6),
(N'Thịt heo',N'kg',70,120000,6),
(N'Rau sống',N'kg',40,10000,6),
(N'Bánh phở',N'kg',30,50000,6),
(N'Bún',N'kg',60,30000,6),
(N'Gia vị',N'kg',20,80000,6),
(N'Cà phê',N'kg',25,90000,6),
(N'Trái cây',N'kg',80,40000,6),
(N'Rượu',N'chai',15,200000,6);

INSERT INTO NHACUNGCAP VALUES
(N'CTY ABC', 'abc@sup.com',N'TP.HCM'),
(N'CTY XYZ', 'xyz@sup.com',N'Hà Nội'),
(N'CTY Fresh', 'fresh@sup.com',N'Đà Nẵng'),
(N'CTY Farm', 'farm@sup.com',N'Gia Lai'),
(N'CTY Food', 'food@sup.com',N'Cần Thơ'),
(N'CTY Supply1', 's1@sup.com',N'TP.HCM'),
(N'CTY Supply2', 's2@sup.com',N'Thái Nguyên'),
(N'CTY Supply3', 's3@sup.com',N'Huế'),
(N'CTY Import', 'imp@sup.com',N'Hà Nội'),
(N'CTY Local', 'loc@sup.com',N'Tiền Giang');

INSERT INTO SDT_NHACUNGCAP VALUES
(1,'028000001'),(2,'024000002'),(3,'023000003'),(4,'026000004'),(5,'029000005'),
(6,'028000006'),(7,'028000007'),(8,'028000008'),(9,'028000009'),(10,'028000010');

INSERT INTO CUNGCAP VALUES
(1,10001,'2025-01-02',20,20000),
(2,10002,'2025-01-05',10,150000),
(3,10003,'2025-01-06',15,120000),
(4,10004,'2025-01-07',30,10000),
(5,10005,'2025-01-10',12,50000),
(6,10006,'2025-01-12',25,30000),
(7,10007,'2025-01-15',8,80000),
(8,10008,'2025-01-18',10,90000),
(9,10009,'2025-01-20',40,40000),
(10,10000,'2025-01-22',5,200000);

INSERT INTO KIEMKE
VALUES
(1005,10001,'2025-01-02','09:00','OK'),
(1005,10002,'2025-01-03','10:00','Thiếu'),
(1005,10003,'2025-01-04','11:00','OK'),
(1005,10004,'2025-01-05','09:30','OK'),
(1005,10005,'2025-01-06','14:00','OK'),
(1005,10006,'2025-01-07','15:00','Thiếu'),
(1013,10007,'2025-01-08','08:00','OK'),
(1013,10008,'2025-01-09','17:00','OK'),
(1013,10009,'2025-01-10','10:00','OK'),
(1013,10000,'2025-01-11','11:00','OK');

INSERT INTO BAOCAODOANHTHU VALUES
('2025-01-31',N'Tháng',10000000,4000000,1000),
('2025-02-28',N'Tháng',12000000,4500000,1000),
('2025-03-31',N'Tháng',9000000,3000000,1000),
('2025-04-30',N'Tháng',11000000,4200000,1010),
('2025-05-31',N'Tháng',11500000,4300000,1010),
('2025-06-30',N'Tháng',13000000,5200000,1000),
('2025-07-31',N'Tháng',12500000,5000000,1000),
('2025-08-31',N'Tháng',14000000,5500000,1010),
('2025-09-30',N'Tháng',15000000,6000000,1000),
('2025-10-31',N'Tháng',16000000,6500000,1010);

INSERT INTO DATBAN VALUES
(2,'2025-01-02','18:00',N'Đã xác nhận', N'Gần cửa',1004,'0910000001',1),
(4,'2025-01-03','19:00',N'Đã đến',      N'Gợi ý',1004,'0910000002',2),
(3,'2025-01-04','20:00',N'Đã hủy',      N'Đổi giờ',1004,'0910000003',3),
(2,'2025-01-05','12:30',N'Đã xác nhận', NULL,1014,'0910000004',4),
(5,'2025-01-06','13:00',N'Đã xác nhận', N'Gặp quản lý',1004,'0910000005',5),
(2,'2025-01-07','18:30',N'Đã đến',      NULL,1014,'0910000006',6),
(6,'2025-01-08','19:30',N'Đã đặt',      N'Nhóm lớn',1014,'0910000007',7),
(3,'2025-01-09','20:15',N'Đã xác nhận', NULL,1004,'0910000008',8),
(2,'2025-01-10','11:00',N'Đã đến',      NULL,1004,'0910000009',9),
(4,'2025-01-11','12:00',N'Đã xác nhận', NULL,1014,'0910000010',10);

INSERT INTO DONGOIMON VALUES
('2025-01-02 18:05', '2025-01-02', N'Đang phục vụ',1,1003),
('2025-01-03 19:02', '2025-01-03', N'Đang phục vụ',2,1003),
('2025-01-04 20:10', '2025-01-04', N'Đã thanh toán',3,1015),
('2025-01-05 12:35', '2025-01-05', N'Đang phục vụ',4,1008),
('2025-01-06 13:10', '2025-01-06', N'Đang phục vụ',5,1006),
('2025-01-07 18:40', '2025-01-07', N'Đang phục vụ',6,1006),
('2025-01-08 19:45', '2025-01-08', N'Đang phục vụ',7,1003),
('2025-01-09 20:20', '2025-01-09', N'Đã thanh toán',8,1015),
('2025-01-10 11:05', '2025-01-10', N'Đang phục vụ',9,1006),
('2025-01-11 12:15', '2025-01-11', N'Đã thanh toán',10,1008);

INSERT INTO LANGOIMON VALUES
(1,'2025-01-02 18:06',N'Đang xử lý',NULL,1003,1001),
(2,'2025-01-03 19:05',N'Sẵn sàng phục vụ',NULL,1006,1001),
(3,'2025-01-04 20:12',N'Đã phục vụ',NULL,1008,1011),
(4,'2025-01-05 12:36',N'Đang xử lý',NULL,1008,1001),
(5,'2025-01-06 13:15',N'Sẵn sàng phục vụ',NULL,1015,1011),
(6,'2025-01-07 18:42',N'Đang xử lý',NULL,1006,1001),
(7,'2025-01-08 19:46',N'Sẵn sàng phục vụ',NULL,1008,1011),
(8,'2025-01-09 20:22',N'Đã phục vụ',NULL,1006,1001),
(9,'2025-01-10 11:06',N'Đang xử lý',NULL,1015,1011),
(10,'2025-01-11 12:16',N'Đã phục vụ',NULL,1003,1001);

INSERT INTO LANGOIMON_MON VALUES
(1,5000,1,70000),
(1,5003,2,50000),
(2,5002,1,85000),
(3,5004,1,40000),
(3,5005,2,35000),
(4,5006,1,60000),
(5,5007,1,80000),
(6,5008,1,65000),
(7,5009,1,90000),
(8,5001,2,45000);

INSERT INTO THANHTOAN VALUES
(3,1004,'0910000003','2025-01-04','21:00','Tiền mặt',0,175000),
(8,1004,'0910000008','2025-01-09','21:30','Thẻ',5000,85000),
(10,1014,'0910000010','2025-01-11','13:00','Tiền mặt',0,120000),
(2,1014,'0910000002','2025-01-03','20:00','Thẻ',0,85000),
(4,1004,'0910000004','2025-01-05','13:00','Tiền mặt',0,60000),
(5,1014,'0910000005','2025-01-06','14:00','Tiền mặt',0,90000),
(1,1004,'0910000001','2025-01-02','19:00','Tiền mặt',0,160000),
(6,1014,'0910000006','2025-01-07','19:00','Tiền mặt',0,65000),
(7,1014,'0910000007','2025-01-08','20:00','Thẻ',10000,180000),
(9,1004,'0910000009','2025-01-10','12:00','Tiền mặt',0,90000);

INSERT INTO CAPNHAT_MONAN VALUES
(1001,1000,'2025-01-01',1,N'Thêm',5001),
(1001,1000,'2025-01-02',2,N'Sửa',5002),
(1001,1000,'2025-01-03',1,N'Thêm',5003),
(1001,1010,'2025-01-04',3,N'Sửa',5004),
(1011,1010,'2025-01-05',1,N'Thêm',5005),
(1011,1000,'2025-01-06',1,N'Thêm',5006),
(1001,1000,'2025-01-07',2,N'Sửa',5007),
(1001,1000,'2025-01-08',1,N'Thêm',5008),
(1001,1000,'2025-01-09',1,N'Thêm',5009),
(1011,1010,'2025-01-10',1,N'Thêm',5000);

/* Add constraints */

ALTER TABLE SDT_NHANVIEN ADD
    CONSTRAINT FK_SDT_NHANVIEN_NHANVIEN FOREIGN KEY (ID_NhanVien) REFERENCES NHANVIEN(ID);

ALTER TABLE SDT_NHACUNGCAP ADD
    CONSTRAINT FK_SDT_NCC_NCC FOREIGN KEY (ID_Nha_Cung_Cap) REFERENCES NHACUNGCAP(ID);

ALTER TABLE CUNGCAP ADD
    CONSTRAINT FK_CUNGCAP_NCC FOREIGN KEY (ID_NhaCungCap) REFERENCES NHACUNGCAP(ID);
ALTER TABLE CUNGCAP ADD
    CONSTRAINT FK_CUNGCAP_NL FOREIGN KEY (ID_NguyenLieu) REFERENCES NGUYENLIEU(ID);

ALTER TABLE KIEMKE ADD
    CONSTRAINT FK_KIEMKE_NL FOREIGN KEY (ID_NguyenLieu) REFERENCES NGUYENLIEU(ID);

ALTER TABLE BAOCAODOANHTHU ADD
    CONSTRAINT FK_BCD_QLY FOREIGN KEY (ID_QuanLy) REFERENCES NHANVIEN(ID);

ALTER TABLE QUANLY ADD
    CONSTRAINT FK_QUANLY_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE BEPTRUONG ADD
    CONSTRAINT FK_BEPTRUONG_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE DAUBEP ADD
    CONSTRAINT FK_DAUBEP_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE PHUCVU ADD
    CONSTRAINT FK_PHUCVU_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE LETAN ADD
    CONSTRAINT FK_LE_TAN_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE LETAN_NGOAINGU ADD
    CONSTRAINT FK_LETANNGOAINGU_LE_TAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID);

ALTER TABLE QUANLYKHO ADD
    CONSTRAINT FK_QUANLYKHO_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE DATBAN ADD
    CONSTRAINT FK_DATBAN_LETAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID),
    CONSTRAINT FK_DATBAN_BAN FOREIGN KEY (ID_Ban) REFERENCES BAN(ID_Ban),
    CONSTRAINT FK_DATBAN_KHACH FOREIGN KEY (SDT_Khach) REFERENCES KHACHHANG(SDT);

ALTER TABLE DONGOIMON ADD
    CONSTRAINT FK_DONBAN_BAN FOREIGN KEY (ID_Ban) REFERENCES BAN(ID_Ban),
    CONSTRAINT FK_DONBAN_PHUCVU FOREIGN KEY (ID_PhucVu) REFERENCES PHUCVU(ID);

ALTER TABLE LANGOIMON ADD
    CONSTRAINT FK_LANGOI_DON FOREIGN KEY (ID_Don) REFERENCES DONGOIMON(ID),
    CONSTRAINT FK_LANGOI_PHUCVU FOREIGN KEY (ID_PhucVu) REFERENCES PHUCVU(ID),
    CONSTRAINT FK_LANGOI_BEPTRUONG FOREIGN KEY (ID_BepTruong) REFERENCES BEPTRUONG(ID);

ALTER TABLE LANGOIMON_MON ADD
    CONSTRAINT FK_LANGOI_ITEM_LAN FOREIGN KEY (ID_LanGoi) REFERENCES LANGOIMON(ID),
    CONSTRAINT FK_LANGOI_ITEM_MON FOREIGN KEY (ID_MonAn) REFERENCES MONAN(ID);

ALTER TABLE THANHTOAN ADD
    CONSTRAINT FK_THANHTOAN_DON FOREIGN KEY (ID_Don) REFERENCES DONGOIMON(ID),
    CONSTRAINT FK_THANHTOAN_LETAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID),
    CONSTRAINT FK_THANHTOAN_KHACH FOREIGN KEY (SDT_Khach) REFERENCES KHACHHANG(SDT);

ALTER TABLE CAPNHAT_MONAN ADD
    CONSTRAINT FK_CAPNHAT_BEPTRUONG FOREIGN KEY (ID_BepTruong) REFERENCES BEPTRUONG(ID),
    CONSTRAINT FK_CAPNHAT_QUANLY FOREIGN KEY (ID_QuanLy) REFERENCES QUANLY(ID),
    CONSTRAINT FK_CAPNHAT_MON FOREIGN KEY (ID_MonAn) REFERENCES MONAN(ID);
