package com.quickstay.hotel;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotels;

    public HotelController(HotelService hotels) {
        this.hotels = hotels;
    }

    /** GET /api/hotels?q=&city=&roomType=&minPrice=&maxPrice= (cong khai). */
    @GetMapping
    public List<HotelSummary> list(@Valid HotelSearch search) {
        return hotels.search(search);
    }

    /** GET /api/hotels/{id} (cong khai); 404 neu khong co. */
    @GetMapping("/{id}")
    public HotelSummary get(@PathVariable Long id) {
        return hotels.get(id);
    }

    /** GET /api/hotels/{id}/rooms?checkIn=&checkOut= (cong khai): loai phong kem so phong trong. */
    @GetMapping("/{id}/rooms")
    public List<RoomView> rooms(@PathVariable Long id,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return hotels.roomsOf(id, checkIn, checkOut);
    }
}
