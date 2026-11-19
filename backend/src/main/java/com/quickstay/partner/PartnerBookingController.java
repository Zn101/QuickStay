package com.quickstay.partner;

import com.quickstay.admin.HotelAdminDtos.HotelRequest;
import com.quickstay.admin.HotelAdminDtos.HotelResponse;
import com.quickstay.admin.HotelAdminService;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.booking.BookingService;
import com.quickstay.booking.BookingStatus;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Cổng tiếp nhận và xử lý đơn đặt phòng và thông tin cơ sở lưu trú dành cho đối tác Khách sạn / Homestay (/api/partner/**).
 */
@RestController
@RequestMapping("/api/partner")
public class PartnerBookingController {

    private final BookingService bookingService;
    private final UserRepository users;
    private final HotelRepository hotels;
    private final HotelAdminService hotelAdminService;

    public PartnerBookingController(BookingService bookingService,
                                    UserRepository users,
                                    HotelRepository hotels,
                                    HotelAdminService hotelAdminService) {
        this.bookingService = bookingService;
        this.users = users;
        this.hotels = hotels;
        this.hotelAdminService = hotelAdminService;
    }

    private User currentUser(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> ApiException.unauthorized("Tài khoản không tồn tại"));
    }

    @GetMapping("/hotel")
    @Transactional(readOnly = true)
    public Hotel getMyHotel(Authentication auth) {
        User u = currentUser(auth);
        if (u.getRole() == Role.ADMIN) {
            return hotels.findAll().stream().findFirst().orElse(null);
        }
        if (u.getHotelId() == null) {
            throw ApiException.notFound("Tài khoản chưa được gán cơ sở lưu trú");
        }
        return hotels.findById(u.getHotelId())
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy cơ sở lưu trú tương ứng"));
    }

    @PutMapping("/hotel")
    public HotelResponse updateMyHotel(
            Authentication auth,
            @Valid @RequestBody HotelRequest req) {
        User u = currentUser(auth);
        Long hotelId = u.getHotelId();
        if (u.getRole() == Role.ADMIN) {
            if (hotelId == null) {
                hotelId = hotels.findAll().stream().findFirst()
                        .map(Hotel::getId)
                        .orElseThrow(() -> ApiException.notFound("Không có cơ sở lưu trú nào"));
            }
        } else if (hotelId == null) {
            throw ApiException.notFound("Tài khoản chưa được gán cơ sở lưu trú");
        }
        return hotelAdminService.update(hotelId, req);
    }

    @PutMapping("/hotel/{id}")
    public HotelResponse updateHotelById(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody HotelRequest req) {
        User u = currentUser(auth);
        if (u.getRole() != Role.ADMIN && (u.getHotelId() == null || !u.getHotelId().equals(id))) {
            throw ApiException.forbidden("Bạn chỉ có quyền chỉnh sửa cơ sở lưu trú được phân công");
        }
        return hotelAdminService.update(id, req);
    }

    @GetMapping("/bookings")
    @Transactional(readOnly = true)
    public List<BookingView> getMyBookings(Authentication auth) {
        User u = currentUser(auth);
        if (u.getRole() == Role.ADMIN) {
            return bookingService.all();
        }
        if (u.getHotelId() == null) {
            return List.of();
        }
        return bookingService.forHotel(u.getHotelId());
    }

    @PatchMapping("/bookings/{id}/status")
    public BookingView updateBookingStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw ApiException.badRequest("Trạng thái không được để trống");
        }
        BookingStatus status;
        try {
            status = BookingStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Trạng thái không hợp lệ: " + statusStr);
        }

        User u = currentUser(auth);
        Long partnerHotelId = u.getRole() == Role.ADMIN ? null : u.getHotelId();
        return bookingService.changeStatusForPartner(id, status, partnerHotelId);
    }
}
