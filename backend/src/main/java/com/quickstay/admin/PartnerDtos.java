package com.quickstay.admin;

import com.quickstay.user.MaxUtf8Bytes;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.venue.VenueService.Listing;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public class PartnerDtos {

    /**
     * role: HOTEL_MANAGER (mac dinh, can hotelId), RESTAURANT_OWNER hoac TOUR_OPERATOR (can listingIds:
     * id nha hang / tour duoc giao cho doi tac).
     */
    public record CreatePartnerRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 6, message = "mat khau toi thieu 6 ky tu")
            @MaxUtf8Bytes(value = 72, message = "mat khau toi da 72 byte") String password,
            @NotBlank @Size(max = 255) String fullName,
            @Size(max = 30) String phone,
            Role role,
            Long hotelId,
            @Size(max = 100) List<Long> listingIds
    ) {}

    /** Moi truong tuy chon; password rong = giu nguyen; listingIds null = giu nguyen. */
    public record UpdatePartnerRequest(
            @Size(max = 255) String fullName,
            @Size(max = 30) String phone,
            Long hotelId,
            @MaxUtf8Bytes(value = 72, message = "mat khau toi da 72 byte") String password,
            @Size(max = 100) List<Long> listingIds
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
            List<Listing> listings,
            Instant createdAt
    ) {
        public static PartnerView of(User u, String hotelName, String hotelCity, List<Listing> listings) {
            return new PartnerView(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(),
                    u.getHotelId(), hotelName, hotelCity, listings, u.getCreatedAt());
        }
    }
}
