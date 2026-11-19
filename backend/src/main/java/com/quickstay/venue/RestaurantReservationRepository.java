package com.quickstay.venue;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantReservationRepository extends JpaRepository<RestaurantReservation, Long> {

    @EntityGraph(attributePaths = {"restaurant", "user"})
    List<RestaurantReservation> findByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    @EntityGraph(attributePaths = {"restaurant", "user"})
    List<RestaurantReservation> findByRestaurantOwnerIdOrderByCreatedAtDescIdDesc(Long ownerId);

    @EntityGraph(attributePaths = {"restaurant", "user"})
    List<RestaurantReservation> findAllByOrderByCreatedAtDescIdDesc();

    boolean existsByRestaurantId(Long restaurantId);

    /** Khoa dong don: chu nha hang xac nhan va khach huy cung luc phai xep hang. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RestaurantReservation r join fetch r.restaurant join fetch r.user where r.id = :id")
    Optional<RestaurantReservation> findByIdForUpdate(@Param("id") Long id);
}
