package com.quickstay.hotel;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
