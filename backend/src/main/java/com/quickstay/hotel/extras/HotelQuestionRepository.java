package com.quickstay.hotel.extras;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelQuestionRepository extends JpaRepository<HotelQuestion, Long> {
    List<HotelQuestion> findByHotelIdOrderByCreatedAtDescIdDesc(Long hotelId);
}
