package com.quickstay.hotel;

import java.math.BigDecimal;

/**
 * Mot loai phong trong GET /api/hotels/{id}/rooms.
 * available: so phong con trong trong khoang ngay da chon; null neu khong gui ngay.
 */
public record RoomView(Long id, Long hotelId, String roomType, BigDecimal pricePerNight, int capacity,
                       int quantity, String description, Integer available) {

    public static RoomView of(Room r, Integer available) {
        return new RoomView(r.getId(), r.getHotel().getId(), r.getRoomType(), r.getPricePerNight(),
                r.getCapacity(), r.getQuantity(), r.getDescription(), available);
    }
}
