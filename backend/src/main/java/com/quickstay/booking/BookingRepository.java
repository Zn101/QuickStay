package com.quickstay.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Lich su dat phong cua mot nguoi dung (T101): moi nhat truoc, trung created_at thi theo id.
     * Lay kem phong va khach san trong cung truy van de dung BookingView khong phat sinh N+1.
     */
    @Query("""
            select b from Booking b
            join fetch b.room r
            join fetch r.hotel
            join fetch b.user u
            where u.id = :userId
            order by b.createdAt desc, b.id desc
            """)
    List<Booking> findMine(@Param("userId") Long userId);

    /** So don chua huy chong lan [checkIn, checkOut) cua mot loai phong; cung dieu kien voi countOverlappingByHotel. */
    @Query("""
            select count(b) from Booking b
            where b.room.id = :roomId
              and b.checkIn < :checkOut
              and b.checkOut > :checkIn
              and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
            """)
    long countOverlapping(@Param("roomId") Long roomId,
                          @Param("checkIn") LocalDate checkIn,
                          @Param("checkOut") LocalDate checkOut);

    /**
     * So don chua huy chong lan [checkIn, checkOut) cua tung loai phong trong khach san, trong MOT truy van (T077).
     * Chong lan khi b.checkIn < checkOut va b.checkOut > checkIn: bat dang thuc chat nen hai ky nghi
     * lien ke (ngay tra cua don nay = ngay nhan cua don kia) khong xung dot.
     * Loai phong khong co don nao chong lan thi khong co trong ket qua.
     */
    @Query("""
            select new com.quickstay.booking.RoomBookedCount(b.room.id, count(b))
            from Booking b
            where b.room.hotel.id = :hotelId
              and b.checkIn < :checkOut
              and b.checkOut > :checkIn
              and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
            group by b.room.id
            """)
    List<RoomBookedCount> countOverlappingByHotel(@Param("hotelId") Long hotelId,
                                                  @Param("checkIn") LocalDate checkIn,
                                                  @Param("checkOut") LocalDate checkOut);

    /**
     * Kiem tra xem loai phong co bat ky don dat phong nao khong (moi trang thai).
     * bookings.room_id NOT NULL nen khong the xoa Room khi con Booking, ke ca CANCELLED.
     * Goi tu RoomAdminService.delete() (T095).
     */
    boolean existsByRoomId(Long roomId);

    /** Khach san co don dat phong o cac trang thai cho truoc khong. Goi tu HotelAdminService.delete() (T083). */
    boolean existsByRoomHotelIdAndStatusIn(Long hotelId, Collection<BookingStatus> statuses);
}
