package com.quickstay.config;

import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Tao tai khoan admin mac dinh neu chua co (T020). Chay o moi moi truong. */
@Component
@Order(1)
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AdminProperties admin;

    public AdminAccountInitializer(UserRepository users, PasswordEncoder encoder, AdminProperties admin) {
        this.users = users;
        this.encoder = encoder;
        this.admin = admin;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = admin.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            return;
        }
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(admin.password()));
        u.setFullName("Quản trị viên");
        u.setRole(Role.ADMIN);
        users.save(u);
        log.info("Da tao tai khoan admin {}", email);
    }
}
