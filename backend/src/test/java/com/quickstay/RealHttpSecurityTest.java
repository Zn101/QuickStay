package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/** Chay qua cong HTTP that (co error dispatch) de bat loi 403 bi doi thanh 401 ma MockMvc khong thay. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealHttpSecurityTest {

    @Autowired TestRestTemplate http;

    private String registerCustomer() {
        ResponseEntity<JsonNode> res = http.postForEntity("/api/auth/register",
                Map.of("email", "http-" + UUID.randomUUID() + "@test.com", "password", "secret123", "fullName", "A"),
                JsonNode.class);
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        return res.getBody().get("token").asText();
    }

    private ResponseEntity<String> get(String path, String token) {
        HttpHeaders h = new HttpHeaders();
        if (token != null) h.setBearerAuth(token);
        return http.exchange(path, HttpMethod.GET, new HttpEntity<>(h), String.class);
    }

    @Test
    void TC_SEC_01_customer_calling_admin_api_gets_403_with_json_message() {
        ResponseEntity<String> res = get("/api/admin/bookings", registerCustomer());
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(true, res.getBody().contains("\"message\""));
    }

    @Test
    void TC_SEC_02_anonymous_calling_protected_api_gets_401() {
        assertEquals(HttpStatus.UNAUTHORIZED, get("/api/bookings/me", null).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, get("/api/admin/bookings", null).getStatusCode());
    }

    @Test
    void TC_SEC_03_admin_cannot_book_gets_403() {
        ResponseEntity<JsonNode> login = http.postForEntity("/api/auth/login",
                Map.of("email", "admin@quickstay.local", "password", "Admin@123"), JsonNode.class);
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(login.getBody().get("token").asText());
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> res = http.exchange("/api/bookings", HttpMethod.POST,
                new HttpEntity<>("{\"roomId\":1,\"checkIn\":\"2030-01-01\",\"checkOut\":\"2030-01-02\",\"guests\":1,"
                        + "\"guestName\":\"A\",\"guestPhone\":\"1\"}", h), String.class);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
    }
}
