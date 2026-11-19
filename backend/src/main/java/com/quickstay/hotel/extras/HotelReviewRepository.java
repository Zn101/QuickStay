package com.quickstay.hotel.extras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HotelReviewRepository extends JpaRepository<HotelReview, Long> {
    List<HotelReview> findByHotelIdOrderByCreatedAtDescIdDesc(Long hotelId);

    /** Tinh diem danh gia trung binh va tong so luot danh gia bang SQL index-only scan, khong can load toan bo entity. */
    @Query("""
            select count(r), coalesce(avg(r.rating), 0.0)
            from HotelReview r
            where r.hotel.id = :hotelId
            """)
    List<Object[]> getRatingStatsByHotelId(@Param("hotelId") Long hotelId);
}
