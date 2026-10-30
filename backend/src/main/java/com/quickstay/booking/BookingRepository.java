package com.quickstay.booking;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    default List<Booking> findByUser(Long userId) {
        return findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.room.id = :roomId
              AND b.checkIn < :checkOut
              AND b.checkOut > :checkIn
              AND b.status <> :cancelled
            """)
    long countOverlapping(
            @Param("roomId") Long roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("cancelled") BookingStatus cancelled
    );

    default long countOverlapping(
            Long roomId,
            LocalDate checkIn,
            LocalDate checkOut
    ) {
        return countOverlapping(
                roomId, checkIn, checkOut, BookingStatus.CANCELLED
        );
    }

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.room.id IN :roomIds
            """)
    boolean existsByRoomIdInQuery(@Param("roomIds") List<Long> roomIds);

    default boolean existsByRoomIdIn(List<Long> roomIds) {
        return roomIds != null
                && !roomIds.isEmpty()
                && existsByRoomIdInQuery(roomIds);
    }

    @EntityGraph(attributePaths = {"user", "room", "room.hotel"})
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user", "room", "room.hotel"})
    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
    List<Booking> findAllDetailed();
}
