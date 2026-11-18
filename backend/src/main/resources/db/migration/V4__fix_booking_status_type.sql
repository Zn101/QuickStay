-- T203: Fix enum columns to varchar for Hibernate ddl-auto=validate
-- Volume cu co the co column type la enum (MySQL native) tu lan chay truoc,
-- khi Flyway chua baseline. Migration nay chuyen sang varchar(20) de
-- Hibernate ddl-auto=validate khong bao loi.
-- Tren DB moi (V1 da tao varchar(20)), lenh nay la no-op.
ALTER TABLE bookings MODIFY COLUMN status VARCHAR(20) NOT NULL;
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL;
