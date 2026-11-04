package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookings;
    private final RoomRepository rooms;
    private final UserRepository users;
    private final Clock clock;

    public BookingService(BookingRepository bookings, RoomRepository rooms, UserRepository users, Clock clock) {
        this.bookings = bookings;
        this.rooms = rooms;
        this.users = users;
        this.clock = clock;
    }

    /**
     * POST /api/bookings: tao don PENDING cho khach dang dang nhap.
     * T087 kiem tra ngay, T088 tinh tong tien theo so dem, T089 kiem tra suc chua.
     * Kiem tra con phong (409) va khoa chong dat trung la T100.
     */
    @Transactional
    public BookingView create(String email, BookingRequest req) {
        validateDates(req.checkIn(), req.checkOut());
        User user = users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        Room room = rooms.findById(req.roomId()).orElseThrow(() -> ApiException.notFound("Khong tim thay phong"));
        if (req.guests() > room.getCapacity()) {
            throw ApiException.badRequest("Phong chi chua toi da " + room.getCapacity() + " khach");
        }

        Booking b = new Booking();
        b.setUser(user);
        b.setRoom(room);
        b.setCheckIn(req.checkIn());
        b.setCheckOut(req.checkOut());
        b.setGuests(req.guests());
        b.setGuestName(req.guestName());
        b.setGuestPhone(req.guestPhone());
        b.setNote(req.note());
        b.setTotalPrice(totalPrice(room.getPricePerNight(), req.checkIn(), req.checkOut()));
        b.setStatus(BookingStatus.PENDING);
        bookings.save(b);
        log.info("Dat phong moi #{} roomId={} {} -> {}", b.getId(), room.getId(), req.checkIn(), req.checkOut());
        return BookingView.of(b);
    }

    @Transactional(readOnly = true)
    public List<BookingView> mine(String email) {
        User user = users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        return bookings.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(BookingView::of).toList();
    }

    @Transactional
    public BookingView cancel(String email, Long id) {
        Booking b = bookings.findById(id).orElseThrow(() -> ApiException.notFound("Khong tim thay don dat phong"));
        if (!b.getUser().getEmail().equals(email)) {
            throw ApiException.forbidden("Ban khong co quyen huy don dat phong nay");
        }
        if (b.getStatus() != BookingStatus.PENDING) {
            throw ApiException.conflict("Chi co the huy don dat phong o trang thai Cho xac nhan (PENDING)");
        }
        b.setStatus(BookingStatus.CANCELLED);
        log.info("Khach {} huy dat phong #{}", email, id);
        return BookingView.of(b);
    }

    /** T087: ngay tra sau ngay nhan; ngay nhan khong truoc hom nay (theo app.timezone). */
    void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (!checkOut.isAfter(checkIn)) {
            throw ApiException.badRequest("Ngay tra phong phai sau ngay nhan phong");
        }
        if (checkIn.isBefore(LocalDate.now(clock))) {
            throw ApiException.badRequest("Ngay nhan phong khong duoc o qua khu");
        }
    }

    /** T088: gia mot dem x so dem; ngay tra phong khong tinh la dem o. */
    static BigDecimal totalPrice(BigDecimal pricePerNight, LocalDate checkIn, LocalDate checkOut) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        return pricePerNight.multiply(BigDecimal.valueOf(nights));
    }
}
