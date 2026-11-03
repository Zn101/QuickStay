package com.quickstay;

import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * POST /api/bookings (T087-T090). JwtAuthFilter (T043) chua co nen gia lap dang nhap bang user(email);
 * filter se dat email cua token vao Authentication.getName() giong vay.
 * Loai phong rieng cho moi test: Deluxe 500k/dem, toi da 2 khach.
 */
class BookingApiTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;
    @Autowired Clock clock;

    private Room room;
    private String customer;

    @BeforeEach
    void setUp() throws Exception {
        Hotel h = new Hotel();
        h.setName("Booking " + UUID.randomUUID());
        h.setCity("Test City");
        hotels.save(h);
        room = new Room();
        room.setHotel(h);
        room.setRoomType("Deluxe");
        room.setPricePerNight(BigDecimal.valueOf(500_000));
        room.setCapacity(2);
        room.setQuantity(3);
        rooms.save(room);
        customer = newCustomerEmail();
        registerCustomer(customer);
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    private Map<String, Object> body(LocalDate in, LocalDate out, Object guests) {
        Map<String, Object> m = new HashMap<>();
        m.put("roomId", room.getId());
        m.put("checkIn", in.toString());
        m.put("checkOut", out.toString());
        m.put("guests", guests);
        m.put("guestName", "Nguyen Van A");
        m.put("guestPhone", "0912345678");
        m.put("note", "Tang cao");
        return m;
    }

    private ResultActions book(Map<String, Object> body) throws Exception {
        return mvc.perform(withBody(post("/api/bookings"), null, body).with(user(customer).roles("CUSTOMER")));
    }

    @Test
    void TC_BOOK_01_valid_booking_is_201_pending_with_total_price() throws Exception {
        LocalDate in = today().plusDays(10);
        long id = read(book(body(in, in.plusDays(2), 2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(1000000))
                .andExpect(jsonPath("$.roomId").value(room.getId()))
                .andExpect(jsonPath("$.roomType").value("Deluxe"))
                .andExpect(jsonPath("$.hotelId").value(room.getHotel().getId()))
                .andExpect(jsonPath("$.hotelName").value(room.getHotel().getName()))
                .andExpect(jsonPath("$.userEmail").value(customer))
                .andExpect(jsonPath("$.checkIn").value(in.toString()))
                .andExpect(jsonPath("$.guests").value(2))
                .andExpect(jsonPath("$.guestName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.note").value("Tang cao"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn()).get("id").asLong();

        Booking saved = bookings.findById(id).orElseThrow();
        assertEquals(BookingStatus.PENDING, saved.getStatus());
        assertEquals(0, BigDecimal.valueOf(1_000_000).compareTo(saved.getTotalPrice()));
    }

    @Test
    void TC_BOOK_02_requires_login() throws Exception {
        LocalDate in = today().plusDays(10);
        mvc.perform(withBody(post("/api/bookings"), null, body(in, in.plusDays(1), 1)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void TC_BOOK_03_admin_cannot_book() throws Exception {
        LocalDate in = today().plusDays(10);
        mvc.perform(withBody(post("/api/bookings"), null, body(in, in.plusDays(1), 1))
                        .with(user(ADMIN_EMAIL).roles("ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void TC_BOOK_07_dates_are_validated() throws Exception {
        LocalDate t = today();
        book(body(t.minusDays(1), t.plusDays(1), 1)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ngay nhan phong khong duoc o qua khu"));
        book(body(t.plusDays(5), t.plusDays(5), 1)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ngay tra phong phai sau ngay nhan phong"));
        book(body(t.plusDays(5), t.plusDays(4), 1)).andExpect(status().isBadRequest());
        // Nhan phong ngay hom nay (gio Viet Nam) la hop le
        book(body(t, t.plusDays(1), 1)).andExpect(status().isCreated());
    }

    @Test
    void TC_BOOK_07b_guests_must_fit_room_capacity() throws Exception {
        LocalDate in = today().plusDays(10);
        book(body(in, in.plusDays(1), 3)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Phong chi chua toi da 2 khach"));
        book(body(in, in.plusDays(1), 0)).andExpect(status().isBadRequest());
        book(body(in, in.plusDays(1), 2)).andExpect(status().isCreated());
    }

    @Test
    void TC_BOOK_07c_missing_or_invalid_fields_are_400() throws Exception {
        LocalDate in = today().plusDays(10);
        Map<String, Object> noName = body(in, in.plusDays(1), 1);
        noName.put("guestName", "  ");
        book(noName).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());

        Map<String, Object> noPhone = body(in, in.plusDays(1), 1);
        noPhone.remove("guestPhone");
        book(noPhone).andExpect(status().isBadRequest());

        Map<String, Object> noRoom = body(in, in.plusDays(1), 1);
        noRoom.remove("roomId");
        book(noRoom).andExpect(status().isBadRequest());

        Map<String, Object> noGuests = body(in, in.plusDays(1), 1);
        noGuests.remove("guests");
        book(noGuests).andExpect(status().isBadRequest());

        Map<String, Object> longNote = body(in, in.plusDays(1), 1);
        longNote.put("note", "a".repeat(1001));
        book(longNote).andExpect(status().isBadRequest());

        Map<String, Object> badDate = body(in, in.plusDays(1), 1);
        badDate.put("checkIn", "03-11-2026");
        book(badDate).andExpect(status().isBadRequest());
    }

    @Test
    void TC_BOOK_08_unknown_room_is_404() throws Exception {
        LocalDate in = today().plusDays(10);
        Map<String, Object> b = body(in, in.plusDays(1), 1);
        b.put("roomId", 999999);
        book(b).andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Khong tim thay phong"));
    }
}
