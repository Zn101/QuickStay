package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Bang phan quyen qua HTTP that (T152): moi API thu voi 3 vai tro (chua dang nhap, khach, admin).
 * Chi kiem tra quyen, khong kiem tra nghiep vu: id 999999 khong ton tai nen admin co the nhan 404/400,
 * dieu quan trong la khong bi 401/403 nham. Test admin cua T108 dung MockMvc nen khong bat duoc
 * loi chi xay ra khi chay that (vd. 403 bi doi thanh 401).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealHttpPermissionTest {

    private static final String ADMIN_EMAIL = "admin@quickstay.local";
    private static final String ADMIN_PASSWORD = "Admin@123";

    @Autowired TestRestTemplate http;
    @Autowired ObjectMapper json;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired BookingRepository bookings;

    private String customer;
    private String admin;

    /** Mot API: phuong thuc, duong dan, body (null neu khong co). */
    private record Api(HttpMethod method, String path, Object body) {
        @Override
        public String toString() {
            return method + " " + path;
        }
    }

    private static final List<Api> ADMIN_ONLY = List.of(
            new Api(HttpMethod.GET, "/api/admin/hotels", null),
            new Api(HttpMethod.POST, "/api/admin/hotels", Map.of()),
            new Api(HttpMethod.PUT, "/api/admin/hotels/999999", Map.of()),
            new Api(HttpMethod.DELETE, "/api/admin/hotels/999999", null),
            new Api(HttpMethod.GET, "/api/admin/rooms", null),
            new Api(HttpMethod.POST, "/api/admin/rooms", Map.of()),
            new Api(HttpMethod.PUT, "/api/admin/rooms/999999", Map.of()),
            new Api(HttpMethod.DELETE, "/api/admin/rooms/999999", null),
            new Api(HttpMethod.GET, "/api/admin/bookings", null),
            new Api(HttpMethod.GET, "/api/admin/bookings?page=0&size=5", null),
            new Api(HttpMethod.PATCH, "/api/admin/bookings/999999/status", Map.of("status", "CONFIRMED")));

    /** Can dang nhap, khach va admin deu duoc. */
    private static final List<Api> ANY_LOGGED_IN = List.of(
            new Api(HttpMethod.GET, "/api/users/me", null),
            new Api(HttpMethod.PUT, "/api/users/me", Map.of()),
            new Api(HttpMethod.GET, "/api/bookings/me", null),
            new Api(HttpMethod.GET, "/api/bookings/me?page=0", null),
            new Api(HttpMethod.PATCH, "/api/bookings/999999/cancel", null));

    private static final List<Api> PUBLIC = List.of(
            new Api(HttpMethod.GET, "/api/hotels", null),
            new Api(HttpMethod.GET, "/api/hotels?page=0&size=2", null),
            new Api(HttpMethod.GET, "/actuator/health", null));

    @BeforeEach
    void setUp() throws Exception {
        http.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
        customer = parse(call(HttpMethod.POST, "/api/auth/register", null, Map.of(
                "email", "perm-" + UUID.randomUUID() + "@test.com", "password", "secret123", "fullName", "Khach"))).get("token").asText();
        admin = parse(call(HttpMethod.POST, "/api/auth/login", null,
                Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD))).get("token").asText();
    }

    private ResponseEntity<String> call(HttpMethod method, String path, String token, Object body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) h.setBearerAuth(token);
        return http.exchange(path, method, new HttpEntity<>(body, h), String.class);
    }

    private ResponseEntity<String> call(Api api, String token) {
        return call(api.method(), api.path(), token, api.body());
    }

    private JsonNode parse(ResponseEntity<String> r) throws Exception {
        return json.readTree(r.getBody());
    }

    private void assertDenied(Api api, String token, HttpStatus expected) throws Exception {
        ResponseEntity<String> r = call(api, token);
        assertEquals(expected, r.getStatusCode(), () -> api + " -> " + r.getBody());
        assertFalse(parse(r).path("message").asText().isBlank(), () -> api + ": thieu message JSON");
    }

    private void assertAllowed(Api api, String token, String role) {
        ResponseEntity<String> r = call(api, token);
        int s = r.getStatusCode().value();
        assertTrue(s != 401 && s != 403 && s < 500, () -> role + " bi chan hoac loi o " + api + ": " + s + " " + r.getBody());
    }

    @Test
    void admin_apis_need_admin_role() throws Exception {
        for (Api api : ADMIN_ONLY) {
            assertDenied(api, null, HttpStatus.UNAUTHORIZED);
            assertDenied(api, customer, HttpStatus.FORBIDDEN);
            assertAllowed(api, admin, "admin");
        }
    }

    @Test
    void account_apis_need_login_and_allow_both_roles() throws Exception {
        for (Api api : ANY_LOGGED_IN) {
            assertDenied(api, null, HttpStatus.UNAUTHORIZED);
            assertAllowed(api, customer, "khach");
            assertAllowed(api, admin, "admin");
        }
    }

    @Test
    void booking_is_for_customers_only() throws Exception {
        Api book = new Api(HttpMethod.POST, "/api/bookings", Map.of());
        assertDenied(book, null, HttpStatus.UNAUTHORIZED);
        assertDenied(book, admin, HttpStatus.FORBIDDEN);
        assertAllowed(book, customer, "khach");   // body rong -> 400, nhung khong bi chan quyen
    }

    @Test
    void public_apis_need_no_login_and_ignore_roles() {
        for (Api api : PUBLIC) {
            assertEquals(HttpStatus.OK, call(api, null).getStatusCode(), api::toString);
            assertAllowed(api, customer, "khach");
            assertAllowed(api, admin, "admin");
        }
        long hotelId = hotels.findAll().get(0).getId();
        assertEquals(HttpStatus.OK, call(HttpMethod.GET, "/api/hotels/" + hotelId, null, null).getStatusCode());
        assertEquals(HttpStatus.OK, call(HttpMethod.GET, "/api/hotels/" + hotelId + "/rooms", null, null).getStatusCode());
    }

    @Test
    void customer_cannot_reach_admin_api_through_path_variants() {
        for (String path : new String[]{"/api/admin/hotels/", "/api//admin/hotels", "/api/admin/hotels;x=1",
                "/API/admin/hotels", "/api/Admin/hotels", "/api/admin/%68otels"}) {
            ResponseEntity<String> r = call(HttpMethod.GET, path, customer, null);
            assertFalse(r.getStatusCode().is2xxSuccessful(), () -> "khach doc duoc " + path + ": " + r.getBody());
        }
    }

    @Test
    void public_get_does_not_open_write_methods_on_hotels() throws Exception {
        assertDenied(new Api(HttpMethod.POST, "/api/hotels", Map.of("name", "X", "city", "Y")), null, HttpStatus.UNAUTHORIZED);
        assertDenied(new Api(HttpMethod.DELETE, "/api/hotels/1", null), null, HttpStatus.UNAUTHORIZED);
    }

    // ---- Doi trang thai don: du lieu sai (nhanh chua phu theo bao cao T142) ----

    private long pendingBooking() {
        Hotel h = new Hotel();
        h.setName("Perm " + UUID.randomUUID());
        h.setCity("Test City");
        hotels.save(h);
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.TEN);
        r.setQuantity(5);
        rooms.save(r);
        Booking b = new Booking();
        b.setUser(users.findByEmail(ADMIN_EMAIL).orElseThrow());
        b.setRoom(r);
        b.setCheckIn(LocalDate.of(2031, 5, 1));
        b.setCheckOut(LocalDate.of(2031, 5, 2));
        b.setGuests(1);
        b.setTotalPrice(BigDecimal.TEN);
        return bookings.save(b).getId();
    }

    @Test
    void admin_status_change_rejects_missing_or_unknown_status() throws Exception {
        long id = pendingBooking();
        String path = "/api/admin/bookings/" + id + "/status";
        for (Object body : new Object[]{Map.of(), Map.of("status", ""), Map.of("status", "  "), Map.of("status", "DA_XONG")}) {
            ResponseEntity<String> r = call(HttpMethod.PATCH, path, admin, body);
            assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode(), () -> body + " -> " + r.getBody());
            assertFalse(parse(r).path("message").asText().isBlank());
        }
        assertEquals(BookingStatus.PENDING, bookings.findById(id).orElseThrow().getStatus(), "don khong doi");

        ResponseEntity<String> ok = call(HttpMethod.PATCH, path, admin, Map.of("status", "confirmed"));
        assertEquals(HttpStatus.OK, ok.getStatusCode(), ok.getBody());
        assertEquals("CONFIRMED", parse(ok).get("status").asText());
    }
}
