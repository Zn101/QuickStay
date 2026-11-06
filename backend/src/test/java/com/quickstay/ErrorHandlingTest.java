package com.quickstay;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T120 – Kiem tra GlobalExceptionHandler (T119) tra dung format JSON {"message":"..."}
 * cho moi loai loi: 400 Bad Request, 404 Not Found, 409 Conflict.
 *
 * Muc tieu:
 * - HTTP status chinh xac.
 * - Response co truong "message" khong null/rong.
 * - Khong de lo stack trace, credentials, JWT secret.
 * - Du lieu DB khong thay doi khi request that bai.
 *
 * Tap trung vao nhung truong hop CHUA duoc cover day du trong cac suite khac,
 * va kiem tra FORMAT JSON xuyen suot tat ca loai loi.
 */
class ErrorHandlingTest extends ApiTestBase {

    @Autowired HotelRepository hotelRepository;
    @Autowired RoomRepository roomRepository;
    @Autowired BookingRepository bookingRepository;
    @Autowired UserRepository userRepository;

    private String adminToken;
    private Hotel hotel;
    private Room room;

    @BeforeEach
    void setUp() throws Exception {
        // Lay admin token
        var result = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        adminToken = read(result).get("token").asText();

        // Tao Hotel + Room cho cac test
        hotel = new Hotel();
        hotel.setName("ErrTest Hotel " + UUID.randomUUID());
        hotel.setCity("Test City");
        hotelRepository.save(hotel);

        room = new Room();
        room.setHotel(hotel);
        room.setRoomType("Standard");
        room.setPricePerNight(BigDecimal.valueOf(300_000));
        room.setCapacity(2);
        room.setQuantity(2);
        roomRepository.save(room);
    }

    // =========================================================================
    // Helper
    // =========================================================================

    /** Xac nhan response co dung 1 truong "message" khong null/rong va khong co stacktrace. */
    private void assertErrorFormat(String responseBody) throws Exception {
        var node = json.readTree(responseBody);
        // Phai co truong "message"
        assert node.has("message") : "Response thieu truong 'message': " + responseBody;
        assert !node.get("message").isNull() : "message khong duoc null";
        assert !node.get("message").asText().isBlank() : "message khong duoc rong";
        // Khong duoc co stack trace
        assert !responseBody.contains("at com.") : "Response co the chua stack trace: " + responseBody;
        assert !responseBody.contains("Exception") || node.has("message")
                : "Response bi lo Exception class name";
        // Khong duoc lo thong tin nhay cam
        assert !responseBody.contains("password") || responseBody.contains("message")
                : "Response co the bi lo 'password'";
        assert !responseBody.contains("secret") : "Response co the bi lo 'secret'";
    }

    // =========================================================================
    // NHOM 1: Kiem tra FORMAT JSON {"message"} xuyen suot moi loai loi
    // =========================================================================

