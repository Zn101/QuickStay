package com.quickstay.hotel;

import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.RoomBookedCount;
import com.quickstay.config.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HotelService {

    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final BookingRepository bookings;

    public HotelService(HotelRepository hotels, RoomRepository rooms, BookingRepository bookings) {
        this.hotels = hotels;
        this.rooms = rooms;
        this.bookings = bookings;
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

    /**
     * GET /api/hotels/{id}/rooms (T076): loai phong sap theo gia tang dan.
     * Gui ca checkIn va checkOut thi kem available = so phong con trong trong [checkIn, checkOut) (T077);
     * so don chong lan cua moi loai phong lay bang mot truy van gom nhom, khong truy van tung phong.
     */
    @Transactional(readOnly = true)
    public List<RoomView> roomsOf(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        if (!hotels.existsById(hotelId)) {
            throw ApiException.notFound("Khong tim thay khach san");
        }
        if ((checkIn == null) != (checkOut == null)) {
            throw ApiException.badRequest("Can nhap ca ngay nhan va ngay tra phong");
        }
        if (checkIn != null && !checkOut.isAfter(checkIn)) {
            throw ApiException.badRequest("Ngay tra phong phai sau ngay nhan phong");
        }
        List<Room> list = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId);
        if (checkIn == null) {
            return list.stream().map(r -> RoomView.of(r, null)).toList();
        }
        Map<Long, Long> booked = bookings.countOverlappingByHotel(hotelId, checkIn, checkOut).stream()
                .collect(Collectors.toMap(RoomBookedCount::roomId, RoomBookedCount::booked));
        return list.stream()
                .map(r -> RoomView.of(r, r.remaining(booked.getOrDefault(r.getId(), 0L))))
                .toList();
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
