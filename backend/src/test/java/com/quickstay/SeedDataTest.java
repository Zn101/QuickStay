package com.quickstay;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.Role;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** Admin mac dinh (T020) va du lieu mau (T037) duoc tao khi khoi dong. */
class SeedDataTest extends ApiTestBase {

    @Autowired UserRepository users;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;

    @Test
    void default_admin_exists() {
        assertEquals(Role.ADMIN, users.findByEmail(ADMIN_EMAIL).orElseThrow().getRole());
    }

    @Test
    @Transactional
    void four_sample_hotels_with_room_types() {
        Map<String, Hotel> byName = hotels.findAll().stream().collect(Collectors.toMap(Hotel::getName, h -> h, (a, b) -> a));
        Map<String, Integer> expectedRoomTypes = Map.of(
                "Sunrise Đà Nẵng Hotel", 3,
                "Old Quarter Boutique Hà Nội", 2,
                "Saigon Central Inn", 2,
                "Hội An Riverside Homestay", 2);
        expectedRoomTypes.forEach((name, count) -> {
            Hotel h = byName.get(name);
            assertNotNull(h, "thieu khach san mau " + name);
            assertEquals(count, rooms.findByHotelIdOrderByPricePerNight(h.getId()).size(), name);
        });
        assertEquals("Đà Nẵng", byName.get("Sunrise Đà Nẵng Hotel").getCity(), "luu dung tieng Viet co dau");
        assertTrue(List.of(byName.get("Saigon Central Inn").getAmenities().split(",\\s*")).contains("Bãi đỗ xe"));
    }
}
