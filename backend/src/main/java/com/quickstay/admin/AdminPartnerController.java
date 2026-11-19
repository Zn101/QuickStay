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
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Quan ly tai khoan doi tac Khach san / Homestay danh cho ADMIN (/api/admin/partners).
 */
@RestController
@RequestMapping("/api/admin/partners")
public class AdminPartnerController {

    private final UserRepository users;
    private final HotelRepository hotels;
    private final PasswordEncoder encoder;

    public AdminPartnerController(UserRepository users, HotelRepository hotels, PasswordEncoder encoder) {
        this.users = users;
        this.hotels = hotels;
        this.encoder = encoder;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PartnerView> list() {
        List<User> partners = users.findByRole(Role.HOTEL_MANAGER);
        Map<Long, Hotel> hotelMap = hotels.findAll().stream().collect(Collectors.toMap(Hotel::getId, h -> h));

        return partners.stream().map(u -> {
            Hotel h = u.getHotelId() != null ? hotelMap.get(u.getHotelId()) : null;
            return PartnerView.of(u, h != null ? h.getName() : null, h != null ? h.getCity() : null);
        }).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PartnerView create(@Valid @RequestBody CreatePartnerRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("Email đã được sử dụng trong hệ thống");
        }

        Hotel hotel = hotels.findById(req.hotelId())
                .orElseThrow(() -> ApiException.badRequest("Không tìm thấy cơ sở lưu trú với ID: " + req.hotelId()));

        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFullName(req.fullName().trim());
        u.setPhone(req.phone() != null ? req.phone().trim() : null);
        u.setRole(Role.HOTEL_MANAGER);
        u.setHotelId(hotel.getId());
        u.setEmailVerified(true);
        users.save(u);

        return PartnerView.of(u, hotel.getName(), hotel.getCity());
    }

    @PutMapping("/{id}")
    @Transactional
    public PartnerView update(@PathVariable Long id, @RequestBody UpdatePartnerRequest req) {
        User u = users.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản đối tác"));

        if (u.getRole() != Role.HOTEL_MANAGER) {
            throw ApiException.badRequest("Tài khoản này không phải là đối tác Khách sạn / Homestay");
        }

        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName().trim());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone().trim());
        }
        if (req.hotelId() != null) {
            Hotel hotel = hotels.findById(req.hotelId())
                    .orElseThrow(() -> ApiException.badRequest("Không tìm thấy cơ sở lưu trú"));
            u.setHotelId(hotel.getId());
        }
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 6 || req.password().length() > 72) {
                throw ApiException.badRequest("Mật khẩu mới phải từ 6 đến 72 ký tự");
            }
            u.setPasswordHash(encoder.encode(req.password()));
        }
        users.save(u);

        Hotel h = u.getHotelId() != null ? hotels.findById(u.getHotelId()).orElse(null) : null;
        return PartnerView.of(u, h != null ? h.getName() : null, h != null ? h.getCity() : null);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        User u = users.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản đối tác"));
        if (u.getRole() != Role.HOTEL_MANAGER) {
            throw ApiException.badRequest("Chỉ được xóa tài khoản đối tác");
        }
        users.delete(u);
    }
}
