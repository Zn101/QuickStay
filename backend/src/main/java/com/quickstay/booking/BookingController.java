package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
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
}
