package com.quickstay.user;

import com.quickstay.config.ApiException;
import com.quickstay.email.EmailService;
import com.quickstay.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/** Ho so nguoi dung dang dang nhap (T064). */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final EmailService emails;

    public UserService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this(users, encoder, jwt, null);
    }

    @Autowired
    public UserService(UserRepository users, PasswordEncoder encoder, JwtService jwt,
                       @Autowired(required = false) EmailService emails) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.emails = emails;
    }

    /** email: subject cua JWT, JwtAuthFilter dat vao Authentication.getName(). */
    @Transactional(readOnly = true)
    public UserDto me(String email) {
        return UserDto.of(current(email));
    }

    @Transactional
    public UpdateProfileResponse update(String email, UpdateProfileRequest req) {
        User u = current(email);
        boolean emailChanged = false;
        if (req.fullName() != null) {
            u.setFullName(req.fullName());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone().isEmpty() ? null : req.phone());
        }
        if (req.email() != null && !req.email().equals(u.getEmail())) {
            if (users.existsByEmail(req.email())) {
                throw ApiException.conflict("Email da duoc su dung");
            }
            log.info("Nguoi dung id={} doi email", u.getId());
            u.setEmail(req.email());
            u.setEmailVerified(false);
            String token = UUID.randomUUID().toString();
            u.setVerificationToken(token);
            u.setVerificationTokenExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
            emailChanged = true;
            if (emails != null) {
                emails.sendVerificationEmail(u.getEmail(), u.getFullName(), token);
            }
        }
        if (req.password() != null) {
            u.setPasswordHash(encoder.encode(req.password()));
            log.info("Nguoi dung id={} doi mat khau", u.getId());
        }
        // Entity dang duoc quan ly trong transaction: thay doi tu ghi xuong DB khi commit.
        // Token mang email lam subject nen doi email thi token cu het tac dung: cap token moi de khong bi mat dang nhap.
        return UpdateProfileResponse.of(u, emailChanged ? jwt.generate(u) : null);
    }

    public record UserSettingsDto(
            String preferredLanguage,
            String currencyDisplay,
            boolean notifyEmail,
            boolean notifyPromo,
            boolean compactMode) {
        public static UserSettingsDto of(User u) {
            return new UserSettingsDto(u.getPreferredLanguage(), u.getCurrencyDisplay(),
                    u.isNotifyEmail(), u.isNotifyPromo(), u.isCompactMode());
        }
    }

    @Transactional(readOnly = true)
    public UserSettingsDto settings(String email) {
        return UserSettingsDto.of(current(email));
    }

    @Transactional
    public UserSettingsDto updateSettings(String email, UserSettingsDto req) {
        User u = current(email);
        if (req.preferredLanguage() != null && (req.preferredLanguage().equals("vi") || req.preferredLanguage().equals("en"))) {
            u.setPreferredLanguage(req.preferredLanguage());
        }
        if (req.currencyDisplay() != null && (req.currencyDisplay().equals("VND") || req.currencyDisplay().equals("USD"))) {
            u.setCurrencyDisplay(req.currencyDisplay());
        }
        u.setNotifyEmail(req.notifyEmail());
        u.setNotifyPromo(req.notifyPromo());
        u.setCompactMode(req.compactMode());
        log.info("Nguoi dung id={} cap nhat cai dat ung dung", u.getId());
        return UserSettingsDto.of(u);
    }

    private User current(String email) {
        // Token hop le nhung tai khoan khong con (vd. vua doi email): yeu cau dang nhap lai
        return users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
    }
}
