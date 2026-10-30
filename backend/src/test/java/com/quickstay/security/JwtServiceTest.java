package com.quickstay.security;

import com.quickstay.user.Role;
import com.quickstay.user.User;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123";

    private static User user() {
        User u = new User();
        u.setEmail("an@test.com");
        u.setRole(Role.ADMIN);
        return u;
    }

    @Test
    void token_carries_email_role_and_expiry() {
        JwtService jwt = new JwtService(new JwtProperties(SECRET, Duration.ofHours(24)));
        var claims = jwt.parse(jwt.generate(user())).orElseThrow();
        assertEquals("an@test.com", claims.getSubject());
        assertEquals("ADMIN", claims.get("role"));
        assertEquals(Duration.ofHours(24).toMillis(),
                claims.getExpiration().getTime() - claims.getIssuedAt().getTime());
    }

    @Test
    void tampered_token_is_rejected() {
        JwtService jwt = new JwtService(new JwtProperties(SECRET, Duration.ofHours(1)));
        String token = jwt.generate(user());
        int sig = token.lastIndexOf('.') + 1;
        String tampered = token.substring(0, sig) + (token.charAt(sig) == 'A' ? 'B' : 'A') + token.substring(sig + 1);
        assertTrue(jwt.parse(tampered).isEmpty());
        assertTrue(jwt.parse("abc.def.ghi").isEmpty());
        assertTrue(jwt.parse("").isEmpty());
    }

    @Test
    void token_signed_with_another_secret_is_rejected() {
        String token = new JwtService(new JwtProperties(SECRET, Duration.ofHours(1))).generate(user());
        JwtService other = new JwtService(new JwtProperties(SECRET + "-khac", Duration.ofHours(1)));
        assertTrue(other.parse(token).isEmpty());
    }

    @Test
    void expired_token_is_rejected() {
        JwtService jwt = new JwtService(new JwtProperties(SECRET, Duration.ofMinutes(-1)));
        assertTrue(jwt.parse(jwt.generate(user())).isEmpty());
    }
}
