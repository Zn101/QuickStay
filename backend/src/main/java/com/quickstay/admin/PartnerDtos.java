package com.quickstay.admin;

import com.quickstay.user.Role;
import com.quickstay.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class PartnerDtos {

    public record CreatePartnerRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 72) String password,
            @NotBlank String fullName,
            String phone,
            @NotNull Long hotelId
    ) {}

    public record UpdatePartnerRequest(
            String fullName,
            String phone,
            Long hotelId,
            String password
    ) {}

    public record PartnerView(
            Long id,
            String email,
            String fullName,
            String phone,
            Role role,
            Long hotelId,
            String hotelName,
            String hotelCity,
            Instant createdAt
    ) {
        public static PartnerView of(User u, String hotelName, String hotelCity) {
            return new PartnerView(
                    u.getId(),
                    u.getEmail(),
                    u.getFullName(),
                    u.getPhone(),
                    u.getRole(),
                    u.getHotelId(),
                    hotelName,
                    hotelCity,
                    u.getCreatedAt()
            );
        }
    }
}
