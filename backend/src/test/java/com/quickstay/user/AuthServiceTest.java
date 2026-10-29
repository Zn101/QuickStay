package com.quickstay.user;

import com.quickstay.config.ApiException;
import com.quickstay.security.JwtService;
import com.quickstay.user.AuthDtos.LoginRequest;
import com.quickstay.user.AuthDtos.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Unit test tang service, khong khoi dong Spring (T035). */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository users;
    @Mock PasswordEncoder encoder;
    @Mock JwtService jwt;
    @InjectMocks AuthService auth;

    @Test
    void register_saves_customer_with_hashed_password_and_normalized_email() {
        when(users.existsByEmail("an@test.com")).thenReturn(false);
        when(encoder.encode("secret123")).thenReturn("HASH");
        when(jwt.generate(any())).thenReturn("TOKEN");

        var res = auth.register(new RegisterRequest("  An@Test.COM ", "secret123", "  Nguyen An ", " "));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        User u = saved.getValue();
        assertEquals("an@test.com", u.getEmail());
        assertEquals("HASH", u.getPasswordHash());
        assertEquals("Nguyen An", u.getFullName());
        assertNull(u.getPhone(), "so dien thoai rong luu null");
        assertEquals(Role.CUSTOMER, u.getRole());
        assertEquals("TOKEN", res.token());
        assertEquals(Role.CUSTOMER, res.user().role());
    }

    @Test
    void register_duplicate_email_is_conflict_and_saves_nothing() {
        when(users.existsByEmail("an@test.com")).thenReturn(true);

        ApiException e = assertThrows(ApiException.class,
                () -> auth.register(new RegisterRequest("AN@test.com", "secret123", "An", null)));

        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        verify(users, never()).save(any());
        verifyNoInteractions(encoder, jwt);
    }

    @Test
    void login_with_correct_password_returns_token() {
        User u = new User();
        u.setEmail("an@test.com");
        u.setPasswordHash("HASH");
        when(users.findByEmail("an@test.com")).thenReturn(Optional.of(u));
        when(encoder.matches("secret123", "HASH")).thenReturn(true);
        when(jwt.generate(u)).thenReturn("TOKEN");

        assertEquals("TOKEN", auth.login(new LoginRequest(" AN@test.com", "secret123")).token());
    }

    @Test
    void login_wrong_password_and_unknown_email_give_same_401() {
        User u = new User();
        u.setPasswordHash("HASH");
        when(users.findByEmail("an@test.com")).thenReturn(Optional.of(u));
        when(encoder.matches("wrong", "HASH")).thenReturn(false);
        when(users.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        ApiException wrong = assertThrows(ApiException.class, () -> auth.login(new LoginRequest("an@test.com", "wrong")));
        ApiException ghost = assertThrows(ApiException.class, () -> auth.login(new LoginRequest("ghost@test.com", "x")));

        assertEquals(HttpStatus.UNAUTHORIZED, wrong.getStatus());
        assertEquals(wrong.getMessage(), ghost.getMessage(), "khong de lo email nao da dang ky");
        verifyNoInteractions(jwt);
    }
}
