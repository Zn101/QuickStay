package com.quickstay.hotel.extras;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelReviewRepository extends JpaRepository<HotelReview, Long> {
    List<HotelReview> findByHotelIdOrderByCreatedAtDescIdDesc(Long hotelId);
}
