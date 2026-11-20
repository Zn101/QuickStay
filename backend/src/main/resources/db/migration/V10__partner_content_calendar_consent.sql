-- QuickStay schema v10: noi dung trang khach san / loai phong do doi tac tu quan ly,
-- lich dong phong (bao tri, giu cho ngoai he thong) va ghi nhan dong y chinh sach khi dang ky.
-- Viet theo cu phap chung cho MySQL 8 va H2 (MODE=MySQL).

-- Khach san: thu vien anh (moi dong "URL|Chu thich"), gio nhan / tra phong,
-- quy dinh rieng cua co so (moi dong "Tieu de|Noi dung"), dua don san bay, am thuc, diem tham quan
ALTER TABLE hotels ADD COLUMN gallery VARCHAR(4000);
ALTER TABLE hotels ADD COLUMN check_in_time VARCHAR(5);
ALTER TABLE hotels ADD COLUMN check_out_time VARCHAR(5);
ALTER TABLE hotels ADD COLUMN house_rules VARCHAR(4000);
ALTER TABLE hotels ADD COLUMN airport_name VARCHAR(255);
-- moi dong "Ten dich vu|Mau xe|So khach toi da|Thoi gian|Gia VND"
ALTER TABLE hotels ADD COLUMN transfers VARCHAR(2000);
-- moi dong "Ten|Loai am thuc|Gio mo cua|Diem nhan|Ghi chu gia"
ALTER TABLE hotels ADD COLUMN dining VARCHAR(2000);
-- moi dong "Dia diem|Khoang cach|Phuong tien|Thoi gian|Gia VND"
ALTER TABLE hotels ADD COLUMN attractions VARCHAR(2000);

-- Loai phong: dien tich, giuong, tien nghi (cach nhau dau phay), anh (moi dong mot URL)
ALTER TABLE rooms ADD COLUMN area_sqm INT;
ALTER TABLE rooms ADD COLUMN bed_info VARCHAR(255);
ALTER TABLE rooms ADD COLUMN amenities VARCHAR(1000);
ALTER TABLE rooms ADD COLUMN image_urls VARCHAR(4000);

-- Lich dong phong: dong "units" phong cua loai phong trong [start_date, end_date)
CREATE TABLE room_closures (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT       NOT NULL,
    start_date DATE         NOT NULL,
    end_date   DATE         NOT NULL,
    units      INT          NOT NULL,
    reason     VARCHAR(255),
    created_at DATETIME(6)  NOT NULL,
    CONSTRAINT fk_closure_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT ck_closure_units CHECK (units >= 1),
    CONSTRAINT ck_closure_range CHECK (end_date > start_date)
);
CREATE INDEX idx_closure_room_dates ON room_closures (room_id, start_date, end_date);

-- Dong y Dieu khoan & Chinh sach khi dang ky (thoi diem va phien ban da dong y)
ALTER TABLE users ADD COLUMN terms_accepted_at DATETIME(6);
ALTER TABLE users ADD COLUMN terms_version VARCHAR(20);
