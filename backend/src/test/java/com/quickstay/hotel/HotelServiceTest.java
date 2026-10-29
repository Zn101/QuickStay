package com.quickstay.hotel;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class HotelServiceTest {

    @Test
    void contains_pattern_lowercases_and_escapes_like_wildcards() {
        assertNull(HotelService.containsPattern(null));
        assertEquals("%đà nẵng%", HotelService.containsPattern("Đà Nẵng"));
        assertEquals("%50!%%", HotelService.containsPattern("50%"));
        assertEquals("%a!_b%", HotelService.containsPattern("a_b"));
        assertEquals("%wow!!%", HotelService.containsPattern("wow!"));
    }

    @Test
    void search_params_trim_and_detect_room_filters() {
        HotelSearch s = new HotelSearch("  sunrise ", " ", "", null, null);
        assertEquals("sunrise", s.q());
        assertNull(s.city());
        assertNull(s.roomType());
        assertFalse(s.filtersRooms());
        assertTrue(new HotelSearch(null, null, null, BigDecimal.ZERO, null).filtersRooms());
        assertTrue(new HotelSearch(null, null, "Deluxe", null, null).filtersRooms());
    }
}
