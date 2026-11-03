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
}
