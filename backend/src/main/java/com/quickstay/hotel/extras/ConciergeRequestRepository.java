package com.quickstay.hotel.extras;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConciergeRequestRepository extends JpaRepository<ConciergeRequest, Long> {
    List<ConciergeRequest> findByGuestEmailOrderByCreatedAtDescIdDesc(String guestEmail);
    List<ConciergeRequest> findAllByOrderByCreatedAtDescIdDesc();
}
