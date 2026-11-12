package com.quickstay.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response cua /api/auth. Email duoc trim + chu thuong ngay khi doc JSON, truoc khi validate. */
public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 6, message = "mat khau toi thieu 6 ky tu")
            @MaxUtf8Bytes(value = 72, message = "mat khau toi da 72 byte") String password,
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

    public record VerifyEmailRequest(@NotBlank String token) {
        public VerifyEmailRequest {
            token = token == null ? null : token.trim();
        }
    }

    public record EmailActionRequest(@NotBlank @Email String email) {
        public EmailActionRequest {
            email = normalizeEmail(email);
        }
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, message = "mat khau toi thieu 6 ky tu")
            @MaxUtf8Bytes(value = 72, message = "mat khau toi da 72 byte") String newPassword) {
        public ResetPasswordRequest {
            token = token == null ? null : token.trim();
        }
    }

    public record EmailPreview(String recipient, String subject, String bodyHtml) {}

    public record ForgotPasswordResponse(
            String message,
            boolean demoMode,
            @JsonInclude(JsonInclude.Include.NON_NULL) EmailPreview demoEmail) {}

    public record MessageResponse(String message) {}

    public record AuthResponse(String token, UserDto user) {}

    static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
