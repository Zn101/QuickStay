package com.quickstay.config;

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

import java.math.BigDecimal;

/**
 * Du lieu mau 4 khach san (T037), chi tao khi bang hotels con trong.
 * Tat bang SEED_SAMPLE_DATA=false.
 */
@Component
@Order(2)
@ConditionalOnProperty(name = "app.seed.sample-data", havingValue = "true", matchIfMissing = true)
public class SampleDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleDataSeeder.class);

    private final HotelRepository hotels;
    private final RoomRepository rooms;

    public SampleDataSeeder(HotelRepository hotels, RoomRepository rooms) {
        this.hotels = hotels;
        this.rooms = rooms;
    }

    /** Mot transaction: loi giua chung thi khong de lai du lieu mau dang do. */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (hotels.count() == 0) {
            Hotel h1 = hotel("Sunrise Đà Nẵng Hotel", "Đà Nẵng", "12 Võ Nguyên Giáp, Sơn Trà",
                    "Khách sạn gần biển Mỹ Khê, phù hợp nghỉ dưỡng gia đình và công tác.",
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                    "Hồ bơi, Wifi miễn phí, Ăn sáng, Gần biển");
            room(h1, "Standard", 650_000, 2, 5);
            room(h1, "Deluxe", 950_000, 3, 4);
            room(h1, "Family Suite", 1_600_000, 5, 2);

            Hotel h2 = hotel("Old Quarter Boutique Hà Nội", "Hà Nội", "28 Hàng Bạc, Hoàn Kiếm",
                    "Khách sạn boutique giữa phố cổ, đi bộ tới Hồ Gươm và các điểm tham quan chính.",
                    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                    "Wifi miễn phí, Lễ tân 24/7, Ăn sáng, Điều hòa");
            room(h2, "Standard", 550_000, 2, 6);
            room(h2, "Deluxe", 850_000, 2, 3);

            Hotel h3 = hotel("Saigon Central Inn", "Hồ Chí Minh", "45 Lê Lợi, Quận 1",
                    "Nhà nghỉ hiện đại ngay trung tâm Quận 1, thuận tiện di chuyển và mua sắm.",
                    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                    "Wifi miễn phí, Điều hòa, Bãi đỗ xe, Lễ tân 24/7");
            room(h3, "Standard", 480_000, 2, 8);
            room(h3, "Deluxe", 720_000, 3, 4);

            Hotel h4 = hotel("Hội An Riverside Homestay", "Hội An", "8 Bạch Đằng, Cẩm Châu",
                    "Homestay yên tĩnh bên sông Hoài, cách phố cổ Hội An vài phút đi bộ.",
                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                    "Wifi miễn phí, Cho thuê xe đạp, Ăn sáng, Ban công view sông");
            room(h4, "Standard", 520_000, 2, 4);
            room(h4, "Family Suite", 1_100_000, 4, 2);
        }

        seedExtraHotelsIfMissing();

        log.info("Du lieu khach san hien co: {} khach san, {} loai phong", hotels.count(), rooms.count());
    }

    private void seedExtraHotelsIfMissing() {
        boolean hasPhuQuoc = hotels.findAll().stream()
                .anyMatch(h -> "Phú Quốc Emerald Bay Luxury Resort".equals(h.getName()));
        if (hasPhuQuoc) {
            return;
        }

        Hotel h5 = hotel("Phú Quốc Emerald Bay Luxury Resort", "Phú Quốc", "Bãi Khem, An Thới, TP. Phú Quốc",
                "Khu nghỉ dưỡng 5 sao cao cấp bên bờ biển Bãi Khem với bãi cát trắng mịn, hồ bơi vô cực nhìn ra vịnh biển Thái Lan.",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
                "Bãi biển riêng, Hồ bơi vô cực, Spa & Massage, Buffet sáng Á - Âu, Đưa đón sân bay, Wifi miễn phí");
        room(h5, "Deluxe Garden View", 1_200_000, 2, 6);
        room(h5, "Ocean View Premier", 1_850_000, 3, 4);
        room(h5, "Beachfront Private Villa", 3_500_000, 4, 2);

        Hotel h6 = hotel("Nha Trang Horizon Beachfront Hotel", "Nha Trang", "102 Trần Phú, Lộc Thọ, TP. Nha Trang",
                "Khách sạn mặt biển đường Trần Phú, ngắm trọn vẹn vịnh Nha Trang xinh đẹp, rooftop sky lounge hiện đại.",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                "View biển trực diện, Hồ bơi trên cao, Rooftop Bar, Bữa sáng buffet, Phòng gym, Wifi tốc độ cao");
        room(h6, "Superior City View", 620_000, 2, 8);
        room(h6, "Deluxe Ocean Front", 980_000, 2, 5);
        room(h6, "Executive Family Suite", 1_750_000, 4, 3);

        Hotel h7 = hotel("Đà Lạt Pine Forest Valley Villa", "Đà Lạt", "15 Khởi Nghĩa Bắc Sơn, Phường 10, TP. Đà Lạt",
                "Biệt thự nghỉ dưỡng giữa rừng thông mộng mơ, khí hậu se lạnh trong lành, ban công ngắm sương mù và sân vườn BBQ.",
                "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800",
                "Sân vườn BBQ, View đồi thông, Lò sưởi ấm cúng, Cho thuê xe máy, Trà & Cà phê miễn phí, Bữa sáng tại phòng");
        room(h7, "Cozy Pine Room", 490_000, 2, 6);
        room(h7, "Valley View Studio", 780_000, 3, 4);
        room(h7, "Family Pine Villa", 1_450_000, 6, 2);

        Hotel h8 = hotel("Huế Imperial Heritage Boutique Hotel", "Huế", "22 Lê Lợi, Vĩnh Ninh, TP. Huế",
                "Khách sạn boutique phong cách cung đình triều Nguyễn giao thoa kiến trúc Pháp cổ điển, bên bờ sông Hương thơ mộng.",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                "Bên bờ sông Hương, Nhà hàng Cung đình, Bể bơi bốn mùa, Cho thuê cổ phục Việt, Cho thuê xe đạp miễn phí");
        room(h8, "Classic Heritage", 530_000, 2, 5);
        room(h8, "Imperial Suite River View", 890_000, 3, 4);
        room(h8, "Royal Family Suite", 1_350_000, 5, 2);
    }

    private Hotel hotel(String name, String city, String address, String desc, String image, String amenities) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setCity(city);
        h.setAddress(address);
        h.setDescription(desc);
        h.setImageUrl(image);
        h.setAmenities(amenities);
        return hotels.save(h);
    }

    private void room(Hotel hotel, String type, long price, int capacity, int quantity) {
        Room r = new Room();
        r.setHotel(hotel);
        r.setRoomType(type);
        r.setPricePerNight(BigDecimal.valueOf(price));
        r.setCapacity(capacity);
        r.setQuantity(quantity);
        r.setDescription("Phòng " + type + " tại " + hotel.getName());
        rooms.save(r);
    }
}
