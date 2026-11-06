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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * POST /api/bookings, GET /api/bookings/me, PATCH /api/bookings/{id}/cancel (T087-T090, T100-T102, T112-T113). JwtAuthFilter (T043) chua co nen gia lap dang nhap bang user(email);
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

    // ---- T100, T102: chong dat trung, ky nghi lien ke ----

    /** Loai phong moi cung khach san voi `room`, so phong tuy chon. */
    private Room newRoom(int quantity) {
        Room r = new Room();
        r.setHotel(room.getHotel());
        r.setRoomType("Type " + UUID.randomUUID());
        r.setPricePerNight(BigDecimal.valueOf(300_000));
        r.setCapacity(2);
        r.setQuantity(quantity);
        return rooms.save(r);
    }

    private ResultActions book(Room r, int from, int to) throws Exception {
        Map<String, Object> b = body(today().plusDays(from), today().plusDays(to), 1);
        b.put("roomId", r.getId());
        return book(b);
    }

    @Test
    void TC_BOOK_04_same_dates_on_full_room_is_409() throws Exception {
        Room single = newRoom(1);
        book(single, 10, 12).andExpect(status().isCreated());
        book(single, 10, 12).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Phong da het trong khoang ngay da chon"));
        book(single, 11, 13).andExpect(status().isConflict());   // chong lan mot phan
        book(single, 9, 15).andExpect(status().isConflict());    // bao trum
    }

    @Test
    void TC_BOOK_05_adjacent_stays_are_both_accepted() throws Exception {
        Room single = newRoom(1);
        book(single, 10, 12).andExpect(status().isCreated());
        book(single, 12, 14).andExpect(status().isCreated());    // nhan phong dung ngay tra cua don truoc
        book(single, 8, 10).andExpect(status().isCreated());     // tra phong dung ngay nhan cua don sau
    }

    @Test
    void TC_BOOK_06_room_type_with_two_rooms_takes_two_bookings_then_409() throws Exception {
        Room two = newRoom(2);
        book(two, 20, 22).andExpect(status().isCreated());
        book(two, 21, 23).andExpect(status().isCreated());
        book(two, 21, 22).andExpect(status().isConflict());
        book(two, 22, 24).andExpect(status().isCreated());       // don [20,22) da tra phong ngay 22
    }

    @Test
    void TC_BOOK_06b_cancelled_booking_frees_the_room() throws Exception {
        Room single = newRoom(1);
        long id = read(book(single, 30, 32).andExpect(status().isCreated()).andReturn()).get("id").asLong();
        book(single, 30, 32).andExpect(status().isConflict());
        cancel(id, customer).andExpect(status().isOk());
        book(single, 30, 32).andExpect(status().isCreated());
    }

    @Test
    void TC_BOOK_06c_other_room_types_are_not_affected() throws Exception {
        Room a = newRoom(1);
        Room b = newRoom(1);
        book(a, 40, 42).andExpect(status().isCreated());
        book(b, 40, 42).andExpect(status().isCreated());
    }

    // ---- T101: lich su dat phong ----

    @Test
    void TC_BOOK_09_history_shows_only_my_bookings_newest_first() throws Exception {
        LocalDate in = today().plusDays(50);
        long first = read(book(body(in, in.plusDays(1), 1)).andReturn()).get("id").asLong();
        long second = read(book(body(in.plusDays(5), in.plusDays(7), 2)).andReturn()).get("id").asLong();

        String other = newCustomerEmail();
        registerCustomer(other);
        mvc.perform(withBody(post("/api/bookings"), null, body(in, in.plusDays(1), 1))
                .with(user(other).roles("CUSTOMER"))).andExpect(status().isCreated());

        mvc.perform(get("/api/bookings/me").with(user(customer).roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(second))
                .andExpect(jsonPath("$[1].id").value(first))
                .andExpect(jsonPath("$[0].hotelName").value(room.getHotel().getName()))
                .andExpect(jsonPath("$[0].roomType").value("Deluxe"))
                .andExpect(jsonPath("$[0].totalPrice").value(1000000))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].userEmail").value(customer));
        mvc.perform(get("/api/bookings/me").with(user(other).roles("CUSTOMER")))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void TC_BOOK_09b_history_requires_login_and_is_empty_for_new_user() throws Exception {
        mvc.perform(get("/api/bookings/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/bookings/me").with(user(customer).roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    // ---- T112, T113: huy don ----

    private ResultActions cancel(long id, String email) throws Exception {
        return mvc.perform(patch("/api/bookings/{id}/cancel", id).with(user(email).roles("CUSTOMER")));
    }

    private long pendingBooking() throws Exception {
        LocalDate in = today().plusDays(60);
        return read(book(body(in, in.plusDays(2), 1)).andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private void setStatus(long id, BookingStatus status) {
        Booking b = bookings.findById(id).orElseThrow();
        b.setStatus(status);
        bookings.save(b);
    }

    @Test
    void TC_BOOK_10_owner_cancels_pending_booking() throws Exception {
        long id = pendingBooking();
        cancel(id, customer)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.hotelName").value(room.getHotel().getName()));
        assertEquals(BookingStatus.CANCELLED, bookings.findById(id).orElseThrow().getStatus());
        mvc.perform(get("/api/bookings/me").with(user(customer).roles("CUSTOMER")))
                .andExpect(jsonPath("$[0].status").value("CANCELLED"));
    }

    @Test
    void TC_BOOK_11_cannot_cancel_someone_elses_booking() throws Exception {
        long id = pendingBooking();
        String other = newCustomerEmail();
        registerCustomer(other);
        cancel(id, other).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Ban khong co quyen huy don dat phong nay"));
        mvc.perform(patch("/api/bookings/{id}/cancel", id).with(user(ADMIN_EMAIL).roles("ADMIN")))
                .andExpect(status().isForbidden());
        assertEquals(BookingStatus.PENDING, bookings.findById(id).orElseThrow().getStatus(), "don khong doi");
    }

    @Test
    void TC_BOOK_11b_only_pending_booking_can_be_cancelled() throws Exception {
        for (BookingStatus status : new BookingStatus[]{BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN,
                BookingStatus.COMPLETED, BookingStatus.CANCELLED}) {
            long id = pendingBooking();
            setStatus(id, status);
            cancel(id, customer).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Chi huy duoc dat phong dang cho xac nhan (PENDING)"));
            assertEquals(status, bookings.findById(id).orElseThrow().getStatus(), "don khong doi");
            setStatus(id, BookingStatus.CANCELLED);   // tra lai phong cho vong lap sau
        }
    }

    @Test
    void TC_BOOK_11c_cancelling_twice_is_409() throws Exception {
        long id = pendingBooking();
        cancel(id, customer).andExpect(status().isOk());
        cancel(id, customer).andExpect(status().isConflict());
    }

    @Test
    void TC_BOOK_11d_unknown_booking_login_and_bad_id() throws Exception {
        cancel(999999, customer).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Khong tim thay don dat phong"));
        mvc.perform(patch("/api/bookings/{id}/cancel", pendingBooking())).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/bookings/abc/cancel").with(user(customer).roles("CUSTOMER")))
                .andExpect(status().isBadRequest());
    }
}
