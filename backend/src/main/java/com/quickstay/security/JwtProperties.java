package com.quickstay.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/** app.jwt.*; sai cau hinh thi app dung ngay khi khoi dong thay vi loi luc dang nhap. */
@Validated
@ConfigurationProperties("app.jwt")
public record JwtProperties(
        // HS256 can khoa toi thieu 256 bit
        @NotBlank @Size(min = 32, message = "JWT_SECRET phai co it nhat 32 ky tu") String secret,
        @NotNull Duration expiration) {
}
