package com.quickstay.venue;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
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
                .filter(x -> x != null && !x.isBlank()).map(x -> x.trim().replace("\n", " ")).toList());
        return joined.isEmpty() ? null : joined;
    }

    static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** "a|b" -> [a, b]; thieu dau "|" thi phan sau rong. */
    private static String[] pair(String line) {
        int i = line.indexOf('|');
        return i < 0 ? new String[]{line.trim(), ""} : new String[]{line.substring(0, i).trim(), line.substring(i + 1).trim()};
    }

    /** Diem trung binh (null neu chua co danh gia) va so danh gia. */
    public record Stats(Double rating, long reviewCount) {
        static final Stats NONE = new Stats(null, 0);

        static Stats of(Object[] row) {
            long count = ((Number) row[1]).longValue();
            Double avg = count == 0 || row[2] == null ? null
                    : Math.round(((Number) row[2]).doubleValue() * 10.0) / 10.0;
            return new Stats(avg, count);
        }
    }

    // ---------- Nha hang ----------

    public record MenuItem(@NotBlank @Size(max = 150) String name, @DecimalMin("0") BigDecimal price) {}

    public record RestaurantRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) String city,
            @Size(max = 255) String cuisine,
            @Size(max = 255) String address,
            @Size(max = 1000) String image,
            @Size(max = 100) String hours,
            @Size(max = 100) String priceRange,
            @Size(max = 20) List<@Size(max = 200) String> specialties,
            @Size(max = 4000) String description,
            @Size(max = 30) String phone,
            @Size(max = 30) List<@Valid MenuItem> menu) {}

    public record RestaurantView(Long id, String name, String city, String cuisine, String address, String image,
                                 String hours, String priceRange, List<String> specialties, String description,
                                 String phone, List<MenuItem> menu, Double rating, long reviewCount,
                                 Long ownerId, String ownerName) {
        static RestaurantView of(Restaurant r, Stats s) {
            var o = r.getOwner();
            List<MenuItem> menu = new ArrayList<>();
            for (String line : lines(r.getMenuItems())) {
                String[] p = pair(line);
                BigDecimal price = null;
                try {
                    price = p[1].isEmpty() ? null : new BigDecimal(p[1]);
                } catch (NumberFormatException ignored) {
                    // gia khong hop le: hien thi mon khong kem gia
                }
                menu.add(new MenuItem(p[0], price));
            }
            return new RestaurantView(r.getId(), r.getName(), r.getCity(), r.getCuisine(), r.getAddress(),
                    r.getImageUrl(), r.getOpeningHours(), r.getPriceRange(), lines(r.getSpecialties()),
                    r.getDescription(), r.getPhone(), menu, s.rating(), s.reviewCount(),
                    o == null ? null : o.getId(), o == null ? null : o.getFullName());
        }
    }

    static String menuToLines(List<MenuItem> menu) {
        if (menu == null) return null;
        return joinLines(menu.stream()
                .filter(m -> m != null && m.name() != null && !m.name().isBlank())
                .map(m -> m.name().replace("|", "/").trim() + "|" + (m.price() == null ? "" : m.price().toPlainString()))
                .toList());
    }

    // ---------- Tour ----------

    public record ItineraryStep(@Size(max = 20) String time, @NotBlank @Size(max = 200) String activity) {}

    public record TourRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 255) String city,
            @Size(max = 255) String category,
            @Size(max = 1000) String image,
            @Size(max = 100) String duration,
            @NotNull @DecimalMin("0") @Digits(integer = 17, fraction = 2) BigDecimal price,
            @Size(max = 255) String transport,
            @Size(max = 20) List<@Size(max = 200) String> highlights,
            @Size(max = 4000) String description,
            @Size(max = 20) List<@Valid ItineraryStep> itinerary,
            @Size(max = 20) List<@Size(max = 200) String> includes,
            @Size(max = 20) List<@Size(max = 200) String> excludes,
            @Size(max = 255) String meetingPoint,
            @Min(1) @Max(1000) Integer maxGuestsPerDay) {}

    public record TourView(Long id, String title, String city, String category, String image, String duration,
                           BigDecimal price, String transport, List<String> highlights, String description,
                           List<ItineraryStep> itinerary, List<String> includes, List<String> excludes,
                           String meetingPoint, int maxGuestsPerDay, Double rating, long reviewCount,
                           Long ownerId, String ownerName) {
        static TourView of(Tour t, Stats s) {
            var o = t.getOwner();
            List<ItineraryStep> steps = lines(t.getItinerary()).stream()
                    .map(l -> {
                        String[] p = pair(l);
                        return p[1].isEmpty() ? new ItineraryStep("", p[0]) : new ItineraryStep(p[0], p[1]);
                    })
                    .toList();
            return new TourView(t.getId(), t.getTitle(), t.getCity(), t.getCategory(), t.getImageUrl(),
                    t.getDuration(), t.getPrice(), t.getTransport(), lines(t.getHighlights()), t.getDescription(),
                    steps, lines(t.getIncludes()), lines(t.getExcludes()), t.getMeetingPoint(),
                    t.getMaxGuestsPerDay(), s.rating(), s.reviewCount(),
                    o == null ? null : o.getId(), o == null ? null : o.getFullName());
        }
    }

    static String itineraryToLines(List<ItineraryStep> steps) {
        if (steps == null) return null;
        return joinLines(steps.stream()
                .filter(st -> st != null && st.activity() != null && !st.activity().isBlank())
                .map(st -> (st.time() == null ? "" : st.time().replace("|", "/").trim()) + "|" + st.activity().replace("|", "/").trim())
                .toList());
    }

    public record Availability(LocalDate date, int maxGuests, long booked, long remaining) {}

    // ---------- Danh gia ----------

    public record ReviewRequest(@NotNull @Min(1) @Max(5) Integer rating, @NotBlank @Size(max = 2000) String comment) {}

    public record ReviewView(Long id, String authorName, int rating, String comment, Instant createdAt) {
        static ReviewView of(VenueReview r) {
            return new ReviewView(r.getId(), r.getAuthorName(), r.getRating(), r.getComment(), r.getCreatedAt());
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
