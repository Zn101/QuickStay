package com.quickstay.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response cua /api/auth. Email duoc trim + chu thuong ngay khi doc JSON, truoc khi validate. */
public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            // BCrypt chi xu ly 72 byte dau; dai hon se bi tu choi thay vi loi 500
            @NotBlank @Size(min = 6, max = 72, message = "mat khau tu 6 den 72 ky tu") String password,
            @NotBlank @Size(max = 255) String fullName,
            @Size(max = 30) String phone) {

        public RegisterRequest {
            email = normalizeEmail(email);
            fullName = fullName == null ? null : fullName.trim();
            phone = phone == null || phone.isBlank() ? null : phone.trim();
        }
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {

        public LoginRequest {
            email = normalizeEmail(email);
        }
    }

    public record AuthResponse(String token, UserDto user) {}

    static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
