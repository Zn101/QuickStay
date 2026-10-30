package com.quickstay.user;

import com.quickstay.config.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Ho so nguoi dung dang dang nhap (T064). */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public UserService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    /** email: subject cua JWT, JwtAuthFilter dat vao Authentication.getName(). */
    @Transactional(readOnly = true)
    public UserDto me(String email) {
        return UserDto.of(current(email));
    }

    @Transactional
    public UserDto update(String email, UpdateProfileRequest req) {
        User u = current(email);
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
        }
        if (req.password() != null) {
            u.setPasswordHash(encoder.encode(req.password()));
            log.info("Nguoi dung id={} doi mat khau", u.getId());
        }
        // Entity dang duoc quan ly trong transaction: thay doi tu ghi xuong DB khi commit
        return UserDto.of(u);
    }

    private User current(String email) {
        // Token hop le nhung tai khoan khong con (vd. vua doi email): yeu cau dang nhap lai
        return users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
    }
}
