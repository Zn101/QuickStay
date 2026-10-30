package com.quickstay.user;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** /api/users/me: can dang nhap (CUSTOMER hoac ADMIN). */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    @GetMapping("/me")
    public UserDto me(Authentication auth) {
        return users.me(auth.getName());
    }

    @PutMapping("/me")
    public UserDto update(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        return users.update(auth.getName(), req);
    }
}
