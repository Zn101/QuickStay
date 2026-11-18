package com.quickstay.user;

import com.quickstay.user.UserService.UserSettingsDto;
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
    public UpdateProfileResponse update(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        return users.update(auth.getName(), req);
    }

    @GetMapping("/me/settings")
    public UserSettingsDto settings(Authentication auth) {
        return users.settings(auth.getName());
    }

    @PutMapping("/me/settings")
    public UserSettingsDto updateSettings(Authentication auth, @RequestBody UserSettingsDto req) {
        return users.updateSettings(auth.getName(), req);
    }
}
