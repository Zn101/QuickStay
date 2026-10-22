package com.quickstay;

import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthApiTest extends ApiTestBase {

    @Autowired UserRepository users;

    @Test
    void TC_AUTH_01_register_returns_token_and_customer_role() throws Exception {
        String email = newCustomerEmail();
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", email, "password", "secret123", "fullName", "An", "phone", "0900")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));
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
    void TC_AUTH_03_duplicate_email_is_rejected() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", email, "password", "secret123", "fullName", "An")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void TC_AUTH_04_register_validates_input() throws Exception {
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", "not-an-email", "password", "123", "fullName", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void TC_AUTH_05_login_success_and_wrong_password() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "secret123")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "wrong-pass")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void TC_AUTH_06_protected_endpoint_requires_valid_jwt() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void TC_AUTH_07_view_and_update_profile() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);
        mvc.perform(auth(get("/api/users/me"), token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));
        mvc.perform(withBody(put("/api/users/me"), token, Map.of("fullName", "Ten Moi", "phone", "0988")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ten Moi"))
                .andExpect(jsonPath("$.phone").value("0988"));
    }

    @Test
    void TC_AUTH_08_change_password_then_login_with_new_one() throws Exception {
        String email = newCustomerEmail();
        String token = registerCustomer(email);
        mvc.perform(withBody(put("/api/users/me"), token, Map.of("password", "newpass123")))
                .andExpect(status().isOk());
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "newpass123")))
                .andExpect(status().isOk());
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "secret123")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void TC_AUTH_09_default_admin_can_login_with_admin_role() throws Exception {
        mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("ADMIN"));
    }
}
