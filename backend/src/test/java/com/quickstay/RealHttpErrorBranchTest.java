package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
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
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
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
 * Nhanh loi chi xay ra khi chay that (T151): cho khoa qua lau, dang ky trung email cung luc,
 * header Authorization sai dang. Moi loi phai la ma 4xx kem {"message"}, khong duoc la 500.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealHttpErrorBranchTest {

    @Autowired TestRestTemplate http;
    @Autowired ObjectMapper json;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired TransactionTemplate tx;
    @Autowired Clock clock;

    @BeforeEach
    void setUp() {
        http.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
    }

    private ResponseEntity<String> call(HttpMethod method, String path, HttpHeaders headers, Object body) {
        HttpHeaders h = headers == null ? new HttpHeaders() : headers;
        h.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange(path, method, new HttpEntity<>(body, h), String.class);
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return h;
    }

    private static HttpHeaders authorization(String value) {
        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.AUTHORIZATION, value);
        return h;
    }

    private JsonNode parse(ResponseEntity<String> r) throws Exception {
        return json.readTree(r.getBody());
    }

    private String register(String email) throws Exception {
        ResponseEntity<String> r = call(HttpMethod.POST, "/api/auth/register", null,
                Map.of("email", email, "password", "secret123", "fullName", "Khach Test"));
        return parse(r).get("token").asText();
    }

    private Room singleRoom() {
        Hotel h = new Hotel();
        h.setName("Error branch " + UUID.randomUUID());
        h.setCity("Test City");
        hotels.save(h);
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setQuantity(1);
        return rooms.save(r);
    }

    private Map<String, Object> bookingBody(Room r) {
        LocalDate d = LocalDate.now(clock).plusDays(10);
        return Map.of("roomId", r.getId(), "checkIn", d.toString(), "checkOut", d.plusDays(1).toString(),
                "guests", 1, "guestName", "A", "guestPhone", "0900");
    }

    private void assertJsonError(ResponseEntity<String> r, HttpStatus expected) throws Exception {
        assertEquals(expected, r.getStatusCode(), r.getBody());
        assertFalse(parse(r).path("message").asText().isBlank(), () -> "phai co message: " + r.getBody());
    }

    // ---- Cho khoa qua lau ----

    @Test
    void booking_waiting_too_long_for_room_lock_is_409_not_500() throws Exception {
        Room room = singleRoom();
        String token = register("lock-" + UUID.randomUUID() + "@test.com");
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService holder = Executors.newSingleThreadExecutor();
        try {
            // Mot transaction khac giu khoa dong phong (nhu mot yeu cau dat phong bi treo)
            Future<?> holding = holder.submit(() -> tx.executeWithoutResult(s -> {
                rooms.findByIdForUpdate(room.getId());
                locked.countDown();
                try {
                    release.await(30, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }));
            assertTrue(locked.await(10, TimeUnit.SECONDS));

            long start = System.nanoTime();
            ResponseEntity<String> r = call(HttpMethod.POST, "/api/bookings", bearer(token), bookingBody(room));
            long waitedMs = (System.nanoTime() - start) / 1_000_000;

            assertJsonError(r, HttpStatus.CONFLICT);
            assertEquals("Phong dang duoc nhieu nguoi dat, vui long thu lai", parse(r).get("message").asText());
            assertTrue(waitedMs < 10_000, () -> "cho khoa qua lau: " + waitedMs + " ms");
            release.countDown();
            holding.get(30, TimeUnit.SECONDS);
        } finally {
            release.countDown();
            holder.shutdownNow();
        }
        // Khoa da tha: dat lai binh thuong
        assertEquals(HttpStatus.CREATED, call(HttpMethod.POST, "/api/bookings", bearer(token), bookingBody(room)).getStatusCode());
    }

    // ---- Dang ky trung email cung luc ----

    @Test
    void simultaneous_registrations_with_same_email_give_one_201_and_rest_409() throws Exception {
        String email = "race-" + UUID.randomUUID() + "@test.com";
        int n = 6;
        ExecutorService pool = Executors.newFixedThreadPool(n);
        try {
            CountDownLatch go = new CountDownLatch(1);
            List<Future<ResponseEntity<String>>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> {
                    go.await();
                    return call(HttpMethod.POST, "/api/auth/register", null,
                            Map.of("email", email, "password", "secret123", "fullName", "Race"));
                }));
            }
            go.countDown();
            int created = 0;
            for (Future<ResponseEntity<String>> f : futures) {
                ResponseEntity<String> r = f.get(60, TimeUnit.SECONDS);
                if (r.getStatusCode() == HttpStatus.CREATED) {
                    created++;
                } else {
                    assertJsonError(r, HttpStatus.CONFLICT);
                }
            }
            assertEquals(1, created);
        } finally {
            pool.shutdownNow();
        }
    }

    // ---- Header Authorization sai dang ----

    @Test
    void malformed_authorization_header_is_401_on_protected_api() throws Exception {
        String token = register("hdr-" + UUID.randomUUID() + "@test.com");
        for (String value : new String[]{token, "Basic " + token, "bearer " + token, "Bearer", "Bearer ", "Bearer  " + token}) {
            assertJsonError(call(HttpMethod.GET, "/api/users/me", authorization(value), null), HttpStatus.UNAUTHORIZED);
        }
        assertEquals(HttpStatus.OK, call(HttpMethod.GET, "/api/users/me", bearer(token), null).getStatusCode());
    }

    @Test
    void bad_token_does_not_block_public_api() throws Exception {
        assertEquals(HttpStatus.OK, call(HttpMethod.GET, "/api/hotels", authorization("Bearer abc.def.ghi"), null).getStatusCode());
        assertEquals(HttpStatus.OK, call(HttpMethod.GET, "/api/hotels", authorization("Basic xyz"), null).getStatusCode());
    }
}
