package com.quickstay.hotel;

import com.quickstay.booking.RoomBookedCount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface RoomClosureRepository extends JpaRepository<RoomClosure, Long> {

    /** Tong so phong bi dong chong lan [checkIn, checkOut) cua mot loai phong (cung cach dem voi don dat phong). */
    @Query("""
            select coalesce(sum(c.units), 0) from RoomClosure c
            where c.room.id = :roomId and c.startDate < :checkOut and c.endDate > :checkIn
            """)
    long sumOverlapping(@Param("roomId") Long roomId,
                        @Param("checkIn") LocalDate checkIn,
                        @Param("checkOut") LocalDate checkOut);

    /** Tong so phong bi dong theo tung loai phong cua nhieu khach san, trong mot truy van. */
    @Query("""
            select new com.quickstay.booking.RoomBookedCount(c.room.id, sum(c.units))
            from RoomClosure c
            where c.room.hotel.id in :hotelIds and c.startDate < :checkOut and c.endDate > :checkIn
            group by c.room.id
            """)
    List<RoomBookedCount> sumOverlappingByHotels(@Param("hotelIds") Collection<Long> hotelIds,
                                                 @Param("checkIn") LocalDate checkIn,
                                                 @Param("checkOut") LocalDate checkOut);

    /** Lich dong phong con hieu luc (ket thuc sau ngay {@code from}) cua mot khach san. */
    @EntityGraph(attributePaths = {"room"})
    @Query("""
            select c from RoomClosure c
            where c.room.hotel.id = :hotelId and c.endDate > :from
            order by c.startDate asc, c.id asc
            """)
    List<RoomClosure> findActiveByHotel(@Param("hotelId") Long hotelId, @Param("from") LocalDate from);
}
