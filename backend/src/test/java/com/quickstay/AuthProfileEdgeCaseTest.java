package com.quickstay;

import com.quickstay.user.Role;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Nhanh loi cua dang ky, dang nhap, ho so (T140): gia tri bien, do dai, dinh dang body.
 * Moi loi du lieu phai la 400 kem {"message"}, khong duoc la 500 hay 409.
 */
class AuthProfileEdgeCaseTest extends ApiTestBase {

    /** Ky tu 3 byte trong UTF-8: 24 ky tu = 72 byte (dung gioi han BCrypt), 25 ky tu = 75 byte. */
    private static final String THREE_BYTES = "ấ";
    /** Email hop le theo @Email nhung dai hon cot users.email (255). */
    private static final String TOO_LONG_EMAIL = "a".repeat(64) + "@" + ("b".repeat(60) + ".").repeat(4) + "com";

    @Autowired UserRepository users;

    private Map<String, Object> registration() {
        Map<String, Object> m = new HashMap<>();
        m.put("email", newCustomerEmail());
        m.put("password", "secret123");
        m.put("fullName", "Khach Test");
        return m;
    }

    private ResultActions register(Map<String, Object> body) throws Exception {
        return mvc.perform(withBody(post("/api/auth/register"), null, body));
    }

    private ResultActions registerWith(String field, Object value) throws Exception {
        Map<String, Object> m = registration();
        m.put(field, value);
        return register(m);
    }

    private ResultActions login(Map<String, Object> body) throws Exception {
        return mvc.perform(withBody(post("/api/auth/login"), null, body));
    }

    private ResultActions updateProfile(String token, Map<String, ?> body) throws Exception {
        return mvc.perform(withBody(put("/api/users/me"), token, body));
    }

    private static void assertBadRequest(ResultActions r) throws Exception {
        r.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
    }

    // ---- Dang ky ----

    @Test
    void register_password_limit_is_72_bytes_not_72_characters() throws Exception {
        registerWith("password", "a".repeat(72)).andExpect(status().isCreated());
        registerWith("password", THREE_BYTES.repeat(24)).andExpect(status().isCreated());
        assertBadRequest(registerWith("password", THREE_BYTES.repeat(25)));
        assertBadRequest(registerWith("password", "a".repeat(73)));
    }

    @Test
    void register_password_boundaries() throws Exception {
        registerWith("password", "123456").andExpect(status().isCreated());
        assertBadRequest(registerWith("password", "12345"));
        assertBadRequest(registerWith("password", "      "));
    }

    @Test
    void register_field_lengths() throws Exception {
        assertBadRequest(registerWith("email", TOO_LONG_EMAIL));
        registerWith("fullName", "a".repeat(255)).andExpect(status().isCreated());
        assertBadRequest(registerWith("fullName", "a".repeat(256)));
        registerWith("phone", "0".repeat(30)).andExpect(status().isCreated());
        assertBadRequest(registerWith("phone", "0".repeat(31)));
    }

    @Test
    void register_rejects_wrong_types_and_missing_fields() throws Exception {
        assertBadRequest(registerWith("email", 123));
        assertBadRequest(registerWith("email", null));
        assertBadRequest(registerWith("password", null));
        assertBadRequest(registerWith("fullName", null));
    }

    @Test
    void register_rejects_malformed_bodies() throws Exception {
        for (String raw : new String[]{"", "[]", "{sai", "\"chuoi\""}) {
            assertBadRequest(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(raw)));
        }
    }

    @Test
    void register_cannot_choose_admin_role() throws Exception {
        String email = newCustomerEmail();
        Map<String, Object> m = registration();
        m.put("email", email);
        m.put("role", "ADMIN");
        register(m).andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("CUSTOMER"));
        assertEquals(Role.CUSTOMER, users.findByEmail(email).orElseThrow().getRole());
    }

    // ---- Dang nhap ----

    @Test
    void login_missing_or_blank_fields_is_400() throws Exception {
        assertBadRequest(login(Map.of("email", "a@test.com")));
        assertBadRequest(login(Map.of("password", "secret123")));
        assertBadRequest(login(Map.of("email", "  ", "password", "secret123")));
        assertBadRequest(login(Map.of("email", "a@test.com", "password", "")));
    }

    @Test
    void login_malformed_body_is_400() throws Exception {
        assertBadRequest(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{sai")));
    }

    @Test
    void login_very_long_password_is_401_not_500() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        login(Map.of("email", email, "password", THREE_BYTES.repeat(100))).andExpect(status().isUnauthorized());
    }

    @Test
    void login_accepts_email_in_other_case_with_spaces() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        login(Map.of("email", "  " + email.toUpperCase() + " ", "password", "secret123")).andExpect(status().isOk());
    }

    // ---- Ho so ----

    @Test
    void profile_password_limit_is_72_bytes_and_keeps_old_password_on_error() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);

        assertBadRequest(updateProfile(token, Map.of("password", THREE_BYTES.repeat(25))));
        assertBadRequest(updateProfile(token, Map.of("password", "12345")));
        login(Map.of("email", email, "password", "secret123")).andExpect(status().isOk());

        updateProfile(token, Map.of("password", THREE_BYTES.repeat(24))).andExpect(status().isOk());
        login(Map.of("email", email, "password", THREE_BYTES.repeat(24))).andExpect(status().isOk());
    }

    @Test
    void profile_field_lengths() throws Exception {
        String token = registerCustomer(newCustomerEmail());
        assertBadRequest(updateProfile(token, Map.of("email", TOO_LONG_EMAIL)));
        assertBadRequest(updateProfile(token, Map.of("email", "khong-phai-email")));
        assertBadRequest(updateProfile(token, Map.of("fullName", "a".repeat(256))));
        assertBadRequest(updateProfile(token, Map.of("phone", "0".repeat(31))));
        updateProfile(token, Map.of("phone", "0".repeat(30))).andExpect(status().isOk());
    }

    @Test
    void profile_rejects_malformed_body() throws Exception {
        String token = registerCustomer(newCustomerEmail());
        for (String raw : new String[]{"", "[]", "{sai"}) {
            assertBadRequest(mvc.perform(put("/api/users/me").header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON).content(raw)));
        }
    }

    @Test
    void profile_cannot_change_own_role() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);
        updateProfile(token, Map.of("role", "ADMIN", "fullName", "Thu Nang Quyen"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("CUSTOMER"));
        assertEquals(Role.CUSTOMER, users.findByEmail(email).orElseThrow().getRole());
    }

    @Test
    void profile_empty_object_changes_nothing() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);
        updateProfile(token, Map.of()).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Khach Test"))
                .andExpect(jsonPath("$.phone").value("0900000000"));
    }
}
