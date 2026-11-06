package com.quickstay.admin;

import com.quickstay.hotel.Hotel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request/Response DTO cho cac API quan ly khach san cua Admin (T082).
 * Su dung record nhat quan voi AuthDtos.java.
 */
public final class HotelAdminDtos {

    private HotelAdminDtos() {}

    /**
     * Body cho POST /api/admin/hotels va PUT /api/admin/hotels/{id}.
     * name va city bat buoc; cac truong con lai tuy chon.
     */
    public record HotelRequest(
            @NotBlank(message = "Ten khach san khong duoc de trong")
            @Size(max = 255, message = "Ten khach san khong qua 255 ky tu")
            String name,

            @NotBlank(message = "Thanh pho khong duoc de trong")
            @Size(max = 255, message = "Thanh pho khong qua 255 ky tu")
            String city,

            @Size(max = 255, message = "Dia chi khong qua 255 ky tu")
            String address,

            @Size(max = 4000, message = "Mo ta khong qua 4000 ky tu")
            String description,

            @Size(max = 1000, message = "URL anh khong qua 1000 ky tu")
            String imageUrl,

            @Size(max = 1000, message = "Tien nghi khong qua 1000 ky tu")
            String amenities
    ) {
        /** Trim cac truong String de tranh luu khoang trang thua. */
        public HotelRequest {
            name        = name        == null ? null : name.trim();
            city        = city        == null ? null : city.trim();
            address     = address     == null || address.isBlank()     ? null : address.trim();
            description = description == null || description.isBlank() ? null : description.trim();
            imageUrl    = imageUrl    == null || imageUrl.isBlank()    ? null : imageUrl.trim();
            amenities   = amenities   == null || amenities.isBlank()   ? null : amenities.trim();
        }
    }

    /**
     * Response tra ve sau POST (201) va PUT (200).
     * Phan anh day du cac truong cua Hotel entity.
     */
    public record HotelResponse(
            Long id,
            String name,
            String city,
            String address,
            String description,
            String imageUrl,
            String amenities
    ) {
        public static HotelResponse of(Hotel h) {
            return new HotelResponse(
                    h.getId(),
                    h.getName(),
                    h.getCity(),
                    h.getAddress(),
                    h.getDescription(),
                    h.getImageUrl(),
                    h.getAmenities()
            );
        }
    }
}
