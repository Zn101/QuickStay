package com.quickstay;

import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Hieu nang truy van (T153, NFR-01: API danh sach, chi tiet, phong trong duoi 500 ms).
 * Du lieu lon tam thoi: 500 khach san x 3 loai phong, 20.000 don cua mot khach tren 5 loai phong cua mot khach san.
 * Xoa sach sau khi do de khong anh huong test khac. Ket qua in ra ([PERF], [EXPLAIN]) de ghi vao bao cao.
 * Do tren H2 trong bo nho; con so tren MySQL that se khac.
 */
class QueryPerformanceTest extends ApiTestBase {

    private static final int HOTELS = 500;
    private static final int BOOKINGS = 20_000;
    private static final long LIMIT_MS = 500;

    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;

    private final String tag = "Perf" + UUID.randomUUID().toString().substring(0, 8);
    private final List<Long> hotelIds = new ArrayList<>();
    private final List<Long> roomIds = new ArrayList<>();
    private long bigHotel;
    private long userId;

    @AfterEach
    void cleanUp() {
        if (!roomIds.isEmpty()) {
            String in = String.join(",", roomIds.stream().map(String::valueOf).toList());
            jdbc.update("delete from bookings where room_id in (" + in + ")");
            jdbc.update("delete from rooms where id in (" + in + ")");
        }
        if (!hotelIds.isEmpty()) {
            jdbc.update("delete from hotels where id in (" + String.join(",", hotelIds.stream().map(String::valueOf).toList()) + ")");
        }
    }

    private long insertHotel(String name) {
        jdbc.update("insert into hotels (name, city) values (?, ?)", name, tag + (hotelIds.size() % 10));
        long id = jdbc.queryForObject("select max(id) from hotels", Long.class);
        hotelIds.add(id);
        return id;
    }

    private long insertRoom(long hotelId, String type, long price, int quantity) {
        jdbc.update("insert into rooms (hotel_id, room_type, price_per_night, capacity, quantity) values (?, ?, ?, 2, ?)",
                hotelId, type, price, quantity);
        long id = jdbc.queryForObject("select max(id) from rooms", Long.class);
        roomIds.add(id);
        return id;
    }

    private void seed() throws Exception {
        long start = System.nanoTime();
        bigHotel = insertHotel(tag + " Big");
        List<Long> bigRooms = new ArrayList<>();
        for (int t = 0; t < 5; t++) bigRooms.add(insertRoom(bigHotel, "Type" + t, 300_000 + t * 100_000L, 60));
        for (int i = 1; i < HOTELS; i++) {
            long h = insertHotel(tag + " Hotel " + i);
            insertRoom(h, "Standard", 400_000 + (i % 7) * 50_000L, 10);
            insertRoom(h, "Deluxe", 900_000 + (i % 5) * 50_000L, 5);
            insertRoom(h, "Suite", 1_500_000, 2);
        }
        String email = "perf-" + UUID.randomUUID() + "@test.com";
        registerCustomer(email);
        userId = users.findByEmail(email).orElseThrow().getId();

        LocalDate base = LocalDate.now().minusDays(365);
        Instant created = Instant.now().minusSeconds(BOOKINGS);
        List<Object[]> rows = new ArrayList<>(BOOKINGS);
        for (int i = 0; i < BOOKINGS; i++) {
            LocalDate in = base.plusDays(i % 730);
            rows.add(new Object[]{userId, bigRooms.get(i % 5), Date.valueOf(in), Date.valueOf(in.plusDays(1 + i % 3)),
                    i % 6 == 0 ? "CANCELLED" : "CONFIRMED", Timestamp.from(created.plusSeconds(i))});
        }
        jdbc.batchUpdate("insert into bookings (user_id, room_id, check_in, check_out, guests, total_price, status, created_at)"
                + " values (?, ?, ?, ?, 1, 100, ?, ?)", rows);
        System.out.printf("[PERF] du lieu: %d khach san, %d loai phong, %d don, tao trong %d ms%n",
                hotelIds.size(), roomIds.size(), BOOKINGS, (System.nanoTime() - start) / 1_000_000);
    }

