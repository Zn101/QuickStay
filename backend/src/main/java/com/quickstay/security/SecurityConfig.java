package com.quickstay.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;

/**
 * Cau hinh bao mat: JWT stateless, phan quyen theo role.
 * T043/T094 (Minh): them JwtAuthFilter, bao ve /api/admin/** chi danh cho ADMIN.
 */
@Configuration
public class SecurityConfig {

    // JwtAuthFilter khong phai @Component: neu la bean, Spring Boot dang ky them no o tang servlet va filter chay 2 lan
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtService jwtService) {
        this.jwtAuthFilter = new JwtAuthFilter(jwtService);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/hotels/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/hotels/*/questions").permitAll()
                        // Chi ADMIN moi truy cap duoc /api/admin/**
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Chi CUSTOMER moi dat phong
                        .requestMatchers(HttpMethod.POST, "/api/bookings").hasRole("CUSTOMER")
                        .anyRequest().authenticated())
                // Ghi JSON truc tiep, khong dung sendError(): sendError chuyen sang /error, trang nay can dang nhap
                // nen 403 bi doi thanh 401 khi chay that (MockMvc khong bat duoc, xem RealHttpApiTest)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                writeError(res, HttpStatus.UNAUTHORIZED, "Chua dang nhap hoac token khong hop le"))
                        .accessDeniedHandler((req, res, ex) ->
                                writeError(res, HttpStatus.FORBIDDEN, "Ban khong co quyen thuc hien thao tac nay")));
        return http.build();
    }

    /** Loi tu tang bao mat cung dang {"message": "..."} nhu ApiExceptionHandler; message la hang so, khong can escape. */
    private static void writeError(HttpServletResponse res, HttpStatus status, String message) throws IOException {
        res.setStatus(status.value());
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties cors) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(cors.allowedOrigins().stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
