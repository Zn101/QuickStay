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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test cho POST /api/admin/rooms va PUT /api/admin/rooms/{id} (T094).
 * Chay day du Spring context + H2 + Flyway theo pattern ApiTestBase.
 * Dung token JWT that (qua /api/auth/login) vi JwtAuthFilter da duoc tao trong T094.
 */
class AdminRoomApiTest extends ApiTestBase {

    @Autowired HotelRepository hotelRepository;
    @Autowired RoomRepository roomRepository;
    @Autowired BookingRepository bookingRepository;
    @Autowired UserRepository userRepository;

    private Hotel hotel;

    @BeforeEach
    void setUp() {
        hotel = new Hotel();
        hotel.setName("Test Hotel " + UUID.randomUUID());
        hotel.setCity("Test City");
        hotelRepository.save(hotel);
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

    private Map<String, Object> validBody() {
        Map<String, Object> m = new HashMap<>();
        m.put("hotelId", hotel.getId());
        m.put("roomType", "Deluxe");
        m.put("pricePerNight", 500000);
        m.put("capacity", 2);
        m.put("quantity", 3);
        m.put("description", "Phong dep, view bien");
        return m;
    }

    /** Tao Room truc tiep vao DB (khong qua API) de dung cho test DELETE/GET. */
    private Room createRoomDirectly() {
        Room r = new Room();
        r.setHotel(hotel);
        r.setRoomType("Direct " + UUID.randomUUID().toString().substring(0, 8));
        r.setPricePerNight(BigDecimal.valueOf(400_000));
        r.setCapacity(2);
        r.setQuantity(1);
        return roomRepository.save(r);
    }

    /** Tao Booking truc tiep cho Room voi trang thai cho truoc. */
    private void createBookingDirectly(Room room, BookingStatus status) {
        String email = "bk-" + UUID.randomUUID() + "@test.com";
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash("hash");
        userRepository.save(u);

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        Booking b = new Booking();
        b.setRoom(room);
        b.setUser(u);
        b.setCheckIn(tomorrow);
        b.setCheckOut(tomorrow.plusDays(2));
        b.setGuests(1);
        b.setTotalPrice(room.getPricePerNight());
        b.setStatus(status);
        bookingRepository.save(b);
    }

    // =========================================================================
    // POST /api/admin/rooms
    // =========================================================================

    /** TC_R001: ADMIN them loai phong thanh cong – 201 + du lieu dung. */
    @Test
    void TC_R001_admin_create_room_success() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.hotelId").value(hotel.getId()))
                .andExpect(jsonPath("$.roomType").value("Deluxe"))
                .andExpect(jsonPath("$.pricePerNight").value(500000))
                .andExpect(jsonPath("$.capacity").value(2))
                .andExpect(jsonPath("$.quantity").value(3))
                .andExpect(jsonPath("$.description").value("Phong dep, view bien"));
    }

    /** TC_R002: Loai phong duoc luu vao database sau khi tao. */
    @Test
    void TC_R002_create_room_persisted_in_db() throws Exception {
        String token = adminToken();
        long countBefore = roomRepository.count();

        var result = mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andExpect(status().isCreated())
                .andReturn();

        long newId = read(result).get("id").asLong();
        assertEquals(countBefore + 1, roomRepository.count());
        assertTrue(roomRepository.existsById(newId));
        var saved = roomRepository.findById(newId).orElseThrow();
        assertEquals("Deluxe", saved.getRoomType());
        assertEquals(hotel.getId(), saved.getHotel().getId());
    }

    /** TC_R003: Them phong voi chi truong bat buoc (khong co description) – 201. */
    @Test
    void TC_R003_create_room_without_optional_fields() throws Exception {
        String token = adminToken();
        Map<String, Object> body = new HashMap<>();
        body.put("hotelId", hotel.getId());
        body.put("roomType", "Standard");
        body.put("pricePerNight", 300000);
        body.put("capacity", 1);
        body.put("quantity", 1);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomType").value("Standard"));
    }

