package com.quickstay.config;

import com.quickstay.content.SiteContent;
import com.quickstay.content.SiteContentRepository;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;

/**
 * Dien noi dung trang chi tiet MAU (thu vien anh, quy dinh, dua don, am thuc, diem tham quan,
 * dien tich / giuong / tien nghi / anh loai phong) cho cac co so mau, MOT LAN DUY NHAT.
 * Sau do doi tac tu sua tai Trang doi tac; xoa trang thi khong bi dien lai (danh dau trong site_contents).
 * Chi dien vao truong dang trong, khong ghi de du lieu doi tac da nhap.
 */
@Component
@Order(3)
@ConditionalOnProperty(name = "app.seed.sample-data", havingValue = "true", matchIfMissing = true)
public class SampleHotelDetailsSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleHotelDetailsSeeder.class);
    static final String MARKER = "seed-hotel-details-v1";

    private static final String U = "https://images.unsplash.com/";
    private static final String Q = "?auto=format&fit=crop&w=1200&q=80";

    private static final String TRANSFERS = String.join("\n",
            "Xe Sedan 4 chỗ riêng tư|Toyota Vios / Mazda 3|3|20 - 30 phút|250000",
            "Xe SUV 7 chỗ gia đình|Toyota Fortuner / Innova|6|20 - 30 phút|380000",
            "Limousine VIP đón bảng tên|Ford Transit Limousine|9|20 - 30 phút|650000");

    private static final String HOUSE_RULES = String.join("\n",
            "Giấy tờ khi nhận phòng|Xuất trình CCCD/Hộ chiếu hoặc VNeID của người đặt phòng.",
            "Trẻ em & Giường phụ|Trẻ em được tính vào tổng số khách của phòng. Giường phụ theo yêu cầu, có phụ phí tại quầy lễ tân.",
            "Hút thuốc|Không hút thuốc trong phòng và khu vực kín.");

    private static final Map<String, String> ATTRACTIONS = Map.of(
            "đà nẵng", "Bà Nà Hills & Cầu Vàng|25 km|Xe riêng 4-7 chỗ có tài xế|45 phút|550000\nDanh thắng Ngũ Hành Sơn|8 km|Taxi / Xe công nghệ / Xe máy|15 phút|150000\nBán đảo Sơn Trà & Chùa Linh Ứng|10 km|Xe máy thuê hoặc xe 4 chỗ|20 phút|180000\nPhố cổ Hội An (Xe ghép/Riêng)|28 km|Shuttle bus hoặc Xe riêng|40 phút|350000",
            "hà nội", "Hồ Hoàn Kiếm & Đền Ngọc Sơn|500 m|Đi bộ hoặc Xích lô phố cổ|5 phút|0\nLăng Chủ tịch Hồ Chí Minh & Chùa Một Cột|2.8 km|Xe điện / Taxi đặt tại lễ tân|10 phút|90000\nVăn Miếu - Quốc Tử Giám|2.5 km|Xe điện du lịch / Grab|10 phút|80000\nTour Làng gốm Bát Tràng / Tràng An|15 - 90 km|Xe du lịch riêng theo ngày|30 - 90 phút|650000",
            "hồ chí minh", "Chợ Bến Thành & Phố đi bộ Nguyễn Huệ|400 m|Đi bộ trực tiếp từ khách sạn|5 phút|0\nDinh Độc Lập & Nhà thờ Đức Bà|1.1 km|Xe đạp / Taxi / Đi bộ|6 phút|60000\nBến Bạch Đằng & Waterbus sông Sài Gòn|900 m|Đi bộ / Xe điện|5 phút|50000\nĐịa đạo Củ Chi (Nửa ngày)|55 km|Xe riêng 4-7 chỗ đón tận sảnh|75 phút|950000",
            "hội an", "Phố cổ Hội An & Chùa Cầu|600 m|Xe đạp miễn phí của homestay / Đi bộ|5 phút|0\nRừng dừa Bảy Mẫu (Thúng chai)|4.5 km|Xe điện / Xe máy / Taxi|12 phút|120000\nBiển An Bàng|4.8 km|Xe đạp hoặc Shuttle miễn phí|15 phút|0\nThánh địa Mỹ Sơn|40 km|Xe riêng khứ hồi đón tại sảnh|60 phút|600000",
            "phú quốc", "Cáp treo Hòn Thơm & Thị trấn Hoàng Hôn|12 km|Xe riêng 4-7 chỗ|20 phút|280000\nGrand World & Thành phố không ngủ|28 km|Shuttle bus hoặc Xe riêng|35 phút|350000\nVinWonders & Vinpearl Safari Phú Quốc|30 km|Xe riêng khứ hồi|40 phút|450000\nBãi Sao & Làng chài Hàm Ninh thưởng thức hải sản|18 km|Xe riêng đón tại sảnh|25 phút|300000",
            "nha trang", "VinWonders Nha Trang & Cáp treo vượt biển|6 km|Taxi / Xe riêng đón tại sảnh|12 phút|120000\nTháp Bà Ponagar & Khu tắm bùn khoáng I-Resort|4.5 km|Xe điện du lịch / Taxi|10 phút|80000\nViện Hải dương học & Cảng Cầu Đá|7 km|Taxi / Xe đưa đón|15 phút|90000\nTour 4 đảo vịnh Nha Trang lặn ngắm san hô|Khởi hành tại cảng|Xe đưa đón ra bến tàu|20 phút|450000",
            "đà lạt", "Quảng trường Lâm Viên & Hồ Xuân Hương|1.8 km|Đi bộ hoặc Xe máy ngắm cảnh|5 phút|0\nThung lũng Tình Yêu & Đồi Mộng Mơ|6 km|Taxi / Xe máy thuê|15 phút|100000\nĐỉnh Langbiang (Xe jeep chinh phục đỉnh)|14 km|Xe riêng 4-7 chỗ|25 phút|280000\nGa xe lửa cổ Đà Lạt & Chùa Ve Chai Linh Phước|7 km|Xe taxi hoặc Tàu hỏa du lịch|15 phút|110000",
            "huế", "Đại Nội Huế (Hoàng thành triều Nguyễn)|1.2 km|Đi bộ hoặc Xích lô ngắm cảnh|5 phút|50000\nChùa Thiên Mụ & Thuyền rồng Ca Huế sông Hương|4.5 km|Thuyền rồng đón tại bến khách sạn|15 phút|150000\nLăng Khải Định & Lăng Tự Đức|9 km|Xe riêng tham quan các lăng tẩm|20 phút|320000\nChợ Đông Ba & Phố đêm Hoàng Thành|1.5 km|Đi bộ hoặc Xích lô|5 phút|40000"
    );

    /** Chi co so mau (SampleDataSeeder); co so doi tac that khong bi dien noi dung mau. */
    static final java.util.Set<String> SAMPLE_HOTELS = java.util.Set.of("Sunrise Đà Nẵng Hotel","Old Quarter Boutique Hà Nội","Saigon Central Inn","Hội An Riverside Homestay","Phú Quốc Emerald Bay Luxury Resort","Nha Trang Horizon Beachfront Hotel","Đà Lạt Pine Forest Valley Villa","Huế Imperial Heritage Boutique Hotel");

    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final SiteContentRepository contents;

    public SampleHotelDetailsSeeder(HotelRepository hotels, RoomRepository rooms, SiteContentRepository contents) {
        this.hotels = hotels;
        this.rooms = rooms;
        this.contents = contents;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (contents.existsById(MARKER)) {
            return;
        }
        int filled = 0;
        for (Hotel h : hotels.findAll()) {
            if (!SAMPLE_HOTELS.contains(h.getName())) {
                continue;
            }
            String city = h.getCity() == null ? "" : h.getCity().toLowerCase(Locale.ROOT);
            if (h.getGallery() == null) {
                h.setGallery(String.join("\n",
                        U + "photo-1611892440504-42a792e24d32" + Q + "|Phòng ngủ",
                        U + "photo-1584622650111-993a426fbf0a" + Q + "|Phòng tắm",
                        U + "photo-1571896349842-33c89424de2d" + Q + "|Hồ bơi",
                        U + "photo-1591088398332-8a7791972843" + Q + "|Sảnh lễ tân"));
            }
            if (h.getCheckInTime() == null) h.setCheckInTime("14:00");
            if (h.getCheckOutTime() == null) h.setCheckOutTime("12:00");
            if (h.getHouseRules() == null) h.setHouseRules(HOUSE_RULES);
            if (h.getTransfers() == null) h.setTransfers(TRANSFERS);
            if (h.getDining() == null) {
                h.setDining(String.join("\n",
                        "Buffet sáng " + h.getName() + "|Á - Âu & đặc sản địa phương|06:30 – 10:00|Món nóng, bánh ngọt và trái cây tươi|Theo hạng phòng hoặc 180.000 ₫/khách",
                        "Quầy cà phê & đồ uống|Đồ uống & bánh ngọt|08:00 – 22:00|Cà phê pha máy, trà chiều|Từ 55.000 ₫"));
            }
            if (h.getAttractions() == null) {
                ATTRACTIONS.entrySet().stream().filter(e -> city.contains(e.getKey())).findFirst()
                        .ifPresent(e -> h.setAttractions(e.getValue()));
            }
            for (Room r : rooms.findByHotelId(h.getId())) {
                fillRoom(r);
            }
            filled++;
        }
        SiteContent marker = new SiteContent();
        marker.setContentType(MARKER);
        marker.setDataJson("{\"hotels\":" + filled + "}");
        contents.save(marker);
        log.info("Da dien noi dung trang chi tiet mau cho {} co so (doi tac co the sua tai Trang doi tac)", filled);
    }

    private static void fillRoom(Room r) {
        String t = r.getRoomType() == null ? "" : r.getRoomType().toLowerCase(Locale.ROOT);
        String[] d;
        if (t.contains("villa") || t.contains("bungalow") || t.contains("beachfront")) {
            d = new String[]{"120", "2 giường King", "Bể bơi riêng, Sân hiên, Bồn tắm, Wifi miễn phí",
                    "photo-1540555700478-4be289fbecef", "photo-1582719478250-c89cae4dc85b", "photo-1584622650111-993a426fbf0a"};
        } else if (t.contains("suite") || t.contains("family") || t.contains("executive")) {
            d = new String[]{"60", "1 giường King + 2 giường đơn", "Phòng khách riêng, Ban công, Bồn tắm, Wifi miễn phí",
                    "photo-1582719478250-c89cae4dc85b", "photo-1591088398332-8a7791972843", "photo-1566665797739-1674de7a421a"};
        } else if (t.contains("deluxe") || t.contains("ocean") || t.contains("premier") || t.contains("studio") || t.contains("view")) {
            d = new String[]{"35", "1 giường King hoặc 2 giường đơn", "Ban công, Bàn làm việc, Ấm đun nước, Wifi miễn phí",
                    "photo-1611892440504-42a792e24d32", "photo-1590490360182-c33d57733427", "photo-1578683010236-d716f9a3f461"};
        } else {
            d = new String[]{"25", "1 giường Queen hoặc 2 giường đơn", "Điều hòa, Smart TV, Wifi miễn phí, Vòi sen",
                    "photo-1590490360182-c33d57733427", "photo-1566665797739-1674de7a421a", "photo-1584622650111-993a426fbf0a"};
        }
        if (r.getAreaSqm() == null) r.setAreaSqm(Integer.parseInt(d[0]));
        if (r.getBedInfo() == null) r.setBedInfo(d[1]);
        if (r.getAmenities() == null) r.setAmenities(d[2]);
        if (r.getImageUrls() == null) r.setImageUrls(U + d[3] + Q + "\n" + U + d[4] + Q + "\n" + U + d[5] + Q);
    }
}
