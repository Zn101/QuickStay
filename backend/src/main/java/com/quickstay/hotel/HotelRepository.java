package com.quickstay.hotel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    @Query("""
            select h from Hotel h
            where (:city is null or lower(h.city) like lower(concat('%', :city, '%')))
              and (:q is null or lower(h.name) like lower(concat('%', :q, '%'))
                   or lower(h.city) like lower(concat('%', :q, '%')))
            order by h.id
            """)
    List<Hotel> search(@Param("city") String city, @Param("q") String q);
}
