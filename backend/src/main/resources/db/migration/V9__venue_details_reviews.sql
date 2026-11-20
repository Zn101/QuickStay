-- QuickStay schema v9: thong tin chi tiet nha hang / tour va danh gia that cua khach.
-- Viet theo cu phap chung cho MySQL 8 va H2 (MODE=MySQL).

-- Nha hang: so dien thoai va thuc don (moi dong "Ten mon|Gia VND")
ALTER TABLE restaurants ADD COLUMN phone VARCHAR(30);
ALTER TABLE restaurants ADD COLUMN menu_items VARCHAR(2000);

-- Tour: lich trinh (moi dong "Gio|Hoat dong"), bao gom / khong bao gom (moi dong mot y),
-- diem don va so khach toi da moi ngay khoi hanh (tong khach cac don chua huy cung ngay)
ALTER TABLE tours ADD COLUMN itinerary VARCHAR(2000);
ALTER TABLE tours ADD COLUMN includes VARCHAR(1000);
ALTER TABLE tours ADD COLUMN excludes VARCHAR(1000);
ALTER TABLE tours ADD COLUMN meeting_point VARCHAR(255);
ALTER TABLE tours ADD COLUMN max_guests_per_day INT NOT NULL DEFAULT 30;

-- Danh gia nha hang / tour: chi khach da hoan tat don moi danh gia, moi nguoi mot lan moi co so
CREATE TABLE venue_reviews (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    venue_type  VARCHAR(20)   NOT NULL,
    venue_id    BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,
    author_name VARCHAR(255)  NOT NULL,
    rating      INT           NOT NULL,
    comment     VARCHAR(2000) NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_vreview_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_vreview_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT uk_vreview_once UNIQUE (venue_type, venue_id, user_id)
);
CREATE INDEX idx_vreview_venue ON venue_reviews (venue_type, venue_id, created_at);

CREATE INDEX idx_tourb_tour_date ON tour_bookings (tour_id, tour_date);

-- ---------------------------------------------------------------------------
-- Bo sung chi tiet cho du lieu mau (khop theo ten; ban ghi admin da sua ten thi bo qua)
-- ---------------------------------------------------------------------------

UPDATE restaurants SET phone = '0236 3888 111', menu_items = 'Tôm hùm nướng bơ tỏi (500g)|1250000
Cua sốt me Cà Mau|690000
Lẩu hải sản chua cay (4 người)|850000
Mực một nắng nướng sa tế|320000
Gỏi cá trích Nam Ô|180000'
WHERE name = 'Sunrise Bistro Seafood & Grill';

UPDATE restaurants SET phone = '0297 3999 222', menu_items = 'Ghẹ Hàm Ninh hấp bia|450000
Nhum biển nướng mỡ hành|220000
Gỏi cá trích Phú Quốc|190000
Cá mú nướng muối ớt|560000
Set BBQ hải sản hoàng hôn (2 người)|1490000'
WHERE name = 'Emerald Bay Ocean Grill';

UPDATE restaurants SET phone = '0258 3777 333', menu_items = 'Bò Wagyu áp chảo sốt vang|980000
Cá hồi Na Uy nướng chanh dây|520000
Pasta hải sản sốt kem|290000
Cocktail hoàng hôn Horizon|180000
Bánh tiramisu nhà làm|120000'
WHERE name = 'Horizon Sky Dining & Cocktail Lounge';

UPDATE restaurants SET phone = '024 3828 4444', menu_items = 'Chả cá Lã Vọng|260000
Phở bò tái lăn|95000
Bún chả Hàng Mành|85000
Nem rán Hà Nội (6 cuốn)|120000
Cốm xào & chè sen|70000'
WHERE name = 'Old Quarter Hanoi Gourmet';

UPDATE restaurants SET phone = '028 3822 5555', menu_items = 'Set menu Fine Dining 5 món|1650000
Bò Úc thăn nội sốt tiêu xanh|890000
Gan ngỗng áp chảo|720000
Ly vang đỏ Bordeaux|260000
Mousse chocolate Marou|150000'
WHERE name = 'Saigon Landmark Bistro & Wine';

