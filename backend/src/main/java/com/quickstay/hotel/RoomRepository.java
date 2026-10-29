package com.quickstay.hotel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHotelIdOrderByPricePerNight(Long hotelId);
}
