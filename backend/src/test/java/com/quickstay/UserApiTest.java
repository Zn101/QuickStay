package com.quickstay;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * GET/PUT /api/users/me (T064).
 * JwtAuthFilter (T043) chua co nen gia lap nguoi dang nhap bang user(email):
 * filter se dat email (subject cua JWT) vao Authentication.getName() giong vay.
 */
class UserApiTest extends ApiTestBase {

    private String newUser() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);
        return email;
    }

    private ResultActions update(String email, Map<String, ?> body) throws Exception {
        return mvc.perform(withBody(put("/api/users/me"), null, body).with(user(email).roles("CUSTOMER")));
    }

    private void canLogin(String email, String password, boolean expected) throws Exception {
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", password)))
                .andExpect(expected ? status().isOk() : status().isUnauthorized());
    }

    @Test
    void TC_AUTH_06_profile_requires_login() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(withBody(put("/api/users/me"), null, Map.of("fullName", "X"))).andExpect(status().isUnauthorized());
    }

    @Test
    void TC_AUTH_07_view_profile() throws Exception {
        String email = newUser();
        mvc.perform(get("/api/users/me").with(user(email).roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Khach Test"))
                .andExpect(jsonPath("$.phone").value("0900000000"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void TC_AUTH_07b_update_name_and_phone() throws Exception {
        String email = newUser();
        update(email, Map.of("fullName", "  Ten Moi ", "phone", "0988"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ten Moi"))
                .andExpect(jsonPath("$.phone").value("0988"));
        mvc.perform(get("/api/users/me").with(user(email).roles("CUSTOMER")))
                .andExpect(jsonPath("$.fullName").value("Ten Moi"));
    }

    @Test
    void TC_AUTH_07c_omitted_or_blank_fields_keep_value_and_empty_phone_clears() throws Exception {
        String email = newUser();
        update(email, Map.of("fullName", "  ", "email", "", "password", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Khach Test"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.phone").value("0900000000"));
        canLogin(email, "secret123", true);
        update(email, Map.of("phone", "")).andExpect(status().isOk()).andExpect(jsonPath("$.phone").isEmpty());
    }

    @Test
    void TC_AUTH_08_change_password_then_login_with_new_one() throws Exception {
        String email = newUser();
        update(email, Map.of("password", "newpass123")).andExpect(status().isOk());
        canLogin(email, "newpass123", true);
        canLogin(email, "secret123", false);
    }

    @Test
    void TC_AUTH_08b_change_email_normalized_and_conflict() throws Exception {
        String email = newUser();
        String other = newUser();
        // Frontend luon gui kem email hien tai: khong bi coi la trung
        Map<String, Object> same = new HashMap<>();
        same.put("email", email.toUpperCase());
        same.put("fullName", "Van Giu Email");
        update(email, same).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));

        update(email, Map.of("email", other)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email da duoc su dung"));

        String changed = newCustomerEmail();
        update(email, Map.of("email", " " + changed.toUpperCase())).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(changed));
        canLogin(changed, "secret123", true);
        // Token cu mang email cu: phai dang nhap lai
        mvc.perform(get("/api/users/me").with(user(email).roles("CUSTOMER"))).andExpect(status().isUnauthorized());
    }

    @Test
    void TC_AUTH_08c_invalid_update_is_rejected() throws Exception {
        String email = newUser();
        update(email, Map.of("email", "khong-phai-email")).andExpect(status().isBadRequest());
        update(email, Map.of("password", "123")).andExpect(status().isBadRequest());
        update(email, Map.of("password", "a".repeat(73))).andExpect(status().isBadRequest());
        canLogin(email, "secret123", true);
    }
}
