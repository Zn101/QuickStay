package com.quickstay.config;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** app.admin.*: tai khoan admin mac dinh (ADMIN_EMAIL, ADMIN_PASSWORD). */
@Validated
@ConfigurationProperties("app.admin")
public record AdminProperties(@NotBlank @Email String email, @NotBlank @Size(min = 6, max = 72) String password) {
}
