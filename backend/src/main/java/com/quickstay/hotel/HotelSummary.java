package com.quickstay.hotel;

import java.math.BigDecimal;

/**
 * Mot khach san trong danh sach / chi tiet (GET /api/hotels).
 * minPrice: gia thap nhat mot dem trong cac loai phong phu hop bo loc; null neu khach san chua co phong.
 */
public record HotelSummary(Long id, String name, String city, String address, String description,
                           String imageUrl, String amenities, BigDecimal minPrice) {
}
