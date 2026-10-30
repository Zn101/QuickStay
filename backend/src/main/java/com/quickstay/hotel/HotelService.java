package com.quickstay.hotel;

import com.quickstay.config.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class HotelService {

    private final HotelRepository hotels;

    public HotelService(HotelRepository hotels) {
        this.hotels = hotels;
    }

    /** GET /api/hotels: danh sach, tim kiem (T049) va loc theo phong (T050), kem gia thap nhat (T048). */
    @Transactional(readOnly = true)
    public List<HotelSummary> search(HotelSearch s) {
        if (s.minPrice() != null && s.maxPrice() != null && s.minPrice().compareTo(s.maxPrice()) > 0) {
            throw ApiException.badRequest("minPrice phai nho hon hoac bang maxPrice");
        }
        return hotels.search(containsPattern(s.q()), containsPattern(s.city()), lower(s.roomType()),
                s.minPrice(), s.maxPrice(), s.filtersRooms());
    }

    /** GET /api/hotels/{id} (T062). */
    @Transactional(readOnly = true)
    public HotelSummary get(Long id) {
        return hotels.findSummary(id).orElseThrow(() -> ApiException.notFound("Khong tim thay khach san"));
    }

    private static String lower(String s) {
        return s == null ? null : s.toLowerCase(Locale.ROOT);
    }

    /** "%tu khoa%" chu thuong; escape ky tu dac biet cua LIKE de nguoi dung go "%" khong khop moi thu. */
    static String containsPattern(String s) {
        if (s == null) {
            return null;
        }
        String escaped = lower(s).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return "%" + escaped + "%";
    }
}
