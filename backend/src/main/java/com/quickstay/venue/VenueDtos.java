package com.quickstay.venue;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/** Request/response cho nha hang, tour va don dat ban / dat tour. Ten truong khop voi frontend (image, hours...). */
public final class VenueDtos {

    private VenueDtos() {}

    static List<String> lines(String s) {
        if (s == null || s.isBlank()) return List.of();
        return Arrays.stream(s.split("\n")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    static String joinLines(List<String> items) {
        if (items == null) return null;
        String joined = String.join("\n", items.stream()
                .filter(x -> x != null && !x.isBlank()).map(String::trim).toList());
        return joined.isEmpty() ? null : joined;
    }

    static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    // ---------- Nha hang ----------

    public record RestaurantRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) String city,
            @Size(max = 255) String cuisine,
            @Size(max = 255) String address,
            @Size(max = 1000) String image,
            @Size(max = 100) String hours,
            @Size(max = 100) String priceRange,
            @Size(max = 20) List<@Size(max = 200) String> specialties,
            @Size(max = 4000) String description) {}

    public record RestaurantView(Long id, String name, String city, String cuisine, String address, String image,
                                 String hours, String priceRange, List<String> specialties, String description,
                                 Long ownerId, String ownerName) {
        static RestaurantView of(Restaurant r) {
            var o = r.getOwner();
            return new RestaurantView(r.getId(), r.getName(), r.getCity(), r.getCuisine(), r.getAddress(),
                    r.getImageUrl(), r.getOpeningHours(), r.getPriceRange(), lines(r.getSpecialties()),
                    r.getDescription(), o == null ? null : o.getId(), o == null ? null : o.getFullName());
        }
    }

    // ---------- Tour ----------

    public record TourRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 255) String city,
            @Size(max = 255) String category,
            @Size(max = 1000) String image,
            @Size(max = 100) String duration,
            @NotNull @DecimalMin("0") @Digits(integer = 17, fraction = 2) BigDecimal price,
            @Size(max = 255) String transport,
            @Size(max = 20) List<@Size(max = 200) String> highlights,
            @Size(max = 4000) String description) {}

    public record TourView(Long id, String title, String city, String category, String image, String duration,
                           BigDecimal price, String transport, List<String> highlights, String description,
                           Long ownerId, String ownerName) {
        static TourView of(Tour t) {
            var o = t.getOwner();
            return new TourView(t.getId(), t.getTitle(), t.getCity(), t.getCategory(), t.getImageUrl(),
                    t.getDuration(), t.getPrice(), t.getTransport(), lines(t.getHighlights()), t.getDescription(),
                    o == null ? null : o.getId(), o == null ? null : o.getFullName());
        }
    }

    // ---------- Don dat ban ----------

    public record ReservationRequest(
            @NotNull LocalDate date,
            @NotBlank @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "gio dang HH:mm") String time,
            @NotNull @Min(1) @Max(50) Integer partySize,
            @NotBlank @Size(max = 255) String guestName,
            @NotBlank @Size(max = 30) String guestPhone,
            @Size(max = 30) String seatingArea,
            @Size(max = 1000) String note) {}

    public record ReservationView(Long id, Long restaurantId, String restaurantName, String restaurantCity,
                                  String userEmail, String guestName, String guestPhone, LocalDate date,
                                  String time, int partySize, String seatingArea, String note,
                                  OrderStatus status, Instant createdAt) {
        static ReservationView of(RestaurantReservation r) {
            var rest = r.getRestaurant();
            return new ReservationView(r.getId(), rest.getId(), rest.getName(), rest.getCity(),
                    r.getUser().getEmail(), r.getGuestName(), r.getGuestPhone(), r.getReservationDate(),
                    r.getReservationTime(), r.getPartySize(), r.getSeatingArea(), r.getNote(),
                    r.getStatus(), r.getCreatedAt());
        }
    }

    // ---------- Don dat tour ----------

    public record TourBookingRequest(
            @NotNull LocalDate date,
            @NotNull @Min(1) @Max(50) Integer guests,
            @NotBlank @Size(max = 255) String guestName,
            @NotBlank @Size(max = 30) String guestPhone,
            @Pattern(regexp = "SEDAN_4|SUV_7|LIMO_VIP", message = "phuong tien khong hop le") String vehicle,
            @Size(max = 1000) String note) {}

    public record TourBookingView(Long id, Long tourId, String tourTitle, String tourCity, String userEmail,
                                  String guestName, String guestPhone, LocalDate date, int guests, String vehicle,
                                  String note, BigDecimal totalPrice, OrderStatus status, Instant createdAt) {
        static TourBookingView of(TourBooking b) {
            var t = b.getTour();
            return new TourBookingView(b.getId(), t.getId(), t.getTitle(), t.getCity(), b.getUser().getEmail(),
                    b.getGuestName(), b.getGuestPhone(), b.getTourDate(), b.getGuests(), b.getVehicle(),
                    b.getNote(), b.getTotalPrice(), b.getStatus(), b.getCreatedAt());
        }
    }

    public record StatusRequest(@NotNull OrderStatus status) {}
}
