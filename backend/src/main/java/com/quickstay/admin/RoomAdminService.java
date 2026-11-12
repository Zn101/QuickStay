package com.quickstay.admin;

import com.quickstay.admin.RoomAdminDtos.RoomRequest;
import com.quickstay.admin.RoomAdminDtos.RoomResponse;
import com.quickstay.booking.BookingRepository;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Logic nghiep vu quan ly loai phong cua Admin (T094, T095).
 * Khong chua logic trong Controller; moi loi nghiep vu nem ApiException.
 */
@Service
public class RoomAdminService {

    private static final Logger log = LoggerFactory.getLogger(RoomAdminService.class);

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final BookingRepository bookingRepository;

    public RoomAdminService(RoomRepository roomRepository,
                            HotelRepository hotelRepository,
                            BookingRepository bookingRepository) {
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * GET /api/admin/rooms – Lay danh sach loai phong (T095, T133-BUG-01).
     *
     * @param hotelId neu co: chi tra phong cua khach san do; neu null: tra tat ca.
     *                Neu hotelId khong ton tai hoac khong co phong: tra mang rong (200).
     * @return danh sach RoomResponse
     */
    @Transactional(readOnly = true)
    public List<RoomResponse> list(Long hotelId) {
        if (hotelId != null) {
            return roomRepository.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId).stream()
                    .map(RoomResponse::of)
                    .toList();
        }
        return roomRepository.findAll().stream()
                .map(RoomResponse::of)
                .toList();
    }

    /**
     * DELETE /api/admin/rooms/{id} – Xoa loai phong (T095).
     *
     * Luong xu ly:
     * 1. Tim loai phong – 404 neu khong ton tai.
     * 2. Kiem tra bat ky Booking nao tham chieu Room nay (moi trang thai) – 409 neu co.
     *    bookings.room_id NOT NULL nen khong the xoa Room khi con Booking, ke ca CANCELLED.
     * 3. Xoa Room.
     *
     * Toan bo chay trong mot @Transactional de tranh race condition.
     *
     * @param id id loai phong can xoa
     * @throws ApiException 404 neu loai phong khong ton tai
     * @throws ApiException 409 neu con bat ky don dat phong nao tham chieu loai phong nay
     */
    @Transactional
    public void delete(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay loai phong voi id=" + id));

        if (bookingRepository.existsByRoomId(id)) {
            throw ApiException.conflict(
                    "Khong the xoa loai phong da co don dat phong");
        }

        roomRepository.delete(room);
        log.info("Admin xoa loai phong id={} type=\"{}\" hotelId={}",
                id, room.getRoomType(), room.getHotel().getId());
    }

    /**
     * POST /api/admin/rooms – Them loai phong moi vao khach san (T094).
     *
     * @param req du lieu da duoc validate boi Controller
     * @return RoomResponse chua id vua tao
     * @throws ApiException 404 neu hotelId khong ton tai
     */
    @Transactional
    public RoomResponse create(RoomRequest req) {
        Hotel hotel = hotelRepository.findById(req.hotelId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach san voi id=" + req.hotelId()));

        Room room = new Room();
        applyRequest(room, hotel, req);
        roomRepository.save(room);
        log.info("Admin tao loai phong moi id={} type=\"{}\" hotelId={}",
                room.getId(), room.getRoomType(), hotel.getId());
        return RoomResponse.of(room);
    }

    /**
     * PUT /api/admin/rooms/{id} – Cap nhat loai phong.
     *
     * @param id  id loai phong can cap nhat
     * @param req du lieu moi da duoc validate boi Controller
     * @return RoomResponse sau khi cap nhat
     * @throws ApiException 404 neu room hoac hotel khong ton tai
     */
    @Transactional
    public RoomResponse update(Long id, RoomRequest req) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay loai phong voi id=" + id));

        Hotel hotel = hotelRepository.findById(req.hotelId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach san voi id=" + req.hotelId()));

        applyRequest(room, hotel, req);
        roomRepository.save(room);
        log.info("Admin cap nhat loai phong id={} type=\"{}\" hotelId={}",
                room.getId(), room.getRoomType(), hotel.getId());
        return RoomResponse.of(room);
    }

    /** Ap dung du lieu tu request len entity (dung chung cho create va update). */
    private void applyRequest(Room room, Hotel hotel, RoomRequest req) {
        room.setHotel(hotel);
        room.setRoomType(req.roomType());
        room.setPricePerNight(req.pricePerNight());
        room.setCapacity(req.capacity());
        room.setQuantity(req.quantity());
        room.setDescription(req.description());
    }
}
