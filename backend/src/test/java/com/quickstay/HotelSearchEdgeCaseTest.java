package com.quickstay;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Nhanh loi cua tim kiem khach san, chi tiet va phong trong (T141, T166): gia tri bien,
 * sai dinh dang, so qua lon. Moi loi du lieu phai la 400/404 kem {"message"} tieng Viet, khong duoc 500.
 */
class HotelSearchEdgeCaseTest extends ApiTestBase {

    @Autowired HotelRepository hotels;

    private ResultActions perform(MockHttpServletRequestBuilder r) throws Exception {
        return mvc.perform(r);
    }

    private static void assertBadRequest(ResultActions r) throws Exception {
        r.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
    }

    // ---- Tham so tim kiem ----

    @Test
    void search_text_longer_than_100_is_400_with_vietnamese_message() throws Exception {
        String longText = "a".repeat(101);
        perform(get("/api/hotels").param("q", longText)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("q: toi da 100 ky tu"));
        perform(get("/api/hotels").param("city", longText)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("city: toi da 100 ky tu"));
        perform(get("/api/hotels").param("roomType", longText)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("roomType: toi da 100 ky tu"));
        perform(get("/api/hotels").param("q", "a".repeat(100))).andExpect(status().isOk());
    }

    @Test
    void negative_price_is_400_with_vietnamese_message() throws Exception {
        perform(get("/api/hotels").param("minPrice", "-1")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("minPrice: khong duoc am"));
        perform(get("/api/hotels").param("maxPrice", "-0.01")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("maxPrice: khong duoc am"));
    }

    @Test
    void unusual_but_valid_search_values_do_not_fail() throws Exception {
        perform(get("/api/hotels").param("q", "' OR 1=1 --")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        perform(get("/api/hotels").param("city", "Ha").param("city", "Noi")).andExpect(status().isOk());
        perform(get("/api/hotels").param("minPrice", "1e400")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        perform(get("/api/hotels").param("minPrice", "0.5")).andExpect(status().isOk());
        perform(get("/api/hotels").param("minPrice", "0").param("maxPrice", "0")).andExpect(status().isOk());
        perform(get("/api/hotels").param("q", "Đà Nẵng 🏖")).andExpect(status().isOk());
    }

    @Test
    void wrong_number_format_in_filters_is_400() throws Exception {
        assertBadRequest(perform(get("/api/hotels").param("minPrice", "100k")));
        assertBadRequest(perform(get("/api/hotels").param("maxPrice", "1.000.000")));
    }

    // ---- Phan trang ----

    @Test
    void huge_page_number_is_400_not_500() throws Exception {
        assertBadRequest(perform(get("/api/hotels").param("page", "2147483647").param("size", "100")));
        assertBadRequest(perform(get("/api/hotels").param("page", "99999999999")));
        assertBadRequest(perform(get("/api/hotels").param("page", "1e3")));
        perform(get("/api/hotels").param("page", "10000").param("size", "100"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items").isEmpty());
    }

    // ---- Chi tiet khach san ----

    @Test
    void hotel_detail_with_odd_ids() throws Exception {
        for (String id : new String[]{"0", "-1", "999999999"}) {
            perform(get("/api/hotels/" + id)).andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").value("Khong tim thay khach san"));
        }
        assertBadRequest(perform(get("/api/hotels/99999999999999999999")));
        assertBadRequest(perform(get("/api/hotels/1.5")));
    }

    // ---- Phong trong ----

    @Test
    void rooms_with_invalid_dates_are_400() throws Exception {
        for (String[] dates : new String[][]{{"2026-02-30", "2026-03-02"}, {"01/12/2026", "03/12/2026"},
                {"2026-13-01", "2026-13-03"}, {"", "2026-12-03"}, {"2026-12-01", ""}}) {
            assertBadRequest(perform(get("/api/hotels/1/rooms").param("checkIn", dates[0]).param("checkOut", dates[1])));
        }
    }

    @Test
    void rooms_for_unknown_hotel_is_404_even_with_dates() throws Exception {
        perform(get("/api/hotels/-1/rooms")).andExpect(status().isNotFound());
        perform(get("/api/hotels/999999/rooms").param("checkIn", "2030-01-01").param("checkOut", "2030-01-02"))
                .andExpect(status().isNotFound());
    }

    @Test
    void very_long_date_range_still_answers() throws Exception {
        perform(get("/api/hotels/1/rooms").param("checkIn", "1900-01-01").param("checkOut", "2900-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].available").value(greaterThanOrEqualTo(0)));
    }

    @Test
    void hotel_without_rooms_has_empty_room_list() throws Exception {
        Hotel h = new Hotel();
        h.setName("No rooms " + UUID.randomUUID());
        h.setCity("Test City");
        hotels.save(h);
        perform(get("/api/hotels/" + h.getId() + "/rooms")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        perform(get("/api/hotels/" + h.getId() + "/rooms").param("checkIn", "2030-01-01").param("checkOut", "2030-01-02"))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        perform(get("/api/hotels/" + h.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.minPrice").isEmpty());
    }
}