    /** Chay 3 lan khoi dong roi do 10 lan; tra ve {trung vi, lon nhat} ms. */
    private long[] measure(String name, MockHttpServletRequestBuilder... requests) throws Exception {
        for (int i = 0; i < 3; i++) for (var r : requests) mvc.perform(r).andExpect(status().is2xxSuccessful());
        long[] times = new long[10];
        for (int i = 0; i < times.length; i++) {
            long t0 = System.nanoTime();
            for (var r : requests) mvc.perform(r).andExpect(status().is2xxSuccessful());
            times[i] = (System.nanoTime() - t0) / 1_000_000;
        }
        Arrays.sort(times);
        long median = times[times.length / 2], max = times[times.length - 1];
        System.out.printf("[PERF] %-48s trung vi %4d ms, lon nhat %4d ms%n", name, median, max);
        return new long[]{median, max};
    }

    private String explain(String sql) {
        String plan = String.join(" ", jdbc.queryForList("EXPLAIN " + sql, String.class)).replaceAll("\\s+", " ");
        System.out.println("[EXPLAIN] " + plan);
        return plan.toUpperCase();
    }

    @Test
    void main_apis_stay_under_500ms_with_large_data() throws Exception {
        seed();
        String token = read(mvc.perform(withBody(post("/api/auth/login"), null,
                Map.of("email", users.findById(userId).orElseThrow().getEmail(), "password", "secret123"))).andReturn())
                .get("token").asText();
        LocalDate d = LocalDate.now().plusDays(30);

        List<long[]> results = new ArrayList<>();
        results.add(measure("GET /hotels/{id}/rooms co ngay (20.000 don)", get("/api/hotels/" + bigHotel + "/rooms")
                .param("checkIn", d.toString()).param("checkOut", d.plusDays(2).toString())));
        results.add(measure("GET /hotels/{id} (chi tiet)", get("/api/hotels/" + bigHotel)));
        results.add(measure("GET /hotels (khoang 504 khach san)", get("/api/hotels")));
        results.add(measure("GET /hotels?city=&maxPrice= (loc)", get("/api/hotels").param("city", tag + "3").param("maxPrice", "600000")));
        results.add(measure("GET /hotels?page=0&size=10", get("/api/hotels").param("page", "0").param("size", "10")));
        results.add(measure("GET /bookings/me?page=0&size=10 (20.000 don)", get("/api/bookings/me")
                .header("Authorization", "Bearer " + token).param("page", "0").param("size", "10")));
        measure("GET /bookings/me khong phan trang (20.000 don)", get("/api/bookings/me").header("Authorization", "Bearer " + token));

        for (long[] r : results) {
            assertTrue(r[0] < LIMIT_MS, "trung vi vuot " + LIMIT_MS + " ms: " + r[0]);
        }

        // Ke hoach truy van: cau dem phong trong va lich su phai dung chi muc, khong quet ca bang
        String count = explain("select count(*) from bookings b where b.room_id = " + roomIds.get(0)
                + " and b.check_in < DATE '" + d.plusDays(2) + "' and b.check_out > DATE '" + d + "' and b.status <> 'CANCELLED'");
        assertTrue(count.contains("IDX_BOOKINGS_ROOM_DATES"), "dem phong trong phai dung idx_bookings_room_dates");
        explain("select b.room_id, count(*) from bookings b join rooms r on r.id = b.room_id where r.hotel_id = " + bigHotel
                + " and b.check_in < DATE '" + d.plusDays(2) + "' and b.check_out > DATE '" + d + "' and b.status <> 'CANCELLED' group by b.room_id");
        String mine = explain("select * from bookings b where b.user_id = " + userId + " order by b.created_at desc, b.id desc limit 10");
        assertTrue(mine.contains("IDX_BOOKINGS_USER_CREATED") || mine.contains("FK_BOOKINGS_USER"),
                "lich su phai tim theo user qua chi muc");
        explain("select * from hotels h where lower(h.city) like '%" + tag.toLowerCase() + "%'");
    }
}
