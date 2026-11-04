package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit test BookingService.create (T087, T088, T089, T100), khong khoi dong Spring.
 * Dong ho co dinh 2026-11-03T18:00Z = 01h sang 04/11 o Viet Nam (UTC van la 03/11):
 * "hom nay" phai la 04/11 theo app.timezone, khong theo gio may chu.
 */
class BookingServiceTest {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 4);

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final RoomRepository rooms = mock(RoomRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final BookingService service = new BookingService(bookings, rooms, users,
            Clock.fixed(Instant.parse("2026-11-03T18:00:00Z"), VN));

    private Room room;

    @BeforeEach
    void setUp() {
        Hotel hotel = new Hotel();
        hotel.setName("Sunrise");
        hotel.setCity("Da Nang");
        room = new Room();
        room.setHotel(hotel);
        room.setRoomType("Standard");
        room.setPricePerNight(BigDecimal.valueOf(650_000));
        room.setCapacity(2);
        room.setQuantity(2);
        ReflectionTestUtils.setField(room, "id", 1L);   // entity chua luu nen chua co id
        User user = new User();
        user.setEmail("an@test.com");
        when(users.findByEmail("an@test.com")).thenReturn(Optional.of(user));
        when(rooms.findByIdForUpdate(1L)).thenReturn(Optional.of(room));
    }

    private static BookingRequest req(LocalDate in, LocalDate out, int guests) {
        return new BookingRequest(1L, in, out, guests, "  Nguyen Van A ", " 0912345678 ", "  ");
    }

    private HttpStatus statusOf(BookingRequest r) {
        return assertThrows(ApiException.class, () -> service.create("an@test.com", r)).getStatus();
    }

    @Test
    void creates_pending_booking_with_total_price_per_night() {
        BookingView v = service.create("an@test.com", req(TODAY.plusDays(1), TODAY.plusDays(4), 2));

        ArgumentCaptor<Booking> saved = ArgumentCaptor.forClass(Booking.class);
        verify(bookings).save(saved.capture());
        Booking b = saved.getValue();
        assertEquals(BookingStatus.PENDING, b.getStatus());
        assertEquals(0, BigDecimal.valueOf(1_950_000).compareTo(b.getTotalPrice()), "3 dem x 650k");
        assertEquals("Nguyen Van A", b.getGuestName());
        assertEquals("0912345678", b.getGuestPhone());
        assertNull(b.getNote(), "ghi chu rong luu null");
        assertEquals("an@test.com", v.userEmail());
        assertEquals("Sunrise", v.hotelName());
        assertEquals("Standard", v.roomType());
    }

    @Test
    void today_in_vietnam_is_allowed_even_when_server_utc_date_is_earlier() {
        assertDoesNotThrow(() -> service.create("an@test.com", req(TODAY, TODAY.plusDays(1), 1)));
        ApiException e = assertThrows(ApiException.class,
                () -> service.create("an@test.com", req(TODAY.minusDays(1), TODAY.plusDays(1), 1)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
        assertEquals("Ngay nhan phong khong duoc o qua khu", e.getMessage());
    }

    @Test
    void checkout_must_be_after_checkin() {
        assertEquals(HttpStatus.BAD_REQUEST, statusOf(req(TODAY.plusDays(3), TODAY.plusDays(3), 1)));
        assertEquals(HttpStatus.BAD_REQUEST, statusOf(req(TODAY.plusDays(3), TODAY.plusDays(2), 1)));
        verifyNoInteractions(bookings);
    }

    @Test
    void guests_over_capacity_is_rejected_but_equal_is_ok() {
        ApiException e = assertThrows(ApiException.class,
                () -> service.create("an@test.com", req(TODAY.plusDays(1), TODAY.plusDays(2), 3)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
        assertEquals("Phong chi chua toi da 2 khach", e.getMessage());
        verify(bookings, never()).save(any());
        assertDoesNotThrow(() -> service.create("an@test.com", req(TODAY.plusDays(1), TODAY.plusDays(2), 2)));
    }

    @Test
    void unknown_room_is_404_and_unknown_user_is_401() {
        BookingRequest noRoom = new BookingRequest(99L, TODAY.plusDays(1), TODAY.plusDays(2), 1, "A", "0900", null);
        assertEquals(HttpStatus.NOT_FOUND, statusOf(noRoom));
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ApiException.class,
                () -> service.create("ghost@test.com", req(TODAY.plusDays(1), TODAY.plusDays(2), 1))).getStatus());
        verify(bookings, never()).save(any());
    }

    @Test
    void full_room_is_409_and_nothing_is_saved() {
        when(bookings.countOverlapping(1L, TODAY.plusDays(1), TODAY.plusDays(3))).thenReturn(2L);
        ApiException e = assertThrows(ApiException.class,
                () -> service.create("an@test.com", req(TODAY.plusDays(1), TODAY.plusDays(3), 1)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        assertEquals("Phong da het trong khoang ngay da chon", e.getMessage());
        verify(bookings, never()).save(any());
    }

    @Test
    void last_free_room_can_still_be_booked() {
        when(bookings.countOverlapping(1L, TODAY.plusDays(1), TODAY.plusDays(3))).thenReturn(1L);
        assertDoesNotThrow(() -> service.create("an@test.com", req(TODAY.plusDays(1), TODAY.plusDays(3), 1)));
        verify(bookings).save(any());
    }

    @Test
    void room_is_locked_before_any_other_read() {
        // Khoa phong phai la lan doc dau tien cua transaction (xem javadoc BookingService.create)
        service.create("an@test.com", req(TODAY.plusDays(1), TODAY.plusDays(2), 1));
        var order = inOrder(rooms, users, bookings);
        order.verify(rooms).findByIdForUpdate(1L);
        order.verify(users).findByEmail("an@test.com");
        order.verify(bookings).countOverlapping(1L, TODAY.plusDays(1), TODAY.plusDays(2));
        order.verify(bookings).save(any());
        verify(rooms, never()).findById(any());
    }

    @Test
    void total_price_counts_nights_not_days() {
        LocalDate d = LocalDate.of(2026, 12, 30);
        assertEquals(0, BigDecimal.valueOf(500_000).compareTo(
                BookingService.totalPrice(BigDecimal.valueOf(500_000), d, d.plusDays(1))));
        assertEquals(0, BigDecimal.valueOf(1_500_000).compareTo(
                BookingService.totalPrice(BigDecimal.valueOf(500_000), d, d.plusDays(3))), "qua nam moi van dung");
    }
}
