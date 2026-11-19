-- QuickStay schema v8: nha hang & tour thanh du lieu that (truoc day chi la JSON noi dung), co chu so huu
-- (vai tro RESTAURANT_OWNER / TOUR_OPERATOR) va don dat ban / dat tour that.
-- Viet theo cu phap chung cho MySQL 8 va H2 (MODE=MySQL).

CREATE TABLE restaurants (
    id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255)  NOT NULL,
    city          VARCHAR(255)  NOT NULL,
    cuisine       VARCHAR(255),
    address       VARCHAR(255),
    image_url     VARCHAR(1000),
    opening_hours VARCHAR(100),
    price_range   VARCHAR(100),
    specialties   VARCHAR(1000),
    description   VARCHAR(4000),
    owner_id      BIGINT,
    CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX idx_restaurants_owner ON restaurants (owner_id);

CREATE TABLE tours (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)  NOT NULL,
    city        VARCHAR(255)  NOT NULL,
    category    VARCHAR(255),
    image_url   VARCHAR(1000),
    duration    VARCHAR(100),
    price       DECIMAL(19,2) NOT NULL,
    transport   VARCHAR(255),
    highlights  VARCHAR(1000),
    description VARCHAR(4000),
    owner_id    BIGINT,
    CONSTRAINT fk_tours_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_tours_price CHECK (price >= 0)
);
CREATE INDEX idx_tours_owner ON tours (owner_id);

CREATE TABLE restaurant_reservations (
    id               BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    restaurant_id    BIGINT        NOT NULL,
    user_id          BIGINT        NOT NULL,
    guest_name       VARCHAR(255)  NOT NULL,
    guest_phone      VARCHAR(30)   NOT NULL,
    reservation_date DATE          NOT NULL,
    reservation_time VARCHAR(5)    NOT NULL,
    party_size       INT           NOT NULL,
    seating_area     VARCHAR(30),
    note             VARCHAR(1000),
    status           VARCHAR(20)   NOT NULL,
    created_at       DATETIME(6)   NOT NULL,
    CONSTRAINT fk_resv_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
    CONSTRAINT fk_resv_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_resv_party CHECK (party_size >= 1)
);
CREATE INDEX idx_resv_restaurant ON restaurant_reservations (restaurant_id, created_at);
CREATE INDEX idx_resv_user ON restaurant_reservations (user_id, created_at);

CREATE TABLE tour_bookings (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tour_id     BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,
    guest_name  VARCHAR(255)  NOT NULL,
    guest_phone VARCHAR(30)   NOT NULL,
    tour_date   DATE          NOT NULL,
    guests      INT           NOT NULL,
    vehicle     VARCHAR(20),
    note        VARCHAR(1000),
    total_price DECIMAL(19,2) NOT NULL,
    status      VARCHAR(20)   NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_tourb_tour FOREIGN KEY (tour_id) REFERENCES tours (id),
    CONSTRAINT fk_tourb_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_tourb_guests CHECK (guests >= 1),
    CONSTRAINT ck_tourb_total CHECK (total_price >= 0)
);
CREATE INDEX idx_tourb_tour ON tour_bookings (tour_id, created_at);
CREATE INDEX idx_tourb_user ON tour_bookings (user_id, created_at);

-- Noi dung tours / restaurants nay nam trong bang rieng; bo ban JSON cu (neu co)
DELETE FROM site_contents WHERE content_type IN ('tours', 'restaurants');

