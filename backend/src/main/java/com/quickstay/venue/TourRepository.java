package com.quickstay.venue;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {
    List<Tour> findAllByOrderByIdAsc();
    List<Tour> findByOwnerIdOrderByIdAsc(Long ownerId);
    List<Tour> findByIdIn(Collection<Long> ids);
}
