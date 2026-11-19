package com.quickstay.user;

import com.quickstay.config.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Thao tac tao du lieu thay mat khach (dat phong, danh gia, dat dich vu) yeu cau email da xac thuc,
 * de khong ai dung email cua nguoi khac. Tat bang REQUIRE_VERIFIED_EMAIL=false (vd. demo noi bo).
 */
@Component
public class EmailVerificationPolicy {

    private final boolean required;

    public EmailVerificationPolicy(@Value("${app.auth.require-verified-email:true}") boolean required) {
        this.required = required;
    }

    public static EmailVerificationPolicy disabled() {
        return new EmailVerificationPolicy(false);
    }

    public void requireVerified(User u) {
        if (required && !u.isEmailVerified()) {
            throw ApiException.forbidden("Vui long xac thuc email truoc khi thuc hien thao tac nay");
        }
    }
}
