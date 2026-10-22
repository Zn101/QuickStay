package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookings;
    private final RoomRepository rooms;
    private final UserRepository users;

    public BookingService(BookingRepository bookings, RoomRepository rooms, UserRepository users) {
        this.bookings = bookings;
        this.rooms = rooms;
        this.users = users;
    }

    /**
     * Kiem tra phong trong va ghi dat phong trong cung mot transaction.
     * Ban ghi phong bi khoa (PESSIMISTIC_WRITE) nen hai yeu cau dong thoi khong the cung vuot qua buoc kiem tra.
     */
    @Transactional
    public BookingView create(String email, BookingRequest req) {
        if (!req.checkOut().isAfter(req.checkIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngay tra phong phai sau ngay nhan phong");
        }
        if (req.checkIn().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngay nhan phong khong duoc o qua khu");
        }
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tai khoan khong ton tai"));
        Room room = rooms.findByIdForUpdate(req.roomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong"));
        if (req.guests() > room.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Phong chi chua toi da " + room.getCapacity() + " khach");
        }
        long taken = bookings.countOverlapping(room.getId(), req.checkIn(), req.checkOut());
        if (taken >= room.getQuantity()) {
            log.info("Het phong: roomId={} {} -> {}", room.getId(), req.checkIn(), req.checkOut());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phong da het trong khoang ngay da chon");
        }
        long nights = ChronoUnit.DAYS.between(req.checkIn(), req.checkOut());
        Booking b = new Booking();
        b.setUser(user);
        b.setRoom(room);
        b.setCheckIn(req.checkIn());
        b.setCheckOut(req.checkOut());
        b.setGuests(req.guests());
        b.setGuestName(req.guestName().trim());
        b.setGuestPhone(req.guestPhone().trim());
        b.setNote(req.note());
        b.setTotalPrice(room.getPricePerNight().multiply(BigDecimal.valueOf(nights)));
        b.setStatus(BookingStatus.PENDING);
        bookings.save(b);
        log.info("Dat phong moi #{} boi {}", b.getId(), email);
        return BookingView.of(b);
    }

    @Transactional(readOnly = true)
    public List<BookingView> mine(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tai khoan khong ton tai"));
        return bookings.findByUser(user.getId()).stream().map(BookingView::of).toList();
    }

    @Transactional
    public BookingView cancel(String email, Long id) {
        Booking b = bookings.findDetailed(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay dat phong"));
        if (!b.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ban khong co quyen huy dat phong nay");
        }
        if (b.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chi huy duoc dat phong dang cho xac nhan (PENDING)");
        }
        b.setStatus(BookingStatus.CANCELLED);
        log.info("Khach {} huy dat phong #{}", email, id);
        return BookingView.of(b);
    }

    @Transactional(readOnly = true)
    public List<BookingView> all() {
        return bookings.findAllDetailed().stream().map(BookingView::of).toList();
    }

    @Transactional
    public BookingView changeStatus(Long id, BookingStatus status) {
        Booking b = bookings.findDetailed(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay dat phong"));
        if (!b.getStatus().next().contains(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Khong the chuyen trang thai " + b.getStatus() + " -> " + status);
        }
        b.setStatus(status);
        log.info("Dat phong #{} chuyen sang {}", id, status);
        return BookingView.of(b);
    }
}
