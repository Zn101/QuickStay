package com.quickstay.user;

import com.quickstay.config.ApiException;
import com.quickstay.email.EmailLog;
import com.quickstay.email.EmailService;
import com.quickstay.security.JwtService;
import com.quickstay.user.AuthDtos.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final EmailService emails;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this(users, encoder, jwt, null);
    }

    @Autowired
    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt,
                       @Autowired(required = false) EmailService emails) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.emails = emails;
    }

    /** Tao tai khoan CUSTOMER. Hai request trung email cung luc: unique key chan ban thu hai (409). */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw ApiException.conflict("Email da duoc su dung");
        }
        User u = new User();
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFullName(req.fullName());
        u.setPhone(req.phone());
        u.setRole(Role.CUSTOMER);
        u.setEmailVerified(false);
        String token = UUID.randomUUID().toString();
        u.setVerificationToken(token);
        u.setVerificationTokenExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        users.save(u);
        log.info("Dang ky tai khoan moi id={}", u.getId());
        if (emails != null) {
            emails.sendVerificationEmail(u.getEmail(), u.getFullName(), token);
        }
        return new AuthResponse(jwt.generate(u), UserDto.of(u));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        // Cung mot thong bao cho sai email va sai mat khau de khong lo email nao da dang ky
        User u = users.findByEmail(req.email())
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> {
                    log.warn("Dang nhap that bai cho {}", req.email());
                    return ApiException.unauthorized("Sai email hoac mat khau");
                });
        return new AuthResponse(jwt.generate(u), UserDto.of(u));
    }

    @Transactional
    public UserDto verifyEmail(String token) {
        User u = users.findByVerificationToken(token)
                .orElseThrow(() -> ApiException.badRequest("Ma xac thuc khong hop le hoac da duoc su dung"));
        if (u.getVerificationTokenExpiresAt() != null && u.getVerificationTokenExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Ma xac thuc da het han, vui long yeu cau gui lai");
        }
        u.setEmailVerified(true);
        u.setVerificationToken(null);
        u.setVerificationTokenExpiresAt(null);
        users.save(u);
        log.info("Da xac thuc email cho user id={}", u.getId());
        return UserDto.of(u);
    }

    @Transactional
    public MessageResponse resendVerification(String email) {
        users.findByEmail(email).ifPresent(u -> {
            if (!u.isEmailVerified()) {
                String token = UUID.randomUUID().toString();
                u.setVerificationToken(token);
                u.setVerificationTokenExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
                users.save(u);
                if (emails != null) {
                    emails.sendVerificationEmail(u.getEmail(), u.getFullName(), token);
                }
            }
        });
        return new MessageResponse("Neu email ton tai va chua xac thuc, chung toi da gui lai lien ket xac thuc.");
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(String email) {
        boolean demoMode = emails == null || !emails.smtpEnabled();

        var opt = users.findByEmail(email);
        if (opt.isPresent()) {
            User u = opt.get();
            String token = UUID.randomUUID().toString();
            u.setResetToken(token);
            u.setResetTokenExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
            users.save(u);
            if (emails != null) {
                emails.sendPasswordResetEmail(u.getEmail(), u.getFullName(), token);
            }
            log.info("Tao yeu cau khoi phuc mat khau cho user id={}", u.getId());
        }

        // Bao mat: Khong bao gio tra ve token khoi phuc trong response JSON ke ca o che do demo
        return new ForgotPasswordResponse(
                "Neu email ton tai trong he thong, chung toi da gui huong dan dat lai mat khau.",
                demoMode,
                null);
    }

    @Transactional
    public MessageResponse resetPassword(String token, String newPassword) {
        User u = users.findByResetToken(token)
                .orElseThrow(() -> ApiException.badRequest("Lien ket hoac ma khoi phuc khong hop le"));
        if (u.getResetTokenExpiresAt() != null && u.getResetTokenExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Ma khoi phuc da het han, vui long gui lai yeu cau");
        }
        u.setPasswordHash(encoder.encode(newPassword));
        u.setResetToken(null);
        u.setResetTokenExpiresAt(null);
        u.setEmailVerified(true);
        users.save(u);
        if (emails != null) {
            emails.sendPasswordChangedEmail(u.getEmail(), u.getFullName());
        }
        log.info("Da dat lai mat khau cho user id={}", u.getId());
        return new MessageResponse("Dat lai mat khau thanh cong! Ban co the dang nhap bang mat khau moi.");
    }
}
