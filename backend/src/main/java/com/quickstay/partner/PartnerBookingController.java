package com.quickstay.partner;

import com.quickstay.admin.HotelAdminDtos.HotelRequest;
import com.quickstay.admin.HotelAdminDtos.HotelResponse;
import com.quickstay.admin.HotelAdminService;
import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.booking.BookingService;
import com.quickstay.booking.BookingStatus;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.extras.HotelExtrasService;
import com.quickstay.hotel.extras.HotelExtrasService.AnswerQuestionRequest;
import com.quickstay.hotel.extras.HotelExtrasService.QuestionView;
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
 * Cổng tiếp nhận và xử lý đơn đặt phòng, thông tin cơ sở và hỏi đáp dành cho đối tác Khách sạn / Homestay (/api/partner/**).
 */
@RestController
@RequestMapping("/api/partner")
public class PartnerBookingController {

    private final BookingService bookingService;
    private final UserRepository users;
    private final HotelRepository hotels;
    private final HotelAdminService hotelAdminService;
    private final HotelExtrasService extras;

    public PartnerBookingController(BookingService bookingService,
                                    UserRepository users,
                                    HotelRepository hotels,
                                    HotelAdminService hotelAdminService,
                                    HotelExtrasService extras) {
        this.bookingService = bookingService;
        this.users = users;
        this.hotels = hotels;
        this.hotelAdminService = hotelAdminService;
        this.extras = extras;
    }

    private User currentUser(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> ApiException.unauthorized("Tài khoản không tồn tại"));
    }

    /**
     * Cơ sở của đối tác. ADMIN (không gắn cơ sở) có thể chỉ định ?hotelId=; bỏ trống thì xem cơ sở đầu tiên (chỉ đọc).
     * Trả DTO, không trả entity JPA.
     */
    @GetMapping("/hotel")
    @Transactional(readOnly = true)
    public HotelResponse getMyHotel(Authentication auth, @RequestParam(required = false) Long hotelId) {
        User u = currentUser(auth);
        if (u.getRole() == Role.ADMIN) {
            var hotel = hotelId != null
                    ? hotels.findById(hotelId)
                    : hotels.findAll().stream().findFirst();
            return hotel.map(HotelResponse::of)
                    .orElseThrow(() -> ApiException.notFound("Không tìm thấy cơ sở lưu trú"));
        }
        if (u.getHotelId() == null) {
            throw ApiException.notFound("Tài khoản chưa được gán cơ sở lưu trú");
        }
        return hotels.findById(u.getHotelId())
                .map(HotelResponse::of)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy cơ sở lưu trú tương ứng"));
    }

    /** Đối tác cập nhật cơ sở được gán. ADMIN phải chỉ rõ cơ sở qua PUT /api/partner/hotel/{id}. */
    @PutMapping("/hotel")
    public HotelResponse updateMyHotel(
            Authentication auth,
            @Valid @RequestBody HotelRequest req) {
        User u = currentUser(auth);
        if (u.getRole() == Role.ADMIN && u.getHotelId() == null) {
            throw ApiException.badRequest("Quản trị viên cần chỉ định cơ sở: dùng PUT /api/partner/hotel/{id}");
        }
        if (u.getHotelId() == null) {
            throw ApiException.notFound("Tài khoản chưa được gán cơ sở lưu trú");
        }
        return hotelAdminService.update(u.getHotelId(), req);
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
        if (u.getRole() != Role.ADMIN && u.getHotelId() == null) {
            // Không có cơ sở thì không có quyền trên đơn nào (không để null bỏ qua kiểm tra sở hữu)
            throw ApiException.forbidden("Tài khoản chưa được gán cơ sở lưu trú");
        }
        Long partnerHotelId = u.getRole() == Role.ADMIN ? null : u.getHotelId();
        return bookingService.changeStatusForPartner(id, status, partnerHotelId);
    }

    /** Câu hỏi của khách về cơ sở do đối tác phụ trách. */
    @GetMapping("/questions")
    public List<QuestionView> myQuestions(Authentication auth) {
        return extras.questionsForPartner(auth.getName());
    }

    /** Đối tác trả lời câu hỏi thuộc cơ sở của mình. */
    @PatchMapping("/questions/{qid}")
    public QuestionView answerQuestion(Authentication auth, @PathVariable Long qid,
                                       @Valid @RequestBody AnswerQuestionRequest req) {
        return extras.answerQuestionAsPartner(qid, auth.getName(), req);
    }
}
