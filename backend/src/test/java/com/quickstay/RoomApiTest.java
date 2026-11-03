package com.quickstay;

import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * GET /api/hotels/{id}/rooms (T076, T077, T078).
 * API dat phong chua co (T087+) nen don dat phong duoc tao thang qua repository.
 * Khach san rieng cho moi test: Standard 300k (2 phong), Deluxe 900k (1 phong), Suite 900k (1 phong).
 */
class RoomApiTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired BookingRepository bookings;

    private Hotel hotel;
    private Room standard;
    private Room deluxe;
    private User guest;

    @BeforeEach
    void setUp() {
        hotel = new Hotel();
        hotel.setName("Rooms " + UUID.randomUUID());
        hotel.setCity("Test City");
        hotels.save(hotel);
        standard = room("Standard", 300_000, 2);
        deluxe = room("Deluxe", 900_000, 1);
        room("Suite", 900_000, 1);
        guest = new User();
        guest.setEmail("rooms-" + UUID.randomUUID() + "@test.com");
        guest.setPasswordHash("x");
        users.save(guest);
    }

    private Room room(String type, long price, int quantity) {
        Room r = new Room();
        r.setHotel(hotel);
        r.setRoomType(type);
        r.setPricePerNight(BigDecimal.valueOf(price));
        r.setCapacity(2);
        r.setQuantity(quantity);
        return rooms.save(r);
    }

    private static LocalDate in(int days) {
        return LocalDate.now().plusDays(days);
    }

    private void book(Room r, int from, int to, BookingStatus status) {
        Booking b = new Booking();
        b.setUser(guest);
        b.setRoom(r);
        b.setCheckIn(in(from));
        b.setCheckOut(in(to));
        b.setGuests(1);
        b.setTotalPrice(r.getPricePerNight());
        b.setStatus(status);
        bookings.save(b);
    }

    private MockHttpServletRequestBuilder roomsBetween(int from, int to) {
        return get("/api/hotels/{id}/rooms", hotel.getId())
                .param("checkIn", in(from).toString()).param("checkOut", in(to).toString());
    }

    @Test
    void TC_ROOM_01_rooms_are_public_sorted_by_price_without_availability() throws Exception {
        mvc.perform(get("/api/hotels/{id}/rooms", hotel.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].roomType").value("Standard"))
                .andExpect(jsonPath("$[1].roomType").value("Deluxe"))   // cung gia 900k: theo id
                .andExpect(jsonPath("$[2].roomType").value("Suite"))
                .andExpect(jsonPath("$[0].hotelId").value(hotel.getId()))
                .andExpect(jsonPath("$[0].pricePerNight").value(300000))
                .andExpect(jsonPath("$[0].capacity").value(2))
                .andExpect(jsonPath("$[0].quantity").value(2))
                .andExpect(jsonPath("$[0].available").doesNotExist());
    }

    @Test
    void TC_ROOM_02_no_booking_means_all_rooms_available() throws Exception {
        mvc.perform(roomsBetween(10, 12))
                .andExpect(jsonPath("$[0].available").value(2))
                .andExpect(jsonPath("$[1].available").value(1))
                .andExpect(jsonPath("$[2].available").value(1));
    }

    @Test
    void TC_ROOM_03_overlapping_booking_reduces_only_its_room_type() throws Exception {
        book(standard, 10, 12, BookingStatus.PENDING);
        mvc.perform(roomsBetween(11, 13))
                .andExpect(jsonPath("$[0].available").value(1))
                .andExpect(jsonPath("$[1].available").value(1));
    }

    @Test
    void TC_ROOM_04_adjacent_stays_do_not_reduce_availability() throws Exception {
        book(standard, 10, 12, BookingStatus.CONFIRMED);
        mvc.perform(roomsBetween(12, 14)).andExpect(jsonPath("$[0].available").value(2));
        mvc.perform(roomsBetween(8, 10)).andExpect(jsonPath("$[0].available").value(2));
    }

    @Test
    void TC_ROOM_05_several_rooms_of_same_type_until_full() throws Exception {
        book(standard, 20, 23, BookingStatus.PENDING);
        mvc.perform(roomsBetween(21, 22)).andExpect(jsonPath("$[0].available").value(1));
        book(standard, 21, 25, BookingStatus.CHECKED_IN);
        mvc.perform(roomsBetween(21, 22)).andExpect(jsonPath("$[0].available").value(0));
        book(deluxe, 21, 22, BookingStatus.PENDING);
        mvc.perform(roomsBetween(21, 22)).andExpect(jsonPath("$[1].available").value(0));
    }

    @Test
    void TC_ROOM_06_cancelled_bookings_free_the_room() throws Exception {
        book(deluxe, 30, 32, BookingStatus.CANCELLED);
        mvc.perform(roomsBetween(30, 32)).andExpect(jsonPath("$[1].available").value(1));
    }

    @Test
    void TC_ROOM_07_invalid_dates_are_400() throws Exception {
        long id = hotel.getId();
        mvc.perform(get("/api/hotels/{id}/rooms", id).param("checkIn", in(5).toString()).param("checkOut", in(3).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ngay tra phong phai sau ngay nhan phong"));
        mvc.perform(get("/api/hotels/{id}/rooms", id).param("checkIn", in(5).toString()).param("checkOut", in(5).toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/hotels/{id}/rooms", id).param("checkIn", in(5).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Can nhap ca ngay nhan va ngay tra phong"));
        mvc.perform(get("/api/hotels/{id}/rooms", id).param("checkOut", in(5).toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/hotels/{id}/rooms", id).param("checkIn", "abc").param("checkOut", in(5).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void TC_ROOM_08_unknown_hotel_is_404() throws Exception {
        mvc.perform(get("/api/hotels/{id}/rooms", 999999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Khong tim thay khach san"));
    }
}
