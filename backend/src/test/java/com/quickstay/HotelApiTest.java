package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * GET /api/hotels (T048, T049, T050) tren du lieu mau:
 * Sunrise Da Nang 650k/950k/1.6tr (Family Suite), Old Quarter Ha Noi 550k/850k,
 * Saigon Central Inn 480k/720k, Hoi An Riverside 520k/1.1tr (Family Suite).
 */
class HotelApiTest extends ApiTestBase {

    private static final String SUNRISE = "Sunrise Đà Nẵng Hotel";
    private static final String OLD_QUARTER = "Old Quarter Boutique Hà Nội";
    private static final String SAIGON = "Saigon Central Inn";
    private static final String HOI_AN = "Hội An Riverside Homestay";

    @Autowired HotelRepository hotelRepo;

    private JsonNode list(MockHttpServletRequestBuilder req) throws Exception {
        return read(mvc.perform(req).andExpect(status().isOk()).andReturn());
    }

    private static List<String> names(JsonNode arr) {
        List<String> out = new ArrayList<>();
        arr.forEach(h -> out.add(h.get("name").asText()));
        return out;
    }

    private static JsonNode byName(JsonNode arr, String name) {
        for (JsonNode h : arr) {
            if (h.get("name").asText().equals(name)) return h;
        }
        return fail("khong co " + name);
    }

    @Test
    void TC_HOTEL_01_public_list_with_min_price() throws Exception {
        JsonNode arr = list(get("/api/hotels"));
        assertTrue(names(arr).containsAll(List.of(SUNRISE, OLD_QUARTER, SAIGON, HOI_AN)));
        JsonNode sunrise = byName(arr, SUNRISE);
        assertEquals(650000, sunrise.get("minPrice").asInt());
        assertEquals("Đà Nẵng", sunrise.get("city").asText());
        for (String field : List.of("id", "address", "description", "imageUrl", "amenities")) {
            assertTrue(sunrise.hasNonNull(field), "thieu truong " + field);
        }
        assertEquals(480000, byName(arr, SAIGON).get("minPrice").asInt());
    }

    @Test
    void TC_HOTEL_02_search_by_city_partial() throws Exception {
        assertEquals(List.of(SUNRISE), names(list(get("/api/hotels").param("city", "nẵng"))));
        assertEquals(List.of(SAIGON), names(list(get("/api/hotels").param("city", "hồ chí"))));
    }

    @Test
    void TC_HOTEL_03_q_matches_name_or_city_case_insensitive() throws Exception {
        assertEquals(List.of(SUNRISE), names(list(get("/api/hotels").param("q", "SUNRISE"))));
        assertEquals(List.of(OLD_QUARTER), names(list(get("/api/hotels").param("q", "hà nội"))));
        assertEquals(List.of(HOI_AN), names(list(get("/api/hotels").param("q", "riverside"))));
        assertEquals(List.of(SAIGON), names(list(get("/api/hotels").param("q", "saigon").param("city", "Hồ Chí Minh"))));
    }

    @Test
    void TC_HOTEL_04_no_result_returns_empty_list() throws Exception {
        mvc.perform(get("/api/hotels").param("q", "khong-ton-tai-xyz"))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        // Ky tu dac biet cua LIKE duoc hieu theo nghia den, khong khop moi thu
        mvc.perform(get("/api/hotels").param("q", "%")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/hotels").param("q", "_")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void TC_HOTEL_05_filter_by_room_type_returns_price_of_matching_rooms() throws Exception {
        JsonNode arr = list(get("/api/hotels").param("roomType", "family suite"));
        assertEquals(List.of(SUNRISE, HOI_AN), names(arr));
        assertEquals(1600000, byName(arr, SUNRISE).get("minPrice").asInt(), "gia cua Family Suite, khong phai Standard");
        assertEquals(1100000, byName(arr, HOI_AN).get("minPrice").asInt());
        // Khop chinh xac: "Suite" khong khop "Family Suite"
        mvc.perform(get("/api/hotels").param("roomType", "Suite")).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void TC_HOTEL_05b_filter_by_price_range() throws Exception {
        JsonNode cheap = list(get("/api/hotels").param("maxPrice", "500000"));
        assertEquals(List.of(SAIGON), names(cheap));

        JsonNode mid = list(get("/api/hotels").param("minPrice", "900000").param("maxPrice", "1200000"));
        assertEquals(List.of(SUNRISE, HOI_AN), names(mid));
        assertEquals(950000, byName(mid, SUNRISE).get("minPrice").asInt(), "phong re nhat trong khoang gia");

        JsonNode combined = list(get("/api/hotels").param("roomType", "deluxe").param("maxPrice", "800000"));
        assertEquals(List.of(SAIGON), names(combined));
        assertEquals(720000, byName(combined, SAIGON).get("minPrice").asInt());
    }

    @Test
    void TC_HOTEL_05c_hotel_without_rooms_only_listed_when_no_room_filter() throws Exception {
        Hotel empty = new Hotel();
        empty.setName("Empty " + UUID.randomUUID());
        empty.setCity("Test City");
        hotelRepo.save(empty);

        JsonNode all = list(get("/api/hotels").param("q", empty.getName()));
        assertEquals(1, all.size());
        assertTrue(all.get(0).get("minPrice").isNull());
        mvc.perform(get("/api/hotels").param("q", empty.getName()).param("minPrice", "0"))
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void TC_HOTEL_05d_invalid_filters_are_rejected() throws Exception {
        mvc.perform(get("/api/hotels").param("minPrice", "900000").param("maxPrice", "500000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("minPrice phai nho hon hoac bang maxPrice"));
        mvc.perform(get("/api/hotels").param("minPrice", "-1"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        mvc.perform(get("/api/hotels").param("maxPrice", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("maxPrice: khong dung dinh dang"));
    }

    @Test
    void TC_HOTEL_05e_blank_params_are_ignored() throws Exception {
        assertTrue(list(get("/api/hotels").param("q", "  ").param("city", "").param("roomType", " ")).size() >= 4);
    }
}
