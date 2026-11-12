package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.booking.BookingDtos.PaymentRequest;
import com.quickstay.config.ApiException;
import com.quickstay.config.PageResponse;
import com.quickstay.email.EmailService;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookings;
    private final RoomRepository rooms;
    private final UserRepository users;
    private final Clock clock;
    private final EmailService emails;

    public BookingService(BookingRepository bookings, RoomRepository rooms, UserRepository users, Clock clock) {
        this(bookings, rooms, users, clock, null);
    }

    @Autowired
    public BookingService(BookingRepository bookings, RoomRepository rooms, UserRepository users, Clock clock,
                          @Autowired(required = false) EmailService emails) {
        this.bookings = bookings;
        this.rooms = rooms;
        this.users = users;
        this.clock = clock;
        this.emails = emails;
    }

    /**
     * POST /api/bookings: tao don PENDING cho khach dang dang nhap.
     * T087 kiem tra ngay, T088 tinh tong tien theo so dem, T089 kiem tra suc chua,
     * T100 chong dat trung: khoa dong phong roi moi dem don chong lan, het phong tra 409.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingView create(String email, BookingRequest req) {
        validateDates(req.checkIn(), req.checkOut());
        Room room = rooms.findByIdForUpdate(req.roomId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phong"));
        User user = users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        if (req.guests() > room.getCapacity()) {
            throw ApiException.badRequest("Phong chi chua toi da " + room.getCapacity() + " khach");
        }
        long booked = bookings.countOverlapping(room.getId(), req.checkIn(), req.checkOut());
        if (room.remaining(booked) < 1) {
            log.info("Het phong: roomId={} {} -> {}", room.getId(), req.checkIn(), req.checkOut());
            throw ApiException.conflict("Phong da het trong khoang ngay da chon");
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
        b.setPaymentMethod(req.paymentMethod() == null ? PaymentMethod.PAY_AT_HOTEL : req.paymentMethod());
        b.setPaymentStatus(PaymentStatus.UNPAID);
        bookings.save(b);
        log.info("Dat phong moi #{} roomId={} {} -> {}", b.getId(), room.getId(), req.checkIn(), req.checkOut());
        if (emails != null) {
            emails.sendBookingConfirmationEmail(b);
        }
        return BookingView.of(b);
    }

    /** POST /api/bookings/{id}/pay: thanh toan mo phong chan thuc cho don cua chinh minh. */
    @Transactional
    public BookingView pay(String email, Long id, PaymentRequest req) {
        Booking b = bookings.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat phong"));
        if (!b.getUser().getEmail().equals(email)) {
            throw ApiException.forbidden("Ban khong co quyen thanh toan don dat phong nay");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw ApiException.conflict("Khong the thanh toan don da huy");
        }
        if (b.getPaymentStatus() == PaymentStatus.PAID) {
            throw ApiException.conflict("Don dat phong nay da duoc thanh toan");
        }
        if (req.paymentMethod() == PaymentMethod.PAY_AT_HOTEL) {
            throw ApiException.badRequest("Vui long chon phuong thuc thanh toan truc tuyen (the, chuyen khoan hoac vi)");
        }

        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        b.setPaymentMethod(req.paymentMethod());
        b.setPaymentStatus(PaymentStatus.PAID);
        b.setPaymentRef("QS-PAY-" + b.getId() + "-" + suffix);
        b.setPaidAt(Instant.now(clock));
        bookings.save(b);
        log.info("Thanh toan mo phong thanh cong don #{} ref={} method={}", b.getId(), b.getPaymentRef(), req.paymentMethod());
        if (emails != null) {
            emails.sendPaymentReceiptEmail(b);
        }
        return BookingView.of(b);
    }

    /** GET /api/bookings/me (T101): don cua nguoi dang dang nhap, moi nhat truoc. */
    @Transactional(readOnly = true)
    public List<BookingView> mine(String email) {
        User user = users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        return bookings.findMine(user.getId()).stream().map(BookingView::of).toList();
    }

    /** GET /api/bookings/me?page=&size= (T165). */
    @Transactional(readOnly = true)
    public PageResponse<BookingView> mine(String email, Pageable pageable) {
        User user = users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        return PageResponse.of(bookings.findMine(user.getId(), pageable).map(BookingView::of));
    }

    /**
     * PATCH /api/bookings/{id}/cancel (T112): chi chu don, chi khi con PENDING.
     * Khoa dong don truoc khi doc trang thai de khong ghi de khi admin dang xac nhan cung luc.
     */
    @Transactional
    public BookingView cancel(String email, Long id) {
        Booking b = bookings.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat phong"));
        if (!b.getUser().getEmail().equals(email)) {
            throw ApiException.forbidden("Ban khong co quyen huy don dat phong nay");
        }
        if (b.getStatus() != BookingStatus.PENDING) {
            throw ApiException.conflict("Chi huy duoc dat phong dang cho xac nhan (PENDING)");
        }
        b.setStatus(BookingStatus.CANCELLED);
        if (b.getPaymentStatus() == PaymentStatus.PAID) {
            b.setPaymentStatus(PaymentStatus.REFUNDED);
        }
        log.info("Khach {} huy dat phong #{}", email, id);
        if (emails != null) {
            emails.sendBookingStatusEmail(b);
        }
        return BookingView.of(b);
    }

    /** GET /api/admin/bookings: toan bo don, moi nhat truoc. */
    @Transactional(readOnly = true)
    public List<BookingView> all() {
        return bookings.findAllByOrderByCreatedAtDescIdDesc().stream().map(BookingView::of).toList();
    }

    /** GET /api/admin/bookings?page=&size= (T165). */
    @Transactional(readOnly = true)
    public PageResponse<BookingView> all(Pageable pageable) {
        return PageResponse.of(bookings.findAllByOrderByCreatedAtDescIdDesc(pageable).map(BookingView::of));
    }

    /** PATCH /api/admin/bookings/{id}/status: doi trang thai theo BookingStatus.next(); cung khoa dong don nhu cancel. */
    @Transactional
    public BookingView changeStatus(Long id, BookingStatus status) {
        Booking b = bookings.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat phong"));
        if (!b.getStatus().next().contains(status)) {
            throw ApiException.conflict("Khong the chuyen trang thai tu " + b.getStatus() + " sang " + status);
        }
        b.setStatus(status);
        if (status == BookingStatus.CANCELLED && b.getPaymentStatus() == PaymentStatus.PAID) {
            b.setPaymentStatus(PaymentStatus.REFUNDED);
        }
        log.info("Admin chuyen trang thai dat phong #{} sang {}", id, status);
        if (emails != null) {
            emails.sendBookingStatusEmail(b);
        }
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
