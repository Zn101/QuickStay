package com.quickstay.admin;

import com.quickstay.admin.HotelAdminDtos.HotelRequest;
import com.quickstay.admin.HotelAdminDtos.HotelResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API quan ly khach san danh rieng cho ADMIN (T082, T083).
 * Phan quyen duoc xu ly tai SecurityConfig (/api/admin/** requires ROLE_ADMIN).
 * Khong chua logic nghiep vu – chi uy quyen cho HotelAdminService.
 */
@RestController
@RequestMapping("/api/admin/hotels")
public class HotelAdminController {

    private final HotelAdminService hotelAdminService;

    public HotelAdminController(HotelAdminService hotelAdminService) {
        this.hotelAdminService = hotelAdminService;
    }

    /**
     * GET /api/admin/hotels – Lay danh sach tat ca khach san (T083).
     * Yeu cau: ADMIN role.
     * Thanh cong: 200 OK + danh sach HotelResponse.
     */
    @GetMapping
    public List<HotelResponse> list() {
        return hotelAdminService.list();
    }

    /**
     * POST /api/admin/hotels – Them moi khach san (T082).
     * Yeu cau: ADMIN role, body hop le.
     * Thanh cong: 201 Created + HotelResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HotelResponse create(@Valid @RequestBody HotelRequest req) {
        return hotelAdminService.create(req);
    }

    /**
     * PUT /api/admin/hotels/{id} – Cap nhat thong tin khach san (T082).
     * Yeu cau: ADMIN role, id ton tai, body hop le.
     * Thanh cong: 200 OK + HotelResponse.
     * That bai: 404 neu id khong ton tai.
     */
    @PutMapping("/{id}")
    public HotelResponse update(@PathVariable Long id, @Valid @RequestBody HotelRequest req) {
        return hotelAdminService.update(id, req);
    }

    /**
     * DELETE /api/admin/hotels/{id} – Xoa khach san (T083).
     * Yeu cau: ADMIN role, id ton tai, khong co don dat phong dang hoat dong.
     * Thanh cong: 204 No Content.
     * That bai: 404 neu id khong ton tai; 409 neu con don PENDING/CONFIRMED/CHECKED_IN.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        hotelAdminService.delete(id);
    }
}
