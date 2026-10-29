package com.quickstay.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Không được để trống email")
            @Email(message = "Email không đúng định dạng")
            String email,

            @NotBlank(message = "Không được để trống mật khẩu")
            @Size(min = 6, max = 72, message = "Mật khẩu phải từ 6 đến 72 kí tự")
            String password,

            @NotBlank(message = "Không được để trống họ và tên")
            @Size(max = 255, message = "Họ và tên tối đa 255 kí tự")
            String fullName,

            @Size(max = 30, message = "Số điện thoại tối đa 30 kí tự")
            String phone) {

        public RegisterRequest {
            email = normalizeEmail(email);
            fullName = fullName == null ? null : fullName.trim();
            phone = phone == null || phone.isBlank() ? null : phone.trim();
        }
    }

    public record LoginRequest(
            @NotBlank(message = "Không được để trống email")
            String email,

            @NotBlank(message = "Không được để trống mật khẩu")
            String password) {

        public LoginRequest {
            email = normalizeEmail(email);
        }
    }

    public record AuthResponse(String token, UserDto user) {}

    static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
