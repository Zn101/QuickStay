package com.quickstay.hotel;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Tham so tim kiem GET /api/hotels (T049, T050). Chuoi rong hoac toan khoang trang coi nhu khong loc.
 *
 * @param q        khop mot phan voi ten hoac thanh pho, khong phan biet hoa thuong
 * @param city     khop mot phan voi thanh pho
 * @param roomType khop chinh xac loai phong, khong phan biet hoa thuong
 */
public record HotelSearch(
        @Size(max = 100) String q,
        @Size(max = 100) String city,
        @Size(max = 100) String roomType,
        @PositiveOrZero BigDecimal minPrice,
        @PositiveOrZero BigDecimal maxPrice) {

    public HotelSearch {
        q = blankToNull(q);
        city = blankToNull(city);
        roomType = blankToNull(roomType);
    }

    /** Co loc theo phong: chi giu khach san co it nhat mot loai phong phu hop. */
    public boolean filtersRooms() {
        return roomType != null || minPrice != null || maxPrice != null;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
