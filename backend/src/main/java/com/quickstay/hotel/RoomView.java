package com.quickstay.hotel;

import java.math.BigDecimal;
import java.util.List;

/**
 * Mot loai phong trong GET /api/hotels/{id}/rooms.
 * available: so phong con trong trong khoang ngay da chon; null neu khong gui ngay.
 * areaSqm, bedInfo, amenities, images: do doi tac nhap; rong khi chua khai bao.
 */
public record RoomView(Long id, Long hotelId, String roomType, BigDecimal pricePerNight, int capacity,
                       int quantity, String description, Integer available,
                       Integer areaSqm, String bedInfo, List<String> amenities, List<String> images) {

    public static RoomView of(Room r, Integer available) {
        return new RoomView(r.getId(), r.getHotel().getId(), r.getRoomType(), r.getPricePerNight(),
                r.getCapacity(), r.getQuantity(), r.getDescription(), available,
                r.getAreaSqm(), r.getBedInfo(), ContentLines.csv(r.getAmenities()),
                ContentLines.lines(r.getImageUrls()));
    }
}
