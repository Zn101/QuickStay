package com.quickstay.hotel;

import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.RoomBookedCount;
import com.quickstay.config.ApiException;
import com.quickstay.config.PageResponse;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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

    /** GET /api/hotels: danh sach, tim kiem (T049), loc theo phong (T050) va loc theo ngay nhan/tra. */
    @Transactional(readOnly = true)
    public List<HotelSummary> search(HotelSearch s) {
        validatePriceRange(s);
        validateDates(s.checkIn(), s.checkOut());
        List<HotelSummary> list = hotels.search(containsPattern(s.q()), containsPattern(s.city()), lower(s.roomType()),
                s.minPrice(), s.maxPrice(), s.filtersRooms());
        if (s.checkIn() == null) {
            return list;
        }
        return filterByAvailability(list, s);
    }

    /** GET /api/hotels?page=&size= (T165): cung bo loc voi search, tra theo trang. */
    @Transactional(readOnly = true)
    public PageResponse<HotelSummary> searchPage(HotelSearch s, Pageable pageable) {
        validatePriceRange(s);
        validateDates(s.checkIn(), s.checkOut());
        if (s.checkIn() == null) {
            return PageResponse.of(hotels.searchPage(containsPattern(s.q()), containsPattern(s.city()), lower(s.roomType()),
                    s.minPrice(), s.maxPrice(), s.filtersRooms(), pageable));
        }
        List<HotelSummary> available = filterByAvailability(
                hotels.search(containsPattern(s.q()), containsPattern(s.city()), lower(s.roomType()),
                        s.minPrice(), s.maxPrice(), s.filtersRooms()),
                s);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), available.size());
        List<HotelSummary> slice = start >= available.size() ? List.of() : available.subList(start, end);
        return PageResponse.of(new PageImpl<>(slice, pageable, available.size()));
    }

    private List<HotelSummary> filterByAvailability(List<HotelSummary> candidates, HotelSearch s) {
        return candidates.stream()
                .filter(h -> hasAvailableRoom(h.id(), s))
                .toList();
    }

    private boolean hasAvailableRoom(Long hotelId, HotelSearch s) {
        List<Room> hotelRooms = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId);
        if (hotelRooms.isEmpty()) {
            return false;
        }
        Map<Long, Long> booked = bookings.countOverlappingByHotel(hotelId, s.checkIn(), s.checkOut()).stream()
                .collect(Collectors.toMap(RoomBookedCount::roomId, RoomBookedCount::booked));
        String targetType = lower(s.roomType());
        return hotelRooms.stream().anyMatch(r -> {
            if (targetType != null && !r.getRoomType().toLowerCase(Locale.ROOT).equals(targetType)) return false;
            if (s.minPrice() != null && r.getPricePerNight().compareTo(s.minPrice()) < 0) return false;
            if (s.maxPrice() != null && r.getPricePerNight().compareTo(s.maxPrice()) > 0) return false;
            return r.remaining(booked.getOrDefault(r.getId(), 0L)) > 0;
        });
    }

    private static void validatePriceRange(HotelSearch s) {
        if (s.minPrice() != null && s.maxPrice() != null && s.minPrice().compareTo(s.maxPrice()) > 0) {
            throw ApiException.badRequest("minPrice phai nho hon hoac bang maxPrice");
        }
    }

    private static void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if ((checkIn == null) != (checkOut == null)) {
            throw ApiException.badRequest("Can nhap ca ngay nhan va ngay tra phong");
        }
        if (checkIn != null && !checkOut.isAfter(checkIn)) {
            throw ApiException.badRequest("Ngay tra phong phai sau ngay nhan phong");
        }
    }

    @Transactional(readOnly = true)
    public List<String> roomTypes() {
        return rooms.findAll().stream()
                .map(Room::getRoomType)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    /** GET /api/hotels/{id} (T062). */
    @Transactional(readOnly = true)
    public HotelSummary get(Long id) {
        return hotels.findSummary(id).orElseThrow(() -> ApiException.notFound("Khong tim thay khach san"));
    }

    /**
     * GET /api/hotels/{id}/rooms (T076): loai phong sap theo gia tang dan.
     * Gui ca checkIn va checkOut thi kem available = so phong con trong trong [checkIn, checkOut) (T077).
     */
    @Transactional(readOnly = true)
    public List<RoomView> roomsOf(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        if (!hotels.existsById(hotelId)) {
            throw ApiException.notFound("Khong tim thay khach san");
        }
        validateDates(checkIn, checkOut);
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
