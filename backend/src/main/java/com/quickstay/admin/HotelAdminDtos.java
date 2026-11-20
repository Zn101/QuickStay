package com.quickstay.admin;

import com.quickstay.hotel.Hotel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request/Response DTO cho cac API quan ly khach san cua Admin (T082) va doi tac (/api/partner/hotel).
 * Su dung record nhat quan voi AuthDtos.java.
 */
public final class HotelAdminDtos {

    private HotelAdminDtos() {}

    /**
     * Body cho POST /api/admin/hotels, PUT /api/admin/hotels/{id} va PUT /api/partner/hotel.
     * name va city bat buoc; cac truong con lai tuy chon.
     * Cac truong noi dung trang chi tiet (gallery ... attractions): null = giu nguyen, chuoi rong = xoa,
     * de form cu chi gui thong tin co ban khong vo tinh xoa noi dung doi tac da nhap.
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
            String amenities,

            @Size(max = 4000, message = "Thu vien anh khong qua 4000 ky tu")
            String gallery,

            @Size(max = 5) String checkInTime,
            @Size(max = 5) String checkOutTime,

            @Size(max = 4000, message = "Quy dinh khong qua 4000 ky tu")
            String houseRules,

            @Size(max = 255) String airportName,

            @Size(max = 2000, message = "Dua don san bay khong qua 2000 ky tu")
            String transfers,

            @Size(max = 2000, message = "Am thuc khong qua 2000 ky tu")
            String dining,

            @Size(max = 2000, message = "Diem tham quan khong qua 2000 ky tu")
            String attractions
    ) {
        /** Trim cac truong String de tranh luu khoang trang thua. */
        public HotelRequest {
            name        = name        == null ? null : name.trim();
            city        = city        == null ? null : city.trim();
            address     = address     == null || address.isBlank()     ? null : address.trim();
            description = description == null || description.isBlank() ? null : description.trim();
            imageUrl    = imageUrl    == null || imageUrl.isBlank()    ? null : imageUrl.trim();
            amenities   = amenities   == null || amenities.isBlank()   ? null : amenities.trim();
            checkInTime  = checkInTime  == null ? null : checkInTime.trim();
            checkOutTime = checkOutTime == null ? null : checkOutTime.trim();
            airportName  = airportName  == null ? null : airportName.trim();
        }

        /** Chi thong tin co ban (giu nguyen noi dung trang chi tiet). */
        public HotelRequest(String name, String city, String address, String description, String imageUrl, String amenities) {
            this(name, city, address, description, imageUrl, amenities, null, null, null, null, null, null, null, null);
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
            String amenities,
            String gallery,
            String checkInTime,
            String checkOutTime,
            String houseRules,
            String airportName,
            String transfers,
            String dining,
            String attractions
    ) {
        public static HotelResponse of(Hotel h) {
            return new HotelResponse(
                    h.getId(),
                    h.getName(),
                    h.getCity(),
                    h.getAddress(),
                    h.getDescription(),
                    h.getImageUrl(),
                    h.getAmenities(),
                    h.getGallery(),
                    h.getCheckInTime(),
                    h.getCheckOutTime(),
                    h.getHouseRules(),
                    h.getAirportName(),
                    h.getTransfers(),
                    h.getDining(),
                    h.getAttractions()
            );
        }
    }
}
