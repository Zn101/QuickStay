package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Dat phong dong thoi that (T114): nhieu luong cung goi BookingService, moi luong mot transaction,
 * chay tren CSDL that cua test nen khoa FOR UPDATE co tac dung. Khong dat @Transactional o lop test.
 */
@SpringBootTest
class BookingConcurrencyTest {

    @Autowired BookingService service;
    @Autowired BookingRepository bookings;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired Clock clock;

    private Hotel hotel;
    private String email;

    @BeforeEach
    void setUp() {
        hotel = new Hotel();
        hotel.setName("Concurrency " + UUID.randomUUID());
        hotel.setCity("Test City");
        hotels.save(hotel);
        User u = new User();
        email = "concurrent-" + UUID.randomUUID() + "@test.com";
        u.setEmail(email);
        u.setPasswordHash("x");
        users.save(u);
    }

    private Room room(int quantity) {
        Room r = new Room();
        r.setHotel(hotel);
        r.setRoomType("Type " + UUID.randomUUID());
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setCapacity(2);
        r.setQuantity(quantity);
        return rooms.save(r);
    }

    private LocalDate day(int offset) {
        return LocalDate.now(clock).plusDays(100 + offset);
    }

    private Callable<Long> booking(Room r, int from, int to) {
        return () -> service.create(email, new BookingRequest(r.getId(), day(from), day(to), 1, "Khach", "0900", null)).id();
    }

    /** Chay cac tac vu cung luc (cho nhau o vach xuat phat); ket qua la gia tri tra ve hoac exception. */
    private <T> List<Object> race(List<Callable<T>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        try {
            CountDownLatch ready = new CountDownLatch(tasks.size());
            CountDownLatch go = new CountDownLatch(1);
            List<Future<T>> futures = new ArrayList<>();
            for (Callable<T> task : tasks) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    go.await();
                    return task.call();
                }));
            }
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            go.countDown();
            List<Object> results = new ArrayList<>();
            for (Future<T> f : futures) {
                try {
                    results.add(f.get(60, TimeUnit.SECONDS));
                } catch (ExecutionException e) {
                    results.add(e.getCause());
                }
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    private static long successes(List<Object> results) {
        return results.stream().filter(r -> !(r instanceof Throwable)).count();
    }

    /** Moi yeu cau khong thanh cong phai la 409 het phong, khong phai loi he thong. */
    private static void assertRestAreConflicts(List<Object> results) {
        for (Object r : results) {
            if (r instanceof Throwable t) {
                assertInstanceOf(ApiException.class, t, () -> "loi khong mong doi: " + t);
                assertEquals(HttpStatus.CONFLICT, ((ApiException) t).getStatus());
            }
        }
    }

    private long activeBookings(Room r, int from, int to) {
        return bookings.countOverlapping(r.getId(), day(from), day(to));
    }

    @Test
    void several_rooms_of_same_type_accept_exactly_quantity_bookings() throws Exception {
        Room r = room(3);
        List<Callable<Long>> tasks = new ArrayList<>();
        for (int i = 0; i < 12; i++) tasks.add(booking(r, 0, 2));

        List<Object> results = race(tasks);

        assertEquals(3, successes(results), "chi du 3 phong");
        assertRestAreConflicts(results);
        assertEquals(3, activeBookings(r, 0, 2));
    }

    @Test
    void last_room_goes_to_exactly_one_request() throws Exception {
        Room r = room(1);
        List<Callable<Long>> tasks = new ArrayList<>();
        for (int i = 0; i < 8; i++) tasks.add(booking(r, 10, 11));

        List<Object> results = race(tasks);

        assertEquals(1, successes(results));
        assertRestAreConflicts(results);
        assertEquals(1, activeBookings(r, 10, 11));
    }

    @Test
    void overlapping_ranges_never_exceed_quantity_on_any_night() throws Exception {
        Room r = room(2);
        List<Callable<Long>> tasks = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            tasks.add(booking(r, 20, 22));
            tasks.add(booking(r, 21, 23));
        }

        List<Object> results = race(tasks);

        assertRestAreConflicts(results);
        // Dem 21 nam trong ca hai khoang nen toi da 2 don chong lan dem do
        assertEquals(2, successes(results));
        assertEquals(2, activeBookings(r, 21, 22));
    }

    @Test
    void adjacent_stays_all_succeed_at_the_same_time() throws Exception {
        Room r = room(1);
        List<Callable<Long>> tasks = new ArrayList<>();
        for (int i = 0; i < 6; i++) tasks.add(booking(r, 30 + i, 31 + i));

        List<Object> results = race(tasks);

        assertEquals(6, successes(results), () -> "ky nghi lien ke khong xung dot: " + results);
    }

    @Test
    void different_room_types_do_not_block_each_other() throws Exception {
        List<Room> list = List.of(room(1), room(1), room(1), room(1));
        List<Callable<Long>> tasks = new ArrayList<>();
        for (Room r : list) tasks.add(booking(r, 40, 42));

        assertEquals(4, successes(race(tasks)));
    }

    @Test
    void customer_cancel_and_admin_confirm_at_same_time_only_one_wins() throws Exception {
        Room r = room(20);
        for (int i = 0; i < 10; i++) {
            long id = service.create(email, new BookingRequest(r.getId(), day(50), day(51), 1, "Khach", "0900", null)).id();
            List<Callable<BookingStatus>> tasks = List.of(
                    () -> service.cancel(email, id).status(),
                    () -> service.changeStatus(id, BookingStatus.CONFIRMED).status());

            List<Object> results = race(tasks);

            assertEquals(1, successes(results), () -> "don #" + id + ": " + results);
            assertRestAreConflicts(results);
            BookingStatus winner = (BookingStatus) results.stream().filter(x -> !(x instanceof Throwable)).findFirst().orElseThrow();
            assertEquals(winner, bookings.findById(id).orElseThrow().getStatus(), "trang thai trong CSDL la cua ben thang");
        }
    }
}
