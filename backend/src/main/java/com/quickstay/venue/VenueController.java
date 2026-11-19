package com.quickstay.venue;

import com.quickstay.venue.VenueDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Nha hang & tour. Phan quyen theo duong dan (SecurityConfig):
 * - GET /api/restaurants, /api/tours: cong khai
 * - POST .../reservations, .../bookings: CUSTOMER
 * - /api/owner/restaurants/**: RESTAURANT_OWNER, ADMIN; /api/owner/tours/**: TOUR_OPERATOR, ADMIN
 * - /api/admin/**: ADMIN
 */
@RestController
@RequestMapping("/api")
public class VenueController {

    private final VenueService venues;

    public VenueController(VenueService venues) {
        this.venues = venues;
    }

    // ---------- Cong khai ----------

    @GetMapping("/restaurants")
    public List<RestaurantView> restaurants() {
        return venues.listRestaurants();
    }

    @GetMapping("/tours")
    public List<TourView> tours() {
        return venues.listTours();
    }

    // ---------- Khach hang ----------

    @PostMapping("/restaurants/{id}/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationView reserve(Authentication auth, @PathVariable Long id, @Valid @RequestBody ReservationRequest req) {
        return venues.reserve(auth.getName(), id, req);
    }

    @PostMapping("/tours/{id}/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public TourBookingView bookTour(Authentication auth, @PathVariable Long id, @Valid @RequestBody TourBookingRequest req) {
        return venues.bookTour(auth.getName(), id, req);
    }

    @GetMapping("/restaurant-reservations/me")
    public List<ReservationView> myReservations(Authentication auth) {
        return venues.myReservations(auth.getName());
    }

    @GetMapping("/tour-bookings/me")
    public List<TourBookingView> myTourBookings(Authentication auth) {
        return venues.myTourBookings(auth.getName());
    }

    @PatchMapping("/restaurant-reservations/{id}/cancel")
    public ReservationView cancelReservation(Authentication auth, @PathVariable Long id) {
        return venues.cancelReservation(auth.getName(), id);
    }

    @PatchMapping("/tour-bookings/{id}/cancel")
    public TourBookingView cancelTourBooking(Authentication auth, @PathVariable Long id) {
        return venues.cancelTourBooking(auth.getName(), id);
    }

    // ---------- Chu nha hang ----------

    @GetMapping("/owner/restaurants")
    public List<RestaurantView> myRestaurants(Authentication auth) {
        return venues.myRestaurants(auth.getName());
    }

    @PutMapping("/owner/restaurants/{id}")
    public RestaurantView updateMyRestaurant(Authentication auth, @PathVariable Long id, @Valid @RequestBody RestaurantRequest req) {
        return venues.updateRestaurantAsOwner(auth.getName(), id, req);
    }

    @GetMapping("/owner/restaurants/reservations")
    public List<ReservationView> ownerReservations(Authentication auth) {
        return venues.ownerReservations(auth.getName());
    }

    @PatchMapping("/owner/restaurants/reservations/{id}/status")
    public ReservationView changeReservationStatus(Authentication auth, @PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return venues.changeReservationStatus(auth.getName(), id, req.status());
    }

    // ---------- Chu tour ----------

    @GetMapping("/owner/tours")
    public List<TourView> myTours(Authentication auth) {
        return venues.myTours(auth.getName());
    }

    @PutMapping("/owner/tours/{id}")
    public TourView updateMyTour(Authentication auth, @PathVariable Long id, @Valid @RequestBody TourRequest req) {
        return venues.updateTourAsOwner(auth.getName(), id, req);
    }

    @GetMapping("/owner/tours/bookings")
    public List<TourBookingView> ownerTourBookings(Authentication auth) {
        return venues.ownerTourBookings(auth.getName());
    }

    @PatchMapping("/owner/tours/bookings/{id}/status")
    public TourBookingView changeTourBookingStatus(Authentication auth, @PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return venues.changeTourBookingStatus(auth.getName(), id, req.status());
    }

    // ---------- Admin ----------

    @PostMapping("/admin/restaurants")
    @ResponseStatus(HttpStatus.CREATED)
    public RestaurantView createRestaurant(@Valid @RequestBody RestaurantRequest req) {
        return venues.createRestaurant(req);
    }

    @PutMapping("/admin/restaurants/{id}")
    public RestaurantView updateRestaurant(@PathVariable Long id, @Valid @RequestBody RestaurantRequest req) {
        return venues.updateRestaurant(id, req);
    }

    @DeleteMapping("/admin/restaurants/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRestaurant(@PathVariable Long id) {
        venues.deleteRestaurant(id);
    }

    @PostMapping("/admin/tours")
    @ResponseStatus(HttpStatus.CREATED)
    public TourView createTour(@Valid @RequestBody TourRequest req) {
        return venues.createTour(req);
    }

    @PutMapping("/admin/tours/{id}")
    public TourView updateTour(@PathVariable Long id, @Valid @RequestBody TourRequest req) {
        return venues.updateTour(id, req);
    }

    @DeleteMapping("/admin/tours/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTour(@PathVariable Long id) {
        venues.deleteTour(id);
    }

    @GetMapping("/admin/restaurant-reservations")
    public List<ReservationView> allReservations() {
        return venues.allReservations();
    }

    @GetMapping("/admin/tour-bookings")
    public List<TourBookingView> allTourBookings() {
        return venues.allTourBookings();
    }
}
