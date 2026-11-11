package com.quickstay;

import com.quickstay.hotel.HotelSearch;
import com.quickstay.hotel.HotelService;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Loi khong luong truoc (T151): tra 500 voi thong bao chung, khong lo chi tiet ben trong
 * (cau SQL, ten bang, stack trace) ra ngoai.
 */
class UnexpectedErrorTest extends ApiTestBase {

    @MockitoBean HotelService hotelService;

    @Test
    void unexpected_exception_is_500_with_generic_message_only() throws Exception {
        when(hotelService.search(any(HotelSearch.class)))
                .thenThrow(new IllegalStateException("SELECT * FROM users WHERE password_hash = 'bi-mat'"));

        mvc.perform(get("/api/hotels"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Loi he thong, vui long thu lai"))
                .andExpect(content().string(not(containsString("password_hash"))))
                .andExpect(content().string(not(containsString("IllegalStateException"))))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }
}
