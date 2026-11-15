package com.quickstay.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.ApiTestBase;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Loi tim duoc khi review ma admin (T186, T187):
 * 1. GET /admin/hotels thieu minPrice trong khi tai lieu ghi "tra mang nhu /hotels".
 * 2. Sua loai phong doi sang khach san khac khi da co don: don cu am tham doi khach san.
 */
class AdminReviewFixTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;
    @Autowired UserRepository users;

    private String admin;
    private Hotel hotel;

    @BeforeEach
    void setUp() throws Exception {
        admin = read(mvc.perform(withBody(post("/api/auth/login"), null,
                Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD))).andReturn()).get("token").asText();
        hotel = newHotel("Review A");
    }

    private Hotel newHotel(String name) {
        Hotel h = new Hotel();
        h.setName(name + " " + UUID.randomUUID());
        h.setCity("Test City");
        return hotels.save(h);
    }

    private Room newRoom(Hotel h, long price) {
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.valueOf(price));
        r.setQuantity(2);
        return rooms.save(r);
    }

    private void bookingFor(Room r) {
        Booking b = new Booking();
        b.setUser(users.findByEmail(ADMIN_EMAIL).orElseThrow());
        b.setRoom(r);
        b.setCheckIn(LocalDate.of(2031, 3, 1));
        b.setCheckOut(LocalDate.of(2031, 3, 2));
        b.setGuests(1);
        b.setTotalPrice(r.getPricePerNight());
        bookings.save(b);
    }

    private JsonNode adminHotel(long id) throws Exception {
        JsonNode list = read(mvc.perform(get("/api/admin/hotels").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk()).andReturn());
        for (JsonNode h : list) if (h.get("id").asLong() == id) return h;
        return fail("khong thay khach san " + id);
    }

    private Map<String, Object> roomBody(long hotelId) {
        return Map.of("hotelId", hotelId, "roomType", "Standard", "pricePerNight", 500000, "capacity", 2, "quantity", 2);
    }

    // ---- 1. minPrice trong danh sach admin ----

    @Test
    void admin_hotel_list_includes_min_price_like_public_list() throws Exception {
        newRoom(hotel, 700_000);
        newRoom(hotel, 400_000);
        JsonNode h = adminHotel(hotel.getId());
        assertEquals(400000, h.get("minPrice").asInt());

        Hotel empty = newHotel("Review empty");
        assertTrue(adminHotel(empty.getId()).get("minPrice").isNull(), "khach san chua co phong: minPrice null");
    }

    @Test
    void updated_hotel_response_keeps_min_price() throws Exception {
        newRoom(hotel, 650_000);
        mvc.perform(withBody(put("/api/admin/hotels/" + hotel.getId()), admin, Map.of("name", "Doi Ten", "city", "Hue")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Doi Ten"))
                .andExpect(jsonPath("$.minPrice").value(650000));
    }

    @Test
    void created_hotel_has_null_min_price() throws Exception {
        mvc.perform(withBody(post("/api/admin/hotels"), admin, Map.of("name", "Moi " + UUID.randomUUID(), "city", "Hue")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.minPrice").isEmpty());
    }

    // ---- 2. Doi khach san cua loai phong da co don ----

    @Test
    void cannot_move_room_with_bookings_to_another_hotel() throws Exception {
        Room room = newRoom(hotel, 500_000);
        bookingFor(room);
        Hotel other = newHotel("Review B");

        mvc.perform(withBody(put("/api/admin/rooms/" + room.getId()), admin, roomBody(other.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Khong the chuyen loai phong da co don dat phong sang khach san khac"));
        assertEquals(hotel.getId(), rooms.findById(room.getId()).orElseThrow().getHotel().getId(), "phong khong doi khach san");
    }

    @Test
    void room_with_bookings_can_still_be_edited_in_same_hotel() throws Exception {
        Room room = newRoom(hotel, 500_000);
        bookingFor(room);
        mvc.perform(withBody(put("/api/admin/rooms/" + room.getId()), admin,
                        Map.of("hotelId", hotel.getId(), "roomType", "Deluxe", "pricePerNight", 800000, "capacity", 3, "quantity", 4)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomType").value("Deluxe"));
    }

    @Test
    void room_without_bookings_can_move_to_another_hotel() throws Exception {
        Room room = newRoom(hotel, 500_000);
        Hotel other = newHotel("Review C");
        mvc.perform(withBody(put("/api/admin/rooms/" + room.getId()), admin, roomBody(other.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotelId").value(other.getId()));
    }
}
