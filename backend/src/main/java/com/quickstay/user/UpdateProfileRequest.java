package com.quickstay.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Body PUT /api/users/me. Moi truong tuy chon; null = giu nguyen.
 * fullName/email/password rong duoc coi nhu khong gui; phone rong = xoa so dien thoai.
 */
public record UpdateProfileRequest(
        @Size(max = 255) String fullName,
        @Size(max = 30) String phone,
        @Email @Size(max = 255) String email,
        @Size(min = 6, message = "mat khau toi thieu 6 ky tu")
        @MaxUtf8Bytes(value = 72, message = "mat khau toi da 72 byte") String password) {

    public UpdateProfileRequest {
        fullName = blankToNull(fullName);
        phone = phone == null ? null : phone.trim();
        email = email == null || email.isBlank() ? null : AuthDtos.normalizeEmail(email);
        password = password == null || password.isEmpty() ? null : password;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
