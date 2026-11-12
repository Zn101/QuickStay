package com.quickstay.user;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Ket qua PUT /api/users/me: ho so nhu UserDto, them token moi khi email thuc su doi (T128).
 * Email khong doi thi khong co truong token, token dang dung van hop le.
 */
public record UpdateProfileResponse(Long id, String email, String fullName, String phone, Role role,
                                    boolean emailVerified,
                                    @JsonInclude(JsonInclude.Include.NON_NULL) String token) {

    public static UpdateProfileResponse of(User u, String token) {
        return new UpdateProfileResponse(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(),
                u.isEmailVerified(), token);
    }
}
