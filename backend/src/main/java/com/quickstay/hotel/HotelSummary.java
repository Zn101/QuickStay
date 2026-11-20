package com.quickstay.hotel;

import java.math.BigDecimal;

/**
 * Mot khach san trong danh sach / chi tiet (GET /api/hotels).
 * minPrice: gia thap nhat mot dem trong cac loai phong phu hop bo loc; null neu khach san chua co phong.
 * rating / reviewCount: diem trung binh va so danh gia that cua khach (rating null khi chua co danh gia).
 */
public record HotelSummary(Long id, String name, String city, String address, String description,
                           String imageUrl, String amenities, BigDecimal minPrice, Double rating, Long reviewCount) {

    public HotelSummary(Long id, String name, String city, String address, String description,
                        String imageUrl, String amenities, BigDecimal minPrice) {
        this(id, name, city, address, description, imageUrl, amenities, minPrice, null, 0L);
    }

    public HotelSummary {
        rating = rating == null ? null : Math.round(rating * 10.0) / 10.0;
        reviewCount = reviewCount == null ? 0L : reviewCount;
    }
}
