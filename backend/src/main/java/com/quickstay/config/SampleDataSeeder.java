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
        if (hotels.count() > 0) {
            return;
        }
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

        log.info("Da tao du lieu mau: {} khach san, {} loai phong", hotels.count(), rooms.count());
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
