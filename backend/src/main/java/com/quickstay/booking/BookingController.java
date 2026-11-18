package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.booking.BookingDtos.PaymentRequest;
import com.quickstay.config.PageQuery;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** /api/bookings: can dang nhap; dat phong chi danh cho CUSTOMER (SecurityConfig). */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingView create(Authentication auth, @Valid @RequestBody BookingRequest req) {
        return bookings.create(auth.getName(), req);
    }

    /** POST /api/bookings/{id}/pay: thanh toan truc tuyen gia lap cho don cua minh. */
    @PostMapping("/{id}/pay")
    public BookingView pay(Authentication auth, @PathVariable Long id, @Valid @RequestBody PaymentRequest req) {
        return bookings.pay(auth.getName(), id, req);
    }

    /** GET /api/bookings/me: lich su dat phong cua toi, moi nhat truoc; them page, size thi tra theo trang. */
    @GetMapping("/me")
    public Object mine(Authentication auth, @Valid PageQuery paging) {
        return paging.requested() ? bookings.mine(auth.getName(), paging.toPageable()) : bookings.mine(auth.getName());
    }

    /** PATCH /api/bookings/{id}/cancel: khach tu huy don cua minh khi con PENDING. */
    @PatchMapping("/{id}/cancel")
    public BookingView cancel(Authentication auth, @PathVariable Long id) {
        return bookings.cancel(auth.getName(), id);
    }
}
