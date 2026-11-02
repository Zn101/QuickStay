package com.quickstay.hotel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    @Query("""
            SELECT h FROM Hotel h
            WHERE (:city IS NULL OR LOWER(h.city) LIKE LOWER(CONCAT('%', :city, '%')))
              AND (:q IS NULL OR LOWER(h.name) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    java.util.List<Hotel> search(
            @Param("city") String city,
            @Param("q") String q
    );
}
