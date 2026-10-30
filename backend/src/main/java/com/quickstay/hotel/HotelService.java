package com.quickstay.hotel;

import com.quickstay.booking.BookingRepository;
import com.quickstay.hotel.HotelDtos.HotelRequest;
import com.quickstay.hotel.HotelDtos.HotelView;
import com.quickstay.hotel.HotelDtos.RoomRequest;
import com.quickstay.common.TextNormalizer;
import com.quickstay.hotel.HotelDtos.RoomView;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

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

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** Tim khach san theo ten/thanh pho; loc theo loai phong va khoang gia (neu co). */
    @Transactional(readOnly = true)
    public List<HotelView> search(String city, String q, String roomType, BigDecimal minPrice, BigDecimal maxPrice) {
        boolean roomFilter = blankToNull(roomType) != null || minPrice != null || maxPrice != null;
        String type = blankToNull(roomType);

        String normalizedCity = TextNormalizer.normalize(city);
        String normalizedQuery = TextNormalizer.normalize(q);

        return hotels.findAll().stream()
                .filter(h -> normalizedCity.isEmpty()
                        || TextNormalizer.normalize(h.getCity()).contains(normalizedCity))
                .filter(h -> normalizedQuery.isEmpty()
                        || TextNormalizer.normalize(h.getName()).contains(normalizedQuery))
                .map(h -> {
                    List<Room> matching = rooms.findByHotelId(h.getId()).stream()
                            .filter(r -> type == null || r.getRoomType().equalsIgnoreCase(type))
                            .filter(r -> minPrice == null || r.getPricePerNight().compareTo(minPrice) >= 0)
                            .filter(r -> maxPrice == null || r.getPricePerNight().compareTo(maxPrice) <= 0)
                            .toList();

                    if (roomFilter && matching.isEmpty()) return null;

                    BigDecimal min = matching.stream()
                            .map(Room::getPricePerNight)
                            .min(Comparator.naturalOrder())
                            .orElse(null);

                    return HotelView.of(h, min);
                })
                .filter(v -> v != null)
                .toList();
    }

    @Transactional(readOnly = true)
    public HotelView get(Long id) {
        Hotel h = find(id);
        BigDecimal min = rooms.findByHotelId(id).stream().map(Room::getPricePerNight)
                .min(Comparator.naturalOrder()).orElse(null);
        return HotelView.of(h, min);
    }

    /** Danh sach phong cua khach san, kem so phong con trong neu co ngay nhan/tra. */
    @Transactional(readOnly = true)
    public List<RoomView> roomsOf(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        find(hotelId);
        if ((checkIn == null) != (checkOut == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can nhap ca ngay nhan va ngay tra phong");
        }
        if (checkIn != null && !checkOut.isAfter(checkIn)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngay tra phong phai sau ngay nhan phong");
        }
        return rooms.findByHotelIdOrderByPricePerNight(hotelId).stream()
                .map(r -> RoomView.of(r, checkIn == null ? null : availability(r, checkIn, checkOut)))
                .toList();
    }

    public int availability(Room room, LocalDate checkIn, LocalDate checkOut) {
        long taken = bookings.countOverlapping(room.getId(), checkIn, checkOut);
        return (int) Math.max(0, room.getQuantity() - taken);
    }

    public Hotel find(Long id) {
        return hotels.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay khach san"));
    }

    // ---- Admin ----

    @Transactional
    public HotelView create(HotelRequest req) {
        Hotel h = new Hotel();
        apply(h, req);
        return HotelView.of(hotels.save(h), null);
    }

    @Transactional
    public HotelView update(Long id, HotelRequest req) {
        Hotel h = find(id);
        apply(h, req);
        return get(hotels.save(h).getId());
    }

    @Transactional
    public void delete(Long id) {
        Hotel h = find(id);
        List<Room> list = rooms.findByHotelId(id);
        if (bookings.existsByRoomIdIn(list.stream().map(Room::getId).toList())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khach san da co dat phong, khong the xoa");
        }
        rooms.deleteAll(list);
        hotels.delete(h);
    }

    private void apply(Hotel h, HotelRequest req) {
        h.setName(req.name().trim());
        h.setCity(req.city().trim());
        h.setAddress(req.address());
        h.setDescription(req.description());
        h.setImageUrl(req.imageUrl());
        h.setAmenities(req.amenities());
    }

    @Transactional(readOnly = true)
    public List<RoomView> adminRooms(Long hotelId) {
        List<Room> list = hotelId == null ? rooms.findAll() : rooms.findByHotelId(hotelId);
        return list.stream().map(r -> RoomView.of(r, null)).toList();
    }

    @Transactional
    public RoomView createRoom(RoomRequest req) {
        Room r = new Room();
        applyRoom(r, req);
        return RoomView.of(rooms.save(r), null);
    }

    @Transactional
    public RoomView updateRoom(Long id, RoomRequest req) {
        Room r = rooms.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong"));
        applyRoom(r, req);
        return RoomView.of(rooms.save(r), null);
    }

    @Transactional
    public void deleteRoom(Long id) {
        if (!rooms.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong");
        }
        if (bookings.existsByRoomIdIn(List.of(id))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phong da co dat phong, khong the xoa");
        }
        rooms.deleteById(id);
    }

    private void applyRoom(Room r, RoomRequest req) {
        r.setHotel(find(req.hotelId()));
        r.setRoomType(req.roomType().trim());
        r.setPricePerNight(req.pricePerNight());
        r.setCapacity(req.capacity());
        r.setQuantity(req.quantity());
        r.setDescription(req.description());
    }
}
