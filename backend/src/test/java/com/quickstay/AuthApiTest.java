package com.quickstay;

import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Test API dang ky / dang nhap qua MockMvc, chay day du Spring + H2 + Flyway (T035). */
class AuthApiTest extends ApiTestBase {

    @Autowired UserRepository users;

    @Test
    void TC_AUTH_01_register_returns_token_and_customer_role() throws Exception {
        String email = newCustomerEmail();
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", email, "password", "secret123", "fullName", "An", "phone", "0900")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void TC_AUTH_02_password_is_stored_as_bcrypt_hash() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        String hash = users.findByEmail(email).orElseThrow().getPasswordHash();
        assertNotEquals("secret123", hash);
        assertTrue(hash.startsWith("$2"), "phai la hash BCrypt");
    }

    @Test
    void TC_AUTH_03_duplicate_email_is_rejected_even_with_other_case_and_spaces() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", "  " + email.toUpperCase() + " ", "password", "secret123", "fullName", "An")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email da duoc su dung"));
    }

    @Test
    void TC_AUTH_04_register_validates_input() throws Exception {
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", "not-an-email", "password", "123", "fullName", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
        mvc.perform(withBody(post("/api/auth/register"), null, Map.of("email", newCustomerEmail())))
                .andExpect(status().isBadRequest());
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", newCustomerEmail(), "password", "a".repeat(73), "fullName", "An")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/register").contentType("application/json").content("{khong-phai-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void TC_AUTH_05_login_success_and_wrong_password() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", email.toUpperCase(), "password", "secret123")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "wrong-pass")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Sai email hoac mat khau"));
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", "", "password", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void TC_AUTH_09_default_admin_can_login_with_admin_role() throws Exception {
        mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    // ─── T193-G2.2-A R-09: forgot-password security integration tests ───────────

    @Test
    void TC_AUTH_FORGOT_01_nonexistent_email_returns_200_with_only_message_field() throws Exception {
        // Email khong ton tai trong he thong van tra 200 voi safe message
        mvc.perform(withBody(post("/api/auth/forgot-password"), null,
                        Map.of("email", "doesnotexist-" + newCustomerEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty())
                // R-09: khong duoc co demoEmail, demoMode trong response
                .andExpect(jsonPath("$.demoEmail").doesNotExist())
                .andExpect(jsonPath("$.demoMode").doesNotExist());
    }

    @Test
    void TC_AUTH_FORGOT_02_existing_customer_email_returns_200_with_only_message_no_token_fields() throws Exception {
        // Dang ky mot customer
        String email = newCustomerEmail();
        registerCustomer(email);

        mvc.perform(withBody(post("/api/auth/forgot-password"), null, Map.of("email", email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty())
                // R-09: response khong duoc co bat ky field nao tiet lo token hay email HTML
                .andExpect(jsonPath("$.demoEmail").doesNotExist())
                .andExpect(jsonPath("$.demoMode").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.bodyHtml").doesNotExist())
                .andExpect(jsonPath("$.recipient").doesNotExist());
    }

    @Test
    void TC_AUTH_FORGOT_03_response_has_exactly_one_field_message() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);

        var result = mvc.perform(withBody(post("/api/auth/forgot-password"), null, Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn();

        // Parse JSON va kiem tra chi co dung 1 field
        var node = json.readTree(result.getResponse().getContentAsString());
        assertEquals(1, node.size(), "Response phai chi co dung 1 field 'message', hien tai co: " + node.fieldNames().next());
        assertTrue(node.has("message"), "Field duy nhat phai la 'message'");
    }

    @Test
    void TC_AUTH_FORGOT_04_nonexistent_and_existing_email_return_identical_message() throws Exception {
        // Ca hai phai tra cung message de khong tiet lo email co ton tai khong
        String realEmail = newCustomerEmail();
        registerCustomer(realEmail);

        var realResult = mvc.perform(withBody(post("/api/auth/forgot-password"), null, Map.of("email", realEmail)))
                .andExpect(status().isOk()).andReturn();
        var ghostResult = mvc.perform(withBody(post("/api/auth/forgot-password"), null,
                        Map.of("email", "ghost-" + newCustomerEmail())))
                .andExpect(status().isOk()).andReturn();

        String realMsg = json.readTree(realResult.getResponse().getContentAsString()).get("message").asText();
        String ghostMsg = json.readTree(ghostResult.getResponse().getContentAsString()).get("message").asText();
        assertEquals(realMsg, ghostMsg, "Message phai giong nhau de khong tiet lo user enumeration");
    }
}
