package com.quickstay.booking;

import java.util.Set;

public enum BookingStatus {
    PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED;

    /** Cac trang thai duoc phep chuyen tiep (docs/QuickStay-ERD.md muc 3). */
    public Set<BookingStatus> next() {
        return switch (this) {
            case PENDING -> Set.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> Set.of(CHECKED_IN, CANCELLED);
            case CHECKED_IN -> Set.of(COMPLETED, CANCELLED);
            case COMPLETED, CANCELLED -> Set.of();
        };
    }
}
