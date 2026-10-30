package com.quickstay.hotel;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Truy van tim kiem/loc cua HotelRepository (T063) tren du lieu rieng cua test:
 * moi test tao khach san trong mot thanh pho ngau nhien nen khong phu thuoc du lieu mau.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class HotelSearchQueryTest {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;

    private String city;
    private Hotel alpha;   // Standard 300k, Deluxe 800k
    private Hotel beta;    // Deluxe 500k
    private Hotel gamma;   // chua co phong

    @BeforeEach
    void setUp() {
        city = "City " + UUID.randomUUID();
        alpha = hotel("Alpha Resort");
        room(alpha, "Standard", 300_000);
        room(alpha, "Deluxe", 800_000);
        beta = hotel("Beta 100% Inn");
        room(beta, "Deluxe", 500_000);
        gamma = hotel("Gamma House");
    }

    private Hotel hotel(String name) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setCity(city);
        return hotels.save(h);
    }

    private void room(Hotel h, String type, long price) {
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType(type);
        r.setPricePerNight(BigDecimal.valueOf(price));
        rooms.save(r);
    }

    /** Luon gioi han trong thanh pho cua test. */
    private List<HotelSummary> search(String q, String roomType, Long min, Long max) {
        return hotels.search(HotelService.containsPattern(q), HotelService.containsPattern(city),
                roomType == null ? null : roomType.toLowerCase(),
                min == null ? null : BigDecimal.valueOf(min), max == null ? null : BigDecimal.valueOf(max),
                roomType != null || min != null || max != null);
    }

    private static List<String> names(List<HotelSummary> list) {
        return list.stream().map(HotelSummary::name).toList();
    }

    private static long price(List<HotelSummary> list, Hotel h) {
        return list.stream().filter(s -> s.id().equals(h.getId())).findFirst().orElseThrow().minPrice().longValue();
    }

    @Test
    void no_filter_lists_all_with_min_price_and_null_for_hotel_without_rooms() {
        List<HotelSummary> all = search(null, null, null, null);
        assertEquals(List.of("Alpha Resort", "Beta 100% Inn", "Gamma House"), names(all));
        assertEquals(300_000, price(all, alpha));
        assertEquals(500_000, price(all, beta));
        assertNull(all.get(2).minPrice());
    }

    @Test
    void q_matches_part_of_name_case_insensitive() {
        assertEquals(List.of("Alpha Resort"), names(search("RESO", null, null, null)));
        assertEquals(List.of("Beta 100% Inn"), names(search("100%", null, null, null)), "% la ky tu thuong");
        assertTrue(search("10_%", null, null, null).isEmpty(), "_ khong phai ky tu dai dien");
    }

    @Test
    void room_type_filter_is_exact_and_recomputes_min_price() {
        List<HotelSummary> deluxe = search(null, "deluxe", null, null);
        assertEquals(List.of("Alpha Resort", "Beta 100% Inn"), names(deluxe));
        assertEquals(800_000, price(deluxe, alpha), "gia Deluxe, khong phai Standard 300k");
        assertTrue(search(null, "delux", null, null).isEmpty());
    }

    @Test
    void price_bounds_are_inclusive() {
        assertEquals(List.of("Beta 100% Inn"), names(search(null, null, 500_000L, 500_000L)));
        assertEquals(List.of("Alpha Resort"), names(search(null, null, null, 300_000L)));
        List<HotelSummary> from500 = search(null, null, 500_000L, null);
        assertEquals(List.of("Alpha Resort", "Beta 100% Inn"), names(from500));
        assertEquals(800_000, price(from500, alpha));
    }

    @Test
    void combined_filters_must_match_the_same_room() {
        // Alpha co Standard 300k va Deluxe 800k nhung khong co Deluxe <= 600k
        assertEquals(List.of("Beta 100% Inn"), names(search(null, "Deluxe", null, 600_000L)));
        assertTrue(search("alpha", "Standard", 400_000L, null).isEmpty());
    }

    @Test
    void find_summary_returns_min_price_or_empty() {
        assertEquals(300_000, hotels.findSummary(alpha.getId()).orElseThrow().minPrice().longValue());
        assertNull(hotels.findSummary(gamma.getId()).orElseThrow().minPrice());
        assertTrue(hotels.findSummary(-1L).isEmpty());
    }
}