UPDATE restaurants SET phone = '0235 3866 666', menu_items = 'Cao lầu Hội An|65000
Cơm gà Hội An|75000
Mì Quảng tôm thịt|70000
Bánh xèo & ram cuốn cải|90000
Hoành thánh chiên|80000'
WHERE name = 'Hoài River Riverside Tavern';

UPDATE restaurants SET phone = '0234 3833 777', menu_items = 'Set ngự thiện Cung đình (10 món)|1200000
Bún bò Huế đặc biệt|85000
Bánh bèo - nậm - lọc|110000
Cơm hến|60000
Chè cung đình|50000'
WHERE name = 'Imperial Royal Palace Feast';

UPDATE restaurants SET phone = '0263 3822 888', menu_items = 'Bò bít tết Úc khoai tây nghiền|420000
Sườn cừu nướng thảo mộc|680000
Lẩu gà lá é Đà Lạt|360000
Salad rau Đà Lạt sốt mè|120000
Vang Đà Lạt (chai)|450000'
WHERE name = 'Pine Hill Wine & Steakhouse';

UPDATE tours SET meeting_point = 'Sảnh khách sạn tại trung tâm Đà Nẵng', max_guests_per_day = 30,
itinerary = '07:30|Đón khách tại khách sạn
08:30|Đi cáp treo lên đỉnh Bà Nà
09:30|Check-in Cầu Vàng & vườn hoa Le Jardin
12:00|Ăn trưa buffet tại Bà Nà
13:30|Làng Pháp, hầm rượu Debay & Fantasy Park
17:00|Trả khách tại khách sạn',
includes = 'Xe đưa đón riêng
Vé cáp treo Bà Nà
Hướng dẫn viên tiếng Việt
Nước suối trên xe',
excludes = 'Buffet trưa
Trò chơi tính phí trong Fantasy Park
Chi phí cá nhân'
WHERE title = 'Tour Bà Nà Hills & Check-in Cầu Vàng';

UPDATE tours SET meeting_point = 'Sảnh khách sạn tại trung tâm Đà Nẵng', max_guests_per_day = 20,
itinerary = '08:00|Đón khách tại khách sạn
08:30|Chùa Linh Ứng & tượng Quan Âm Sơn Trà
10:00|Ngắm toàn cảnh vịnh Đà Nẵng từ bán đảo
11:00|Danh thắng Ngũ Hành Sơn & làng đá Non Nước
12:30|Trả khách tại khách sạn',
includes = 'Xe đưa đón
Vé tham quan Ngũ Hành Sơn
Hướng dẫn viên
Nước suối'
WHERE title = 'Tour Bán Đảo Sơn Trà & Ngũ Hành Sơn';

UPDATE tours SET meeting_point = 'Cảng An Thới, Phú Quốc (có xe đón từ khách sạn)', max_guests_per_day = 40,
itinerary = '08:00|Đón khách tại khách sạn ra cảng An Thới
09:00|Cano đi Hòn Móng Tay & Hòn Gầm Ghì
10:30|Lặn ngắm san hô (có trang bị)
12:00|Ăn trưa hải sản trên đảo
14:00|Cáp treo Hòn Thơm & công viên nước
17:00|Về lại khách sạn',
includes = 'Xe & cano đưa đón
Vé cáp treo Hòn Thơm
Ăn trưa
Áo phao, kính lặn',
excludes = 'Đồ uống ngoài thực đơn
Chi phí cá nhân'
WHERE title = 'Tour Khám Phá 4 Đảo & Cáp Treo Hòn Thơm';

UPDATE tours SET meeting_point = 'Cảng Cầu Đá, Nha Trang', max_guests_per_day = 40,
itinerary = '08:00|Tập trung tại cảng Cầu Đá
08:45|Tàu ra Vịnh San Hô (Hòn Mun)
09:30|Lặn ngắm san hô & cá nhiệt đới
12:00|Ăn trưa trên tàu
14:00|Tắm biển, nghỉ ngơi tại bãi Tranh
16:00|Về lại cảng',
includes = 'Tàu tham quan
Ăn trưa trên tàu
Trang bị lặn ống thở
Phí vào khu bảo tồn',
excludes = 'Lặn bình dưỡng khí (phụ thu)
Đưa đón khách sạn'
WHERE title = 'Tour Vịnh San Hô & Lặn Ngắm Biển Nha Trang';

