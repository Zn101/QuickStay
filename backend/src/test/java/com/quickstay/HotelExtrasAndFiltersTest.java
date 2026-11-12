package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Integration tests cho loc theo ngay/vi tri/loai phong, concierge, reviews, Q&A, chinh sach va cai dat. */
class HotelExtrasAndFiltersTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;

    private MockHttpServletRequestBuilder bearer(MockHttpServletRequestBuilder b, String token) {
        return b.header("Authorization", "Bearer " + token);
    }

    private String adminToken() throws Exception {
        MvcResult r = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        return read(r).get("token").asText();
    }

    @Test
    void hotels_filter_by_date_location_and_room_type() throws Exception {
        String uniqueCity = "FilterCity-" + UUID.randomUUID();
        Hotel h = new Hotel();
        h.setName("Unique Filter Hotel");
        h.setCity(uniqueCity);
        hotels.save(h);

        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Penthouse");
        r.setPricePerNight(BigDecimal.valueOf(2_000_000));
        r.setCapacity(2);
        r.setQuantity(1);
        rooms.save(r);

        LocalDate d1 = LocalDate.now().plusDays(15);
        LocalDate d2 = LocalDate.now().plusDays(17);

        // Truoc khi dat: khach san hien thi voi loc ngay + dia diem + loai phong
        mvc.perform(get("/api/hotels")
                        .param("city", uniqueCity)
                        .param("roomType", "Penthouse")
                        .param("checkIn", d1.toString())
                        .param("checkOut", d2.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(h.getId()));

        // Dat het 1 phong duy nhat
        String token = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), token, Map.of(
                        "roomId", r.getId(),
                        "checkIn", d1.toString(),
                        "checkOut", d2.toString(),
                        "guests", 2,
                        "guestName", "Khach",
                        "guestPhone", "0912345678")))
                .andExpect(status().isCreated());

        // Trong khoang ngay da het phong: khong con trong ket qua loc
        mvc.perform(get("/api/hotels")
                        .param("city", uniqueCity)
                        .param("roomType", "Penthouse")
                        .param("checkIn", d1.toString())
                        .param("checkOut", d2.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Ngay lien ke van con phong
        mvc.perform(get("/api/hotels")
                        .param("city", uniqueCity)
                        .param("roomType", "Penthouse")
                        .param("checkIn", d2.toString())
                        .param("checkOut", d2.plusDays(2).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // Ngay khong hop le -> 400
        mvc.perform(get("/api/hotels").param("checkIn", d1.toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/hotels").param("checkIn", d2.toString()).param("checkOut", d1.toString()))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/hotels/room-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem("Penthouse")));
    }

    @Test
    void extras_reviews_qa_and_concierge_services_work_end_to_end() throws Exception {
        long hotelId = hotels.findAll().get(0).getId();
        String customer = registerCustomer(newCustomerEmail());
        String admin = adminToken();

        // Extras: photos, airport transfers, dining, attractions, amenities, policies
        mvc.perform(get("/api/hotels/" + hotelId + "/extras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos", not(empty())))
                .andExpect(jsonPath("$.airportTransfers", not(empty())))
                .andExpect(jsonPath("$.diningOptions", not(empty())))
                .andExpect(jsonPath("$.attractionTransports", not(empty())))
                .andExpect(jsonPath("$.categorizedAmenities", not(empty())))
                .andExpect(jsonPath("$.policies", not(empty())));

        // Reviews
        mvc.perform(withBody(post("/api/hotels/" + hotelId + "/reviews"), null,
                        Map.of("rating", 5, "comment", "Tuyet voi")))
                .andExpect(status().isUnauthorized());
        mvc.perform(withBody(post("/api/hotels/" + hotelId + "/reviews"), customer,
                        Map.of("rating", 5, "comment", "Dich vu dua don san bay rat tot", "stayType", "Cong tac")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5));
        mvc.perform(get("/api/hotels/" + hotelId + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].comment", containsString("dua don san bay")));

        // Q&A: khach hoi (public), admin tra loi (ADMIN only)
        MvcResult qRes = mvc.perform(withBody(post("/api/hotels/" + hotelId + "/questions"), null,
                        Map.of("authorName", "Ban Doc", "question", "Co cho thue xe may khong?")))
                .andExpect(status().isCreated())
                .andReturn();
        long qId = read(qRes).get("id").asLong();

        mvc.perform(withBody(patch("/api/admin/questions/" + qId), customer, Map.of("answer", "Co")))
                .andExpect(status().isForbidden());
        mvc.perform(withBody(patch("/api/admin/questions/" + qId), admin,
                        Map.of("answer", "Co cho thue xe tay ga 150k/ngay tai le tan")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer", containsString("150k/ngay")));

        // Concierge: dat dua don san bay / am thuc / xe tham quan
        mvc.perform(withBody(post("/api/hotels/" + hotelId + "/concierge"), customer, Map.of(
                        "serviceType", "AIRPORT_TRANSFER",
                        "serviceTitle", "Xe Sedan 4 chỗ riêng tư",
                        "serviceDate", LocalDate.now().plusDays(3).toString(),
                        "serviceTime", "14:30",
                        "guests", 2,
                        "guestPhone", "0912345678",
                        "details", "Chuyen bay VN123",
                        "estimatedFee", 250000)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.serviceType").value("AIRPORT_TRANSFER"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        mvc.perform(bearer(get("/api/concierge/me"), customer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(bearer(get("/api/admin/concierge"), customer)).andExpect(status().isForbidden());
        mvc.perform(bearer(get("/api/admin/concierge"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
    }

    @Test
    void user_account_and_app_settings_persist() throws Exception {
        String token = registerCustomer(newCustomerEmail());
        mvc.perform(get("/api/users/me/settings")).andExpect(status().isUnauthorized());

        mvc.perform(bearer(get("/api/users/me/settings"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredLanguage").value("vi"))
                .andExpect(jsonPath("$.currencyDisplay").value("VND"))
                .andExpect(jsonPath("$.notifyEmail").value(true));

        mvc.perform(withBody(put("/api/users/me/settings"), token, Map.of(
                        "preferredLanguage", "en",
                        "currencyDisplay", "USD",
                        "notifyEmail", false,
                        "notifyPromo", true,
                        "compactMode", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredLanguage").value("en"))
                .andExpect(jsonPath("$.currencyDisplay").value("USD"))
                .andExpect(jsonPath("$.notifyEmail").value(false))
                .andExpect(jsonPath("$.notifyPromo").value(true))
                .andExpect(jsonPath("$.compactMode").value(true));

        MvcResult reRead = mvc.perform(bearer(get("/api/users/me/settings"), token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = read(reRead);
        assertEquals("en", json.get("preferredLanguage").asText());
        assertEquals("USD", json.get("currencyDisplay").asText());
    }
}
