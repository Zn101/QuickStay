package com.quickstay.booking;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static com.quickstay.booking.BookingStatus.*;
import static org.junit.jupiter.api.Assertions.*;

class BookingStatusTest {

    @Test
    void transitions_follow_erd_state_diagram() {
        assertEquals(Set.of(CONFIRMED, CANCELLED), PENDING.next());
        assertEquals(Set.of(CHECKED_IN, CANCELLED), CONFIRMED.next());
        assertEquals(Set.of(COMPLETED, CANCELLED), CHECKED_IN.next());
        assertTrue(COMPLETED.next().isEmpty());
        assertTrue(CANCELLED.next().isEmpty());
    }
}
