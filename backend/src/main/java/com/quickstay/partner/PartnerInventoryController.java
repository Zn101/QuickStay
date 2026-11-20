package com.quickstay.partner;

import com.quickstay.admin.RoomAdminDtos.RoomRequest;
import com.quickstay.admin.RoomAdminDtos.RoomResponse;
import com.quickstay.admin.RoomAdminService;
import com.quickstay.config.ApiException;
import com.quickstay.partner.PartnerInventoryService.CalendarView;
import com.quickstay.partner.PartnerInventoryService.ClosureRequest;
import com.quickstay.partner.PartnerInventoryService.ClosureView;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Doi tac khach san tu quan ly loai phong (gia, suc chua, so luong, anh, tien nghi) va lich phong.
 * HOTEL_MANAGER luon thao tac tren co so duoc gan; ADMIN phai chi ro ?hotelId=.
 */
@RestController
@RequestMapping("/api/partner")
public class PartnerInventoryController {

    private final UserRepository users;
    private final RoomAdminService roomService;
    private final PartnerInventoryService inventory;

    public PartnerInventoryController(UserRepository users, RoomAdminService roomService,
                                      PartnerInventoryService inventory) {
        this.users = users;
        this.roomService = roomService;
        this.inventory = inventory;
    }

    private Long hotelOf(Authentication auth, Long requested) {
        User u = users.findByEmail(auth.getName())
                .orElseThrow(() -> ApiException.unauthorized("Tài khoản không tồn tại"));
        if (u.getRole() == Role.ADMIN) {
            if (requested == null) {
                throw ApiException.badRequest("Quản trị viên cần chỉ định cơ sở qua ?hotelId=");
            }
            return requested;
        }
        if (u.getHotelId() == null) {
            throw ApiException.notFound("Tài khoản chưa được gán cơ sở lưu trú");
        }
        return u.getHotelId();
    }

    @GetMapping("/rooms")
    public List<RoomResponse> rooms(Authentication auth, @RequestParam(required = false) Long hotelId) {
        return roomService.listForHotel(hotelOf(auth, hotelId));
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse createRoom(Authentication auth, @RequestParam(required = false) Long hotelId,
                                   @Valid @RequestBody RoomRequest req) {
        return roomService.createForHotel(hotelOf(auth, hotelId), req);
    }

    @PutMapping("/rooms/{id}")
    public RoomResponse updateRoom(Authentication auth, @RequestParam(required = false) Long hotelId,
                                   @PathVariable Long id, @Valid @RequestBody RoomRequest req) {
        return roomService.updateForHotel(hotelOf(auth, hotelId), id, req);
    }

    @DeleteMapping("/rooms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(Authentication auth, @RequestParam(required = false) Long hotelId, @PathVariable Long id) {
        roomService.deleteForHotel(hotelOf(auth, hotelId), id);
    }

    @GetMapping("/calendar")
    public CalendarView calendar(Authentication auth, @RequestParam(required = false) Long hotelId,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                 @RequestParam(defaultValue = "14") int days) {
        return inventory.calendar(hotelOf(auth, hotelId), from, days);
    }

    @GetMapping("/closures")
    public List<ClosureView> closures(Authentication auth, @RequestParam(required = false) Long hotelId) {
        return inventory.closures(hotelOf(auth, hotelId));
    }

    @PostMapping("/closures")
    @ResponseStatus(HttpStatus.CREATED)
    public ClosureView close(Authentication auth, @RequestParam(required = false) Long hotelId,
                             @Valid @RequestBody ClosureRequest req) {
        return inventory.close(hotelOf(auth, hotelId), req);
    }

    @DeleteMapping("/closures/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reopen(Authentication auth, @RequestParam(required = false) Long hotelId, @PathVariable Long id) {
        inventory.reopen(hotelOf(auth, hotelId), id);
    }
}
