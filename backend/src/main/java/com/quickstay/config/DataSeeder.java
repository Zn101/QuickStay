package com.quickstay.config;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Tao tai khoan admin va du lieu mau khi CSDL con trong. */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final PasswordEncoder encoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataSeeder(UserRepository users, HotelRepository hotels, RoomRepository rooms, PasswordEncoder encoder,
                      @Value("${app.admin.email}") String adminEmail,
                      @Value("${app.admin.password}") String adminPassword) {
        this.users = users;
        this.hotels = hotels;
        this.rooms = rooms;
        this.encoder = encoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (!users.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPasswordHash(encoder.encode(adminPassword));
            admin.setFullName("Quan tri vien");
            admin.setRole(Role.ADMIN);
            users.save(admin);
            log.info("Da tao tai khoan admin {}", adminEmail);
        }
        if (hotels.count() == 0) {
            seedHotels();
        }
    }

    private void seedHotels() {
        Hotel h1 = hotel("Sunrise Da Nang Hotel", "Da Nang", "12 Vo Nguyen Giap, Son Tra",
                "Khach san gan bien My Khe, phu hop nghi duong gia dinh va cong tac.",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "Ho boi, Wifi mien phi, An sang, Gan bien");
        room(h1, "Standard", 650000, 2, 5);
        room(h1, "Deluxe", 950000, 3, 4);
        room(h1, "Family Suite", 1600000, 5, 2);

        Hotel h2 = hotel("Old Quarter Boutique Ha Noi", "Ha Noi", "28 Hang Bac, Hoan Kiem",
                "Khach san boutique giua pho co, di bo toi Ho Guom va cac diem tham quan chinh.",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                "Wifi mien phi, Le tan 24/7, An sang, Dieu hoa");
        room(h2, "Standard", 550000, 2, 6);
        room(h2, "Deluxe", 850000, 2, 3);

        Hotel h3 = hotel("Saigon Central Inn", "Ho Chi Minh", "45 Le Loi, Quan 1",
                "Nha nghi hien dai ngay trung tam Quan 1, thuan tien di chuyen va mua sam.",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                "Wifi mien phi, Dieu hoa, Bai do xe, Le tan 24/7");
        room(h3, "Standard", 480000, 2, 8);
        room(h3, "Deluxe", 720000, 3, 4);

        Hotel h4 = hotel("Hoi An Riverside Homestay", "Hoi An", "8 Bach Dang, Cam Chau",
                "Homestay yen tinh ben song Hoai, cach pho co Hoi An vai phut di bo.",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                "Wifi mien phi, Cho thue xe dap, An sang, Ban cong view song");
        room(h4, "Standard", 520000, 2, 4);
        room(h4, "Family Suite", 1100000, 4, 2);
        log.info("Da tao du lieu mau: {} khach san", hotels.count());
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
        r.setDescription("Phong " + type + " tai " + hotel.getName());
        rooms.save(r);
    }
}
