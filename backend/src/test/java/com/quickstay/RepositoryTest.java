package com.quickstay;

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
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Entity + repository (T036) chay tren luoc do Flyway that (ddl-auto=validate),
 * nen test nay cung bat loi lech giua entity va file migration.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RepositoryTest {

    @Autowired UserRepository users;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;

    private User newUser() {
        User u = new User();
        u.setEmail("repo-" + UUID.randomUUID() + "@test.com");
        u.setPasswordHash("hash");
        return users.saveAndFlush(u);
    }

    private Hotel newHotel() {
        Hotel h = new Hotel();
        h.setName("Repo Hotel");
        h.setCity("Test City");
        return hotels.save(h);
    }

    private Room newRoom(Hotel h, String type, long price) {
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType(type);
        r.setPricePerNight(BigDecimal.valueOf(price));
        return rooms.save(r);
    }

    private Booking booking(User u, Room r, LocalDate in, LocalDate out) {
        Booking b = new Booking();
        b.setUser(u);
        b.setRoom(r);
        b.setCheckIn(in);
        b.setCheckOut(out);
        b.setGuests(1);
        b.setTotalPrice(r.getPricePerNight());
        return b;
    }

    @Test
    void booking_is_saved_with_defaults_and_listed_newest_first() {
        User u = newUser();
        Room r = newRoom(newHotel(), "Standard", 500_000);
        LocalDate d = LocalDate.now().plusDays(10);
        Booking first = bookings.saveAndFlush(booking(u, r, d, d.plusDays(1)));
        Booking second = bookings.saveAndFlush(booking(u, r, d.plusDays(5), d.plusDays(7)));

        assertEquals(BookingStatus.PENDING, first.getStatus());
        assertNotNull(first.getCreatedAt());
        List<Booking> mine = bookings.findByUserIdOrderByCreatedAtDesc(u.getId());
        assertEquals(List.of(second.getId(), first.getId()), mine.stream().map(Booking::getId).toList());
    }

    @Test
    void rooms_of_hotel_are_sorted_by_price() {
        Hotel h = newHotel();
        newRoom(h, "Suite", 2_000_000);
        newRoom(h, "Standard", 500_000);
        newRoom(h, "Deluxe", 900_000);
        assertEquals(List.of("Standard", "Deluxe", "Suite"),
                rooms.findByHotelIdOrderByPricePerNight(h.getId()).stream().map(Room::getRoomType).toList());
    }

    @Test
    void database_rejects_duplicate_email() {
        User u = newUser();
        User dup = new User();
        dup.setEmail(u.getEmail());
        dup.setPasswordHash("hash");
        assertThrows(DataIntegrityViolationException.class, () -> users.saveAndFlush(dup));
    }

    @Test
    void database_rejects_checkout_not_after_checkin() {
        User u = newUser();
        Room r = newRoom(newHotel(), "Standard", 500_000);
        LocalDate d = LocalDate.now().plusDays(3);
        assertThrows(DataIntegrityViolationException.class, () -> bookings.saveAndFlush(booking(u, r, d, d)));
    }

    @Test
    void database_rejects_invalid_room_values() {
        Room r = new Room();
        r.setHotel(newHotel());
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.valueOf(-1));
        assertThrows(DataIntegrityViolationException.class, () -> rooms.saveAndFlush(r));
    }
}