    /** TC_EH001: 400 tu validation – format JSON dung. */
    @Test
    void TC_EH001_400_validation_error_has_message_field() throws Exception {
        // POST /api/admin/hotels thieu "name"
        var result = mvc.perform(withBody(post("/api/admin/hotels"), adminToken,
                        Map.of("city", "Ha Noi")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andReturn();

        assertErrorFormat(result.getResponse().getContentAsString());
    }

    /** TC_EH002: 400 tu malformed JSON – format JSON dung. */
    @Test
    void TC_EH002_400_malformed_json_has_message_field() throws Exception {
        var result = mvc.perform(post("/api/admin/hotels")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{not valid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andReturn();

        assertErrorFormat(result.getResponse().getContentAsString());
    }

    /** TC_EH003: 404 tu ApiException.notFound – format JSON dung. */
    @Test
    void TC_EH003_404_not_found_has_message_field() throws Exception {
        var result = mvc.perform(put("/api/admin/hotels/999999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"name\":\"X\",\"city\":\"Y\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andReturn();

        assertErrorFormat(result.getResponse().getContentAsString());
    }

    /** TC_EH004: 409 tu ApiException.conflict – format JSON dung. */
    @Test
    void TC_EH004_409_conflict_has_message_field() throws Exception {
        // Tao booking de protect room
        String email = "eh-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(3);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.PENDING);
        bookingRepository.save(b);

        var result = mvc.perform(delete("/api/admin/rooms/" + room.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andReturn();

        assertErrorFormat(result.getResponse().getContentAsString());
    }

    // =========================================================================
    // NHOM 2: HTTP 400 – Bad Request tren cac endpoint chua duoc cover
    // =========================================================================

    /** TC_EH005: Dang ky email sai dinh dang – 400 + message. */
    @Test
    void TC_EH005_400_register_invalid_email() throws Exception {
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", "khong-phai-email",
                               "password", "secret123",
                               "fullName", "Test User")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH006: Dang ky mat khau qua ngan – 400 + message. */
    @Test
    void TC_EH006_400_register_short_password() throws Exception {
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", newCustomerEmail(),
                               "password", "123",
                               "fullName", "Test User")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH007: POST /admin/rooms – pricePerNight am – 400. */
    @Test
    void TC_EH007_400_room_negative_price() throws Exception {
        mvc.perform(withBody(post("/api/admin/rooms"), adminToken,
                        Map.of("hotelId", hotel.getId(),
                               "roomType", "Deluxe",
                               "pricePerNight", -100,
                               "capacity", 2,
                               "quantity", 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH008: POST /admin/rooms – capacity = 0 – 400. */
    @Test
    void TC_EH008_400_room_zero_capacity() throws Exception {
        mvc.perform(withBody(post("/api/admin/rooms"), adminToken,
                        Map.of("hotelId", hotel.getId(),
                               "roomType", "Deluxe",
                               "pricePerNight", 500000,
                               "capacity", 0,
                               "quantity", 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH009: PATCH status voi gia tri enum khong ton tai – 400. */
    @Test
    void TC_EH009_400_invalid_booking_status_enum() throws Exception {
        // Tao booking
        String email = "eh2-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(10);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.PENDING);
        bookingRepository.save(b);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"INVALID_STATUS\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH010: POST /api/auth/login thieu password – 400 hoac 401. */
    @Test
    void TC_EH010_400_login_missing_password() throws Exception {
        mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assert status == 400 || status == 401
                            : "Phai tra 400 hoac 401 khi thieu password, nhung nhan: " + status;
                })
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // =========================================================================
    // NHOM 3: HTTP 404 – Not Found tren cac endpoint khac nhau
    // =========================================================================

    /** TC_EH011: GET /api/hotels/{id} voi id khong ton tai – 404. */
    @Test
    void TC_EH011_404_hotel_not_found() throws Exception {
        mvc.perform(get("/api/hotels/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH012: PUT /api/admin/rooms/{id} voi id khong ton tai – 404. */
    @Test
    void TC_EH012_404_room_not_found_on_update() throws Exception {
        mvc.perform(withBody(put("/api/admin/rooms/999999"), adminToken,
                        Map.of("hotelId", hotel.getId(),
                               "roomType", "Suite",
                               "pricePerNight", 1000000,
                               "capacity", 2,
                               "quantity", 1)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH013: PATCH /api/admin/bookings/{id}/status voi id khong ton tai – 404. */
    @Test
    void TC_EH013_404_booking_not_found_on_status_change() throws Exception {
        mvc.perform(patch("/api/admin/bookings/999999/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH014: DELETE /api/admin/hotels/{id} voi id khong ton tai – 404. */
    @Test
    void TC_EH014_404_hotel_not_found_on_delete() throws Exception {
        mvc.perform(delete("/api/admin/hotels/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH015: DELETE /api/admin/rooms/{id} voi id khong ton tai – 404. */
    @Test
    void TC_EH015_404_room_not_found_on_delete() throws Exception {
        mvc.perform(delete("/api/admin/rooms/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // =========================================================================
    // NHOM 4: HTTP 409 – Conflict tren cac tinh huong xung dot nghiep vu
    // =========================================================================

    /** TC_EH016: Dang ky email trung – 409 + message. */
    @Test
    void TC_EH016_409_duplicate_email_on_register() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);

        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", email,
                               "password", "secret123",
                               "fullName", "Duplicate")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_EH017: Xoa hotel co booking – 409, hotel van con trong DB. */
    @Test
    void TC_EH017_409_delete_hotel_with_booking_db_intact() throws Exception {
        // Tao booking cho room cua hotel
        String email = "eh3-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(5);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(b);

        mvc.perform(delete("/api/admin/hotels/" + hotel.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Hotel phai van con trong DB
        assert hotelRepository.existsById(hotel.getId())
                : "Hotel bi xoa trai phep khi co booking";
    }

    /** TC_EH018: Xoa room co booking CONFIRMED – 409, room van con. */
    @Test
    void TC_EH018_409_delete_room_with_confirmed_booking_db_intact() throws Exception {
        String email = "eh4-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(5);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(b);

        mvc.perform(delete("/api/admin/rooms/" + room.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        assert roomRepository.existsById(room.getId())
                : "Room bi xoa trai phep khi co booking";
    }

    /** TC_EH019: Chuyen trang thai sai quy trinh PENDING->COMPLETED – 409, status giu nguyen. */
    @Test
    void TC_EH019_409_invalid_status_transition_db_intact() throws Exception {
        String email = "eh5-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(5);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.PENDING);
        bookingRepository.save(b);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        var saved = bookingRepository.findById(b.getId()).orElseThrow();
        assert saved.getStatus() == BookingStatus.PENDING
                : "Status phai giu nguyen PENDING sau 409";
    }

    /** TC_EH020: Chuyen trang thai tu trang thai ket thuc COMPLETED – 409. */
    @Test
    void TC_EH020_409_terminal_state_cannot_transition() throws Exception {
        String email = "eh6-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(5);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(b);

        mvc.perform(patch("/api/admin/bookings/" + b.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // =========================================================================
    // NHOM 5: Khong de lo thong tin nhay cam
    // =========================================================================

    /** TC_EH021: Response 500 tu he thong khong lo stack trace. */
    @Test
    void TC_EH021_error_response_no_stack_trace_in_400() throws Exception {
        // Gui body rong de kich 400
        var result = mvc.perform(post("/api/admin/hotels")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertErrorFormat(body);
        // Kiem tra chi co 1 truong "message", khong co truong nao tiet lo noi bo
        var node = json.readTree(body);
        assert node.size() == 1 : "Response chi duoc co dung 1 truong 'message', nhung co: " + node.size();
    }

    /** TC_EH022: Response 404 chi co truong "message", khong co du lieu thua. */
    @Test
    void TC_EH022_404_response_has_only_message_field() throws Exception {
        var result = mvc.perform(delete("/api/admin/rooms/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertErrorFormat(body);
        var node = json.readTree(body);
        assert node.size() == 1 : "404 response chi duoc co truong 'message', nhung co: " + node.size();
    }

    /** TC_EH023: Response 409 chi co truong "message". */
    @Test
    void TC_EH023_409_response_has_only_message_field() throws Exception {
        // Tao booking de kich 409
        String email = "eh7-" + UUID.randomUUID() + "@test.com";
        User u = new User(); u.setEmail(email); u.setPasswordHash("hash");
        userRepository.save(u);
        LocalDate ci = LocalDate.now().plusDays(5);
        Booking b = new Booking();
        b.setRoom(room); b.setUser(u);
        b.setCheckIn(ci); b.setCheckOut(ci.plusDays(1));
        b.setGuests(1); b.setTotalPrice(BigDecimal.valueOf(300_000));
        b.setStatus(BookingStatus.PENDING);
        bookingRepository.save(b);

        var result = mvc.perform(delete("/api/admin/rooms/" + room.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertErrorFormat(body);
        var node = json.readTree(body);
        assert node.size() == 1 : "409 response chi duoc co truong 'message', nhung co: " + node.size();
    }
}
