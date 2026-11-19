package com.quickstay.hotel.extras;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelQuestionRepository extends JpaRepository<HotelQuestion, Long> {
    List<HotelQuestion> findByHotelIdOrderByCreatedAtDescIdDesc(Long hotelId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from HotelQuestion q where q.hotel.id = :hotelId")
    int deleteByHotelId(@org.springframework.data.repository.query.Param("hotelId") Long hotelId);
}
