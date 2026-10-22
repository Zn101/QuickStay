package com.quickstay.booking;

import com.quickstay.booking.BookingDtos.BookingRequest;
import com.quickstay.booking.BookingDtos.BookingView;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingView create(Authentication auth, @Valid @RequestBody BookingRequest req) {
        return service.create(auth.getName(), req);
    }

    @GetMapping("/me")
    public List<BookingView> mine(Authentication auth) {
        return service.mine(auth.getName());
    }

    @PatchMapping("/{id}/cancel")
    public BookingView cancel(Authentication auth, @PathVariable Long id) {
        return service.cancel(auth.getName(), id);
    }
}
