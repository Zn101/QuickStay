package com.quickstay.venue;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TourBookingRepository extends JpaRepository<TourBooking, Long> {

    @EntityGraph(attributePaths = {"tour", "user"})
    List<TourBooking> findByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    @EntityGraph(attributePaths = {"tour", "user"})
    List<TourBooking> findByTourOwnerIdOrderByCreatedAtDescIdDesc(Long ownerId);

    @EntityGraph(attributePaths = {"tour", "user"})
    List<TourBooking> findAllByOrderByCreatedAtDescIdDesc();

    boolean existsByTourId(Long tourId);

    boolean existsByUserIdAndTourIdAndStatus(Long userId, Long tourId, OrderStatus status);

    /** Tong so khach cua cac don chua huy trong mot ngay khoi hanh. */
    @Query("select coalesce(sum(b.guests), 0) from TourBooking b where b.tour.id = :tourId and b.tourDate = :date and b.status <> com.quickstay.venue.OrderStatus.CANCELLED")
    long sumGuestsOnDate(@Param("tourId") Long tourId, @Param("date") java.time.LocalDate date);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from TourBooking b join fetch b.tour join fetch b.user where b.id = :id")
    Optional<TourBooking> findByIdForUpdate(@Param("id") Long id);
}
