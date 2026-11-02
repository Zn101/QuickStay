package com.quickstay.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    public record UpdateProfileRequest(String fullName, String phone, @Email String email,
                                       @Size(min = 6, message = "mat khau toi thieu 6 ky tu") String password) {}

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public UserController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @GetMapping("/me")
    public UserDto me(Authentication auth) {
        return UserDto.of(current(auth));
    }

    @PutMapping("/me")
    public UserDto update(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        User u = current(auth);
        if (req.fullName() != null && !req.fullName().isBlank()) u.setFullName(req.fullName().trim());
        if (req.phone() != null) u.setPhone(req.phone());
        if (req.email() != null && !req.email().isBlank()) {
            String email = req.email().trim().toLowerCase();
            if (!email.equals(u.getEmail()) && users.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email da duoc su dung");
            }
            u.setEmail(email);
        }
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(encoder.encode(req.password()));
        }
        return UserDto.of(users.save(u));
    }

    private User current(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tai khoan khong ton tai"));
    }
}
