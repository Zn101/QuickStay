package com.quickstay.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class BookingDtos {

    private BookingDtos() {}

    public record BookingRequest(@NotNull Long roomId, @NotNull LocalDate checkIn, @NotNull LocalDate checkOut,
                                 @Min(1) int guests, @NotBlank String guestName, @NotBlank String guestPhone,
                                 String note) {}

    public record StatusRequest(@NotNull BookingStatus status) {}

    public record BookingView(Long id, Long roomId, String roomType, Long hotelId, String hotelName,
                              String userEmail, LocalDate checkIn, LocalDate checkOut, int guests,
                              String guestName, String guestPhone, String note, BigDecimal totalPrice,
                              BookingStatus status, Instant createdAt) {
        public static BookingView of(Booking b) {
            return new BookingView(b.getId(), b.getRoom().getId(), b.getRoom().getRoomType(),
                    b.getRoom().getHotel().getId(), b.getRoom().getHotel().getName(), b.getUser().getEmail(),
                    b.getCheckIn(), b.getCheckOut(), b.getGuests(), b.getGuestName(), b.getGuestPhone(),
                    b.getNote(), b.getTotalPrice(), b.getStatus(), b.getCreatedAt());
        }
    }
}
