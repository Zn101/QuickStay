package com.quickstay.admin;

import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.booking.BookingService;
import com.quickstay.booking.BookingStatus;
import com.quickstay.config.ApiException;
import com.quickstay.config.PageQuery;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API quan ly don dat phong danh rieng cho ADMIN (T106, T107).
 * /api/admin/** duoc bao ve boi SecurityConfig (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/bookings")
public class BookingAdminController {

    private final BookingService bookingService;

    public BookingAdminController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * GET /api/admin/bookings - Danh sach tat ca don dat phong, moi nhat truoc.
     */
    @GetMapping
    public Object list(@Valid PageQuery paging) {
        return paging.requested() ? bookingService.all(paging.toPageable()) : bookingService.all();
    }

    /**
     * PATCH /api/admin/bookings/{id}/status - Cap nhat trang thai don dat phong.
     */
    @PatchMapping("/{id}/status")
    public BookingView updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw ApiException.badRequest("Trang thai khong duoc de trong");
        }
        try {
            BookingStatus status = BookingStatus.valueOf(statusStr.trim().toUpperCase());
            return bookingService.changeStatus(id, status);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Trang thai khong hop le: " + statusStr);
        }
    }
}

