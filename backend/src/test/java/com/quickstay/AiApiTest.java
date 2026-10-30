package com.quickstay;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Chay khong co khoa API nen kiem tra che do du phong cua AI. */
class AiApiTest extends ApiTestBase {

    @Test
    void TC_AI_01_describe_requires_admin() throws Exception {
        Map<String, String> body = Map.of("type", "hotel", "name", "Hotel X");
        mvc.perform(withBody(post("/api/ai/describe"), null, body)).andExpect(status().isUnauthorized());
        mvc.perform(withBody(post("/api/ai/describe"), registerCustomer(newCustomerEmail()), body))
                .andExpect(status().isForbidden());
    }

    @Test
    void TC_AI_02_describe_returns_text_using_name_and_amenities() throws Exception {
        mvc.perform(withBody(post("/api/ai/describe"), adminToken(),
                        Map.of("type", "hotel", "name", "Hotel Mau", "city", "Hue", "amenities", "Ho boi, Wifi")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value(containsString("Hotel Mau")))
                .andExpect(jsonPath("$.description").value(containsString("Ho boi")));
    }

    @Test
    void TC_AI_03_describe_validates_name() throws Exception {
        mvc.perform(withBody(post("/api/ai/describe"), adminToken(), Map.of("type", "hotel", "name", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void TC_AI_04_chat_is_public_and_answers_from_database() throws Exception {
        mvc.perform(withBody(post("/api/ai/chat"), null, Map.of("message", "Khach san o Da Nang gia bao nhieu?")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value(containsString("Sunrise Đà Nẵng Hotel")));
    }

    @Test
    void TC_AI_05_chat_rejects_empty_message() throws Exception {
        mvc.perform(withBody(post("/api/ai/chat"), null, Map.of("message", " ")))
                .andExpect(status().isBadRequest());
    }
}
