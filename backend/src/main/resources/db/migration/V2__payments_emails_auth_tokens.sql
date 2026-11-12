-- QuickStay schema v2: xac thuc email, khoi phuc mat khau, thanh toan gia lap va nhat ky email.
-- Viet theo cu phap chung cho MySQL 8 va H2 (MODE=MySQL).

ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(128);
ALTER TABLE users ADD COLUMN verification_token_expires_at DATETIME(6);
ALTER TABLE users ADD COLUMN reset_token VARCHAR(128);
ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME(6);

UPDATE users SET email_verified = TRUE WHERE role = 'ADMIN';

CREATE INDEX idx_users_verification_token ON users (verification_token);
CREATE INDEX idx_users_reset_token ON users (reset_token);

ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(30) NOT NULL DEFAULT 'PAY_AT_HOTEL';
ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID';
ALTER TABLE bookings ADD COLUMN payment_ref VARCHAR(64);
ALTER TABLE bookings ADD COLUMN paid_at DATETIME(6);

CREATE TABLE email_logs (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    recipient   VARCHAR(255)  NOT NULL,
    subject     VARCHAR(255)  NOT NULL,
    body_html   VARCHAR(8000) NOT NULL,
    email_type  VARCHAR(40)   NOT NULL,
    status      VARCHAR(20)   NOT NULL,
    sent_at     DATETIME(6)   NOT NULL
);

CREATE INDEX idx_email_logs_recipient ON email_logs (recipient, sent_at);
