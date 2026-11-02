package com.quickstay.security;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/** app.cors.allowed-origins: danh sach nguon Frontend, cach nhau bang dau phay. */
@Validated
@ConfigurationProperties("app.cors")
public record CorsProperties(@NotEmpty List<String> allowedOrigins) {
}
