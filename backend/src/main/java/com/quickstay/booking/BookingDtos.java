package com.quickstay.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Request/response cua /api/bookings (docs/QuickStay-API.md muc 6). */
public final class BookingDtos {

    private BookingDtos() {}

    /**
     * Body POST /api/bookings. Kiem tra hinh thuc o day; quy tac nghiep vu (ngay, suc chua) o BookingService.
     * guests la Integer de thieu truong bao "khong duoc de trong" thay vi thanh 0.
     */
    public record BookingRequest(
            @NotNull Long roomId,
            @NotNull LocalDate checkIn,
            @NotNull LocalDate checkOut,
            @NotNull @Min(value = 1, message = "toi thieu 1 khach") Integer guests,
            @NotBlank @Size(max = 255) String guestName,
            @NotBlank @Size(max = 30) String guestPhone,
            @Size(max = 1000) String note,
            PaymentMethod paymentMethod) {

        public BookingRequest(Long roomId, LocalDate checkIn, LocalDate checkOut, Integer guests,
                              String guestName, String guestPhone, String note) {
            this(roomId, checkIn, checkOut, guests, guestName, guestPhone, note, PaymentMethod.PAY_AT_HOTEL);
        }

        public BookingRequest {
            guestName = guestName == null ? null : guestName.trim();
            guestPhone = guestPhone == null ? null : guestPhone.trim();
            note = note == null || note.isBlank() ? null : note.trim();
            paymentMethod = paymentMethod == null ? PaymentMethod.PAY_AT_HOTEL : paymentMethod;
        }
    }

    public record PaymentRequest(
            @NotNull PaymentMethod paymentMethod,
            @Size(max = 60) String accountLabel) {
        public PaymentRequest {
            accountLabel = accountLabel == null || accountLabel.isBlank() ? null : accountLabel.trim();
        }
    }

    public record BookingView(Long id, Long roomId, String roomType, Long hotelId, String hotelName, String userEmail,
                              LocalDate checkIn, LocalDate checkOut, int guests, String guestName, String guestPhone,
                              String note, BigDecimal totalPrice, BookingStatus status,
                              PaymentMethod paymentMethod, PaymentStatus paymentStatus, String paymentRef, Instant paidAt,
                              Instant createdAt) {

        public static BookingView of(Booking b) {
            var room = b.getRoom();
            var hotel = room.getHotel();
            return new BookingView(b.getId(), room.getId(), room.getRoomType(), hotel.getId(), hotel.getName(),
                    b.getUser().getEmail(), b.getCheckIn(), b.getCheckOut(), b.getGuests(), b.getGuestName(),
                    b.getGuestPhone(), b.getNote(), b.getTotalPrice(), b.getStatus(),
                    b.getPaymentMethod(), b.getPaymentStatus(), b.getPaymentRef(), b.getPaidAt(),
                    b.getCreatedAt());
        }
    }
}
