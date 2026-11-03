package com.quickstay.admin;

import com.quickstay.admin.RoomAdminDtos.RoomRequest;
import com.quickstay.admin.RoomAdminDtos.RoomResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API quan ly loai phong danh rieng cho ADMIN (T094, T095).
 * Phan quyen duoc xu ly tai SecurityConfig (/api/admin/** requires ROLE_ADMIN).
 * Khong chua logic nghiep vu – chi uy quyen cho RoomAdminService.
 */
@RestController
@RequestMapping("/api/admin/rooms")
public class RoomAdminController {

    private final RoomAdminService roomAdminService;

    public RoomAdminController(RoomAdminService roomAdminService) {
        this.roomAdminService = roomAdminService;
    }

    /**
     * GET /api/admin/rooms – Lay danh sach tat ca loai phong (T095).
     * Yeu cau: ADMIN role.
     * Thanh cong: 200 OK + List<RoomResponse>.
     */
    @GetMapping
    public List<RoomResponse> list() {
        return roomAdminService.list();
    }

    /**
     * POST /api/admin/rooms – Them loai phong moi (T094).
     * Yeu cau: ADMIN role, body hop le, hotelId ton tai.
     * Thanh cong: 201 Created + RoomResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@Valid @RequestBody RoomRequest req) {
        return roomAdminService.create(req);
    }

    /**
     * PUT /api/admin/rooms/{id} – Cap nhat loai phong (T094).
     * Yeu cau: ADMIN role, id ton tai, body hop le, hotelId ton tai.
     * Thanh cong: 200 OK + RoomResponse.
     * That bai: 404 neu id hoac hotelId khong ton tai.
     */
    @PutMapping("/{id}")
    public RoomResponse update(@PathVariable Long id, @Valid @RequestBody RoomRequest req) {
        return roomAdminService.update(id, req);
    }

    /**
     * DELETE /api/admin/rooms/{id} – Xoa loai phong (T095).
     * Yeu cau: ADMIN role, id ton tai, khong co don dat phong nao.
     * Thanh cong: 204 No Content.
     * That bai: 404 neu id khong ton tai; 409 neu con bat ky booking nao.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        roomAdminService.delete(id);
    }
}
