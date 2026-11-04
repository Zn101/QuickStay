package com.quickstay.hotel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    /** Sap theo gia tang dan; cung gia thi theo id de thu tu on dinh. */
    List<Room> findByHotelIdOrderByPricePerNightAscIdAsc(Long hotelId);

    List<Room> findByHotelIdOrderByPricePerNight(Long hotelId);
}
