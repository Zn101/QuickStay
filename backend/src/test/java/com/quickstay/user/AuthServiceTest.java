package com.quickstay.user;

import com.quickstay.config.ApiException;
import com.quickstay.email.EmailService;
import com.quickstay.security.JwtService;
import com.quickstay.user.AuthDtos.ForgotPasswordResponse;
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

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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

    // ─── T193-G2.2-A R-09: forgot-password security tests ───────────────────────

    /** Tao AuthService voi EmailService tuy chinh (InjectMocks khong inject EmailService). */
    private AuthService authWithEmail(EmailService emailService) {
        return new AuthService(users, encoder, jwt, emailService);
    }

    @Test
    void forgotPassword_no_email_service_nonexistent_email_returns_safe_message() {
        // EmailService = null (khong duoc cau hinh)
        when(users.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        ForgotPasswordResponse resp = auth.forgotPassword("ghost@test.com");

        assertNotNull(resp.message(), "phai tra message");
        assertFalse(resp.message().isBlank(), "message khong duoc rong");
        // Xac nhan ForgotPasswordResponse chi co 1 field (message) – khong co demoMode, demoEmail
        assertEquals(1, ForgotPasswordResponse.class.getRecordComponents().length,
                "ForgotPasswordResponse phai chi co dung 1 field 'message'");
        verify(users, never()).save(any());
    }

    @Test
    void forgotPassword_no_email_service_existing_email_saves_token_returns_safe_message_no_token_in_response() {
        // EmailService = null; email ton tai
        User u = new User();
        u.setEmail("customer@test.com");
        u.setRole(Role.CUSTOMER);
        when(users.findByEmail("customer@test.com")).thenReturn(Optional.of(u));

        ForgotPasswordResponse resp = auth.forgotPassword("customer@test.com");

        // Response chi chua message, khong chua token
        assertNotNull(resp.message());
        assertFalse(resp.message().isBlank());
        // Token duoc luu trong DB (users.save() duoc goi)
        verify(users).save(u);
        // Message khong chua token
        assertFalse(resp.message().contains(u.getResetToken() != null ? u.getResetToken() : "uuid"),
                "message khong duoc chua reset token");
    }

    @Test
    void forgotPassword_with_email_service_customer_no_token_in_response() throws Exception {
        EmailService emailSvc = mock(EmailService.class);
        AuthService svc = authWithEmail(emailSvc);

        User u = new User();
        u.setEmail("customer@test.com");
        u.setRole(Role.CUSTOMER);
        when(users.findByEmail("customer@test.com")).thenReturn(Optional.of(u));

        ForgotPasswordResponse resp = svc.forgotPassword("customer@test.com");

        // Response chi co 1 field message
        assertEquals(1, ForgotPasswordResponse.class.getRecordComponents().length,
                "ForgotPasswordResponse chi duoc co 1 field 'message'");
        assertNotNull(resp.message());
        // sendPasswordResetEmail duoc goi nhung token khong bi lo ra response
        verify(emailSvc).sendPasswordResetEmail(anyString(), any(), anyString());
    }

    @Test
    void forgotPassword_with_email_service_admin_no_token_in_response() {
        EmailService emailSvc = mock(EmailService.class);
        AuthService svc = authWithEmail(emailSvc);

        User u = new User();
        u.setEmail("admin@test.com");
        u.setRole(Role.ADMIN);
        when(users.findByEmail("admin@test.com")).thenReturn(Optional.of(u));

        ForgotPasswordResponse resp = svc.forgotPassword("admin@test.com");

        assertNotNull(resp.message());
        // Email admin: sendPasswordResetEmail van duoc goi
        verify(emailSvc).sendPasswordResetEmail(anyString(), any(), anyString());
    }

    @Test
    void forgotPassword_nonexistent_email_returns_same_safe_message_as_existing_email() {
        // Email khong ton tai
        when(users.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        ForgotPasswordResponse respGhost = auth.forgotPassword("ghost@test.com");

        // Email ton tai
        User u = new User();
        u.setEmail("real@test.com");
        u.setRole(Role.CUSTOMER);
        when(users.findByEmail("real@test.com")).thenReturn(Optional.of(u));
        ForgotPasswordResponse respReal = auth.forgotPassword("real@test.com");

        // Ca hai tra cung message (khong de lo email co ton tai khong)
        assertEquals(respGhost.message(), respReal.message(),
                "message phai giong nhau cho email ton tai va khong ton tai");
    }

    @Test
    void forgotPassword_smtp_failure_returns_safe_message_no_exception_propagated() {
        EmailService emailSvc = mock(EmailService.class);
        AuthService svc = authWithEmail(emailSvc);

        User u = new User();
        u.setEmail("customer@test.com");
        u.setRole(Role.CUSTOMER);
        when(users.findByEmail("customer@test.com")).thenReturn(Optional.of(u));
        doThrow(new RuntimeException("SMTP connection failed")).when(emailSvc)
                .sendPasswordResetEmail(anyString(), any(), anyString());

        // Khong nem exception ra ngoai; tra safe message
        ForgotPasswordResponse resp = assertDoesNotThrow(() -> svc.forgotPassword("customer@test.com"));
        assertNotNull(resp.message());
        assertFalse(resp.message().isBlank());
    }

    @Test
    void resetPassword_expired_token_throws_bad_request() {
        User u = new User();
        u.setResetToken("expired-token");
        u.setResetTokenExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS)); // da het han
        when(users.findByResetToken("expired-token")).thenReturn(Optional.of(u));

        ApiException e = assertThrows(ApiException.class,
                () -> auth.resetPassword("expired-token", "newPass123"));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
        assertTrue(e.getMessage().toLowerCase().contains("het han") ||
                        e.getMessage().toLowerCase().contains("expired") ||
                        e.getMessage().contains("het"),
                "thong bao loi phai de cap den het han");
    }

    @Test
    void resetPassword_invalid_or_already_used_token_throws_bad_request() {
        // Token khong ton tai (da bi xoa sau lan su dung dau)
        when(users.findByResetToken("used-or-invalid-token")).thenReturn(Optional.empty());

        ApiException e = assertThrows(ApiException.class,
                () -> auth.resetPassword("used-or-invalid-token", "newPass123"));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void resetPassword_valid_token_clears_token_and_updates_password() {
        User u = new User();
        u.setResetToken("valid-token");
        u.setResetTokenExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        when(users.findByResetToken("valid-token")).thenReturn(Optional.of(u));
        when(encoder.encode("newPass123")).thenReturn("NEW_HASH");

        auth.resetPassword("valid-token", "newPass123");

        verify(users).save(u);
        assertEquals("NEW_HASH", u.getPasswordHash());
        assertNull(u.getResetToken(), "token phai bi xoa sau khi su dung");
        assertNull(u.getResetTokenExpiresAt(), "expiry phai bi xoa sau khi su dung");
        assertTrue(u.isEmailVerified(), "email phai duoc danh dau la da xac thuc");
    }
}
