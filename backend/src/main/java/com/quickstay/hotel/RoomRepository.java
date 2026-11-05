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

    List<Room> findByHotelIdOrderByPricePerNight(Long hotelId);
}
