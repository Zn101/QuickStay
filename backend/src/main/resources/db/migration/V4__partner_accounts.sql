-- QuickStay schema v4: bo sung cot hotel_id vao bang users de quan ly tai khoan doi tac khach san / homestay (HOTEL_MANAGER)

ALTER TABLE users ADD COLUMN hotel_id BIGINT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE SET NULL;
CREATE INDEX idx_users_hotel ON users (hotel_id);