UPDATE tours SET meeting_point = 'Phố cổ Hà Nội (đón tại khách sạn khu Hoàn Kiếm)', max_guests_per_day = 30,
itinerary = '07:00|Đón khách tại phố cổ Hà Nội
09:00|Chùa Bái Đính
12:00|Ăn trưa buffet Ninh Bình
13:30|Đi thuyền Tràng An qua các hang động
16:00|Khởi hành về Hà Nội
18:30|Trả khách tại phố cổ',
includes = 'Xe đưa đón khứ hồi
Vé thuyền Tràng An
Vé xe điện Bái Đính
Ăn trưa buffet
Hướng dẫn viên',
excludes = 'Đồ uống
Tiền tip lái đò'
WHERE title = 'Tour Di Sản Tràng An - Bái Đính Từ Hà Nội';

UPDATE tours SET meeting_point = 'Nhà hát Thành phố Hồ Chí Minh', max_guests_per_day = 25,
itinerary = '14:00|Tập trung tại Nhà hát Thành phố
14:30|Dinh Độc Lập & Nhà thờ Đức Bà
16:00|Chợ Bến Thành
18:00|Lên du thuyền sông Sài Gòn, ăn tối
20:30|Kết thúc tại bến Bạch Đằng',
includes = 'Xe điện tham quan
Vé Dinh Độc Lập
Ăn tối trên du thuyền
Hướng dẫn viên',
excludes = 'Đồ uống có cồn
Mua sắm cá nhân'
WHERE title = 'City Tour Sài Gòn & Du Thuyền Sông Bạch Đằng';

UPDATE tours SET meeting_point = 'Chùa Cầu, phố cổ Hội An', max_guests_per_day = 20,
itinerary = '15:00|Đón khách tại phố cổ Hội An
15:30|Rừng dừa Bảy Mẫu, đi thuyền thúng
17:30|Ăn tối đặc sản Hội An
19:00|Thả đèn hoa đăng trên sông Hoài
20:00|Dạo phố cổ về đêm & kết thúc',
includes = 'Thuyền thúng rừng dừa
Bữa tối đặc sản
Đèn hoa đăng
Hướng dẫn viên',
excludes = 'Vé tham quan phố cổ
Chi phí cá nhân'
WHERE title = 'Tour Thả Đèn Hoa Đăng & Rừng Dừa Bảy Mẫu';

UPDATE tours SET meeting_point = 'Sảnh khách sạn tại trung tâm Huế', max_guests_per_day = 25,
itinerary = '08:00|Đón khách tại khách sạn
08:30|Đại Nội Huế - Hoàng thành triều Nguyễn
11:00|Lăng Khải Định
12:30|Ăn trưa món Huế
14:00|Chùa Thiên Mụ
19:00|Nghe Ca Huế trên thuyền rồng sông Hương',
includes = 'Xe đưa đón
Vé Đại Nội & Lăng Khải Định
Vé thuyền Ca Huế
Hướng dẫn viên',
excludes = 'Ăn trưa
Chi phí cá nhân'
WHERE title = 'Tour Cố Đô Triều Nguyễn & Ca Huế Sông Hương';

UPDATE tours SET meeting_point = 'Quảng trường Lâm Viên, Đà Lạt (có đón tại khách sạn)', max_guests_per_day = 20,
itinerary = '04:30|Đón khách tại khách sạn
05:15|Săn mây & ngắm bình minh đồi chè Cầu Đất
07:00|Ăn sáng & cà phê giữa đồi chè
08:30|Check-in tuabin gió & cánh đồng hoa
10:00|Tham quan vườn hồng treo gió
11:30|Trả khách tại khách sạn',
includes = 'Xe Jeep / xe 7 chỗ đưa đón
Ăn sáng & cà phê
Vé vào đồi chè
Hướng dẫn viên'
WHERE title = 'Tour Săn Mây Đồi Chè Cầu Đất & Vườn Hồng';
