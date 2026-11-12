package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phan trang tuy chon cua GET /hotels, /bookings/me, /admin/bookings (T165).
 * Moi test co thanh pho rieng: 5 khach san, trong do 3 co phong Deluxe va 1 khong co phong nao.
 */
class PagingApiTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired BookingRepository bookings;

    private String city;
    private Room room;

    @BeforeEach
    void setUp() {
        city = "PagingCity" + UUID.randomUUID();
        room = room(hotel("A"), "Deluxe", 300_000);
        room(hotel("B"), "Deluxe", 500_000);
        room(hotel("C"), "Deluxe", 900_000);
        room(hotel("D"), "Standard", 100_000);
        hotel("E");   // chua co phong
    }

    private Hotel hotel(String name) {
        Hotel h = new Hotel();
        h.setName("Paging " + name);
        h.setCity(city);
        return hotels.save(h);
    }

    private Room room(Hotel h, String type, long price) {
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType(type);
        r.setPricePerNight(BigDecimal.valueOf(price));
        r.setQuantity(50);
        return rooms.save(r);
    }

    private JsonNode ok(MockHttpServletRequestBuilder req) throws Exception {
        return read(mvc.perform(req).andExpect(status().isOk()).andReturn());
    }

    private MockHttpServletRequestBuilder inCity() {
        return get("/api/hotels").param("city", city);
    }

    private static List<String> names(JsonNode items) {
        List<String> out = new ArrayList<>();
        items.forEach(h -> out.add(h.get("name").asText()));
        return out;
    }

    private static void assertPage(JsonNode p, int size, int page, int pageSize, long totalItems, int totalPages) {
        assertEquals(size, p.get("items").size());
        assertEquals(page, p.get("page").asInt());
        assertEquals(pageSize, p.get("size").asInt());
        assertEquals(totalItems, p.get("totalItems").asLong());
        assertEquals(totalPages, p.get("totalPages").asInt());
    }

    /** Dat n don cua email nay, tra id theo thu tu tao. */
    private List<Long> bookingsOf(String email, int n) {
        User u = users.findByEmail(email).orElseThrow();
        List<Long> ids = new ArrayList<>();
        LocalDate d = LocalDate.of(2031, 1, 1);
        for (int i = 0; i < n; i++) {
            Booking b = new Booking();
            b.setUser(u);
            b.setRoom(room);
            b.setCheckIn(d.plusDays(i));
            b.setCheckOut(d.plusDays(i + 1));
            b.setGuests(1);
            b.setTotalPrice(BigDecimal.ONE);
            ids.add(bookings.save(b).getId());
        }
        return ids;
    }

    private String customer() throws Exception {
        return registerCustomer(newCustomerEmail());
    }

    private static List<Long> ids(JsonNode items) {
        List<Long> out = new ArrayList<>();
        items.forEach(b -> out.add(b.get("id").asLong()));
        return out;
    }

    // ---- Khach san ----

    @Test
    void hotels_without_paging_params_still_return_plain_array() throws Exception {
        JsonNode arr = ok(inCity());
        assertTrue(arr.isArray(), "Frontend hien tai doc mang");
        assertEquals(5, arr.size());
    }

    @Test
    void hotels_are_split_into_pages_without_overlap() throws Exception {
        JsonNode p0 = ok(inCity().param("page", "0").param("size", "2"));
        JsonNode p1 = ok(inCity().param("page", "1").param("size", "2"));
        JsonNode p2 = ok(inCity().param("page", "2").param("size", "2"));

        assertPage(p0, 2, 0, 2, 5, 3);
        assertPage(p1, 2, 1, 2, 5, 3);
        assertPage(p2, 1, 2, 2, 5, 3);
        List<String> all = new ArrayList<>(names(p0.get("items")));
        all.addAll(names(p1.get("items")));
        all.addAll(names(p2.get("items")));
        assertEquals(List.of("Paging A", "Paging B", "Paging C", "Paging D", "Paging E"), all);
    }

    @Test
    void page_past_the_end_is_empty_with_correct_totals() throws Exception {
        assertPage(ok(inCity().param("page", "9").param("size", "2")), 0, 9, 2, 5, 3);
    }

    @Test
    void single_paging_param_uses_defaults_for_the_other() throws Exception {
        assertPage(ok(inCity().param("size", "3")), 3, 0, 3, 5, 2);
        assertPage(ok(inCity().param("page", "0")), 5, 0, 10, 5, 1);
    }

    @Test
    void total_counts_only_hotels_matching_room_filters() throws Exception {
        assertPage(ok(inCity().param("roomType", "deluxe").param("page", "0").param("size", "2")), 2, 0, 2, 3, 2);
        assertPage(ok(inCity().param("maxPrice", "500000").param("page", "0").param("size", "10")), 3, 0, 10, 3, 1);
        assertPage(ok(inCity().param("roomType", "deluxe").param("minPrice", "400000").param("maxPrice", "600000")
                .param("page", "0").param("size", "10")), 1, 0, 10, 1, 1);
    }

    @Test
    void paged_items_keep_min_price_of_matching_rooms() throws Exception {
        JsonNode p = ok(inCity().param("roomType", "deluxe").param("page", "0").param("size", "1"));
        assertEquals(300000, p.get("items").get(0).get("minPrice").asInt());
    }

    @Test
    void paged_search_by_keyword_counts_correctly() throws Exception {
        assertPage(ok(inCity().param("q", "paging a").param("page", "0").param("size", "10")), 1, 0, 10, 1, 1);
        assertPage(ok(inCity().param("q", "khong-co-gi").param("page", "0").param("size", "10")), 0, 0, 10, 0, 0);
    }

    @Test
    void invalid_paging_params_are_400() throws Exception {
        for (Map<String, String> bad : List.of(Map.of("page", "-1"), Map.of("size", "0"), Map.of("size", "101"),
                Map.of("page", "abc"), Map.of("size", "abc"))) {
            MockHttpServletRequestBuilder req = get("/api/hotels");
            bad.forEach(req::param);
            mvc.perform(req).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        }
        ok(inCity().param("size", "100"));
        mvc.perform(inCity().param("minPrice", "9").param("maxPrice", "1").param("page", "0"))
                .andExpect(status().isBadRequest());
    }

    // ---- Lich su dat phong ----

    @Test
    void my_bookings_without_paging_params_still_return_plain_array() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);
        bookingsOf(email, 2);
        JsonNode arr = ok(get("/api/bookings/me").header("Authorization", "Bearer " + token));
        assertTrue(arr.isArray());
        assertEquals(2, arr.size());
    }

    @Test
    void my_bookings_are_paged_newest_first_and_only_mine() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);
        List<Long> mine = bookingsOf(email, 5);
        String otherEmail = newCustomerEmail();
        registerCustomer(otherEmail);
        bookingsOf(otherEmail, 3);

        JsonNode p0 = ok(get("/api/bookings/me").header("Authorization", "Bearer " + token).param("page", "0").param("size", "2"));
        JsonNode p2 = ok(get("/api/bookings/me").header("Authorization", "Bearer " + token).param("page", "2").param("size", "2"));

        assertPage(p0, 2, 0, 2, 5, 3);
        assertEquals(List.of(mine.get(4), mine.get(3)), ids(p0.get("items")));
        assertPage(p2, 1, 2, 2, 5, 3);
        assertEquals(List.of(mine.get(0)), ids(p2.get("items")));
        assertEquals(room.getHotel().getName(), p0.get("items").get(0).get("hotelName").asText());
    }

    @Test
    void my_bookings_paging_requires_login_and_validates() throws Exception {
        mvc.perform(get("/api/bookings/me").param("page", "0")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/bookings/me").header("Authorization", "Bearer " + customer()).param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    // ---- Don cua admin ----

    @Test
    void admin_bookings_are_paged_newest_first() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        List<Long> created = bookingsOf(email, 3);
        String admin = adminToken();

        JsonNode p = ok(get("/api/admin/bookings").header("Authorization", "Bearer " + admin).param("page", "0").param("size", "3"));
        assertEquals(3, p.get("items").size());
        assertTrue(p.get("totalItems").asLong() >= 3);
        assertEquals(List.of(created.get(2), created.get(1), created.get(0)), ids(p.get("items")));

        JsonNode arr = ok(get("/api/admin/bookings").header("Authorization", "Bearer " + admin));
        assertTrue(arr.isArray(), "Frontend admin hien tai doc mang");
    }

    @Test
    void admin_bookings_paging_is_still_admin_only() throws Exception {
        mvc.perform(get("/api/admin/bookings").header("Authorization", "Bearer " + customer()).param("page", "0"))
                .andExpect(status().isForbidden());
    }

    private String adminToken() throws Exception {
        return read(mvc.perform(withBody(post("/api/auth/login"), null,
                Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD))).andReturn()).get("token").asText();
    }
}
