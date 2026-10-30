package com.quickstay;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BookingApiTest extends ApiTestBase {

    @Test
    void TC_BOOK_01_create_computes_total_by_nights_and_is_pending() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        String token = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), token, bookingBody(room, in(20), in(23), 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(1500000))
                .andExpect(jsonPath("$.guestName").value("Nguyen Van A"));
    }

    @Test
    void TC_BOOK_02_requires_login() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        mvc.perform(withBody(post("/api/bookings"), null, bookingBody(room, in(20), in(21), 1)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void TC_BOOK_03_admin_cannot_book() throws Exception {
        String admin = adminToken();
        long room = newRoom(admin, 1, 2, 500000);
        mvc.perform(withBody(post("/api/bookings"), admin, bookingBody(room, in(20), in(21), 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void TC_BOOK_04_overlapping_dates_are_rejected_when_room_is_full() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        String a = registerCustomer(newCustomerEmail());
        String b = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(30), in(33), 2)))
                .andExpect(status().isCreated());
        mvc.perform(withBody(post("/api/bookings"), b, bookingBody(room, in(32), in(35), 2)))
                .andExpect(status().isConflict());
        mvc.perform(withBody(post("/api/bookings"), b, bookingBody(room, in(29), in(31), 2)))
                .andExpect(status().isConflict());
    }

    @Test
    void TC_BOOK_05_back_to_back_stays_do_not_conflict() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        String a = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(40), in(42), 2)))
                .andExpect(status().isCreated());
        mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(42), in(44), 2)))
                .andExpect(status().isCreated());
    }

    @Test
    void TC_BOOK_06_quantity_greater_than_one_allows_parallel_bookings_until_full() throws Exception {
        long room = newRoom(adminToken(), 2, 2, 500000);
        String t = registerCustomer(newCustomerEmail());
        for (int i = 0; i < 2; i++) {
            mvc.perform(withBody(post("/api/bookings"), t, bookingBody(room, in(50), in(52), 2)))
                    .andExpect(status().isCreated());
        }
        mvc.perform(withBody(post("/api/bookings"), t, bookingBody(room, in(50), in(52), 2)))
                .andExpect(status().isConflict());
    }

    @Test
    void TC_BOOK_07_invalid_dates_and_guest_count_are_rejected() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        String t = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), t, bookingBody(room, in(10), in(10), 1)))
                .andExpect(status().isBadRequest());
        mvc.perform(withBody(post("/api/bookings"), t, bookingBody(room, in(-3), in(2), 1)))
                .andExpect(status().isBadRequest());
        mvc.perform(withBody(post("/api/bookings"), t, bookingBody(room, in(10), in(12), 5)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void TC_BOOK_08_unknown_room_is_404() throws Exception {
        String t = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), t, bookingBody(999999, in(10), in(12), 1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void TC_BOOK_09_history_only_shows_own_bookings() throws Exception {
        long room = newRoom(adminToken(), 3, 2, 500000);
        String a = registerCustomer(newCustomerEmail());
        String b = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(60), in(61), 1)));
        mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(62), in(63), 1)));
        mvc.perform(auth(get("/api/bookings/me"), a)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(auth(get("/api/bookings/me"), b)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void TC_BOOK_10_cancel_pending_frees_the_room() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        String a = registerCustomer(newCustomerEmail());
        String b = registerCustomer(newCustomerEmail());
        long id = read(mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(70), in(72), 2)))
                .andReturn()).get("id").asLong();
        mvc.perform(auth(patch("/api/bookings/" + id + "/cancel"), a))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(withBody(post("/api/bookings"), b, bookingBody(room, in(70), in(72), 2)))
                .andExpect(status().isCreated());
    }

    @Test
    void TC_BOOK_11_cannot_cancel_someone_elses_or_confirmed_booking() throws Exception {
        String admin = adminToken();
        long room = newRoom(admin, 2, 2, 500000);
        String a = registerCustomer(newCustomerEmail());
        String b = registerCustomer(newCustomerEmail());
        long id = read(mvc.perform(withBody(post("/api/bookings"), a, bookingBody(room, in(80), in(82), 2)))
                .andReturn()).get("id").asLong();
        mvc.perform(auth(patch("/api/bookings/" + id + "/cancel"), b)).andExpect(status().isForbidden());
        mvc.perform(withBody(patch("/api/admin/bookings/" + id + "/status"), admin,
                java.util.Map.of("status", "CONFIRMED"))).andExpect(status().isOk());
        mvc.perform(auth(patch("/api/bookings/" + id + "/cancel"), a)).andExpect(status().isConflict());
    }

    /** Rui ro "dat trung khi nhieu nguoi dat cung luc": 8 yeu cau, chi con 1 phong -> dung 1 yeu cau thanh cong. */
    @Test
    void TC_BOOK_12_concurrent_requests_never_double_book() throws Exception {
        long room = newRoom(adminToken(), 1, 2, 500000);
        int n = 8;
        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < n; i++) tokens.add(registerCustomer(newCustomerEmail()));
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger created = new AtomicInteger();
        AtomicInteger conflict = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (String token : tokens) {
            futures.add(pool.submit(() -> {
                start.await();
                int code = mvc.perform(withBody(post("/api/bookings"), token, bookingBody(room, in(90), in(92), 2)))
                        .andReturn().getResponse().getStatus();
                if (code == 201) created.incrementAndGet();
                else if (code == 409) conflict.incrementAndGet();
                return null;
            }));
        }
        start.countDown();
        for (Future<?> f : futures) f.get(60, TimeUnit.SECONDS);
        pool.shutdown();
        assertEquals(1, created.get(), "chi 1 dat phong duoc tao");
        assertEquals(n - 1, conflict.get(), "cac yeu cau con lai phai nhan 409");
    }
}
