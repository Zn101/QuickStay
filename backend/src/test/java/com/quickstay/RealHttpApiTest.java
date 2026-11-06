package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.security.JwtProperties;
import com.quickstay.security.JwtService;
import com.quickstay.user.User;
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
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Goi API qua cong HTTP that voi JWT that (T126, T127, T128): di qua JwtAuthFilter, Spring Security,
 * controller va xu ly loi nhu khi chay that. MockMvc khong co buoc chuyen sang /error
 * nen khong bat duoc loi kieu 403 bi doi thanh 401.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealHttpApiTest {

    private static final String ADMIN_EMAIL = "admin@quickstay.local";
    private static final String ADMIN_PASSWORD = "Admin@123";

    @Autowired TestRestTemplate http;
    @Autowired ObjectMapper json;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired JwtProperties jwtProps;
    @Autowired Clock clock;

    private Room room;

    @BeforeEach
    void setUp() {
        // Client JDK: ho tro PATCH va doc duoc body cua 401 (client mac dinh khong lam duoc)
        http.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
        room = newRoom(3);
    }

    private Room newRoom(int quantity) {
        Hotel h = new Hotel();
        h.setName("Real HTTP " + UUID.randomUUID());
        h.setCity("Test City");
        hotels.save(h);
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setCapacity(2);
        r.setQuantity(quantity);
        return rooms.save(r);
    }

    private ResponseEntity<String> call(HttpMethod method, String path, String token, Object body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) h.setBearerAuth(token);
        return http.exchange(path, method, new HttpEntity<>(body, h), String.class);
    }

    private JsonNode parse(ResponseEntity<String> r) throws Exception {
        return json.readTree(r.getBody());
    }

    private String customer(String email) throws Exception {
        ResponseEntity<String> r = call(HttpMethod.POST, "/api/auth/register", null,
                Map.of("email", email, "password", "secret123", "fullName", "Khach Test", "phone", "0900000000"));
        assertEquals(HttpStatus.CREATED, r.getStatusCode(), r.getBody());
        return parse(r).get("token").asText();
    }

    private String newCustomer() throws Exception {
        return customer("http-" + UUID.randomUUID() + "@test.com");
    }

    private String admin() throws Exception {
        ResponseEntity<String> r = call(HttpMethod.POST, "/api/auth/login", null,
                Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD));
        return parse(r).get("token").asText();
    }

    private Map<String, Object> bookingBody(Room r, int from, int to) {
        LocalDate today = LocalDate.now(clock);
        return Map.of("roomId", r.getId(), "checkIn", today.plusDays(from).toString(),
                "checkOut", today.plusDays(to).toString(), "guests", 1,
                "guestName", "Nguyen Van A", "guestPhone", "0912345678");
    }

    private void assertJsonError(ResponseEntity<String> r, HttpStatus expected) throws Exception {
        assertEquals(expected, r.getStatusCode(), r.getBody());
        assertNotNull(r.getBody(), "phai co body JSON");
        assertFalse(parse(r).path("message").asText().isBlank(), () -> "phai co message: " + r.getBody());
    }

    // ---- T126: ho so va lich su dat phong voi token that ----

    @Test
    void TC_HTTP_01_profile_with_real_token() throws Exception {
        String email = "http-" + UUID.randomUUID() + "@test.com";
        String token = customer(email);

        ResponseEntity<String> me = call(HttpMethod.GET, "/api/users/me", token, null);
        assertEquals(HttpStatus.OK, me.getStatusCode());
        assertEquals(email, parse(me).get("email").asText());
        assertEquals("CUSTOMER", parse(me).get("role").asText());
        assertFalse(me.getBody().contains("passwordHash"));

        ResponseEntity<String> updated = call(HttpMethod.PUT, "/api/users/me", token,
                Map.of("fullName", "Ten Moi", "phone", "0988"));
        assertEquals(HttpStatus.OK, updated.getStatusCode());
        assertEquals("Ten Moi", parse(updated).get("fullName").asText());
        assertEquals("0988", parse(call(HttpMethod.GET, "/api/users/me", token, null)).get("phone").asText());
    }

    @Test
    void TC_HTTP_02_history_shows_only_own_bookings() throws Exception {
        String mine = newCustomer();
        String other = newCustomer();
        long first = parse(call(HttpMethod.POST, "/api/bookings", mine, bookingBody(room, 10, 11))).get("id").asLong();
        long second = parse(call(HttpMethod.POST, "/api/bookings", mine, bookingBody(room, 20, 21))).get("id").asLong();
        call(HttpMethod.POST, "/api/bookings", other, bookingBody(room, 10, 11));

        JsonNode history = parse(call(HttpMethod.GET, "/api/bookings/me", mine, null));
        assertEquals(2, history.size());
        assertEquals(second, history.get(0).get("id").asLong(), "moi nhat truoc");
        assertEquals(first, history.get(1).get("id").asLong());
        assertEquals(room.getHotel().getName(), history.get(0).get("hotelName").asText());
        assertEquals(1, parse(call(HttpMethod.GET, "/api/bookings/me", other, null)).size());
    }

    @Test
    void TC_HTTP_03_bad_tokens_are_401_with_json() throws Exception {
        assertJsonError(call(HttpMethod.GET, "/api/users/me", null, null), HttpStatus.UNAUTHORIZED);
        assertJsonError(call(HttpMethod.GET, "/api/bookings/me", "abc.def.ghi", null), HttpStatus.UNAUTHORIZED);

        User u = users.findByEmail(ADMIN_EMAIL).orElseThrow();
        String expired = new JwtService(new JwtProperties(jwtProps.secret(), Duration.ofMinutes(-1))).generate(u);
        assertJsonError(call(HttpMethod.GET, "/api/users/me", expired, null), HttpStatus.UNAUTHORIZED);

        String foreign = new JwtService(new JwtProperties("khoa-khac-khoa-khac-khoa-khac-khoa-khac-123", Duration.ofHours(1))).generate(u);
        assertJsonError(call(HttpMethod.GET, "/api/users/me", foreign, null), HttpStatus.UNAUTHORIZED);
    }

    // ---- T128: 403 phai la 403, khong bi doi thanh 401 ----

    @Test
    void TC_HTTP_04_customer_calling_admin_api_is_403_with_json() throws Exception {
        assertJsonError(call(HttpMethod.GET, "/api/admin/hotels", newCustomer(), null), HttpStatus.FORBIDDEN);
    }

    @Test
    void TC_HTTP_05_admin_booking_is_403_with_json() throws Exception {
        assertJsonError(call(HttpMethod.POST, "/api/bookings", admin(), bookingBody(room, 10, 11)), HttpStatus.FORBIDDEN);
    }

    @Test
    void TC_HTTP_06_cancelling_someone_elses_booking_is_403_with_json() throws Exception {
        long id = parse(call(HttpMethod.POST, "/api/bookings", newCustomer(), bookingBody(room, 10, 11))).get("id").asLong();
        assertJsonError(call(HttpMethod.PATCH, "/api/bookings/" + id + "/cancel", newCustomer(), null), HttpStatus.FORBIDDEN);
    }

    @Test
    void TC_HTTP_07_owner_can_cancel_and_room_is_free_again() throws Exception {
        Room single = newRoom(1);
        String token = newCustomer();
        long id = parse(call(HttpMethod.POST, "/api/bookings", token, bookingBody(single, 10, 12))).get("id").asLong();
        assertJsonError(call(HttpMethod.POST, "/api/bookings", newCustomer(), bookingBody(single, 10, 12)), HttpStatus.CONFLICT);

        ResponseEntity<String> cancelled = call(HttpMethod.PATCH, "/api/bookings/" + id + "/cancel", token, null);
        assertEquals(HttpStatus.OK, cancelled.getStatusCode(), cancelled.getBody());
        assertEquals("CANCELLED", parse(cancelled).get("status").asText());
        assertEquals(HttpStatus.CREATED, call(HttpMethod.POST, "/api/bookings", newCustomer(), bookingBody(single, 10, 12)).getStatusCode());
    }

    // ---- T128: doi email khong lam nguoi dung bi mat dang nhap ----

    @Test
    void TC_HTTP_08_changing_email_returns_new_token_that_keeps_user_logged_in() throws Exception {
        String oldEmail = "http-" + UUID.randomUUID() + "@test.com";
        String oldToken = customer(oldEmail);
        call(HttpMethod.POST, "/api/bookings", oldToken, bookingBody(room, 40, 41));
        String newEmail = "http-" + UUID.randomUUID() + "@test.com";

        ResponseEntity<String> updated = call(HttpMethod.PUT, "/api/users/me", oldToken, Map.of("email", newEmail));
        assertEquals(HttpStatus.OK, updated.getStatusCode(), updated.getBody());
        assertEquals(newEmail, parse(updated).get("email").asText());
        String newToken = parse(updated).path("token").asText();
        assertFalse(newToken.isBlank(), "doi email phai tra token moi");

        assertEquals(newEmail, parse(call(HttpMethod.GET, "/api/users/me", newToken, null)).get("email").asText());
        assertEquals(1, parse(call(HttpMethod.GET, "/api/bookings/me", newToken, null)).size(), "van thay don cu");
        assertJsonError(call(HttpMethod.GET, "/api/users/me", oldToken, null), HttpStatus.UNAUTHORIZED);
    }

    @Test
    void TC_HTTP_09_no_new_token_when_email_unchanged() throws Exception {
        String email = "http-" + UUID.randomUUID() + "@test.com";
        String token = customer(email);
        JsonNode updated = parse(call(HttpMethod.PUT, "/api/users/me", token, Map.of("email", email, "fullName", "Giu Email")));
        assertFalse(updated.has("token"), "email khong doi thi token cu van dung duoc");
        assertEquals(HttpStatus.OK, call(HttpMethod.GET, "/api/users/me", token, null).getStatusCode());
    }

    // ---- T127: 2 yeu cau HTTP cung luc cho phong cuoi ----

    @Test
    void TC_HTTP_10_two_simultaneous_requests_for_last_room() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            for (int round = 0; round < 10; round++) {
                Room last = newRoom(1);
                List<String> tokens = List.of(newCustomer(), newCustomer());
                CountDownLatch ready = new CountDownLatch(2);
                CountDownLatch go = new CountDownLatch(1);
                List<Future<ResponseEntity<String>>> futures = new ArrayList<>();
                for (String token : tokens) {
                    futures.add(pool.submit(() -> {
                        ready.countDown();
                        go.await();
                        return call(HttpMethod.POST, "/api/bookings", token, bookingBody(last, 10, 12));
                    }));
                }
                assertTrue(ready.await(10, TimeUnit.SECONDS));
                go.countDown();

                ResponseEntity<String> a = futures.get(0).get(60, TimeUnit.SECONDS);
                ResponseEntity<String> b = futures.get(1).get(60, TimeUnit.SECONDS);
                List<HttpStatus> statuses = List.of(HttpStatus.valueOf(a.getStatusCode().value()), HttpStatus.valueOf(b.getStatusCode().value()));
                assertTrue(statuses.contains(HttpStatus.CREATED) && statuses.contains(HttpStatus.CONFLICT),
                        () -> "phai dung 1 thanh cong, 1 het phong: " + statuses);
                ResponseEntity<String> loser = a.getStatusCode().value() == 409 ? a : b;
                assertEquals("Phong da het trong khoang ngay da chon", parse(loser).get("message").asText());
            }
        } finally {
            pool.shutdownNow();
        }
    }
}
