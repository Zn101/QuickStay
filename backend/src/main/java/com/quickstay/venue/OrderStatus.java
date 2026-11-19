package com.quickstay.venue;

import java.util.Set;

/** Trang thai don dat ban / dat tour. */
public enum OrderStatus {
    PENDING, CONFIRMED, COMPLETED, CANCELLED;

    public Set<OrderStatus> next() {
        return switch (this) {
            case PENDING -> Set.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> Set.of(COMPLETED, CANCELLED);
            case COMPLETED, CANCELLED -> Set.of();
        };
    }

    public String label() {
        return switch (this) {
            case PENDING -> "Chờ xác nhận";
            case CONFIRMED -> "Đã xác nhận";
            case COMPLETED -> "Đã hoàn tất";
            case CANCELLED -> "Đã huỷ";
        };
    }
}
