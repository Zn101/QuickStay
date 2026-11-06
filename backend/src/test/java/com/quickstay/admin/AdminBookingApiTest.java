package com.quickstay.admin;

import com.quickstay.ApiTestBase;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test cho GET /api/admin/bookings (T106) va
 * PATCH /api/admin/bookings/{id}/status (T107).
 * Chay day du Spring context + H2 + Flyway theo pattern ApiTestBase.
 */
class AdminBookingApiTest extends ApiTestBase {

    @Autowired BookingRepository bookingRepository;
    @Autowired HotelRepository hotelRepository;
    @Autowired RoomRepository roomRepository;
    @Autowired UserRepository userRepository;

    private Room room;

    @BeforeEach
    void setUp() {
        Hotel h = new Hotel();
        h.setName("T106 Hotel " + UUID.randomUUID());
        h.setCity("Ha Noi");
        hotelRepository.save(h);

        room = new Room();
        room.setHotel(h);
        room.setRoomType("Standard");
        room.setPricePerNight(BigDecimal.valueOf(500_000));
        room.setCapacity(2);
        room.setQuantity(5);
        roomRepository.save(room);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private String adminToken() throws Exception {
        var result = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        return read(result).get("token").asText();
    }

    /** Tao Booking truc tiep vao DB (khong qua API) voi trang thai cho truoc. */
    private Booking createBookingDirectly(BookingStatus status) {
        String email = "bk-" + UUID.randomUUID() + "@test.com";
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash("hash");
        userRepository.save(u);

        LocalDate checkIn = LocalDate.now().plusDays(5);
        Booking b = new Booking();
        b.setRoom(room);
        b.setUser(u);
        b.setCheckIn(checkIn);
        b.setCheckOut(checkIn.plusDays(2));
        b.setGuests(1);
        b.setGuestName("Nguyen Van Test");
        b.setGuestPhone("0900000000");
        b.setTotalPrice(room.getPricePerNight().multiply(BigDecimal.valueOf(2)));
        b.setStatus(status);
        return bookingRepository.save(b);
    }

    // =========================================================================
    // GET /api/admin/bookings (T106)
    // =========================================================================

    /** TC_AB01: ADMIN lay danh sach tat ca booking - 200 OK + mang JSON. */
    @Test
    void TC_AB01_admin_get_all_bookings_returns_200() throws Exception {
        String token = adminToken();
        mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    /** TC_AB02: Booking vua tao phai co trong danh sach tra ve. */
    @Test
    void TC_AB02_created_booking_appears_in_list() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        var result = mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(result);
        boolean found = false;
        for (var node : arr) {
            if (node.get("id").asLong() == b.getId()) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Booking vua tao phai co trong danh sach admin");
    }

    /** TC_AB03: Danh sach rong khi chua co booking - tra ve mang rong []. */
    @Test
    void TC_AB03_empty_list_when_no_bookings() throws Exception {
        String token = adminToken();
        bookingRepository.deleteAll();

        mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    /** TC_AB04: Response chua day du cac truong theo BookingView DTO. */
    @Test
    void TC_AB04_response_contains_required_dto_fields() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        var result = mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(result);
        boolean found = false;
        for (var node : arr) {
            if (node.get("id").asLong() == b.getId()) {
                assertNotNull(node.get("id"));
                assertNotNull(node.get("roomId"));
                assertNotNull(node.get("roomType"));
                assertNotNull(node.get("hotelId"));
                assertNotNull(node.get("hotelName"));
                assertNotNull(node.get("userEmail"));
                assertNotNull(node.get("checkIn"));
                assertNotNull(node.get("checkOut"));
                assertNotNull(node.get("guests"));
                assertNotNull(node.get("totalPrice"));
                assertNotNull(node.get("status"));
                assertNotNull(node.get("createdAt"));
                assertEquals("PENDING", node.get("status").asText());
                assertEquals(room.getId().longValue(), node.get("roomId").asLong());
                assertEquals(room.getHotel().getId().longValue(), node.get("hotelId").asLong());
                found = true;
                break;
            }
        }
        assertTrue(found, "Booking phai co trong danh sach");
    }

    /** TC_AB05: API tra ve booking cua NHIEU user khac nhau (khong loc theo user). */
    @Test
    void TC_AB05_returns_bookings_from_all_users() throws Exception {
        String token = adminToken();
        Booking b1 = createBookingDirectly(BookingStatus.PENDING);
        Booking b2 = createBookingDirectly(BookingStatus.CONFIRMED);
        assertNotEquals(b1.getUser().getEmail(), b2.getUser().getEmail());

        var result = mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(result);
        boolean foundB1 = false, foundB2 = false;
        for (var node : arr) {
            long id = node.get("id").asLong();
            if (id == b1.getId()) foundB1 = true;
            if (id == b2.getId()) foundB2 = true;
        }
        assertTrue(foundB1, "Booking cua user 1 phai co trong danh sach");
        assertTrue(foundB2, "Booking cua user 2 phai co trong danh sach");
    }

    /** TC_AB06: API tra ve booking cua moi trang thai. */
    @Test
    void TC_AB06_returns_bookings_of_all_statuses() throws Exception {
        String token = adminToken();
        Booking pending   = createBookingDirectly(BookingStatus.PENDING);
        Booking confirmed = createBookingDirectly(BookingStatus.CONFIRMED);
        Booking completed = createBookingDirectly(BookingStatus.COMPLETED);
        Booking cancelled = createBookingDirectly(BookingStatus.CANCELLED);

        var result = mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(result);
        boolean p = false, c = false, done = false, cancel = false;
        for (var node : arr) {
            long id = node.get("id").asLong();
            if (id == pending.getId())   p      = true;
            if (id == confirmed.getId()) c      = true;
            if (id == completed.getId()) done   = true;
            if (id == cancelled.getId()) cancel = true;
        }
        assertTrue(p && c && done && cancel, "Phai co du 4 trang thai trong danh sach");
    }

    /** TC_AB07: Danh sach sap xep moi nhat truoc (createdAt DESC). */
    @Test
    void TC_AB07_list_sorted_newest_first() throws Exception {
        String token = adminToken();
        createBookingDirectly(BookingStatus.PENDING);
        Booking latest = createBookingDirectly(BookingStatus.CONFIRMED);

        var result = mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(result);
        boolean latestIsFirst = false;
        for (int i = 0; i < arr.size(); i++) {
            if (arr.get(i).get("id").asLong() == latest.getId()) {
                latestIsFirst = (i == 0);
                break;
            }
        }
        assertTrue(latestIsFirst, "Booking moi nhat phai o dau danh sach (createdAt DESC)");
    }

    /** TC_AB08: Booking PENDING tu API POST /api/bookings phai xuat hien trong danh sach Admin. */
    @Test
    void TC_AB08_booking_created_via_api_appears_in_admin_list() throws Exception {
        String customerEmail = newCustomerEmail();
        registerCustomer(customerEmail);

        var bookingResult = mvc.perform(
                withBody(post("/api/bookings"), null, Map.of(
                        "roomId",     room.getId(),
                        "checkIn",    LocalDate.now().plusDays(10).toString(),
                        "checkOut",   LocalDate.now().plusDays(12).toString(),
                        "guests",     1,
                        "guestName",  "Test Guest",
                        "guestPhone", "0900000000"
                )).with(user(customerEmail).roles("CUSTOMER")))
                .andExpect(status().isCreated())
                .andReturn();

        long bookingId = read(bookingResult).get("id").asLong();

        String adminToken = adminToken();
        var listResult = mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(listResult);
        boolean found = false;
        for (var node : arr) {
            if (node.get("id").asLong() == bookingId) {
                assertEquals("PENDING", node.get("status").asText());
                assertEquals(customerEmail, node.get("userEmail").asText());
                found = true;
                break;
            }
        }
        assertTrue(found, "Booking PENDING tu API phai xuat hien trong danh sach Admin");
    }

    /** TC_AB09: Chua dang nhap - 401. */
    @Test
    void TC_AB09_no_token_returns_401() throws Exception {
        mvc.perform(get("/api/admin/bookings"))
                .andExpect(status().isUnauthorized());
    }

    /** TC_AB10: Token sai/het han - 401. */
    @Test
    void TC_AB10_invalid_token_returns_401() throws Exception {
        mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    /** TC_AB11: CUSTOMER truy cap GET /api/admin/bookings - 403. */
    @Test
    void TC_AB11_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());
        mvc.perform(get("/api/admin/bookings")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // PATCH /api/admin/bookings/{id}/status (T107)
    // =========================================================================

    private String patchStatus(long bookingId, String status) {
        return "{\"status\":\"" + status + "\"}";
    }

    /** TC_AB12: PENDING -> CONFIRMED thanh cong - 200 + status moi, DB cap nhat. */
    @Test
    void TC_AB12_pending_to_confirmed_success() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CONFIRMED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.getId()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        assertEquals(BookingStatus.CONFIRMED,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus());
    }

    /** TC_AB13: CONFIRMED -> CHECKED_IN thanh cong - 200. */
    @Test
    void TC_AB13_confirmed_to_checked_in_success() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CONFIRMED);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CHECKED_IN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"));

        assertEquals(BookingStatus.CHECKED_IN,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus());
    }

