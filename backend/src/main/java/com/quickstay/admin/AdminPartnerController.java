package com.quickstay.admin;

import com.quickstay.admin.PartnerDtos.CreatePartnerRequest;
import com.quickstay.admin.PartnerDtos.PartnerView;
import com.quickstay.admin.PartnerDtos.UpdatePartnerRequest;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import com.quickstay.venue.VenueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Quan ly tai khoan doi tac ben thu ba danh cho ADMIN (/api/admin/partners):
 * Khach san / Homestay (HOTEL_MANAGER), Chu nha hang (RESTAURANT_OWNER), Chu tour / khu du lich (TOUR_OPERATOR).
 */
@RestController
@RequestMapping("/api/admin/partners")
public class AdminPartnerController {

    private final UserRepository users;
    private final HotelRepository hotels;
    private final PasswordEncoder encoder;
    private final VenueService venues;

    public AdminPartnerController(UserRepository users, HotelRepository hotels, PasswordEncoder encoder,
                                  VenueService venues) {
        this.users = users;
        this.hotels = hotels;
        this.encoder = encoder;
        this.venues = venues;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PartnerView> list() {
        Map<Long, Hotel> hotelMap = hotels.findAll().stream().collect(Collectors.toMap(Hotel::getId, h -> h));
        return Stream.of(Role.HOTEL_MANAGER, Role.RESTAURANT_OWNER, Role.TOUR_OPERATOR)
                .flatMap(role -> users.findByRole(role).stream())
                .map(u -> view(u, u.getHotelId() == null ? null : hotelMap.get(u.getHotelId())))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PartnerView create(@Valid @RequestBody CreatePartnerRequest req) {
        Role role = req.role() == null ? Role.HOTEL_MANAGER : req.role();
        if (!role.isPartner()) {
            throw ApiException.badRequest("Vai trò đối tác không hợp lệ");
        }
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("Email đã được sử dụng trong hệ thống");
        }

        Hotel hotel = null;
        if (role == Role.HOTEL_MANAGER) {
            if (req.hotelId() == null) {
                throw ApiException.badRequest("Cần chọn cơ sở lưu trú cho đối tác Khách sạn / Homestay");
            }
            hotel = hotels.findById(req.hotelId())
                    .orElseThrow(() -> ApiException.badRequest("Không tìm thấy cơ sở lưu trú với ID: " + req.hotelId()));
        } else if (req.listingIds() == null || req.listingIds().isEmpty()) {
            throw ApiException.badRequest(role == Role.RESTAURANT_OWNER
                    ? "Cần chọn ít nhất một nhà hàng cho chủ nhà hàng"
                    : "Cần chọn ít nhất một tour cho đơn vị tổ chức tour");
        }

        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFullName(req.fullName().trim());
        u.setPhone(req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null);
        u.setRole(role);
        u.setHotelId(hotel != null ? hotel.getId() : null);
        u.setEmailVerified(true);
        users.save(u);

        if (role != Role.HOTEL_MANAGER) {
            venues.assignListings(u, req.listingIds());
        }
        return view(u, hotel);
    }

    @PutMapping("/{id}")
    @Transactional
    public PartnerView update(@PathVariable Long id, @Valid @RequestBody UpdatePartnerRequest req) {
        User u = users.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản đối tác"));
        if (!u.getRole().isPartner()) {
            throw ApiException.badRequest("Tài khoản này không phải là tài khoản đối tác");
        }

        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName().trim());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone().isBlank() ? null : req.phone().trim());
        }
        if (req.hotelId() != null) {
            if (u.getRole() != Role.HOTEL_MANAGER) {
                throw ApiException.badRequest("Chỉ đối tác Khách sạn / Homestay mới được gán cơ sở lưu trú");
            }
            Hotel hotel = hotels.findById(req.hotelId())
                    .orElseThrow(() -> ApiException.badRequest("Không tìm thấy cơ sở lưu trú"));
            u.setHotelId(hotel.getId());
        }
        if (req.listingIds() != null) {
            if (u.getRole() == Role.HOTEL_MANAGER) {
                throw ApiException.badRequest("Đối tác Khách sạn / Homestay dùng hotelId, không dùng listingIds");
            }
            venues.assignListings(u, req.listingIds());
        }
        if (req.password() != null && !req.password().isBlank()) {
            // Gioi han 72 byte (bcrypt) da kiem tra bang @MaxUtf8Bytes
            if (req.password().length() < 6) {
                throw ApiException.badRequest("Mật khẩu mới tối thiểu 6 ký tự");
            }
            u.setPasswordHash(encoder.encode(req.password()));
            // Đăng xuất mọi phiên cũ của đối tác
            u.setTokensValidAfter(Instant.now().truncatedTo(ChronoUnit.SECONDS));
        }
        users.save(u);

        Hotel h = u.getHotelId() != null ? hotels.findById(u.getHotelId()).orElse(null) : null;
        return view(u, h);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        User u = users.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản đối tác"));
        if (!u.getRole().isPartner()) {
            throw ApiException.badRequest("Chỉ được xóa tài khoản đối tác");
        }
        // Gỡ chủ sở hữu khỏi nhà hàng / tour trước khi xoá (cơ sở vẫn hiển thị, chờ gán đối tác mới)
        venues.assignListings(u, List.of());
        users.delete(u);
    }

    private PartnerView view(User u, Hotel h) {
        return PartnerView.of(u, h != null ? h.getName() : null, h != null ? h.getCity() : null, venues.listingsOf(u));
    }
}
