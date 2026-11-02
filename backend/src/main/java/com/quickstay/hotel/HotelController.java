package com.quickstay.hotel;

import com.quickstay.hotel.HotelDtos.HotelView;
import com.quickstay.hotel.HotelDtos.RoomView;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService service;

    public HotelController(HotelService service) {
        this.service = service;
    }

    @GetMapping
    public List<HotelView> list(@RequestParam(required = false) String city,
                                @RequestParam(required = false) String q,
                                @RequestParam(required = false) String roomType,
                                @RequestParam(required = false) BigDecimal minPrice,
                                @RequestParam(required = false) BigDecimal maxPrice) {
        return service.search(city, q, roomType, minPrice, maxPrice);
    }

    @GetMapping("/{id}")
    public HotelView get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/rooms")
    public List<RoomView> rooms(@PathVariable Long id,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return service.roomsOf(id, checkIn, checkOut);
    }
}
