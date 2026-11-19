-- QuickStay schema v7:
-- 1. tokens_valid_after: JWT phat hanh truoc moc nay bi tu choi (doi/dat lai mat khau -> dang xuat moi phien cu)
-- 2. payment_account_label: nhan tai khoan thanh toan da che (vd. "Visa **** 4242")
-- 3. site_contents: noi dung Tours / Restaurants / News do admin quan ly (luu dang JSON theo tung loai)

ALTER TABLE users ADD COLUMN tokens_valid_after DATETIME(6);

ALTER TABLE bookings ADD COLUMN payment_account_label VARCHAR(60);

CREATE TABLE site_contents (
    content_type VARCHAR(40)  NOT NULL PRIMARY KEY,
    data_json    LONGTEXT     NOT NULL,
    updated_at   DATETIME(6)  NOT NULL
);
