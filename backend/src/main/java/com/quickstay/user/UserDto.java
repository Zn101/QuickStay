package com.quickstay.user;

public record UserDto(Long id, String email, String fullName, String phone, Role role) {
    public static UserDto of(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole());
    }
}
