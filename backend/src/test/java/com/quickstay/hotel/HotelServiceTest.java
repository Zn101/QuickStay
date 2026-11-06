package com.quickstay.hotel;

import com.quickstay.config.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Unit test tim kiem va loc khach san (T063), khong khoi dong Spring. */
@ExtendWith(MockitoExtension.class)
class HotelServiceTest {

    @Mock HotelRepository repo;
    @InjectMocks HotelService service;

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

    @Test
    void search_passes_normalized_filters_to_repository() {
        when(repo.search(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(List.of());

        service.search(new HotelSearch(" Sun ", "Đà", " Family SUITE ", BigDecimal.ONE, BigDecimal.TEN));

        verify(repo).search("%sun%", "%đà%", "family suite", BigDecimal.ONE, BigDecimal.TEN, true);
    }

    @Test
    void search_without_filters_lists_all_hotels() {
        when(repo.search(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(List.of());

        service.search(new HotelSearch(null, null, null, null, null));

        verify(repo).search(null, null, null, null, null, false);
    }

    @Test
    void equal_min_and_max_price_is_allowed() {
        when(repo.search(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(List.of());
        BigDecimal p = BigDecimal.valueOf(500_000);
        assertDoesNotThrow(() -> service.search(new HotelSearch(null, null, null, p, p)));
    }

    @Test
    void min_price_greater_than_max_is_bad_request_and_skips_query() {
        ApiException e = assertThrows(ApiException.class, () -> service.search(
                new HotelSearch(null, null, null, BigDecimal.TEN, BigDecimal.ONE)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
        verifyNoInteractions(repo);
    }

    @Test
    void get_returns_summary_or_404() {
        HotelSummary h = new HotelSummary(1L, "A", "B", null, null, null, null, BigDecimal.ONE);
        when(repo.findSummary(1L)).thenReturn(Optional.of(h));
        when(repo.findSummary(99L)).thenReturn(Optional.empty());

        assertSame(h, service.get(1L));
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ApiException.class, () -> service.get(99L)).getStatus());
    }
}
