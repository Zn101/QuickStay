package com.quickstay.venue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VenueReviewRepository extends JpaRepository<VenueReview, Long> {

    List<VenueReview> findByVenueTypeAndVenueIdOrderByCreatedAtDescIdDesc(String venueType, Long venueId);

    boolean existsByVenueTypeAndVenueIdAndUserId(String venueType, Long venueId, Long userId);

    /** [venueId, so danh gia, diem trung binh] cua moi co so cung loai, trong mot truy van. */
    @Query("select r.venueId, count(r), avg(r.rating) from VenueReview r where r.venueType = :type group by r.venueId")
    List<Object[]> statsByType(@Param("type") String type);

    void deleteByVenueTypeAndVenueId(String venueType, Long venueId);
}
