package com.quickstay.user;

import com.quickstay.config.ApiException;
import com.quickstay.security.JwtService;
import com.quickstay.user.AuthDtos.AuthResponse;
import com.quickstay.user.AuthDtos.LoginRequest;
import com.quickstay.user.AuthDtos.RegisterRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
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
        users.save(u);
        log.info("Dang ky tai khoan moi id={}", u.getId());
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
}
