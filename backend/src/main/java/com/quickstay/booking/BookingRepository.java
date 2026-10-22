package com.quickstay.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("""
            select b from Booking b join fetch b.room r join fetch r.hotel join fetch b.user
            where b.user.id = :userId order by b.createdAt desc, b.id desc
            """)
    List<Booking> findByUser(@Param("userId") Long userId);

    @Query("""
            select b from Booking b join fetch b.room r join fetch r.hotel join fetch b.user
            order by b.createdAt desc, b.id desc
            """)
    List<Booking> findAllDetailed();

    @Query("""
            select b from Booking b join fetch b.room r join fetch r.hotel join fetch b.user
            where b.id = :id
            """)
    java.util.Optional<Booking> findDetailed(@Param("id") Long id);

    /** So booking chua huy chong lan khoang [checkIn, checkOut) cua phong. */
    @Query("""
            select count(b) from Booking b
            where b.room.id = :roomId and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
              and b.checkIn < :checkOut and b.checkOut > :checkIn
            """)
    long countOverlapping(@Param("roomId") Long roomId, @Param("checkIn") LocalDate checkIn,
                          @Param("checkOut") LocalDate checkOut);

    boolean existsByRoomIdIn(Collection<Long> roomIds);
}