    /** TC_R004: Thieu truong hotelId – 400. */
    @Test
    void TC_R004_create_missing_hotelId_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.remove("hotelId");

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R005: Thieu truong roomType – 400. */
    @Test
    void TC_R005_create_missing_roomType_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.remove("roomType");

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R006: roomType la chuoi trang – 400. */
    @Test
    void TC_R006_create_blank_roomType_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("roomType", "   ");

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R007: Thieu pricePerNight – 400. */
    @Test
    void TC_R007_create_missing_price_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.remove("pricePerNight");

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R008: pricePerNight am (-1) – 400. */
    @Test
    void TC_R008_create_negative_price_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("pricePerNight", -1);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R009: pricePerNight bang 0 – hop le (phong mien phi), tra 201. */
    @Test
    void TC_R009_create_zero_price_is_valid() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("pricePerNight", 0);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pricePerNight").value(0));
    }

    /** TC_R010: capacity = 0 – 400 (toi thieu 1). */
    @Test
    void TC_R010_create_zero_capacity_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("capacity", 0);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R011: capacity am – 400. */
    @Test
    void TC_R011_create_negative_capacity_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("capacity", -5);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R012: quantity = 0 – 400 (toi thieu 1). */
    @Test
    void TC_R012_create_zero_quantity_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("quantity", 0);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R013: hotelId khong ton tai – 404. */
    @Test
    void TC_R013_create_nonexistent_hotel_returns_404() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("hotelId", 999999L);

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R014: description qua 2000 ky tu – 400. */
    @Test
    void TC_R014_create_description_too_long_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("description", "A".repeat(2001));

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R015: Body sai JSON – 400. */
    @Test
    void TC_R015_create_malformed_json_returns_400() throws Exception {
        String token = adminToken();

        mvc.perform(post("/api/admin/rooms")
                        .contentType("application/json")
                        .content("{khong-phai-json")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R016: Khong co token – 401. */
    @Test
    void TC_R016_create_no_token_returns_401() throws Exception {
        mvc.perform(withBody(post("/api/admin/rooms"), null, validBody()))
                .andExpect(status().isUnauthorized());
    }

    /** TC_R017: Token sai/het han – 401. */
    @Test
    void TC_R017_create_invalid_token_returns_401() throws Exception {
        mvc.perform(withBody(post("/api/admin/rooms"), "invalid.jwt.token", validBody()))
                .andExpect(status().isUnauthorized());
    }

    /** TC_R018: CUSTOMER truy cap POST /api/admin/rooms – 403. */
    @Test
    void TC_R018_create_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(withBody(post("/api/admin/rooms"), customerToken, validBody()))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // PUT /api/admin/rooms/{id}
    // =========================================================================

    /** TC_R019: ADMIN cap nhat loai phong thanh cong – 200 + du lieu moi. */
    @Test
    void TC_R019_admin_update_room_success() throws Exception {
        String token = adminToken();

        // Tao phong truoc
        var createResult = mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andExpect(status().isCreated())
                .andReturn();
        long id = read(createResult).get("id").asLong();

        // Tao hotel moi de test thay doi hotelId
        Hotel hotel2 = new Hotel();
        hotel2.setName("Hotel 2 " + UUID.randomUUID());
        hotel2.setCity("Another City");
        hotelRepository.save(hotel2);

        Map<String, Object> updateBody = new HashMap<>();
        updateBody.put("hotelId", hotel2.getId());
        updateBody.put("roomType", "Suite");
        updateBody.put("pricePerNight", 1200000);
        updateBody.put("capacity", 4);
        updateBody.put("quantity", 2);
        updateBody.put("description", "Phong Suite cao cap");

        mvc.perform(withBody(put("/api/admin/rooms/" + id), token, updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.hotelId").value(hotel2.getId()))
                .andExpect(jsonPath("$.roomType").value("Suite"))
                .andExpect(jsonPath("$.pricePerNight").value(1200000))
                .andExpect(jsonPath("$.capacity").value(4))
                .andExpect(jsonPath("$.quantity").value(2));
    }

    /** TC_R020: Cap nhat duoc luu vao database. */
    @Test
    void TC_R020_update_room_persisted_in_db() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        Map<String, Object> updateBody = validBody();
        updateBody.put("roomType", "Family Suite");
        updateBody.put("pricePerNight", 2000000);
        updateBody.put("capacity", 5);
        updateBody.put("quantity", 1);

        mvc.perform(withBody(put("/api/admin/rooms/" + id), token, updateBody))
                .andExpect(status().isOk());

        var saved = roomRepository.findById(id).orElseThrow();
        assertEquals("Family Suite", saved.getRoomType());
        assertEquals(0, java.math.BigDecimal.valueOf(2000000).compareTo(saved.getPricePerNight()));
        assertEquals(5, saved.getCapacity());
        assertEquals(1, saved.getQuantity());
    }

    /** TC_R021: Cap nhat phong khong ton tai – 404. */
    @Test
    void TC_R021_update_nonexistent_room_returns_404() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(put("/api/admin/rooms/999999"), token, validBody()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R022: Cap nhat voi hotelId khong ton tai – 404. */
    @Test
    void TC_R022_update_nonexistent_hotel_returns_404() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        Map<String, Object> updateBody = validBody();
        updateBody.put("hotelId", 999999L);

        mvc.perform(withBody(put("/api/admin/rooms/" + id), token, updateBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R023: Cap nhat voi capacity = 0 – 400. */
    @Test
    void TC_R023_update_zero_capacity_returns_400() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        Map<String, Object> updateBody = validBody();
        updateBody.put("capacity", 0);

        mvc.perform(withBody(put("/api/admin/rooms/" + id), token, updateBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R024: Cap nhat voi pricePerNight am – 400. */
    @Test
    void TC_R024_update_negative_price_returns_400() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/rooms"), token, validBody()))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        Map<String, Object> updateBody = validBody();
        updateBody.put("pricePerNight", -100);

        mvc.perform(withBody(put("/api/admin/rooms/" + id), token, updateBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R025: Khong co token khi cap nhat – 401. */
    @Test
    void TC_R025_update_no_token_returns_401() throws Exception {
        mvc.perform(withBody(put("/api/admin/rooms/1"), null, validBody()))
                .andExpect(status().isUnauthorized());
    }

    /** TC_R026: CUSTOMER truy cap PUT /api/admin/rooms/{id} – 403. */
    @Test
    void TC_R026_update_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(withBody(put("/api/admin/rooms/1"), customerToken, validBody()))
                .andExpect(status().isForbidden());
    }

    /** TC_R027: roomType vuot 255 ky tu – 400. */
    @Test
    void TC_R027_create_roomType_too_long_returns_400() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("roomType", "A".repeat(256));

        mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R028: Whitespace o dau/cuoi roomType duoc trim truoc khi luu. */
    @Test
    void TC_R028_roomType_whitespace_trimmed() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("roomType", "  Superior  ");

        var result = mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isCreated())
                .andReturn();

        long id = read(result).get("id").asLong();
        var saved = roomRepository.findById(id).orElseThrow();
        assertEquals("Superior", saved.getRoomType());
    }

    /** TC_R029: Phong moi xuat hien trong GET /api/hotels/{id}/rooms sau khi tao. */
    @Test
    void TC_R029_created_room_visible_in_public_api() throws Exception {
        String token = adminToken();
        Map<String, Object> body = validBody();
        body.put("roomType", "Visible Room");
        body.put("pricePerNight", 750000);

        var createResult = mvc.perform(withBody(post("/api/admin/rooms"), token, body))
                .andExpect(status().isCreated())
                .andReturn();
        long newId = read(createResult).get("id").asLong();

        // Kiem tra phong xuat hien trong danh sach cong khai
        var listResult = mvc.perform(get("/api/hotels/{id}/rooms", hotel.getId()))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(listResult);
        boolean found = false;
        for (var node : arr) {
            if (node.get("id").asLong() == newId) {
                assertEquals("Visible Room", node.get("roomType").asText());
                assertEquals(750000, node.get("pricePerNight").asInt());
                found = true;
                break;
            }
        }
        assertTrue(found, "Phong vua tao phai xuat hien trong GET /api/hotels/{id}/rooms");
    }

    // =========================================================================
    // GET /api/admin/rooms (T095)
    // =========================================================================

    /** TC_R030: ADMIN lay danh sach loai phong thanh cong – 200 + mang JSON. */
    @Test
    void TC_R030_admin_list_rooms_success() throws Exception {
        String token = adminToken();

        mvc.perform(get("/api/admin/rooms")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    /** TC_R031: Danh sach tra ve chua cac truong bat buoc (id, hotelId, roomType, pricePerNight, capacity, quantity). */
    @Test
    void TC_R031_list_response_contains_required_fields() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();

        var result = mvc.perform(get("/api/admin/rooms")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        var arr = read(result);
        boolean found = false;
        for (var node : arr) {
            if (node.get("id").asLong() == r.getId()) {
                assertEquals(hotel.getId().longValue(), node.get("hotelId").asLong());
                assertNotNull(node.get("roomType"));
                assertNotNull(node.get("pricePerNight"));
                assertTrue(node.get("capacity").asInt() >= 1);
                assertTrue(node.get("quantity").asInt() >= 1);
                found = true;
                break;
            }
        }
        assertTrue(found, "Phong vua tao phai co trong danh sach admin");
    }

    /** TC_R032: Khong co token khi lay danh sach – 401. */
    @Test
    void TC_R032_list_no_token_returns_401() throws Exception {
        mvc.perform(get("/api/admin/rooms"))
                .andExpect(status().isUnauthorized());
    }

    /** TC_R033: CUSTOMER truy cap GET /api/admin/rooms – 403. */
    @Test
    void TC_R033_list_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(get("/api/admin/rooms")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // DELETE /api/admin/rooms/{id} (T095)
    // =========================================================================

    /** TC_R034: ADMIN xoa loai phong khong co booking – 204 No Content. */
    @Test
    void TC_R034_admin_delete_room_no_booking_success() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        long id = r.getId();

        mvc.perform(delete("/api/admin/rooms/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertFalse(roomRepository.existsById(id), "Loai phong phai bi xoa khoi DB");
    }

    /** TC_R035: Xoa loai phong khong ton tai – 404. */
    @Test
    void TC_R035_delete_nonexistent_room_returns_404() throws Exception {
        String token = adminToken();

        mvc.perform(delete("/api/admin/rooms/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R036: Xoa loai phong co booking PENDING – 409 Conflict. */
    @Test
    void TC_R036_delete_room_with_pending_booking_returns_409() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        createBookingDirectly(r, BookingStatus.PENDING);

        mvc.perform(delete("/api/admin/rooms/" + r.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R037: Xoa loai phong co booking CONFIRMED – 409. */
    @Test
    void TC_R037_delete_room_with_confirmed_booking_returns_409() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        createBookingDirectly(r, BookingStatus.CONFIRMED);

        mvc.perform(delete("/api/admin/rooms/" + r.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R038: Xoa loai phong co booking CHECKED_IN – 409. */
    @Test
    void TC_R038_delete_room_with_checked_in_booking_returns_409() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        createBookingDirectly(r, BookingStatus.CHECKED_IN);

        mvc.perform(delete("/api/admin/rooms/" + r.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R039: Xoa loai phong co booking COMPLETED – 409 (FK NOT NULL, bao ve lich su). */
    @Test
    void TC_R039_delete_room_with_completed_booking_returns_409() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        createBookingDirectly(r, BookingStatus.COMPLETED);

        mvc.perform(delete("/api/admin/rooms/" + r.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R040: Xoa loai phong co booking CANCELLED – 409 (FK NOT NULL, room_id khong duoc null). */
    @Test
    void TC_R040_delete_room_with_cancelled_booking_returns_409() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        createBookingDirectly(r, BookingStatus.CANCELLED);

        mvc.perform(delete("/api/admin/rooms/" + r.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_R041: Loai phong van con trong DB sau khi xoa that bai vi co booking. */
    @Test
    void TC_R041_room_still_exists_after_failed_delete() throws Exception {
        String token = adminToken();
        Room r = createRoomDirectly();
        createBookingDirectly(r, BookingStatus.PENDING);
        long id = r.getId();

        mvc.perform(delete("/api/admin/rooms/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());

        assertTrue(roomRepository.existsById(id), "Loai phong phai van con trong DB");
    }

    /** TC_R042: Khong co token khi xoa – 401. */
    @Test
    void TC_R042_delete_no_token_returns_401() throws Exception {
        mvc.perform(delete("/api/admin/rooms/1"))
                .andExpect(status().isUnauthorized());
    }

    /** TC_R043: CUSTOMER truy cap DELETE /api/admin/rooms/{id} – 403. */
    @Test
    void TC_R043_delete_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(delete("/api/admin/rooms/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
