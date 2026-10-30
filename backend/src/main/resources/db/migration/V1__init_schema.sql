-- QuickStay schema v1 (docs/QuickStay-ERD.md). Viet theo cu phap chung cho MySQL 8 va H2 (MODE=MySQL).
-- Khong sua file nay sau khi da merge: moi thay doi luoc do tao file V2__..., V3__...

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    phone         VARCHAR(255),
    role          VARCHAR(20)  NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE hotels (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255)  NOT NULL,
    city        VARCHAR(255)  NOT NULL,
    address     VARCHAR(255),
    description VARCHAR(4000),
    image_url   VARCHAR(1000),
    amenities   VARCHAR(1000)
);

CREATE TABLE rooms (
    id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    hotel_id        BIGINT        NOT NULL,
    room_type       VARCHAR(255)  NOT NULL,
    price_per_night DECIMAL(19,2) NOT NULL,
    capacity        INT           NOT NULL,
    quantity        INT           NOT NULL,
    description     VARCHAR(2000),
    CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    CONSTRAINT ck_rooms_price CHECK (price_per_night >= 0),
    CONSTRAINT ck_rooms_capacity CHECK (capacity >= 1),
    CONSTRAINT ck_rooms_quantity CHECK (quantity >= 1)
);

CREATE TABLE bookings (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT        NOT NULL,
    room_id     BIGINT        NOT NULL,
    check_in    DATE          NOT NULL,
    check_out   DATE          NOT NULL,
    guests      INT           NOT NULL,
    guest_name  VARCHAR(255),
    guest_phone VARCHAR(255),
    note        VARCHAR(1000),
    total_price DECIMAL(19,2) NOT NULL,
    status      VARCHAR(20)   NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms (id),
    CONSTRAINT ck_bookings_dates CHECK (check_out > check_in),
    CONSTRAINT ck_bookings_guests CHECK (guests >= 1),
    CONSTRAINT ck_bookings_total CHECK (total_price >= 0)
);

-- Tim kiem theo thanh pho (GET /hotels?city=)
CREATE INDEX idx_hotels_city ON hotels (city);
-- Dem don chong lan khoang ngay khi tinh phong trong / dat phong
CREATE INDEX idx_bookings_room_dates ON bookings (room_id, check_in, check_out);
-- Lich su dat phong cua toi, moi nhat truoc
CREATE INDEX idx_bookings_user_created ON bookings (user_id, created_at);
