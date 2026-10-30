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

import static org.junit.jupiter.api.Assertions.*;

/**
 * T056 — Kiem tra bao mat qua HTTP that (webEnvironment = RANDOM_PORT).
 * Dung TestRestTemplate thay MockMvc de co error-dispatch day du, bat loi
 * 403 bi doi thanh 401 neu dung sendError().
 *
 * Phu thuoc: T055 (AuthenticationEntryPoint va AccessDeniedHandler tra JSON).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealHttpSecurityTest {

    @Autowired
    TestRestTemplate http;

    // ─── Helper methods ────────────────────────────────────────────────────────

    /** Dang ky mot CUSTOMER moi va tra ve JWT. */
    private String registerCustomer() {
        ResponseEntity<JsonNode> res = http.postForEntity("/api/auth/register",
                Map.of("email", "http-" + UUID.randomUUID() + "@test.com",
                       "password", "secret123",
                       "fullName", "Test User"),
                JsonNode.class);
        assertEquals(HttpStatus.CREATED, res.getStatusCode(), "Dang ky CUSTOMER that bai");
        return res.getBody().get("token").asText();
    }

    /** Lay JWT admin (tai khoan mac dinh duoc DataSeeder tao). */
    private String adminToken() {
        ResponseEntity<JsonNode> res = http.postForEntity("/api/auth/login",
                Map.of("email", "admin@quickstay.local", "password", "Admin@123"),
                JsonNode.class);
        assertEquals(HttpStatus.OK, res.getStatusCode(), "Dang nhap admin that bai");
        return res.getBody().get("token").asText();
    }

    /** GET request, token co the null (anonymous). */
    private ResponseEntity<String> get(String path, String token) {
        HttpHeaders h = new HttpHeaders();
        if (token != null) h.setBearerAuth(token);
        return http.exchange(path, HttpMethod.GET, new HttpEntity<>(h), String.class);
    }

    // ─── TC_SEC_01: API cong khai (T056 case 1) ───────────────────────────────

    /**
     * GET /api/hotels khong can xac thuc → 200.
     * Xac nhan endpoint public hoat dong dung theo SecurityConfig.
     */
    @Test
    void TC_SEC_01_public_hotel_api_accessible_without_token() {
        ResponseEntity<String> res = get("/api/hotels", null);
        assertEquals(HttpStatus.OK, res.getStatusCode(),
                "API cong khai /api/hotels phai tra 200 ma khong can token");
    }

    /**
     * GET /actuator/health khong can token → 200.
     */
    @Test
    void TC_SEC_02_health_endpoint_is_public() {
        ResponseEntity<String> res = get("/actuator/health", null);
        assertEquals(HttpStatus.OK, res.getStatusCode(),
                "/actuator/health phai tra 200 khong can xac thuc");
    }

    // ─── TC_SEC_03/04: Khong co JWT → 401 (T056 case 2) ─────────────────────

    /**
     * GET /api/bookings/me khong co JWT → 401.
     * GET /api/admin/bookings khong co JWT → 401.
     */
    @Test
    void TC_SEC_03_anonymous_calling_protected_api_gets_401() {
        assertEquals(HttpStatus.UNAUTHORIZED, get("/api/bookings/me", null).getStatusCode(),
                "/api/bookings/me phai tra 401 khi khong co token");
        assertEquals(HttpStatus.UNAUTHORIZED, get("/api/admin/bookings", null).getStatusCode(),
                "/api/admin/bookings phai tra 401 khi khong co token");
    }

    // ─── TC_SEC_05: JWT khong hop le → 401 (T056 case 3) ────────────────────

    /**
     * JWT gia mao hoac sai chu ky → 401 (JwtAuthFilter bo qua, SecurityContext rong,
     * AuthenticationEntryPoint tra JSON 401).
     */
    @Test
    void TC_SEC_05_invalid_jwt_gets_401() {
        ResponseEntity<String> res = get("/api/bookings/me", "this.is.not.a.valid.jwt");
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode(),
                "JWT gia mao phai tra 401");
        assertNotNull(res.getBody(), "Body 401 phai ton tai");
        assertTrue(res.getBody().contains("\"message\""),
                "Body 401 phai co truong message");
    }

    // ─── TC_SEC_06: CUSTOMER goi API ADMIN → 403 (T056 case 4) ──────────────

    /**
     * CUSTOMER co JWT hop le nhung goi /api/admin/** → 403 voi JSON body.
     * Day la test cu (TC_SEC_01 trong version truoc), giu nguyen de khong mat coverage.
     */
    @Test
    void TC_SEC_06_customer_calling_admin_api_gets_403_with_json_message() {
        ResponseEntity<String> res = get("/api/admin/bookings", registerCustomer());
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode(),
                "CUSTOMER goi admin API phai tra 403");
        assertNotNull(res.getBody(), "Body 403 phai ton tai");
        assertTrue(res.getBody().contains("\"message\""),
                "Body 403 phai co truong message theo format du an");
    }

    // ─── TC_SEC_07: ADMIN goi API ADMIN → khong bi tu choi (T056 case 5) ────

    /**
     * ADMIN co JWT hop le goi /api/admin/bookings → KHONG bi tu choi do phan quyen.
     * Ket qua phai la 2xx (200 OK voi danh sach) hoac loi nghiep vu, khong phai 401/403.
     */
    @Test
    void TC_SEC_07_admin_calling_admin_api_is_not_rejected_by_authorization() {
        ResponseEntity<String> res = get("/api/admin/bookings", adminToken());
        assertNotEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode(),
                "Admin khong duoc bi 401");
        assertNotEquals(HttpStatus.FORBIDDEN, res.getStatusCode(),
                "Admin khong duoc bi 403");
        // Ket qua thuc te: 200 OK voi danh sach booking JSON
        assertEquals(HttpStatus.OK, res.getStatusCode(),
                "Admin goi /api/admin/bookings phai tra 200");
    }

    // ─── TC_SEC_08: Content-Type JSON tren 401 (T056 case 6) ────────────────

    /**
     * Response 401 phai co Content-Type application/json va truong message.
     */
    @Test
    void TC_SEC_08_unauthorized_response_has_json_content_type_and_message() {
        ResponseEntity<String> res = get("/api/users/me", null);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertNotNull(res.getHeaders().getContentType(),
                "Response 401 phai co Content-Type header");
        assertTrue(res.getHeaders().getContentType().includes(MediaType.APPLICATION_JSON),
                "Content-Type 401 phai la application/json");
        assertNotNull(res.getBody(), "Body 401 khong duoc null");
        assertTrue(res.getBody().contains("\"message\""),
                "Body 401 phai co truong message theo format du an");
    }

    /**
     * Response 403 phai co Content-Type application/json va truong message.
     */
    @Test
    void TC_SEC_09_forbidden_response_has_json_content_type_and_message() {
        ResponseEntity<String> res = get("/api/admin/bookings", registerCustomer());
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertNotNull(res.getHeaders().getContentType());
        assertTrue(res.getHeaders().getContentType().includes(MediaType.APPLICATION_JSON),
                "Content-Type 403 phai la application/json");
        assertTrue(res.getBody().contains("\"message\""),
                "Body 403 phai co truong message");
    }

    // ─── TC_SEC_10: ADMIN khong duoc POST /api/bookings → 403 ───────────────

    /**
     * POST /api/bookings chi cho phep CUSTOMER (hasRole CUSTOMER).
     * ADMIN co JWT hop le goi endpoint nay phai nhan 403.
     * Test cu (TC_SEC_03 phien ban truoc), giu nguyen.
     */
    @Test
    void TC_SEC_10_admin_cannot_create_booking_gets_403() {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(adminToken());
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> res = http.exchange("/api/bookings", HttpMethod.POST,
                new HttpEntity<>("{\"roomId\":1,\"checkIn\":\"2030-01-01\",\"checkOut\":\"2030-01-02\","
                        + "\"guests\":1,\"guestName\":\"A\",\"guestPhone\":\"1\"}", h),
                String.class);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode(),
                "ADMIN goi POST /api/bookings phai nhan 403");
    }
}
