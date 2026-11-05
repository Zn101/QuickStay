package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    /** GET /api/bookings/me: lich su dat phong cua toi, moi nhat truoc. */
    @GetMapping("/me")
    public List<BookingView> mine(Authentication auth) {
        return bookings.mine(auth.getName());
    }

    /** PATCH /api/bookings/{id}/cancel: khach tu huy don cua minh khi con PENDING. */
    @PatchMapping("/{id}/cancel")
    public BookingView cancel(Authentication auth, @PathVariable Long id) {
        return bookings.cancel(auth.getName(), id);
    }
}
