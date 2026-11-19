-- QuickStay schema v6: Toi uu hoa chi muc (database indexes) giam latency va tranh filesort.
-- Tuong thich cu phap chung cho MySQL 8 va H2 (MODE=MySQL).

-- 1. Toi uu loc don dat phong theo trang thai (status)
CREATE INDEX idx_bookings_status ON bookings (status);

-- 2. Toi uu sap xep toan bo don dat phong moi nhat truoc (tranh filesort cho admin va partner)
CREATE INDEX idx_bookings_created_at_id ON bookings (created_at, id);

-- 3. Toi uu tim phong theo khach san kem sap xep gia tang dan
CREATE INDEX idx_rooms_hotel_price ON rooms (hotel_id, price_per_night, id);

-- 4. Toi uu tinh diem danh gia trung binh va so luot danh gia theo khach san (index-only scan)
CREATE INDEX idx_reviews_hotel_rating ON hotel_reviews (hotel_id, rating);
