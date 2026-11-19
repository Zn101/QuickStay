package com.quickstay;

import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.hotel.extras.HotelReview;
import com.quickstay.hotel.extras.HotelReviewRepository;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Hoi quy cho cac loi phat hien khi review toan bo code (bao mat, AI, du lieu). */
class ReviewFixesTest extends ApiTestBase {

    /** "Hom nay" theo mui gio nghiep vu cua app (app.timezone), khong theo mui gio may chay test. */
    private static final java.time.ZoneId APP_ZONE = java.time.ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired UserRepository users;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;
    @Autowired HotelReviewRepository reviews;

    private String login(String email, String password) throws Exception {
        return read(mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", password)))
                .andExpect(status().isOk()).andReturn()).get("token").asText();
    }

    private String admin() throws Exception {
        return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private Hotel newHotel() {
        Hotel h = new Hotel();
        h.setName("Fix Test " + UUID.randomUUID());
        h.setCity("Hue");
        return hotels.save(h);
    }

    private Room newRoom(Hotel h, int quantity) {
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setCapacity(2);
        r.setQuantity(quantity);
        return rooms.save(r);
    }

    private Map<String, Object> roomBody(Hotel h, int quantity) {
        Map<String, Object> m = new HashMap<>();
        m.put("hotelId", h.getId());
        m.put("roomType", "Standard");
        m.put("pricePerNight", 500000);
        m.put("capacity", 2);
        m.put("quantity", quantity);
        return m;
    }

    private long book(String token, long roomId, int fromDay, int toDay) throws Exception {
        return read(mvc.perform(withBody(post("/api/bookings"), token, Map.of(
                        "roomId", roomId,
                        "checkIn", LocalDate.now(APP_ZONE).plusDays(fromDay).toString(),
                        "checkOut", LocalDate.now(APP_ZONE).plusDays(toDay).toString(),
                        "guests", 1, "guestName", "Khach", "guestPhone", "0900000000")))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    // ---------- AI guardrails ----------

    @Test
    void ai_rate_limit_has_no_email_based_exemption_and_returns_429() throws Exception {
        // Truoc day email bat dau bang "eval" duoc mien gioi han
        String token = registerCustomer("eval-" + UUID.randomUUID() + "@test.com");
        int tooMany = 0;
        for (int i = 0; i < 30; i++) {
            int s = mvc.perform(withBody(post("/api/ai/chat"), token, Map.of("message", "Xin chao " + i)))
                    .andReturn().getResponse().getStatus();
            if (s == 429) tooMany++;
        }
        org.junit.jupiter.api.Assertions.assertTrue(tooMany >= 5, "phai bi chan sau 25 yeu cau/phut");
    }

    @Test
    void partner_cannot_read_pricing_hints_of_other_hotel() throws Exception {
        Hotel mine = newHotel();
        Hotel other = newHotel();
        String email = "host-" + UUID.randomUUID() + "@test.com";
        mvc.perform(withBody(post("/api/admin/partners"), admin(), Map.of(
                "email", email, "password", "Host@1234", "fullName", "Chu", "hotelId", mine.getId())))
                .andExpect(status().isCreated());
        String partner = login(email, "Host@1234");

        mvc.perform(withBody(get("/api/ai/pricing-hints/" + other.getId()), partner, null)).andExpect(status().isForbidden());
        mvc.perform(withBody(get("/api/ai/pricing-hints/" + mine.getId()), partner, null)).andExpect(status().isOk());

        // Q&A: doi tac chi tra loi cau hoi cua co so minh
        long qMine = read(mvc.perform(withBody(post("/api/hotels/" + mine.getId() + "/questions"), null,
                Map.of("question", "Co bai do xe khong?"))).andReturn()).get("id").asLong();
        long qOther = read(mvc.perform(withBody(post("/api/hotels/" + other.getId() + "/questions"), null,
                Map.of("question", "Co ho boi khong?"))).andReturn()).get("id").asLong();
        mvc.perform(withBody(get("/api/partner/questions"), partner, null))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(qMine));
        mvc.perform(withBody(patch("/api/partner/questions/" + qOther), partner, Map.of("answer", "Co")))
                .andExpect(status().isForbidden());
        mvc.perform(withBody(patch("/api/partner/questions/" + qMine), partner, Map.of("answer", "Co, mien phi")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.answer").value("Co, mien phi"));
    }

    // ---------- JWT thu hoi ----------

    @Test
    void old_tokens_stop_working_after_password_change_but_new_token_works() throws Exception {
        String email = newCustomerEmail();
        String oldToken = registerCustomer(email);
        // Cho sang giay moi de iat cua token cu < tokensValidAfter
        Thread.sleep(1100);
        String newToken = read(mvc.perform(withBody(put("/api/users/me"), oldToken,
                        Map.of("password", "newpass123", "currentPassword", "secret123")))
                .andExpect(status().isOk()).andReturn()).get("token").asText();

        mvc.perform(withBody(get("/api/users/me"), oldToken, null)).andExpect(status().isUnauthorized());
        mvc.perform(withBody(get("/api/users/me"), newToken, null)).andExpect(status().isOk());
    }

    @Test
    void deleted_partner_token_is_rejected_immediately() throws Exception {
        Hotel h = newHotel();
        String email = "host-" + UUID.randomUUID() + "@test.com";
        long id = read(mvc.perform(withBody(post("/api/admin/partners"), admin(), Map.of(
                "email", email, "password", "Host@1234", "fullName", "Chu", "hotelId", h.getId())))
                .andReturn()).get("id").asLong();
        String partner = login(email, "Host@1234");
        mvc.perform(withBody(get("/api/partner/bookings"), partner, null)).andExpect(status().isOk());
        mvc.perform(withBody(delete("/api/admin/partners/" + id), admin(), null)).andExpect(status().isNoContent());
        mvc.perform(withBody(get("/api/partner/bookings"), partner, null)).andExpect(status().isUnauthorized());
    }

    // ---------- Du lieu ----------

    @Test
    void deleting_hotel_with_reviews_and_questions_succeeds() throws Exception {
        Hotel h = newHotel();
        HotelReview r = new HotelReview();
        r.setHotel(h);
        r.setAuthorName("A");
        r.setRating(5);
        r.setComment("Tot");
        reviews.save(r);
        mvc.perform(withBody(post("/api/hotels/" + h.getId() + "/questions"), admin(), Map.of("question", "?")))
                .andExpect(status().isCreated());
        mvc.perform(withBody(delete("/api/admin/hotels/" + h.getId()), admin(), null)).andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertFalse(hotels.existsById(h.getId()));
    }

    @Test
    void room_with_bookings_cannot_move_hotel_or_shrink_below_active_bookings() throws Exception {
        Hotel h = newHotel();
        Hotel other = newHotel();
        Room room = newRoom(h, 3);
        String c = registerCustomer(newCustomerEmail());
        book(c, room.getId(), 10, 12);
        book(c, room.getId(), 11, 13);

        mvc.perform(withBody(put("/api/admin/rooms/" + room.getId()), admin(), roomBody(other, 3)))
                .andExpect(status().isConflict());
        mvc.perform(withBody(put("/api/admin/rooms/" + room.getId()), admin(), roomBody(h, 1)))
                .andExpect(status().isConflict());
        mvc.perform(withBody(put("/api/admin/rooms/" + room.getId()), admin(), roomBody(h, 2)))
                .andExpect(status().isOk());
    }

    @Test
    void booking_length_and_horizon_are_limited() throws Exception {
        Room room = newRoom(newHotel(), 1);
        String c = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), c, Map.of("roomId", room.getId(),
                        "checkIn", LocalDate.now(APP_ZONE).plusDays(1).toString(),
                        "checkOut", LocalDate.now(APP_ZONE).plusDays(40).toString(),
                        "guests", 1, "guestName", "K", "guestPhone", "09")))
                .andExpect(status().isBadRequest());
        mvc.perform(withBody(post("/api/bookings"), c, Map.of("roomId", room.getId(),
                        "checkIn", LocalDate.now(APP_ZONE).plusDays(400).toString(),
                        "checkOut", LocalDate.now(APP_ZONE).plusDays(401).toString(),
                        "guests", 1, "guestName", "K", "guestPhone", "09")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void payment_account_label_is_stored() throws Exception {
        Room room = newRoom(newHotel(), 1);
        String c = registerCustomer(newCustomerEmail());
        long id = book(c, room.getId(), 5, 6);
        mvc.perform(withBody(post("/api/bookings/" + id + "/pay"), c,
                        Map.of("paymentMethod", "CREDIT_CARD", "accountLabel", "Visa **** 4242")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentAccountLabel").value("Visa **** 4242"));
    }

    @Test
    void hotel_without_reviews_has_no_fake_rating() throws Exception {
        Hotel h = newHotel();
        mvc.perform(get("/api/hotels/" + h.getId() + "/extras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewCount").value(0))
                .andExpect(jsonPath("$.averageRating").value(0.0));
    }

    @Test
    void concierge_in_the_past_is_rejected() throws Exception {
        Hotel h = newHotel();
        String c = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/hotels/" + h.getId() + "/concierge"), c, Map.of(
                        "serviceType", "DINING", "serviceTitle", "Ban toi",
                        "serviceDate", LocalDate.now(APP_ZONE).minusDays(1).toString(),
                        "guests", 2, "guestPhone", "0900000000")))
                .andExpect(status().isBadRequest());
    }

    // ---------- Noi dung CMS ----------

    @Test
    void site_content_is_public_to_read_and_admin_only_to_write() throws Exception {
        String customer = registerCustomer(newCustomerEmail());
        List<Map<String, Object>> items = List.of(Map.of("id", 1, "title", "Tour Hue"));
        mvc.perform(withBody(put("/api/admin/content/news"), customer, items)).andExpect(status().isForbidden());
        mvc.perform(withBody(put("/api/admin/content/khong-co"), admin(), items)).andExpect(status().isNotFound());
        mvc.perform(withBody(put("/api/admin/content/tours"), admin(), Map.of("x", 1))).andExpect(status().isBadRequest());
        mvc.perform(withBody(put("/api/admin/content/tours"), admin(), items)).andExpect(status().isOk());
        mvc.perform(get("/api/content/tours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Tour Hue"));
    }

    @Test
    void admin_pending_count_endpoint() throws Exception {
        long expected = bookings.countByStatus(BookingStatus.PENDING);
        mvc.perform(withBody(get("/api/admin/bookings/pending-count"), admin(), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(expected));
    }

}
