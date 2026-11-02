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
 * Integration test cho cac API quan ly khach san Admin (T082, T083).
 * Chay day du Spring context + H2 + Flyway theo pattern ApiTestBase.
 */
class AdminHotelApiTest extends ApiTestBase {

    @Autowired HotelRepository hotelRepository;
    @Autowired RoomRepository roomRepository;
    @Autowired BookingRepository bookingRepository;
    @Autowired UserRepository userRepository;

    // =========================================================================
    // Helper methods
    // =========================================================================

    private String adminToken() throws Exception {
        var result = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        return read(result).get("token").asText();
    }

    /** Tao Hotel truc tiep vao DB de dung trong cac test DELETE/GET. */
    private Hotel createHotelDirectly(String name, String city) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setCity(city);
        return hotelRepository.save(h);
    }

    /** Tao Room cho Hotel. */
    private Room createRoomDirectly(Hotel hotel) {
        Room r = new Room();
        r.setHotel(hotel);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setCapacity(2);
        r.setQuantity(1);
        return roomRepository.save(r);
    }

    /** Tao Booking voi trang thai cho truoc. */
    private Booking createBookingDirectly(Room room, BookingStatus status) {
        // Lay hoac tao user de gan vao booking
        String email = "booking-test-" + UUID.randomUUID() + "@test.com";
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
        return bookingRepository.save(b);
    }

    // =========================================================================
    // POST /api/admin/hotels (T082)
    // =========================================================================

    /** TC_H001: ADMIN them khach san thanh cong – tra ve 201 va du lieu dung. */
    @Test
    void TC_H001_admin_create_hotel_success() throws Exception {
        String token = adminToken();
        var body = Map.of(
                "name", "Test Hotel Ha Noi",
                "city", "Ha Noi",
                "address", "123 Tran Hung Dao",
                "description", "Khach san dep",
                "imageUrl", "https://example.com/img.jpg",
                "amenities", "Wifi, Ho boi"
        );

        mvc.perform(withBody(post("/api/admin/hotels"), token, body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Test Hotel Ha Noi"))
                .andExpect(jsonPath("$.city").value("Ha Noi"))
                .andExpect(jsonPath("$.address").value("123 Tran Hung Dao"))
                .andExpect(jsonPath("$.imageUrl").value("https://example.com/img.jpg"))
                .andExpect(jsonPath("$.amenities").value("Wifi, Ho boi"));
    }

    /** TC_H002: ADMIN them khach san chi voi cac truong bat buoc – tra ve 201. */
    @Test
    void TC_H002_admin_create_hotel_required_fields_only() throws Exception {
        String token = adminToken();
        var body = Map.of("name", "Minimal Hotel", "city", "Da Nang");

        mvc.perform(withBody(post("/api/admin/hotels"), token, body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Minimal Hotel"))
                .andExpect(jsonPath("$.city").value("Da Nang"));
    }

    /** TC_H003: Khach san duoc luu vao database sau khi tao. */
    @Test
    void TC_H003_admin_create_hotel_persisted_in_db() throws Exception {
        String token = adminToken();
        long countBefore = hotelRepository.count();

        var result = mvc.perform(withBody(post("/api/admin/hotels"), token,
                        Map.of("name", "DB Check Hotel", "city", "Hue")))
                .andExpect(status().isCreated())
                .andReturn();

        long newId = read(result).get("id").asLong();
        assertEquals(countBefore + 1, hotelRepository.count());
        assertTrue(hotelRepository.existsById(newId));
    }

    /** TC_H004: Thieu truong 'name' – phai tra ve 400. */
    @Test
    void TC_H004_create_missing_name_returns_400() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(post("/api/admin/hotels"), token, Map.of("city", "Ho Chi Minh")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H005: Thieu truong 'city' – phai tra ve 400. */
    @Test
    void TC_H005_create_missing_city_returns_400() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(post("/api/admin/hotels"), token, Map.of("name", "No City Hotel")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H006: Truong 'name' la chuoi trang – phai tra ve 400. */
    @Test
    void TC_H006_create_blank_name_returns_400() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(post("/api/admin/hotels"), token, Map.of("name", "   ", "city", "Ha Noi")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H007: 'name' vuot 255 ky tu – phai tra ve 400. */
    @Test
    void TC_H007_create_name_too_long_returns_400() throws Exception {
        String token = adminToken();
        String longName = "A".repeat(256);

        mvc.perform(withBody(post("/api/admin/hotels"), token, Map.of("name", longName, "city", "Ha Noi")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H008: Body sai JSON – phai tra ve 400. */
    @Test
    void TC_H008_create_malformed_json_returns_400() throws Exception {
        String token = adminToken();

        mvc.perform(post("/api/admin/hotels")
                        .contentType("application/json")
                        .content("{khong-phai-json")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H009: Khong co token – phai tra ve 401. */
    @Test
    void TC_H009_create_no_token_returns_401() throws Exception {
        mvc.perform(withBody(post("/api/admin/hotels"), null,
                        Map.of("name", "No Auth Hotel", "city", "Ha Noi")))
                .andExpect(status().isUnauthorized());
    }

    /** TC_H010: Token sai / het han – phai tra ve 401. */
    @Test
    void TC_H010_create_invalid_token_returns_401() throws Exception {
        mvc.perform(withBody(post("/api/admin/hotels"), "invalid.token.here",
                        Map.of("name", "Bad Token Hotel", "city", "Ha Noi")))
                .andExpect(status().isUnauthorized());
    }

    /** TC_H011: CUSTOMER truy cap API Admin – phai tra ve 403. */
    @Test
    void TC_H011_create_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(withBody(post("/api/admin/hotels"), customerToken,
                        Map.of("name", "Customer Hotel", "city", "Ha Noi")))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // PUT /api/admin/hotels/{id} (T082)
    // =========================================================================

    /** TC_H012: ADMIN cap nhat khach san thanh cong – tra ve 200 va du lieu moi. */
    @Test
    void TC_H012_admin_update_hotel_success() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/hotels"), token,
                        Map.of("name", "Old Name", "city", "Old City")))
                .andExpect(status().isCreated())
                .andReturn();
        long id = read(createResult).get("id").asLong();

        var updateBody = Map.of(
                "name", "New Name",
                "city", "New City",
                "address", "New Address",
                "description", "Updated description",
                "imageUrl", "https://example.com/new.jpg",
                "amenities", "Wifi, Spa"
        );

        mvc.perform(withBody(put("/api/admin/hotels/" + id), token, updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("New Name"))
                .andExpect(jsonPath("$.city").value("New City"))
                .andExpect(jsonPath("$.address").value("New Address"))
                .andExpect(jsonPath("$.amenities").value("Wifi, Spa"));
    }

    /** TC_H013: Cap nhat thay doi du lieu trong database. */
    @Test
    void TC_H013_update_hotel_persisted_in_db() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/hotels"), token,
                        Map.of("name", "Before Update", "city", "Test City")))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        mvc.perform(withBody(put("/api/admin/hotels/" + id), token,
                        Map.of("name", "After Update", "city", "Updated City")))
                .andExpect(status().isOk());

        var hotel = hotelRepository.findById(id).orElseThrow();
        assertEquals("After Update", hotel.getName());
        assertEquals("Updated City", hotel.getCity());
    }

    /** TC_H014: Cap nhat khach san khong ton tai – phai tra ve 404. */
    @Test
    void TC_H014_update_nonexistent_hotel_returns_404() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(put("/api/admin/hotels/999999"), token,
                        Map.of("name", "Ghost Hotel", "city", "Nowhere")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H015: Cap nhat voi 'name' bi thieu – phai tra ve 400. */
    @Test
    void TC_H015_update_missing_name_returns_400() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/hotels"), token,
                        Map.of("name", "To Update", "city", "Test City")))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        mvc.perform(withBody(put("/api/admin/hotels/" + id), token, Map.of("city", "New City")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H016: Cap nhat voi 'city' la chuoi trang – phai tra ve 400. */
    @Test
    void TC_H016_update_blank_city_returns_400() throws Exception {
        String token = adminToken();

        var createResult = mvc.perform(withBody(post("/api/admin/hotels"), token,
                        Map.of("name", "To Update Blank City", "city", "Test City")))
                .andReturn();
        long id = read(createResult).get("id").asLong();

        mvc.perform(withBody(put("/api/admin/hotels/" + id), token,
                        Map.of("name", "Valid Name", "city", "  ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H017: Khong co token khi cap nhat – phai tra ve 401. */
    @Test
    void TC_H017_update_no_token_returns_401() throws Exception {
        mvc.perform(withBody(put("/api/admin/hotels/1"), null,
                        Map.of("name", "No Auth Update", "city", "Ha Noi")))
                .andExpect(status().isUnauthorized());
    }

    /** TC_H018: CUSTOMER truy cap PUT /api/admin/hotels/{id} – phai tra ve 403. */
    @Test
    void TC_H018_update_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(withBody(put("/api/admin/hotels/1"), customerToken,
                        Map.of("name", "Customer Update", "city", "Ha Noi")))
                .andExpect(status().isForbidden());
    }

    /** TC_H019: Khoang trang dau/cuoi cua name va city duoc trim truoc khi luu. */
    @Test
    void TC_H019_whitespace_is_trimmed() throws Exception {
        String token = adminToken();

        var result = mvc.perform(withBody(post("/api/admin/hotels"), token,
                        Map.of("name", "  Trim Hotel  ", "city", "  Ha Noi  ")))
                .andExpect(status().isCreated())
                .andReturn();

        long id = read(result).get("id").asLong();
        var hotel = hotelRepository.findById(id).orElseThrow();
        assertEquals("Trim Hotel", hotel.getName());
        assertEquals("Ha Noi", hotel.getCity());
    }

    // =========================================================================
    // GET /api/admin/hotels (T083)
    // =========================================================================

    /** TC_H020: ADMIN lay danh sach khach san thanh cong – tra ve 200 va mang JSON. */
    @Test
    void TC_H020_admin_list_hotels_success() throws Exception {
        String token = adminToken();

        mvc.perform(withBody(get("/api/admin/hotels"), token, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    /** TC_H021: Danh sach tra ve chua cac truong id, name, city. */
    @Test
    void TC_H021_list_response_contains_required_fields() throws Exception {
        String token = adminToken();
        // Tao them 1 khach san co the tim thay trong ket qua
        Hotel h = createHotelDirectly("Field Check Hotel", "Can Tho");

        var result = mvc.perform(withBody(get("/api/admin/hotels"), token, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        // Kiem tra trong mang co phan tu voi id cua khach san vua tao
        var arr = read(result);
        boolean found = false;
        for (var node : arr) {
            if (node.get("id").asLong() == h.getId()) {
                assertEquals("Field Check Hotel", node.get("name").asText());
                assertEquals("Can Tho", node.get("city").asText());
                found = true;
                break;
            }
        }
        assertTrue(found, "Khach san vua tao phai co trong danh sach");
    }

    /** TC_H022: Khong co token khi lay danh sach – phai tra ve 401. */
    @Test
    void TC_H022_list_no_token_returns_401() throws Exception {
        mvc.perform(get("/api/admin/hotels"))
                .andExpect(status().isUnauthorized());
    }

    /** TC_H023: CUSTOMER truy cap GET /api/admin/hotels – phai tra ve 403. */
    @Test
    void TC_H023_list_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(get("/api/admin/hotels")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // DELETE /api/admin/hotels/{id} (T083)
    // =========================================================================

    /** TC_H024: ADMIN xoa khach san khong co phong – thanh cong, tra ve 204. */
    @Test
    void TC_H024_admin_delete_hotel_no_rooms_success() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Delete Me No Room", "Test City");
        long id = h.getId();

        mvc.perform(delete("/api/admin/hotels/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertFalse(hotelRepository.existsById(id), "Khach san phai bi xoa khoi DB");
    }

    /** TC_H025: ADMIN xoa khach san co phong nhung khong co don dat phong – thanh cong. */
    @Test
    void TC_H025_admin_delete_hotel_with_rooms_no_bookings_success() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Delete Me With Room", "Test City");
        createRoomDirectly(h);
        long hotelId = h.getId();

        mvc.perform(delete("/api/admin/hotels/" + hotelId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertFalse(hotelRepository.existsById(hotelId), "Khach san phai bi xoa khoi DB");
        assertEquals(0, roomRepository.findByHotelIdOrderByPricePerNight(hotelId).size(),
                "Cac phong cua khach san phai bi xoa theo");
    }

    /** TC_H026: Xoa khach san co don PENDING – phai tra ve 409. */
    @Test
    void TC_H026_delete_hotel_with_pending_booking_returns_409() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Has Pending", "Test City");
        Room r = createRoomDirectly(h);
        createBookingDirectly(r, BookingStatus.PENDING);

        mvc.perform(delete("/api/admin/hotels/" + h.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H027: Xoa khach san co don CONFIRMED – phai tra ve 409. */
    @Test
    void TC_H027_delete_hotel_with_confirmed_booking_returns_409() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Has Confirmed", "Test City");
        Room r = createRoomDirectly(h);
        createBookingDirectly(r, BookingStatus.CONFIRMED);

        mvc.perform(delete("/api/admin/hotels/" + h.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H028: Xoa khach san co don CHECKED_IN – phai tra ve 409. */
    @Test
    void TC_H028_delete_hotel_with_checked_in_booking_returns_409() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Has CheckedIn", "Test City");
        Room r = createRoomDirectly(h);
        createBookingDirectly(r, BookingStatus.CHECKED_IN);

        mvc.perform(delete("/api/admin/hotels/" + h.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H029: Xoa khach san chi co don COMPLETED – KHONG duoc phep xoa (bao ve lich su). */
    @Test
    void TC_H029_delete_hotel_with_completed_booking_returns_409() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Has Completed", "Test City");
        Room r = createRoomDirectly(h);
        createBookingDirectly(r, BookingStatus.COMPLETED);

        mvc.perform(delete("/api/admin/hotels/" + h.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Khach san phai van con trong DB
        assertTrue(hotelRepository.existsById(h.getId()));
    }

    /** TC_H030: Xoa khach san chi co don CANCELLED – KHONG duoc phep xoa (bao ve lich su). */
    @Test
    void TC_H030_delete_hotel_with_cancelled_booking_returns_409() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Has Cancelled", "Test City");
        Room r = createRoomDirectly(h);
        createBookingDirectly(r, BookingStatus.CANCELLED);

        mvc.perform(delete("/api/admin/hotels/" + h.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Khach san phai van con trong DB
        assertTrue(hotelRepository.existsById(h.getId()));
    }

    /** TC_H031: Xoa khach san khong ton tai – phai tra ve 404. */
    @Test
    void TC_H031_delete_nonexistent_hotel_returns_404() throws Exception {
        String token = adminToken();

        mvc.perform(delete("/api/admin/hotels/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    /** TC_H032: Khach san van con trong DB sau khi xoa that bai vi co don active. */
    @Test
    void TC_H032_hotel_still_exists_in_db_after_failed_delete() throws Exception {
        String token = adminToken();
        Hotel h = createHotelDirectly("Protected Hotel", "Test City");
        Room r = createRoomDirectly(h);
        createBookingDirectly(r, BookingStatus.PENDING);
        long hotelId = h.getId();

        mvc.perform(delete("/api/admin/hotels/" + hotelId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());

        // Khach san va phong phai van con nguyen
        assertTrue(hotelRepository.existsById(hotelId), "Khach san phai van con trong DB");
        assertEquals(1, roomRepository.findByHotelIdOrderByPricePerNight(hotelId).size(),
                "Phong phai van con trong DB");
    }

    /** TC_H033: Khong co token khi xoa – phai tra ve 401. */
    @Test
    void TC_H033_delete_no_token_returns_401() throws Exception {
        mvc.perform(delete("/api/admin/hotels/1"))
                .andExpect(status().isUnauthorized());
    }

    /** TC_H034: CUSTOMER truy cap DELETE /api/admin/hotels/{id} – phai tra ve 403. */
    @Test
    void TC_H034_delete_customer_role_returns_403() throws Exception {
        String customerToken = registerCustomer(newCustomerEmail());

        mvc.perform(delete("/api/admin/hotels/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
