package com.quickstay.user;

import com.quickstay.user.AuthDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/verify-email")
    public UserDto verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return auth.verifyEmail(req.token());
    }

    @PostMapping("/resend-verification")
    public MessageResponse resendVerification(@Valid @RequestBody EmailActionRequest req) {
        return auth.resendVerification(req.email());
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody EmailActionRequest req) {
        return auth.forgotPassword(req.email());
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return auth.resetPassword(req.token(), req.newPassword());
    }
}
