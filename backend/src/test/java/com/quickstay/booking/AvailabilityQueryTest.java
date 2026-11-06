package com.quickstay.booking;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Truy van dem don chong lan (T077, T078) tren du lieu rieng:
 * phong A (2 phong): [10,12) PENDING, [12,15) CONFIRMED, [5,8) CANCELLED; phong B (1 phong): [11,13).
 * Ngay tinh tu mot moc co dinh, khoang [checkIn, checkOut) khong tinh ngay tra phong.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AvailabilityQueryTest {

    private static final LocalDate BASE = LocalDate.of(2030, 1, 1);

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired BookingRepository bookings;

    private Hotel hotel;
    private Room a;
    private Room b;

    private static LocalDate d(int day) {
        return BASE.plusDays(day);
    }

    @BeforeEach
    void setUp() {
        User u = new User();
        u.setEmail("avail-" + UUID.randomUUID() + "@test.com");
        u.setPasswordHash("x");
        users.save(u);

        hotel = new Hotel();
        hotel.setName("Availability " + UUID.randomUUID());
        hotel.setCity("Test City");
        hotels.save(hotel);
        a = room("A", 2);
        b = room("B", 1);

        book(u, a, 10, 12, BookingStatus.PENDING);
        book(u, a, 12, 15, BookingStatus.CONFIRMED);
        book(u, a, 5, 8, BookingStatus.CANCELLED);
        book(u, b, 11, 13, BookingStatus.PENDING);
    }

    private Room room(String type, int quantity) {
        Room r = new Room();
        r.setHotel(hotel);
        r.setRoomType(type);
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setQuantity(quantity);
        return rooms.save(r);
    }

    private void book(User u, Room r, int in, int out, BookingStatus status) {
        Booking x = new Booking();
        x.setUser(u);
        x.setRoom(r);
        x.setCheckIn(d(in));
        x.setCheckOut(d(out));
        x.setGuests(1);
        x.setTotalPrice(BigDecimal.ONE);
        x.setStatus(status);
        bookings.save(x);
    }

    /** roomId -> so don chong lan; loai phong khong co don thi khong co trong map. */
    private Map<Long, Long> booked(int in, int out) {
        return bookings.countOverlappingByHotel(hotel.getId(), d(in), d(out)).stream()
                .collect(Collectors.toMap(RoomBookedCount::roomId, RoomBookedCount::booked));
    }

    @Test
    void adjacent_stays_do_not_overlap() {
        // Tra phong dung ngay nhan cua don [10,12); nhan phong dung ngay tra cua don [12,15)
        assertTrue(booked(8, 10).isEmpty());
        assertTrue(booked(15, 17).isEmpty());
    }

    @Test
    void partial_overlap_on_either_side_counts() {
        assertEquals(Map.of(a.getId(), 1L), booked(9, 11));   // cat dau don [10,12)
        assertEquals(Map.of(a.getId(), 1L), booked(14, 16));  // cat duoi don [12,15)
        assertEquals(Map.of(a.getId(), 1L), booked(13, 14));  // nam trong don [12,15)
    }

    @Test
    void range_covering_several_bookings_counts_each_room_type_separately() {
        assertEquals(Map.of(a.getId(), 2L, b.getId(), 1L), booked(11, 13));
        assertEquals(Map.of(a.getId(), 2L, b.getId(), 1L), booked(1, 20));
    }

    @Test
    void cancelled_bookings_are_ignored() {
        assertTrue(booked(5, 8).isEmpty());
        assertTrue(booked(6, 7).isEmpty());
    }

    @Test
    void other_hotels_are_not_counted() {
        Hotel other = new Hotel();
        other.setName("Other " + UUID.randomUUID());
        other.setCity("Test City");
        hotels.save(other);
        assertTrue(bookings.countOverlappingByHotel(other.getId(), d(1), d(20)).isEmpty());
    }

    @Test
    void remaining_never_goes_below_zero() {
        Room r = new Room();
        r.setQuantity(2);
        assertEquals(2, r.remaining(0));
        assertEquals(1, r.remaining(1));
        assertEquals(0, r.remaining(2));
        assertEquals(0, r.remaining(3), "admin giam quantity duoi so don dang co");
    }
}