-- Du lieu hien co (truoc day viet cung trong frontend) chuyen sang DB de moi moi truong giu nguyen noi dung
-- 8 restaurants, 9 tours
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Sunrise Bistro Seafood & Grill', 'Đà Nẵng', 'Hải sản & Đồ nướng', '12 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', '10:30 – 23:00', '250.000 ₫ - 650.000 ₫/khách', 'Tôm hùm nướng bơ tỏi
Cua sốt me Cà Mau
Lẩu hải sản chua cay', 'Không gian mở nhìn thẳng ra bãi biển Mỹ Khê lộng gió. Bể hải sản tươi sống chọn tại chỗ và chế biến ngay theo yêu cầu.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Emerald Bay Ocean Grill', 'Phú Quốc', 'Hải sản cao cấp & BBQ Biển', 'Bãi Khem, An Thới, TP. Phú Quốc', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80', '11:00 – 22:30', '380.000 ₫ - 950.000 ₫/khách', 'Nhum biển nướng mỡ hành
Gỏi cá trích đảo ngọc
Sò điệp Nhật nướng phô mai', 'Nhà hàng sát bờ biển Bãi Khem với bàn ăn lãng mạn trên bãi cát trắng mịn, ngắm hoàng hôn vịnh biển tuyệt mỹ.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Horizon Sky Dining & Cocktail Lounge', 'Nha Trang', 'Á - Âu & Rooftop View Biển', '102 Trần Phú, Lộc Thọ, Nha Trang', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80', '16:00 – 24:00', '300.000 ₫ - 780.000 ₫/khách', 'Bò Wagyu nướng đá núi lửa
Cá hồi áp chảo sốt chanh leo
Cocktail Signature biển nhiệt đới', 'Rooftop tầng 28 ngắm trọn toàn cảnh vịnh biển Nha Trang và cầu Trần Phú rực rỡ ánh đèn về đêm.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Old Quarter Hanoi Gourmet', 'Hà Nội', 'Ẩm thực Bắc Bộ truyền thống', '28 Hàng Bạc, Hoàn Kiếm, Hà Nội', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80', '07:00 – 22:00', '150.000 ₫ - 420.000 ₫/khách', 'Chả cá Lăng Hà Thành
Bún chả que tre nướng than hoa
Nem rán phố cổ gia truyền', 'Không gian nhà cổ mái ngói trầm mặc giữa 36 phố phường, tái hiện hương vị tinh hoa ẩm thực truyền thống kinh kỳ.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Saigon Landmark Bistro & Wine', 'Hồ Chí Minh', 'Fine Dining & Rượu vang', '45 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80', '11:00 – 23:30', '450.000 ₫ - 1.200.000 ₫/khách', 'Thăn bò Úc nướng sốt nấm Truffle
Cừu đút lò thảo mộc
Hầm rượu vang hơn 200 nhãn hiệu', 'Phong cách Pháp sang trọng ngay phố đi bộ sầm uất bậc nhất Sài Gòn, điểm hẹn lý tưởng cho đối tác và tiệc kỷ niệm.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Hoài River Riverside Tavern', 'Hội An', 'Đặc sản Quảng Nam & Cao Lầu', '8 Bạch Đằng, Minh An, Hội An', 'https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80', '08:00 – 22:00', '120.000 ₫ - 350.000 ₫/khách', 'Cao lầu thịt xíu giòn bì
Cơm gà Hội An da vàng
Bánh bao bánh vạc hoa hồng trắng', 'Ban công ven sông Hoài thơ mộng, vừa thưởng thức các món ăn truyền thống xứ Quảng vừa ngắm thuyền thả hoa đăng.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Imperial Royal Palace Feast', 'Huế', 'Ẩm thực Cung đình Triều Nguyễn', '22 Lê Lợi, Vĩnh Ninh, TP. Huế', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80', '10:30 – 21:30', '280.000 ₫ - 700.000 ₫/khách', 'Nem công chả phượng cung đình
Cơm sen hoàng cung
Chè hạt sen long nhãn bọc bột lọc', 'Mỗi món ăn là một tác phẩm nghệ thuật tỉ mỉ, thưởng thức trong tiếng nhã nhạc cung đình Huế trang trọng.');
INSERT INTO restaurants (name, city, cuisine, address, image_url, opening_hours, price_range, specialties, description) VALUES ('Pine Hill Wine & Steakhouse', 'Đà Lạt', 'Bò Bít Tết & Rượu vang', '15 Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt', 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=900&q=80', '11:00 – 22:00', '290.000 ₫ - 680.000 ₫/khách', 'Tomahawk Steak nướng than củi
Súp bí đỏ kem nấm
Salad rau củ quả hữu cơ Đà Lạt', 'Nhà gỗ ấm áp giữa rừng thông reo rì rào, bếp sưởi củi tí tách mang đến không khí lãng mạn bậc nhất xứ sương mù.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Bà Nà Hills & Check-in Cầu Vàng', 'Đà Nẵng', 'Danh lam & Cảnh đẹp', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80', '1 ngày (08:00 - 17:00)', 850000, 'Xe đưa đón riêng 4-7 chỗ + Vé cáp treo', 'Cầu Vàng bàn tay khổng lồ
Làng Pháp cổ kính & Hầm rượu Debay
Khu vui chơi Fantasy Park', 'Khám phá chốn bồng lai tiên cảnh Bà Nà Hills, tận hưởng khí hậu 4 mùa trong 1 ngày và chiêm ngưỡng kiến trúc tráng lệ của Cầu Vàng nổi tiếng toàn cầu.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Bán Đảo Sơn Trà & Ngũ Hành Sơn', 'Đà Nẵng', 'Văn hóa & Tâm linh', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80', 'Nửa ngày (08:00 - 12:30)', 450000, 'Xe du lịch máy lạnh có tài xế', 'Chùa Linh Ứng tượng Phật Bà 67m
Đỉnh Bàn Cờ ngắm trọn vịnh
Động Huyền Không kỳ ảo', 'Chuyến tham quan kết hợp thiên nhiên hoang sơ của bán đảo Sơn Trà và cụm hang động kỳ vĩ của Ngũ Hành Sơn thiêng liêng.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Khám Phá 4 Đảo & Cáp Treo Hòn Thơm', 'Phú Quốc', 'Biển đảo & Lặn biển', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80', '1 ngày (08:30 - 17:30)', 1050000, 'Cano cao tốc & Cáp treo vượt biển', 'Hòn Mây Rút Trong & Ngoài
Lặn ngắm san hô tự nhiên
Cáp treo Hòn Thơm dài nhất thế giới', 'Trải nghiệm cano lướt sóng qua những hòn đảo hoang sơ nhất quần đảo An Thới, tắm biển bãi cát trắng mịn và bay trên biển với cáp treo 3 dây kỳ vĩ.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Vịnh San Hô & Lặn Ngắm Biển Nha Trang', 'Nha Trang', 'Biển đảo & Lặn biển', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80', '1 ngày (08:00 - 16:30)', 750000, 'Tàu gỗ du lịch & Cano trung chuyển', 'Vịnh San Hô nước trong vắt
Bữa trưa hải sản tươi sống trên bè
Lặn bình khí với huấn luyện viên', 'Thư giãn giữa làn nước ngọc bích của vịnh Nha Trang - một trong 29 vịnh biển đẹp nhất thế giới, thỏa sức ngắm nhìn rạn san hô rực rỡ.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Di Sản Tràng An - Bái Đính Từ Hà Nội', 'Hà Nội', 'Di sản & Lịch sử', 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=80', '1 ngày (07:30 - 18:30)', 950000, 'Limousine đón trả tại khách sạn', 'Ngồi thuyền chèo tay xuyên hang Tràng An
Quần thể chùa Bái Đính kỷ lục Châu Á
Bữa trưa đặc sản dê núi Ninh Bình', 'Hành trình khám phá Di sản Văn hóa & Thiên nhiên Thế giới UNESCO Tràng An, nơi cảnh quan núi đá vôi non nước hữu tình giao hòa với tâm linh.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('City Tour Sài Gòn & Du Thuyền Sông Bạch Đằng', 'Hồ Chí Minh', 'Đô thị & Trải nghiệm', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80', 'Chiều - Tối (14:30 - 21:30)', 680000, 'Xe buýt 2 tầng Hop-on Hop-off + Thuyền sông', 'Dinh Độc Lập & Bưu điện Trung tâm
Ngắm hoàng hôn sông Sài Gòn trên du thuyền
Ăn tối set menu Á - Âu sang trọng', 'Cảm nhận nhịp đập sôi động của thành phố mang tên Bác từ tầng 2 xe buýt mui trần và thưởng ngoạn bữa tối lãng mạn ngắm nhìn tòa tháp Landmark 81 lung linh.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Thả Đèn Hoa Đăng & Rừng Dừa Bảy Mẫu', 'Hội An', 'Văn hóa & Sinh thái', 'https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80', 'Nửa ngày (14:00 - 19:30)', 480000, 'Thúng chai sinh thái & Xe đưa đón', 'Chèo thuyền thúng xoay múa điêu luyện
Thả hoa đăng cầu may trên sông Hoài
Thưởng thức cao lầu & chè bắp phố cổ', 'Hóa thân thành ngư dân miền Trung trải nghiệm lắc thuyền thúng giữa rừng dừa bạt ngàn, sau đó ngắm nhìn phố cổ Hội An lên đèn lung linh.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Cố Đô Triều Nguyễn & Ca Huế Sông Hương', 'Huế', 'Di sản & Cung đình', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80', '1 ngày (08:00 - 20:30)', 820000, 'Thuyền rồng sông Hương & Xe du lịch', 'Đại Nội Hoàng Thành & Ngọ Môn
Lăng Khải Định & Lăng Tự Đức tinh xảo
Thưởng thức ca Huế đêm trên thuyền rồng', 'Chìm đắm trong không gian trầm mặc của kinh thành xưa, chiêm ngưỡng kiến trúc cung đình lộng lẫy và lắng nghe làn điệu dân ca Huế ngọt ngào.');
INSERT INTO tours (title, city, category, image_url, duration, price, transport, highlights, description) VALUES ('Tour Săn Mây Đồi Chè Cầu Đất & Vườn Hồng', 'Đà Lạt', 'Thiên nhiên & Sống ảo', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80', 'Nửa ngày sáng sớm (04:30 - 11:30)', 520000, 'Xe 16 chỗ đón tận homestay/khách sạn', 'Săn biển mây bồng bềnh tại Cầu Đất
Check-in đồi chè xanh mướt & tuabin gió
Tham quan vườn hồng treo gió trĩu quả', 'Đón bình minh rạng rỡ trên đỉnh đồi mây mờ ảo, hít thở không khí se lạnh trong veo của xứ sở ngàn hoa và lưu giữ những khung hình tuyệt đẹp.');
