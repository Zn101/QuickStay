package com.quickstay.hotel;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tham so tim kiem GET /api/hotels (T049, T050 + loc theo ngay). Chuoi rong hoac toan khoang trang coi nhu khong loc.
 */
public record HotelSearch(
        @Size(max = 100, message = "toi da 100 ky tu") String q,
        @Size(max = 100, message = "toi da 100 ky tu") String city,
        @Size(max = 100, message = "toi da 100 ky tu") String roomType,
        @PositiveOrZero(message = "khong duoc am") BigDecimal minPrice,
        @PositiveOrZero(message = "khong duoc am") BigDecimal maxPrice,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {

    public HotelSearch(String q, String city, String roomType, BigDecimal minPrice, BigDecimal maxPrice) {
        this(q, city, roomType, minPrice, maxPrice, null, null);
    }

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
