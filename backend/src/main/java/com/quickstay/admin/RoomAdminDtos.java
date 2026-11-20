package com.quickstay.admin;

import com.quickstay.hotel.Room;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request/Response DTO cho API quan ly loai phong cua Admin (T094) va doi tac (/api/partner/rooms).
 * Su dung record nhat quan voi BookingDtos.java.
 */
public final class RoomAdminDtos {

    private RoomAdminDtos() {}

    /**
     * Body cho POST /api/admin/rooms va PUT /api/admin/rooms/{id} (doi tac: hotelId bi bo qua, luon la co so cua minh).
     * Validate hinh thuc o day; quy tac ton tai hotel o RoomAdminService.
     * areaSqm / bedInfo / amenities / imageUrls: null = giu nguyen khi cap nhat, chuoi rong = xoa.
     */
    public record RoomRequest(
            Long hotelId,

            @NotBlank(message = "Loai phong khong duoc de trong")
            @Size(max = 255, message = "Loai phong khong qua 255 ky tu")
            String roomType,

            @NotNull(message = "Gia phong khong duoc de trong")
            @DecimalMin(value = "0", message = "Gia phong phai lon hon hoac bang 0")
            BigDecimal pricePerNight,

            @NotNull(message = "Suc chua khong duoc de trong")
            @Min(value = 1, message = "Suc chua toi thieu la 1 khach")
            @Max(value = 50, message = "Suc chua toi da 50 khach")
            Integer capacity,

            @NotNull(message = "So luong phong khong duoc de trong")
            @Min(value = 1, message = "So luong phong toi thieu la 1")
            @Max(value = 1000, message = "So luong phong toi da 1000")
            Integer quantity,

            @Size(max = 2000, message = "Mo ta khong qua 2000 ky tu")
            String description,

            @Min(value = 1, message = "Dien tich toi thieu 1 m2")
            @Max(value = 5000, message = "Dien tich toi da 5000 m2")
            Integer areaSqm,

            @Size(max = 255, message = "Thong tin giuong khong qua 255 ky tu")
            String bedInfo,

            @Size(max = 1000, message = "Tien nghi phong khong qua 1000 ky tu")
            String amenities,

            @Size(max = 4000, message = "Danh sach anh khong qua 4000 ky tu")
            String imageUrls
    ) {
        public RoomRequest {
            roomType    = roomType    == null ? null : roomType.trim();
            description = description == null || description.isBlank() ? null : description.trim();
            bedInfo     = bedInfo     == null ? null : bedInfo.trim();
            amenities   = amenities   == null ? null : amenities.trim();
        }

        /** Chi thong tin co ban (giu nguyen dien tich, giuong, tien nghi, anh). */
        public RoomRequest(Long hotelId, String roomType, BigDecimal pricePerNight, Integer capacity,
                           Integer quantity, String description) {
            this(hotelId, roomType, pricePerNight, capacity, quantity, description, null, null, null, null);
        }
    }

    /**
     * Response tra ve sau POST (201) va PUT (200).
     * Nhat quan voi RoomView de Frontend khong can xu ly 2 format khac nhau.
     */
    public record RoomResponse(
            Long id,
            Long hotelId,
            String roomType,
            BigDecimal pricePerNight,
            int capacity,
            int quantity,
            String description,
            Integer areaSqm,
            String bedInfo,
            String amenities,
            String imageUrls
    ) {
        public static RoomResponse of(Room r) {
            return new RoomResponse(
                    r.getId(),
                    r.getHotel().getId(),
                    r.getRoomType(),
                    r.getPricePerNight(),
                    r.getCapacity(),
                    r.getQuantity(),
                    r.getDescription(),
                    r.getAreaSqm(),
                    r.getBedInfo(),
                    r.getAmenities(),
                    r.getImageUrls()
            );
        }
    }
}
