package com.quickstay.admin;

import com.quickstay.hotel.Room;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request/Response DTO cho API quan ly loai phong cua Admin (T094).
 * Su dung record nhat quan voi BookingDtos.java.
 */
public final class RoomAdminDtos {

    private RoomAdminDtos() {}

    /**
     * Body cho POST /api/admin/rooms va PUT /api/admin/rooms/{id}.
     * Validate hinh thuc o day; quy tac ton tai hotel o RoomAdminService.
     */
    public record RoomRequest(
            @NotNull(message = "hotelId khong duoc de trong")
            Long hotelId,

            @NotBlank(message = "Loai phong khong duoc de trong")
            @Size(max = 255, message = "Loai phong khong qua 255 ky tu")
            String roomType,

            @NotNull(message = "Gia phong khong duoc de trong")
            @DecimalMin(value = "0", message = "Gia phong phai lon hon hoac bang 0")
            BigDecimal pricePerNight,

            @NotNull(message = "Suc chua khong duoc de trong")
            @Min(value = 1, message = "Suc chua toi thieu la 1 khach")
            Integer capacity,

            @NotNull(message = "So luong phong khong duoc de trong")
            @Min(value = 1, message = "So luong phong toi thieu la 1")
            Integer quantity,

            @Size(max = 2000, message = "Mo ta khong qua 2000 ky tu")
            String description
    ) {
        public RoomRequest {
            roomType    = roomType    == null ? null : roomType.trim();
            description = description == null || description.isBlank() ? null : description.trim();
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
            String description
    ) {
        public static RoomResponse of(Room r) {
            return new RoomResponse(
                    r.getId(),
                    r.getHotel().getId(),
                    r.getRoomType(),
                    r.getPricePerNight(),
                    r.getCapacity(),
                    r.getQuantity(),
                    r.getDescription()
            );
        }
    }
}
