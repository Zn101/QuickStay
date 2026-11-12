-- QuickStay schema v3: danh gia khach san, hoi dap Q&A, dich vu concierge (dua don san bay, am thuc, tham quan) va cai dat nguoi dung.

ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) NOT NULL DEFAULT 'vi';
ALTER TABLE users ADD COLUMN currency_display VARCHAR(10) NOT NULL DEFAULT 'VND';
ALTER TABLE users ADD COLUMN notify_email BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN notify_promo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN compact_mode BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE hotel_reviews (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    hotel_id    BIGINT        NOT NULL,
    user_id     BIGINT,
    author_name VARCHAR(255)  NOT NULL,
    rating      INT           NOT NULL,
    comment     VARCHAR(2000) NOT NULL,
    stay_type   VARCHAR(50),
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_reviews_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    CONSTRAINT ck_reviews_rating CHECK (rating >= 1 AND rating <= 5)
);
CREATE INDEX idx_reviews_hotel ON hotel_reviews (hotel_id, created_at);

CREATE TABLE hotel_questions (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    hotel_id    BIGINT        NOT NULL,
    author_name VARCHAR(255)  NOT NULL,
    question    VARCHAR(1000) NOT NULL,
    answer      VARCHAR(2000),
    answered_by VARCHAR(255),
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_qa_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);
CREATE INDEX idx_qa_hotel ON hotel_questions (hotel_id, created_at);

CREATE TABLE concierge_requests (
    id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    hotel_id      BIGINT        NOT NULL,
    user_id       BIGINT,
    guest_name    VARCHAR(255)  NOT NULL,
    guest_email   VARCHAR(255)  NOT NULL,
    guest_phone   VARCHAR(50)   NOT NULL,
    service_type  VARCHAR(30)   NOT NULL,
    service_title VARCHAR(255)  NOT NULL,
    service_date  DATE          NOT NULL,
    service_time  VARCHAR(20),
    guests        INT           NOT NULL DEFAULT 1,
    details       VARCHAR(1000),
    estimated_fee DECIMAL(19,2) NOT NULL DEFAULT 0,
    status        VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED',
    created_at    DATETIME(6)   NOT NULL,
    CONSTRAINT fk_concierge_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);
CREATE INDEX idx_concierge_hotel ON concierge_requests (hotel_id, created_at);
CREATE INDEX idx_concierge_email ON concierge_requests (guest_email, created_at);
