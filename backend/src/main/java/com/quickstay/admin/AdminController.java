package com.quickstay.admin;

import com.quickstay.booking.BookingDtos.BookingView;
import com.quickstay.booking.BookingDtos.StatusRequest;
import com.quickstay.booking.BookingService;
import com.quickstay.hotel.HotelDtos.HotelRequest;
import com.quickstay.hotel.HotelDtos.HotelView;
import com.quickstay.hotel.HotelDtos.RoomRequest;
import com.quickstay.hotel.HotelDtos.RoomView;
import com.quickstay.hotel.HotelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final HotelService hotels;
    private final BookingService bookings;

    public AdminController(HotelService hotels, BookingService bookings) {
        this.hotels = hotels;
        this.bookings = bookings;
    }

    @GetMapping("/hotels")
    public List<HotelView> listHotels() {
        return hotels.search(null, null, null, null, null);
    }

    @PostMapping("/hotels")
    @ResponseStatus(HttpStatus.CREATED)
    public HotelView createHotel(@Valid @RequestBody HotelRequest req) {
        return hotels.create(req);
    }

    @PutMapping("/hotels/{id}")
    public HotelView updateHotel(@PathVariable Long id, @Valid @RequestBody HotelRequest req) {
        return hotels.update(id, req);
    }

    @DeleteMapping("/hotels/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHotel(@PathVariable Long id) {
        hotels.delete(id);
    }

    @GetMapping("/rooms")
    public List<RoomView> listRooms(@RequestParam(required = false) Long hotelId) {
        return hotels.adminRooms(hotelId);
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomView createRoom(@Valid @RequestBody RoomRequest req) {
        return hotels.createRoom(req);
    }

    @PutMapping("/rooms/{id}")
    public RoomView updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest req) {
        return hotels.updateRoom(id, req);
    }

    @DeleteMapping("/rooms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@PathVariable Long id) {
        hotels.deleteRoom(id);
    }

    @GetMapping("/bookings")
    public List<BookingView> listBookings() {
        return bookings.all();
    }

    @PatchMapping("/bookings/{id}/status")
    public BookingView changeStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return bookings.changeStatus(id, req.status());
    }
}
