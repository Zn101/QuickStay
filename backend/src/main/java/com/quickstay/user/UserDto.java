package com.quickstay.user;

public record UserDto(Long id, String email, String fullName, String phone, Role role, boolean emailVerified, Long hotelId) {
    public UserDto(Long id, String email, String fullName, String phone, Role role, boolean emailVerified) {
        this(id, email, fullName, phone, role, emailVerified, null);
    }

    public static UserDto of(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(), u.isEmailVerified(), u.getHotelId());
    }
}
