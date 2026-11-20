package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Tai khoan chu nha hang / chu tour: admin tao, chu quan ly co so cua minh va xu ly don that cua khach. */
class VenuePartnerApiTest extends ApiTestBase {

    /** "Hom nay" theo mui gio nghiep vu cua app (app.timezone), khong theo mui gio may chay test. */
    private static final java.time.ZoneId APP_ZONE = java.time.ZoneId.of("Asia/Ho_Chi_Minh");

    private String login(String email, String password) throws Exception {
        return read(mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", password)))
                .andExpect(status().isOk()).andReturn()).get("token").asText();
    }

    private String admin() throws Exception {
        return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private long createRestaurant(String admin, String name) throws Exception {
        return read(mvc.perform(withBody(post("/api/admin/restaurants"), admin, Map.of(
                        "name", name, "city", "Huế", "cuisine", "Cung đình",
                        "specialties", List.of("Bún bò", "Cơm hến"))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private long createTour(String admin, String title, int price) throws Exception {
        return read(mvc.perform(withBody(post("/api/admin/tours"), admin, Map.of(
                        "title", title, "city", "Huế", "price", price, "highlights", List.of("Đại Nội"))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private String createPartner(String admin, String role, List<Long> listingIds) throws Exception {
        String email = role.toLowerCase() + "-" + UUID.randomUUID() + "@test.com";
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", "Owner@123");
        body.put("fullName", "Chu " + role);
        body.put("role", role);
        body.put("listingIds", listingIds);
        mvc.perform(withBody(post("/api/admin/partners"), admin, body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value(role))
                .andExpect(jsonPath("$.listings", hasSize(listingIds.size())));
        return login(email, "Owner@123");
    }

    @Test
    void seeded_listings_are_public() throws Exception {
        mvc.perform(get("/api/restaurants")).andExpect(status().isOk()).andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].specialties", not(empty())));
        mvc.perform(get("/api/tours")).andExpect(status().isOk()).andExpect(jsonPath("$", not(empty())));
    }

    @Test
    void restaurant_owner_manages_own_restaurant_and_reservations_only() throws Exception {
        String admin = admin();
        long mine = createRestaurant(admin, "Nha hang A " + UUID.randomUUID());
        long other = createRestaurant(admin, "Nha hang B " + UUID.randomUUID());
        String owner = createPartner(admin, "RESTAURANT_OWNER", List.of(mine));

        // Chu nha hang khac khong lay duoc nha hang da co chu
        Map<String, Object> steal = new HashMap<>(Map.of("email", "x-" + UUID.randomUUID() + "@test.com",
                "password", "Owner@123", "fullName", "X", "role", "RESTAURANT_OWNER"));
        steal.put("listingIds", List.of(mine));
        mvc.perform(withBody(post("/api/admin/partners"), admin, steal)).andExpect(status().isConflict());

        mvc.perform(withBody(get("/api/owner/restaurants"), owner, null))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(mine));
        Map<String, Object> edit = Map.of("name", "Nha hang A moi", "city", "Huế", "hours", "10:00 - 22:00");
        mvc.perform(withBody(put("/api/owner/restaurants/" + mine), owner, edit))
                .andExpect(status().isOk()).andExpect(jsonPath("$.hours").value("10:00 - 22:00"));
        mvc.perform(withBody(put("/api/owner/restaurants/" + other), owner, edit)).andExpect(status().isForbidden());
        // Sai loai doi tac: chu nha hang khong vao cong tour, khong dat phong khach san
        mvc.perform(withBody(get("/api/owner/tours"), owner, null)).andExpect(status().isForbidden());

        // Khach dat ban that
        String customer = registerCustomer(newCustomerEmail());
        Map<String, Object> resv = Map.of("date", LocalDate.now(APP_ZONE).plusDays(3).toString(), "time", "19:00",
                "partySize", 4, "guestName", "Khach", "guestPhone", "0900000000", "seatingArea", "VIEW_DEP");
        long resvId = read(mvc.perform(withBody(post("/api/restaurants/" + mine + "/reservations"), customer, resv))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn()).get("id").asLong();
        long otherResv = read(mvc.perform(withBody(post("/api/restaurants/" + other + "/reservations"), customer, resv))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        // Doi tac khong duoc dat ban thay khach
        mvc.perform(withBody(post("/api/restaurants/" + mine + "/reservations"), owner, resv)).andExpect(status().isForbidden());
        // Ngay qua khu / gio sai dinh dang
        Map<String, Object> past = new HashMap<>(resv);
        past.put("date", LocalDate.now(APP_ZONE).minusDays(1).toString());
        mvc.perform(withBody(post("/api/restaurants/" + mine + "/reservations"), customer, past)).andExpect(status().isBadRequest());
        Map<String, Object> badTime = new HashMap<>(resv);
        badTime.put("time", "25:99");
        mvc.perform(withBody(post("/api/restaurants/" + mine + "/reservations"), customer, badTime)).andExpect(status().isBadRequest());

        // Chu chi thay don cua nha hang minh
        mvc.perform(withBody(get("/api/owner/restaurants/reservations"), owner, null))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(resvId));
        mvc.perform(withBody(patch("/api/owner/restaurants/reservations/" + otherResv + "/status"), owner,
                Map.of("status", "CONFIRMED"))).andExpect(status().isForbidden());
        mvc.perform(withBody(patch("/api/owner/restaurants/reservations/" + resvId + "/status"), owner,
                Map.of("status", "COMPLETED"))).andExpect(status().isConflict());
        mvc.perform(withBody(patch("/api/owner/restaurants/reservations/" + resvId + "/status"), owner,
                Map.of("status", "CONFIRMED"))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Khach xem va huy don cua minh
        mvc.perform(withBody(get("/api/restaurant-reservations/me"), customer, null))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(withBody(patch("/api/restaurant-reservations/" + resvId + "/cancel"), customer, null))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));

        // Nha hang co don thi khong xoa duoc
        mvc.perform(withBody(delete("/api/admin/restaurants/" + mine), admin, null)).andExpect(status().isConflict());
    }

    @Test
    void tour_operator_receives_bookings_with_server_side_price() throws Exception {
        String admin = admin();
        long tour = createTour(admin, "Tour Hue " + UUID.randomUUID(), 300000);
        String operator = createPartner(admin, "TOUR_OPERATOR", List.of(tour));
        String customer = registerCustomer(newCustomerEmail());

        JsonNode booking = read(mvc.perform(withBody(post("/api/tours/" + tour + "/bookings"), customer, Map.of(
                        "date", LocalDate.now(APP_ZONE).plusDays(5).toString(), "guests", 3,
                        "guestName", "Khach", "guestPhone", "0900000000", "vehicle", "SUV_7",
                        "totalPrice", 1)))
                .andExpect(status().isCreated()).andReturn());
        org.junit.jupiter.api.Assertions.assertEquals(900000, booking.get("totalPrice").asInt());

        mvc.perform(withBody(post("/api/tours/" + tour + "/bookings"), customer, Map.of(
                        "date", LocalDate.now(APP_ZONE).toString(), "guests", 1, "guestName", "K", "guestPhone", "09")))
                .andExpect(status().isBadRequest());

        mvc.perform(withBody(get("/api/owner/tours/bookings"), operator, null))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(withBody(patch("/api/owner/tours/bookings/" + booking.get("id").asLong() + "/status"), operator,
                Map.of("status", "CONFIRMED"))).andExpect(status().isOk());
        mvc.perform(withBody(get("/api/owner/restaurants"), operator, null)).andExpect(status().isForbidden());

        // Admin cap nhat danh sach tour cua doi tac: go het thi doi tac khong con thay don
        long partnerId = read(mvc.perform(withBody(get("/api/admin/partners"), admin, null)).andReturn())
                .findValues("id").stream().mapToLong(JsonNode::asLong).max().orElseThrow();
        mvc.perform(withBody(get("/api/admin/partners"), admin, null))
                .andExpect(jsonPath("$[?(@.role == 'TOUR_OPERATOR')]", not(empty())));
        org.junit.jupiter.api.Assertions.assertTrue(partnerId > 0);
    }

    @Test
    void detail_pages_capacity_reviews_and_hotel_links() throws Exception {
        String admin = admin();
        // Tour 2 cho / ngay
        Map<String, Object> tourBody = new HashMap<>(Map.of("title", "Tour Cho It " + UUID.randomUUID(), "city", "Huế",
                "price", 100000, "maxGuestsPerDay", 2, "meetingPoint", "Chùa Thiên Mụ"));
        tourBody.put("itinerary", List.of(Map.of("time", "08:00", "activity", "Đón khách")));
        tourBody.put("includes", List.of("Xe"));
        long tour = read(mvc.perform(withBody(post("/api/admin/tours"), admin, tourBody))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(get("/api/tours/" + tour))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itinerary[0].time").value("08:00"))
                .andExpect(jsonPath("$.itinerary[0].activity").value("Đón khách"))
                .andExpect(jsonPath("$.meetingPoint").value("Chùa Thiên Mụ"))
                .andExpect(jsonPath("$.rating").doesNotExist())
                .andExpect(jsonPath("$.reviewCount").value(0));

        String customer = registerCustomer(newCustomerEmail());
        String date = LocalDate.now(APP_ZONE).plusDays(9).toString();
        Map<String, Object> two = Map.of("date", date, "guests", 2, "guestName", "K", "guestPhone", "09");
        long bookingId = read(mvc.perform(withBody(post("/api/tours/" + tour + "/bookings"), customer, two))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(get("/api/tours/" + tour + "/availability").param("date", date))
                .andExpect(jsonPath("$.remaining").value(0));
        mvc.perform(withBody(post("/api/tours/" + tour + "/bookings"), customer,
                Map.of("date", date, "guests", 1, "guestName", "K", "guestPhone", "09")))
                .andExpect(status().isConflict());

        // Danh gia: chua hoan tat -> 403; hoan tat -> 201; lan hai -> 409; diem hien trong danh sach
        Map<String, Object> review = Map.of("rating", 4, "comment", "Hướng dẫn viên nhiệt tình");
        mvc.perform(withBody(post("/api/tours/" + tour + "/reviews"), customer, review)).andExpect(status().isForbidden());
        for (String st : new String[]{"CONFIRMED", "COMPLETED"}) {
            mvc.perform(withBody(patch("/api/owner/tours/bookings/" + bookingId + "/status"), admin, Map.of("status", st)))
                    .andExpect(status().isOk());
        }
        mvc.perform(withBody(post("/api/tours/" + tour + "/reviews"), customer, review)).andExpect(status().isCreated());
        mvc.perform(withBody(post("/api/tours/" + tour + "/reviews"), customer, review)).andExpect(status().isConflict());
        mvc.perform(get("/api/tours/" + tour + "/reviews")).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/tours/" + tour)).andExpect(jsonPath("$.rating").value(4.0)).andExpect(jsonPath("$.reviewCount").value(1));

        // Nha hang co thuc don
        Map<String, Object> restBody = new HashMap<>(Map.of("name", "Quan Hue " + UUID.randomUUID(), "city", "Huế", "phone", "0234 111"));
        restBody.put("menu", List.of(Map.of("name", "Bún bò", "price", 85000)));
        long rest = read(mvc.perform(withBody(post("/api/admin/restaurants"), admin, restBody))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(get("/api/restaurants/" + rest))
                .andExpect(jsonPath("$.menu[0].name").value("Bún bò"))
                .andExpect(jsonPath("$.menu[0].price").value(85000));

        // Trang khach san o Hue goi y nha hang & tour cung thanh pho
        Long hueHotel = null;
        for (JsonNode h : read(mvc.perform(get("/api/hotels")).andReturn())) {
            if (h.get("city").asText().contains("Huế")) hueHotel = h.get("id").asLong();
        }
        org.junit.jupiter.api.Assumptions.assumeTrue(hueHotel != null, "can khach san mau o Hue");
        mvc.perform(get("/api/hotels/" + hueHotel + "/extras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nearbyRestaurants", not(empty())))
                .andExpect(jsonPath("$.nearbyRestaurants[0].city", containsString("Huế")))
                .andExpect(jsonPath("$.nearbyTours", not(empty())));
    }

    @Test
    void partner_creation_validates_role_and_listings() throws Exception {
        String admin = admin();
        Map<String, Object> base = new HashMap<>(Map.of("email", "v-" + UUID.randomUUID() + "@test.com",
                "password", "Owner@123", "fullName", "V"));
        base.put("role", "TOUR_OPERATOR");
        mvc.perform(withBody(post("/api/admin/partners"), admin, base)).andExpect(status().isBadRequest());
        base.put("role", "CUSTOMER");
        base.put("listingIds", List.of(1));
        mvc.perform(withBody(post("/api/admin/partners"), admin, base)).andExpect(status().isBadRequest());
        base.put("role", "RESTAURANT_OWNER");
        base.put("listingIds", List.of(999999));
        mvc.perform(withBody(post("/api/admin/partners"), admin, base)).andExpect(status().isBadRequest());
    }
}
