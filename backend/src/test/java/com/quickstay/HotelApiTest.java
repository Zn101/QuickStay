package com.quickstay;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HotelApiTest extends ApiTestBase {

    @Test
    void TC_HOTEL_01_list_is_public_and_has_seed_data() throws Exception {
        mvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$[0].minPrice").isNotEmpty());
    }

    @Test
    void TC_HOTEL_02_search_by_city() throws Exception {
        mvc.perform(get("/api/hotels").param("city", "Da Nang"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].city", everyItem(containsString("Da Nang"))))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    void TC_HOTEL_03_search_by_name_keyword_case_insensitive() throws Exception {
        mvc.perform(get("/api/hotels").param("q", "sunrise"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value(containsStringIgnoringCase("Sunrise")));
    }

    @Test
    void TC_HOTEL_04_search_without_result_returns_empty_list() throws Exception {
        mvc.perform(get("/api/hotels").param("q", "khong-ton-tai-xyz"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void TC_HOTEL_05_filter_by_room_type_and_price_range() throws Exception {
        mvc.perform(get("/api/hotels").param("roomType", "Family Suite").param("maxPrice", "1200000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Hoi An Riverside Homestay")))
                .andExpect(jsonPath("$[*].name", not(hasItem("Sunrise Da Nang Hotel"))));
    }

    @Test
    void TC_HOTEL_06_detail_and_rooms() throws Exception {
        long id = read(mvc.perform(get("/api/hotels").param("q", "Saigon")).andReturn()).get(0).get("id").asLong();
        mvc.perform(get("/api/hotels/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Ho Chi Minh"));
        mvc.perform(get("/api/hotels/" + id + "/rooms")).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].available").doesNotExist());
    }

    @Test
    void TC_HOTEL_07_unknown_hotel_is_404() throws Exception {
        mvc.perform(get("/api/hotels/999999")).andExpect(status().isNotFound());
    }

    @Test
    void TC_HOTEL_08_availability_reflects_bookings() throws Exception {
        String admin = adminToken();
        long roomId = newRoom(admin, 2, 2, 500000);
        long hotelId = hotelOf(admin, roomId);
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), customer, bookingBody(roomId, in(10), in(12), 2)))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/hotels/" + hotelId + "/rooms")
                        .param("checkIn", in(10).toString()).param("checkOut", in(12).toString()))
                .andExpect(jsonPath("$[0].available").value(1));
        mvc.perform(get("/api/hotels/" + hotelId + "/rooms")
                        .param("checkIn", in(12).toString()).param("checkOut", in(14).toString()))
                .andExpect(jsonPath("$[0].available").value(2));
    }

    @Test
    void TC_HOTEL_09_invalid_date_range_is_400() throws Exception {
        mvc.perform(get("/api/hotels/1/rooms")
                        .param("checkIn", in(5).toString()).param("checkOut", in(3).toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/hotels/1/rooms").param("checkIn", in(5).toString()))
                .andExpect(status().isBadRequest());
    }

    private long hotelOf(String admin, long roomId) throws Exception {
        var rooms = read(mvc.perform(get("/api/admin/rooms").header("Authorization", "Bearer " + admin)).andReturn());
        for (var r : rooms) if (r.get("id").asLong() == roomId) return r.get("hotelId").asLong();
        throw new IllegalStateException("khong thay phong");
    }
}
