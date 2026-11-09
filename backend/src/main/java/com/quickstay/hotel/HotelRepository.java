package com.quickstay.hotel;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    /**
     * Danh sach khach san kem gia thap nhat, trong mot truy van (khong N+1).
     * Dieu kien loc phong nam trong ON cua LEFT JOIN nen min(...) chi tinh tren phong phu hop;
     * khi roomsFiltered = true, HAVING bo khach san khong con phong nao phu hop.
     * Cac pattern LIKE da duoc escape bang '!' o HotelService.
     */
    String SEARCH_QUERY = """
            select new com.quickstay.hotel.HotelSummary(
                h.id, h.name, h.city, h.address, h.description, h.imageUrl, h.amenities, min(r.pricePerNight))
            from Hotel h
            left join Room r on r.hotel = h
                and (:roomType is null or lower(r.roomType) = :roomType)
                and (:minPrice is null or r.pricePerNight >= :minPrice)
                and (:maxPrice is null or r.pricePerNight <= :maxPrice)
            where (:cityPattern is null or lower(h.city) like :cityPattern escape '!')
              and (:qPattern is null or lower(h.name) like :qPattern escape '!'
                   or lower(h.city) like :qPattern escape '!')
            group by h.id, h.name, h.city, h.address, h.description, h.imageUrl, h.amenities
            having :roomsFiltered = false or count(r.id) > 0
            order by h.id
            """;

    @Query(SEARCH_QUERY)
    List<HotelSummary> search(@Param("qPattern") String qPattern,
                              @Param("cityPattern") String cityPattern,
                              @Param("roomType") String roomType,
                              @Param("minPrice") BigDecimal minPrice,
                              @Param("maxPrice") BigDecimal maxPrice,
                              @Param("roomsFiltered") boolean roomsFiltered);

    /**
     * Ban phan trang cua search (T165). Cau dem viet rieng vi SEARCH_QUERY co GROUP BY:
     * dem khach san thoa dieu kien, EXISTS tuong duong HAVING cua cau chinh.
     */
    @Query(value = SEARCH_QUERY, countQuery = """
            select count(h) from Hotel h
            where (:cityPattern is null or lower(h.city) like :cityPattern escape '!')
              and (:qPattern is null or lower(h.name) like :qPattern escape '!'
                   or lower(h.city) like :qPattern escape '!')
              and (:roomsFiltered = false or exists (
                    select r.id from Room r where r.hotel = h
                      and (:roomType is null or lower(r.roomType) = :roomType)
                      and (:minPrice is null or r.pricePerNight >= :minPrice)
                      and (:maxPrice is null or r.pricePerNight <= :maxPrice)))
            """)
    Page<HotelSummary> searchPage(@Param("qPattern") String qPattern,
                                  @Param("cityPattern") String cityPattern,
                                  @Param("roomType") String roomType,
                                  @Param("minPrice") BigDecimal minPrice,
                                  @Param("maxPrice") BigDecimal maxPrice,
                                  @Param("roomsFiltered") boolean roomsFiltered,
                                  Pageable pageable);

    /** Mot khach san kem gia thap nhat tren moi loai phong; rong neu khong ton tai. */
    @Query("""
            select new com.quickstay.hotel.HotelSummary(
                h.id, h.name, h.city, h.address, h.description, h.imageUrl, h.amenities, min(r.pricePerNight))
            from Hotel h
            left join Room r on r.hotel = h
            where h.id = :id
            group by h.id, h.name, h.city, h.address, h.description, h.imageUrl, h.amenities
            """)
    Optional<HotelSummary> findSummary(@Param("id") Long id);
}
