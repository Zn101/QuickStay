package com.quickstay.config;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Khoi tao tai khoan doi tac mau cho Homestay va Khach san (HOTEL_MANAGER).
 * Chay o @Order(3) sau khi Admin va Sample Data da duoc nap.
 * CHI chay khi bat du lieu mau (app.seed.sample-data=true): mat khau mau la cong khai, khong duoc ton tai tren moi truong that.
 */
@Component
@Order(3)
@ConditionalOnProperty(name = "app.seed.sample-data", havingValue = "true", matchIfMissing = true)
public class PartnerAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PartnerAccountInitializer.class);

    private final UserRepository users;
    private final HotelRepository hotels;
    private final PasswordEncoder encoder;

    public PartnerAccountInitializer(UserRepository users, HotelRepository hotels, PasswordEncoder encoder) {
        this.users = users;
        this.hotels = hotels;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 1. Khoi tao tai khoan cho ben Homestay (Hoi An Riverside Homestay)
        String homestayEmail = "homestay@quickstay.local";
        if (!users.existsByEmail(homestayEmail)) {
            Hotel homestay = hotels.findAll().stream()
                    .filter(h -> h.getName().toLowerCase().contains("homestay") || h.getCity().toLowerCase().contains("hội an"))
                    .findFirst()
                    .orElse(null);

            if (homestay != null) {
                User u = new User();
                u.setEmail(homestayEmail);
                u.setPasswordHash(encoder.encode("Host@123"));
                u.setFullName("Chủ Homestay Hội An");
                u.setPhone("0905123456");
                u.setRole(Role.HOTEL_MANAGER);
                u.setHotelId(homestay.getId());
                u.setEmailVerified(true);
                users.save(u);
                log.info("Da tao tai khoan doi tac Homestay: {} (co so: {})", homestayEmail, homestay.getName());
            }
        }

        // 2. Khoi tao tai khoan cho ben Khach san (Sunrise Da Nang)
        String partnerEmail = "partner@quickstay.local";
        if (!users.existsByEmail(partnerEmail)) {
            Hotel hotel = hotels.findAll().stream()
                    .filter(h -> h.getName().toLowerCase().contains("sunrise") || h.getCity().toLowerCase().contains("đà nẵng"))
                    .findFirst()
                    .orElse(null);

            if (hotel != null) {
                User u = new User();
                u.setEmail(partnerEmail);
                u.setPasswordHash(encoder.encode("Partner@123"));
                u.setFullName("Quản lý Sunrise Đà Nẵng");
                u.setPhone("0905987654");
                u.setRole(Role.HOTEL_MANAGER);
                u.setHotelId(hotel.getId());
                u.setEmailVerified(true);
                users.save(u);
                log.info("Da tao tai khoan doi tac Khach san: {} (co so: {})", partnerEmail, hotel.getName());
            }
        }
    }
}
