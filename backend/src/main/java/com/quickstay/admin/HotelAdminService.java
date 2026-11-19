package com.quickstay.admin;

import com.quickstay.admin.HotelAdminDtos.HotelRequest;
import com.quickstay.admin.HotelAdminDtos.HotelResponse;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.hotel.extras.ConciergeRequestRepository;
import com.quickstay.hotel.extras.HotelQuestionRepository;
import com.quickstay.hotel.extras.HotelReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Logic nghiep vu quan ly khach san cua Admin (T082, T083).
 * Khong chua logic trong Controller; moi loi nghiep vu nem ApiException.
 */
@Service
public class HotelAdminService {

    private static final Logger log = LoggerFactory.getLogger(HotelAdminService.class);

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final HotelReviewRepository reviewRepository;
    private final HotelQuestionRepository questionRepository;
    private final ConciergeRequestRepository conciergeRepository;

    public HotelAdminService(HotelRepository hotelRepository,
                             RoomRepository roomRepository,
                             BookingRepository bookingRepository,
                             HotelReviewRepository reviewRepository,
                             HotelQuestionRepository questionRepository,
                             ConciergeRequestRepository conciergeRepository) {
        this.reviewRepository = reviewRepository;
        this.questionRepository = questionRepository;
        this.conciergeRepository = conciergeRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Lay danh sach tat ca khach san (T083).
     *
     * @return danh sach HotelResponse
     */
    @Transactional(readOnly = true)
    public List<HotelResponse> list() {
        return hotelRepository.findAll().stream()
                .map(HotelResponse::of)
                .toList();
    }

    /**
     * Them moi mot khach san (T082).
     *
     * @param req du lieu khach san da duoc validate boi Controller
     * @return HotelResponse chua id cua khach san vua tao
     */
    @Transactional
    public HotelResponse create(HotelRequest req) {
        Hotel hotel = new Hotel();
        applyRequest(hotel, req);
        hotelRepository.save(hotel);
        log.info("Admin tao khach san moi id={} name=\"{}\"", hotel.getId(), hotel.getName());
        return HotelResponse.of(hotel);
    }

    /**
     * Cap nhat thong tin khach san theo id (T082).
     *
     * @param id  id khach san can cap nhat
     * @param req du lieu moi da duoc validate boi Controller
     * @return HotelResponse sau khi cap nhat
     * @throws ApiException 404 neu khach san khong ton tai
     */
    @Transactional
    public HotelResponse update(Long id, HotelRequest req) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach san voi id=" + id));
        applyRequest(hotel, req);
        hotelRepository.save(hotel);
        log.info("Admin cap nhat khach san id={} name=\"{}\"", hotel.getId(), hotel.getName());
        return HotelResponse.of(hotel);
    }

    /**
     * Xoa khach san theo id (T083).
     *
     * Luong xu ly:
     * 1. Tim khach san – 404 neu khong ton tai.
     * 2. Kiem tra bat ky don dat phong nao (moi trang thai) lien ket voi khach san.
     *    - Neu co → 409: bao ve toan ven lich su dat phong, tranh vi pham FK.
     *    - Booking co FK NOT NULL tro toi Room; xoa Room khi con Booking la loi DB.
     * 3. Xoa toan bo Room cua khach san (khong con Booking nao tham chieu).
     * 4. Xoa Hotel.
     *
     * Toan bo chay trong mot @Transactional de tranh race condition.
     *
     * @param id id khach san can xoa
     * @throws ApiException 404 neu khach san khong ton tai
     * @throws ApiException 409 neu con bat ky don dat phong nao
     */
    @Transactional
    public void delete(Long id) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach san voi id=" + id));

        // Kiem tra tat ca booking (moi trang thai) lien ket voi khach san.
        // Khong the xoa Room khi con Booking tham chieu (FK NOT NULL bookings.room_id).
        // Khong xoa Booking de dam bao toan ven lich su dat phong.
        if (bookingRepository.existsByRoomHotelIdAndStatusIn(id, List.of(BookingStatus.values()))) {
            throw ApiException.conflict(
                    "Khach san da co dat phong, khong the xoa");
        }

        // Yeu cau dich vu concierge la giao dich cua khach: khong xoa am tham
        if (conciergeRepository.existsByHotelId(id)) {
            throw ApiException.conflict("Khach san da co yeu cau dich vu (concierge), khong the xoa");
        }
        // Danh gia va hoi dap gan voi khach san (FK khong cascade): xoa truoc de khong vi pham rang buoc
        reviewRepository.deleteByHotelId(id);
        questionRepository.deleteByHotelId(id);
        roomRepository.deleteAll(roomRepository.findByHotelIdOrderByPricePerNightAscIdAsc(id));
        hotelRepository.delete(hotel);
        log.info("Admin xoa khach san id={} name=\"{}\"", id, hotel.getName());
    }

    /** Ap dung du lieu tu request len entity (dung chung cho create va update). */
    private void applyRequest(Hotel hotel, HotelRequest req) {
        hotel.setName(req.name());
        hotel.setCity(req.city());
        hotel.setAddress(req.address());
        hotel.setDescription(req.description());
        hotel.setImageUrl(req.imageUrl());
        hotel.setAmenities(req.amenities());
    }
}