    /** TC_AB14: CHECKED_IN -> COMPLETED thanh cong - 200. */
    @Test
    void TC_AB14_checked_in_to_completed_success() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CHECKED_IN);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "COMPLETED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        assertEquals(BookingStatus.COMPLETED,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus());
    }

    /** TC_AB15: PENDING -> CANCELLED thanh cong - 200. */
    @Test
    void TC_AB15_pending_to_cancelled_success() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CANCELLED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    /** TC_AB16: CONFIRMED -> CANCELLED thanh cong - 200. */
    @Test
    void TC_AB16_confirmed_to_cancelled_success() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CONFIRMED);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CANCELLED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    /** TC_AB17: CHECKED_IN -> CANCELLED thanh cong - 200. */
    @Test
    void TC_AB17_checked_in_to_cancelled_success() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CHECKED_IN);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CANCELLED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    /** TC_AB18: PENDING -> CHECKED_IN khong hop le - 409, DB giu PENDING. */
    @Test
    void TC_AB18_pending_to_checked_in_is_409() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CHECKED_IN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertEquals(BookingStatus.PENDING,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus(),
                "DB phai giu nguyen PENDING sau khi 409");
    }

    /** TC_AB19: PENDING -> COMPLETED khong hop le - 409. */
    @Test
    void TC_AB19_pending_to_completed_is_409() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "COMPLETED")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertEquals(BookingStatus.PENDING,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus());
    }

    /** TC_AB20: CONFIRMED -> COMPLETED khong hop le (bo qua CHECKED_IN) - 409. */
    @Test
    void TC_AB20_confirmed_to_completed_is_409() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CONFIRMED);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "COMPLETED")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertEquals(BookingStatus.CONFIRMED,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus());
    }

    /** TC_AB21: CONFIRMED -> PENDING khong hop le - 409. */
    @Test
    void TC_AB21_confirmed_to_pending_is_409() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CONFIRMED);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "PENDING")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_AB22: COMPLETED la trang thai ket thuc - khong the chuyen sang bat ky trang thai nao. */
    @Test
    void TC_AB22_completed_is_terminal_state() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.COMPLETED);

        for (String target : new String[]{"PENDING", "CONFIRMED", "CHECKED_IN", "CANCELLED"}) {
            mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                            .header("Authorization", "Bearer " + token)
                            .contentType("application/json")
                            .content(patchStatus(b.getId(), target)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }

        assertEquals(BookingStatus.COMPLETED,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus(),
                "COMPLETED phai giu nguyen sau tat ca lan thu chuyen trang thai");
    }

    /** TC_AB23: CANCELLED la trang thai ket thuc - khong the chuyen sang bat ky trang thai nao. */
    @Test
    void TC_AB23_cancelled_is_terminal_state() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.CANCELLED);

        for (String target : new String[]{"PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED"}) {
            mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                            .header("Authorization", "Bearer " + token)
                            .contentType("application/json")
                            .content(patchStatus(b.getId(), target)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }

        assertEquals(BookingStatus.CANCELLED,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus(),
                "CANCELLED phai giu nguyen sau tat ca lan thu chuyen trang thai");
    }

    /** TC_AB24: ID don dat phong khong ton tai - 404. */
    @Test
    void TC_AB24_nonexistent_booking_returns_404() throws Exception {
        String token = adminToken();

        mvc.perform(patch("/api/admin/bookings/999999/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(999999L, "CONFIRMED")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_AB25: Truong 'status' trong body bi thieu - 400. */
    @Test
    void TC_AB25_missing_status_field_returns_400() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_AB26: Gia tri 'status' khong hop le (khong phai enum) - 400. */
    @Test
    void TC_AB26_invalid_status_value_returns_400() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "KHONG_TON_TAI")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_AB27: Chua dang nhap - 401. */
    @Test
    void TC_AB27_no_token_returns_401() throws Exception {
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CONFIRMED")))
                .andExpect(status().isUnauthorized());
    }

    /** TC_AB28: CUSTOMER truy cap PATCH - 403, DB giu nguyen. */
    @Test
    void TC_AB28_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CONFIRMED")))
                .andExpect(status().isForbidden());

        assertEquals(BookingStatus.PENDING,
                bookingRepository.findById(b.getId()).orElseThrow().getStatus(),
                "Status phai giu PENDING khi bi tu choi 403");
    }

    /** TC_AB29: Response tra ve day du cac truong BookingView sau khi chuyen trang thai. */
    @Test
    void TC_AB29_response_contains_full_booking_view() throws Exception {
        String token = adminToken();
        Booking b = createBookingDirectly(BookingStatus.PENDING);

        var result = mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(patchStatus(b.getId(), "CONFIRMED")))
                .andExpect(status().isOk())
                .andReturn();

        var node = read(result);
        assertNotNull(node.get("id"));
        assertNotNull(node.get("roomId"));
        assertNotNull(node.get("roomType"));
        assertNotNull(node.get("hotelId"));
        assertNotNull(node.get("hotelName"));
        assertNotNull(node.get("userEmail"));
        assertNotNull(node.get("checkIn"));
        assertNotNull(node.get("checkOut"));
        assertNotNull(node.get("totalPrice"));
        assertNotNull(node.get("status"));
        assertNotNull(node.get("createdAt"));
        assertEquals("CONFIRMED", node.get("status").asText());
        assertEquals(b.getId().longValue(), node.get("id").asLong());
    }
}
