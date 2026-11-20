package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Doi tac khach san tu quan ly loai phong, lich dong phong, noi dung trang;
 * dong y chinh sach khi dang ky; chinh sach huy truoc ngay nhan phong.
 */
class PartnerInventoryApiTest extends ApiTestBase {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;
    @Autowired UserRepository users;

    private String login(String email, String password) throws Exception {
        return read(mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", password)))
                .andExpect(status().isOk()).andReturn()).get("token").asText();
    }

    private String admin() throws Exception {
        return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private Hotel newHotel() {
        Hotel h = new Hotel();
        h.setName("Inventory Test " + UUID.randomUUID());
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

    private String partnerOf(Hotel h) throws Exception {
        String email = "host-" + UUID.randomUUID() + "@test.com";
        mvc.perform(withBody(post("/api/admin/partners"), admin(), Map.of(
                "email", email, "password", "Host@1234", "fullName", "Chu", "hotelId", h.getId())))
                .andExpect(status().isCreated());
        return login(email, "Host@1234");
    }

    private static LocalDate day(int n) {
        return LocalDate.now(APP_ZONE).plusDays(n);
    }

    private static Map<String, Object> roomBody(String type, int qty) {
        Map<String, Object> m = new HashMap<>();
        m.put("roomType", type);
        m.put("pricePerNight", 700000);
        m.put("capacity", 3);
        m.put("quantity", qty);
        m.put("areaSqm", 32);
        m.put("bedInfo", "1 giuong King");
        m.put("amenities", "Ban cong, Bon tam");
        m.put("imageUrls", "https://img.test/a.jpg\nhttps://img.test/b.jpg");
        return m;
    }

    @Test
    void partner_manages_own_room_types_and_public_page_shows_details() throws Exception {
        Hotel h = newHotel();
        String partner = partnerOf(h);

        long id = read(mvc.perform(withBody(post("/api/partner/rooms"), partner, roomBody("Deluxe", 4)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hotelId").value(h.getId()))
                .andReturn()).get("id").asLong();

        mvc.perform(get("/api/hotels/" + h.getId() + "/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomType").value("Deluxe"))
                .andExpect(jsonPath("$[0].areaSqm").value(32))
                .andExpect(jsonPath("$[0].amenities", contains("Ban cong", "Bon tam")))
                .andExpect(jsonPath("$[0].images", hasSize(2)));

        Map<String, Object> upd = roomBody("Deluxe Ocean", 5);
        upd.put("hotelId", 999999); // doi tac khong chuyen duoc phong sang co so khac
        mvc.perform(withBody(put("/api/partner/rooms/" + id), partner, upd))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotelId").value(h.getId()))
                .andExpect(jsonPath("$.roomType").value("Deluxe Ocean"));

        mvc.perform(withBody(delete("/api/partner/rooms/" + id), partner, null)).andExpect(status().isNoContent());
    }

    @Test
    void partner_cannot_touch_rooms_of_another_hotel() throws Exception {
        Hotel mine = newHotel();
        Room other = newRoom(newHotel(), 2);
        String partner = partnerOf(mine);

        mvc.perform(withBody(put("/api/partner/rooms/" + other.getId()), partner, roomBody("Hack", 1)))
                .andExpect(status().isForbidden());
        mvc.perform(withBody(delete("/api/partner/rooms/" + other.getId()), partner, null))
                .andExpect(status().isForbidden());
        mvc.perform(withBody(post("/api/partner/closures"), partner, Map.of(
                "roomId", other.getId(), "startDate", day(3).toString(), "endDate", day(5).toString(), "units", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void customer_cannot_use_partner_inventory_api() throws Exception {
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(get("/api/partner/rooms"), customer, null)).andExpect(status().isForbidden());
        mvc.perform(withBody(get("/api/partner/calendar"), customer, null)).andExpect(status().isForbidden());
    }

    @Test
    void closing_rooms_reduces_availability_and_blocks_booking() throws Exception {
        Hotel h = newHotel();
        Room room = newRoom(h, 2);
        String partner = partnerOf(h);

        long closure = read(mvc.perform(withBody(post("/api/partner/closures"), partner, Map.of(
                "roomId", room.getId(), "startDate", day(10).toString(), "endDate", day(12).toString(),
                "units", 2, "reason", "Bao tri")))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();

        mvc.perform(get("/api/hotels/" + h.getId() + "/rooms")
                        .param("checkIn", day(11).toString()).param("checkOut", day(12).toString()))
                .andExpect(jsonPath("$[0].available").value(0));

        JsonNode cal = read(mvc.perform(withBody(get("/api/partner/calendar"), partner, null)
                .param("from", day(10).toString()).param("days", "3")).andExpect(status().isOk()).andReturn());
        JsonNode cells = cal.get("rooms").get(0).get("days");
        assertEquals(2, cells.get(0).get("closed").asInt());
        assertEquals(0, cells.get(0).get("available").asInt());
        assertEquals(2, cells.get(2).get("available").asInt()); // ngay mo lai

        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), customer, Map.of(
                "roomId", room.getId(), "checkIn", day(10).toString(), "checkOut", day(11).toString(), "guests", 1,
                "guestName", "Khach", "guestPhone", "0900000000")))
                .andExpect(status().isConflict());

        mvc.perform(withBody(delete("/api/partner/closures/" + closure), partner, null)).andExpect(status().isNoContent());
        mvc.perform(withBody(post("/api/bookings"), customer, Map.of(
                "roomId", room.getId(), "checkIn", day(10).toString(), "checkOut", day(11).toString(), "guests", 1,
                "guestName", "Khach", "guestPhone", "0900000000")))
                .andExpect(status().isCreated());
    }

    @Test
    void cannot_close_more_rooms_than_are_free() throws Exception {
        Hotel h = newHotel();
        Room room = newRoom(h, 1);
        String partner = partnerOf(h);
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), customer, Map.of(
                "roomId", room.getId(), "checkIn", day(20).toString(), "checkOut", day(22).toString(), "guests", 1,
                "guestName", "Khach", "guestPhone", "0900000000")))
                .andExpect(status().isCreated());

        mvc.perform(withBody(post("/api/partner/closures"), partner, Map.of(
                "roomId", room.getId(), "startDate", day(21).toString(), "endDate", day(23).toString(), "units", 1)))
                .andExpect(status().isConflict());
        mvc.perform(withBody(post("/api/partner/closures"), partner, Map.of(
                "roomId", room.getId(), "startDate", day(-1).toString(), "endDate", day(1).toString(), "units", 1)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void partner_edits_hotel_page_content_and_basic_form_keeps_it() throws Exception {
        Hotel h = newHotel();
        String partner = partnerOf(h);
        Map<String, Object> body = new HashMap<>();
        body.put("name", h.getName());
        body.put("city", "Hue");
        body.put("checkInTime", "15:00");
        body.put("checkOutTime", "11:00");
        body.put("houseRules", "Thu cung|Khong nhan thu cung");
        body.put("transfers", "Xe 4 cho|Vios|3|25 phut|300000");
        body.put("dining", "Bistro|Viet|06:00 - 10:00|Pho bo|Tu 50.000");
        body.put("gallery", "https://img.test/lobby.jpg|Sanh");
        mvc.perform(withBody(put("/api/partner/hotel/" + h.getId()), partner, body)).andExpect(status().isOk());

        mvc.perform(get("/api/hotels/" + h.getId() + "/extras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.airportTransfers[0].price").value(300000))
                .andExpect(jsonPath("$.diningOptions[0].name").value("Bistro"))
                .andExpect(jsonPath("$.attractionTransports", empty()))
                .andExpect(jsonPath("$.photos[0].caption").value("Sanh"))
                .andExpect(jsonPath("$.policies[0].detail", containsString("15:00")))
                .andExpect(jsonPath("$.policies[1].title").value("Thu cung"));

        // Form thong tin co ban (khong gui truong noi dung) khong xoa noi dung da nhap
        mvc.perform(withBody(put("/api/partner/hotel/" + h.getId()), partner, Map.of("name", h.getName(), "city", "Hue")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transfers").value("Xe 4 cho|Vios|3|25 phut|300000"));

        body.put("transfers", "Xe 4 cho|Vios|3|25 phut|khong-phai-so");
        mvc.perform(withBody(put("/api/partner/hotel/" + h.getId()), partner, body)).andExpect(status().isBadRequest());
        body.put("transfers", "");
        body.put("checkInTime", "25:00");
        mvc.perform(withBody(put("/api/partner/hotel/" + h.getId()), partner, body)).andExpect(status().isBadRequest());
    }

    @Test
    void new_hotel_without_content_shows_no_fake_extras() throws Exception {
        Hotel h = newHotel();
        mvc.perform(get("/api/hotels/" + h.getId() + "/extras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos", empty()))
                .andExpect(jsonPath("$.airportTransfers", empty()))
                .andExpect(jsonPath("$.diningOptions", empty()))
                .andExpect(jsonPath("$.averageRating").value(0.0));
        mvc.perform(get("/api/hotels/" + h.getId()))
                .andExpect(jsonPath("$.rating").doesNotExist())
                .andExpect(jsonPath("$.reviewCount").value(0));
    }

    @Test
    void register_requires_policy_consent_and_records_it() throws Exception {
        String email = newCustomerEmail();
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", email, "password", "secret123", "fullName", "An")))
                .andExpect(status().isBadRequest());
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("acceptedTerms", false, "email", email, "password", "secret123", "fullName", "An")))
                .andExpect(status().isBadRequest());
        registerCustomer(email);
        var u = users.findByEmail(email).orElseThrow();
        assertNotNull(u.getTermsAcceptedAt());
        assertEquals(com.quickstay.user.AuthService.TERMS_VERSION, u.getTermsVersion());
    }

    @Test
    void customer_can_cancel_confirmed_booking_before_check_in_day_only() throws Exception {
        Room room = newRoom(newHotel(), 3);
        String customer = registerCustomer(newCustomerEmail());
        long future = read(mvc.perform(withBody(post("/api/bookings"), customer, Map.of(
                "roomId", room.getId(), "checkIn", day(5).toString(), "checkOut", day(6).toString(), "guests", 1,
                "guestName", "Khach", "guestPhone", "0900000000"))).andReturn()).get("id").asLong();
        Booking b = bookings.findById(future).orElseThrow();
        b.setStatus(BookingStatus.CONFIRMED);
        bookings.save(b);
        mvc.perform(withBody(patch("/api/bookings/" + future + "/cancel"), customer, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        long today = read(mvc.perform(withBody(post("/api/bookings"), customer, Map.of(
                "roomId", room.getId(), "checkIn", day(0).toString(), "checkOut", day(1).toString(), "guests", 1,
                "guestName", "Khach", "guestPhone", "0900000000"))).andReturn()).get("id").asLong();
        mvc.perform(withBody(patch("/api/bookings/" + today + "/cancel"), customer, null))
                .andExpect(status().isConflict());
    }
}
