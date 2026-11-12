package com.quickstay;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T132 – Kiem tra cau hinh CORS cua QuickStay Backend.
 *
 * Cau hinh hien tai (application.properties):
 *   app.cors.allowed-origins = http://localhost:5173, http://localhost:8081
 *   allowed-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
 *   allowed-headers: Authorization, Content-Type
 *   allowCredentials: khong bat
 *   pattern: /api/**
 *
 * Test chay qua day du Spring Security + CORS filter (ApiTestBase @SpringBootTest).
 * Dung GET /api/hotels (endpoint public, khong can token) de kiem tra CORS don gian.
 */
class CorsTest extends ApiTestBase {

    // Origins duoc phep (theo application.properties default)
    private static final String ORIGIN_VITE   = "http://localhost:5173";
    private static final String ORIGIN_DOCKER = "http://localhost:8081";

    // Origins KHONG duoc phep
    private static final String ORIGIN_EVIL        = "http://evil.com";
    private static final String ORIGIN_ATTACKER    = "http://attacker.example.com";

    // =========================================================================
    // CORS-01: Origin hop le nhan duoc Access-Control-Allow-Origin chinh xac
    // =========================================================================

    /** CORS-01a: GET tu Vite origin (localhost:5173) – duoc cap quyen CORS. */
    @Test
    void CORS_01a_valid_origin_vite_gets_acao_header() throws Exception {
        mvc.perform(get("/api/hotels")
                        .header("Origin", ORIGIN_VITE))
                .andExpect(status().isOk())
                // Phai tra ve dung origin da gui, khong phai wildcard
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_VITE));
    }

    /** CORS-01b: GET tu Docker frontend origin (localhost:8081) – duoc cap quyen CORS. */
    @Test
    void CORS_01b_valid_origin_docker_gets_acao_header() throws Exception {
        mvc.perform(get("/api/hotels")
                        .header("Origin", ORIGIN_DOCKER))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_DOCKER));
    }

    // =========================================================================
    // CORS-02: Preflight OPTIONS tu origin hop le – tra ve headers day du
    // =========================================================================

    /** CORS-02a: Preflight OPTIONS tu Vite origin – headers CORS day du. */
    @Test
    void CORS_02a_preflight_valid_origin_returns_cors_headers() throws Exception {
        mvc.perform(options("/api/hotels")
                        .header("Origin", ORIGIN_VITE)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_VITE))
                // Phai co Access-Control-Allow-Methods
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                // Phai co Access-Control-Allow-Headers
                .andExpect(header().exists("Access-Control-Allow-Headers"));
    }

    /** CORS-02b: Preflight OPTIONS tu Docker origin – tra ve ACAO header. */
    @Test
    void CORS_02b_preflight_docker_origin_returns_acao() throws Exception {
        mvc.perform(options("/api/auth/login")
                        .header("Origin", ORIGIN_DOCKER)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_DOCKER));
    }

    /** CORS-02c: Access-Control-Allow-Methods phai chua cac method duoc cau hinh. */
    @Test
    void CORS_02c_preflight_allow_methods_contains_configured_methods() throws Exception {
        var result = mvc.perform(options("/api/hotels")
                        .header("Origin", ORIGIN_VITE)
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                .andReturn();

        String allowMethods = result.getResponse().getHeader("Access-Control-Allow-Methods");
        // Tat ca 6 method phai co mat
        for (String method : new String[]{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}) {
            assert allowMethods != null && allowMethods.contains(method)
                    : "Access-Control-Allow-Methods phai chua " + method + ", nhung la: " + allowMethods;
        }
    }

    // =========================================================================
    // CORS-03: Origin KHONG hop le – khong nhan ACAO header
    // =========================================================================

    /**
     * CORS-03a: GET tu evil.com – KHONG duoc cap quyen CORS.
     * Spring Security tra 403 Forbidden khi origin khong hop le trong CORS request.
     * Day la behavior dung: Spring reject preflight CORS tu origin la.
     */
    @Test
    void CORS_03a_invalid_origin_evil_does_not_get_acao_header() throws Exception {
        mvc.perform(get("/api/hotels")
                        .header("Origin", ORIGIN_EVIL))
                // Spring Security tra 403 cho CORS request tu origin khong hop le
                // (khong phai 200, vi Spring reject o tang CORS filter truoc khi xu ly endpoint)
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Chap nhan 403 (Spring reject) hoac 200 khong co ACAO (neu Spring cho di qua)
                    // Dieu quan trong la KHONG duoc co ACAO header voi gia tri origin la
                    String acao = result.getResponse().getHeader("Access-Control-Allow-Origin");
                    assert acao == null || !acao.equals(ORIGIN_EVIL)
                            : "KHONG duoc cap ACAO cho origin la: " + acao;
                });
    }

    /** CORS-03b: GET tu attacker.example.com – KHONG duoc cap quyen CORS. */
    @Test
    void CORS_03b_invalid_origin_attacker_does_not_get_acao_header() throws Exception {
        mvc.perform(get("/api/hotels")
                        .header("Origin", ORIGIN_ATTACKER))
                .andExpect(result -> {
                    String acao = result.getResponse().getHeader("Access-Control-Allow-Origin");
                    assert acao == null || !acao.equals(ORIGIN_ATTACKER)
                            : "KHONG duoc cap ACAO cho origin la: " + acao;
                });
    }

    /** CORS-03c: Origin la subdomain gia mao (localhost:5173.evil.com) – bi tu choi. */
    @Test
    void CORS_03c_fake_subdomain_of_valid_origin_is_rejected() throws Exception {
        String fakeOrigin = "http://localhost:5173.evil.com";
        mvc.perform(get("/api/hotels")
                        .header("Origin", fakeOrigin))
                .andExpect(result -> {
                    String acao = result.getResponse().getHeader("Access-Control-Allow-Origin");
                    assert acao == null || !acao.equals(fakeOrigin)
                            : "KHONG duoc cap ACAO cho origin gia mao: " + acao;
                });
    }

    // =========================================================================
    // CORS-04: Preflight OPTIONS tu origin KHONG hop le – khong duoc cap quyen
    // =========================================================================

    /** CORS-04: Preflight OPTIONS tu evil.com – khong co ACAO header. */
    @Test
    void CORS_04_preflight_invalid_origin_no_cors_headers() throws Exception {
        mvc.perform(options("/api/hotels")
                        .header("Origin", ORIGIN_EVIL)
                        .header("Access-Control-Request-Method", "GET"))
                // Spring tra 403 hoac khong co ACAO header cho preflight tu origin khong hop le
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    // =========================================================================
    // CORS-05: Request co Authorization header – duoc xu ly dung
    // =========================================================================

    /** CORS-05: GET voi Authorization header tu origin hop le – ACAO header co mat. */
    @Test
    void CORS_05_request_with_authorization_header_from_valid_origin() throws Exception {
        // Lay token that de test
        var loginResult = mvc.perform(withBody(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login"),
                        null,
                        java.util.Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        String token = read(loginResult).get("token").asText();

        mvc.perform(get("/api/admin/hotels")
                        .header("Origin", ORIGIN_VITE)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                // Phai co ACAO header du co Authorization
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_VITE));
    }

    /** CORS-05b: Preflight yeu cau phep Authorization header – ACAH phai chua Authorization. */
    @Test
    void CORS_05b_preflight_for_authorization_header_is_allowed() throws Exception {
        var result = mvc.perform(options("/api/admin/hotels")
                        .header("Origin", ORIGIN_VITE)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_VITE))
                .andExpect(header().exists("Access-Control-Allow-Headers"))
                .andReturn();

        String allowHeaders = result.getResponse().getHeader("Access-Control-Allow-Headers");
        assert allowHeaders != null && allowHeaders.contains("Authorization")
                : "Access-Control-Allow-Headers phai chua 'Authorization', nhung la: " + allowHeaders;
    }

    // =========================================================================
    // CORS-06: Request KHONG co Origin header – khong phai CORS, xu ly binh thuong
    // =========================================================================

    /** CORS-06a: GET khong co Origin – backend tra response binh thuong, khong co ACAO header. */
    @Test
    void CORS_06a_request_without_origin_header_is_not_cors() throws Exception {
        mvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                // Khong co Origin → khong phai CORS request → khong co ACAO header
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    /** CORS-06b: Request khong co Origin KHONG bi block – van tra response. */
    @Test
    void CORS_06b_request_without_origin_still_gets_response() throws Exception {
        // Direct API call (tu cURL, Postman, server-to-server) khong co Origin
        // Phai hoat dong binh thuong – CORS chi ngan browser doc response, khong ngan server tra response
        mvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    // =========================================================================
    // CORS-07: Khong dung wildcard
    // =========================================================================

    /** CORS-07: ACAO header KHONG duoc la wildcard (*). */
    @Test
    void CORS_07_acao_is_never_wildcard() throws Exception {
        var result = mvc.perform(get("/api/hotels")
                        .header("Origin", ORIGIN_VITE))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN_VITE))
                .andReturn();

        String acao = result.getResponse().getHeader("Access-Control-Allow-Origin");
        assert !"*".equals(acao) : "ACAO khong duoc la wildcard (*)";
    }
}
