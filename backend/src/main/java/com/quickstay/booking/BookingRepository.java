package com.quickstay.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

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
}
