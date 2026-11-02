package com.quickstay.hotel;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public final class HotelDtos {

    private HotelDtos() {}

    public record HotelView(Long id, String name, String city, String address, String description,
                            String imageUrl, String amenities, BigDecimal minPrice) {
        public static HotelView of(Hotel h, BigDecimal minPrice) {
            return new HotelView(h.getId(), h.getName(), h.getCity(), h.getAddress(), h.getDescription(),
                    h.getImageUrl(), h.getAmenities(), minPrice);
        }
    }

    /** available = so phong con trong trong khoang ngay da chon (null neu khong chon ngay). */
    public record RoomView(Long id, Long hotelId, String roomType, BigDecimal pricePerNight, int capacity,
                           int quantity, String description, Integer available) {
        public static RoomView of(Room r, Integer available) {
            return new RoomView(r.getId(), r.getHotel().getId(), r.getRoomType(), r.getPricePerNight(),
                    r.getCapacity(), r.getQuantity(), r.getDescription(), available);
        }
    }

    public record HotelRequest(@NotBlank String name, @NotBlank String city, String address,
                               String description, String imageUrl, String amenities) {}

    public record RoomRequest(@NotNull Long hotelId, @NotBlank String roomType,
                              @NotNull @Min(0) BigDecimal pricePerNight,
                              @Min(1) int capacity, @Min(1) int quantity, String description) {}
}
