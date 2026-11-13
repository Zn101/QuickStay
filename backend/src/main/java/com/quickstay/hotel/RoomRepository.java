package com.quickstay.hotel;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    /** Sap theo gia tang dan; cung gia thi theo id de thu tu on dinh. */
    List<Room> findByHotelIdOrderByPricePerNightAscIdAsc(Long hotelId);

    List<Room> findByHotelId(Long hotelId);

    default List<Room> findByHotelIdOrderByPricePerNight(Long hotelId) {
        return findByHotelIdOrderByPricePerNightAscIdAsc(hotelId);
    }

    /**
     * Doc loai phong va khoa dong do (SELECT ... FOR UPDATE) toi het transaction (T100):
     * hai yeu cau dat cung loai phong phai xep hang, yeu cau sau chi dem don sau khi yeu cau truoc da ghi xong.
     * Chi khoa dong rooms (khong join hotels) de khong chan dat phong o loai phong khac cung khach san.
     * Cho khoa toi da 3 giay (CSDL khong ho tro gioi han thi dung thoi gian cho mac dinh cua CSDL).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);
}
