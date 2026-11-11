package com.quickstay;

import com.quickstay.booking.BookingRepository;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Nhanh loi dat phong va huy don voi du lieu dau vao bat thuong (T151), qua JWT that.
 * Gui JSON tho de kiem tra dung kieu du lieu ma client co the gui sai.
 */
class BookingInputEdgeCaseTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;
    @Autowired Clock clock;

    private Room room;
    private String token;
    private String in;
    private String out;

    @BeforeEach
    void setUp() throws Exception {
        Hotel h = new Hotel();
        h.setName("Input " + UUID.randomUUID());
        h.setCity("Test City");
        hotels.save(h);
        room = new Room();
        room.setHotel(h);
        room.setRoomType("Standard");
        room.setPricePerNight(BigDecimal.valueOf(500_000));
        room.setCapacity(4);
        room.setQuantity(5);
        rooms.save(room);
        token = registerCustomer(newCustomerEmail());
        LocalDate d = LocalDate.now(clock).plusDays(10);
        in = d.toString();
        out = d.plusDays(1).toString();
    }

    /** guests va roomId duoc chen nguyen van vao JSON de thu cac kieu sai. */
    private ResultActions bookRaw(String roomId, String guests) throws Exception {
        String body = """
                {"roomId": %s, "checkIn": "%s", "checkOut": "%s", "guests": %s,
                 "guestName": "Nguyen Van A", "guestPhone": "0912345678"}
                """.formatted(roomId, in, out, guests);
        return mvc.perform(post("/api/bookings").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static void assertBadRequest(ResultActions r) throws Exception {
        r.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void fractional_guests_is_rejected_not_rounded() throws Exception {
        long before = bookings.count();
        assertBadRequest(bookRaw(room.getId().toString(), "2.5"));
        assertEquals(before, bookings.count(), "khong duoc tao don voi so khach bi lam tron");
    }

    @Test
    void guests_out_of_int_range_or_wrong_type_is_400() throws Exception {
        assertBadRequest(bookRaw(room.getId().toString(), "99999999999"));
        assertBadRequest(bookRaw(room.getId().toString(), "-1"));
        assertBadRequest(bookRaw(room.getId().toString(), "\"hai\""));
        assertBadRequest(bookRaw(room.getId().toString(), "null"));
    }

    @Test
    void room_id_with_wrong_type_is_400() throws Exception {
        assertBadRequest(bookRaw("\"abc\"", "1"));
        assertBadRequest(bookRaw("1.5", "1"));
        assertBadRequest(bookRaw("null", "1"));
    }

    @Test
    void whole_number_written_as_string_is_accepted() throws Exception {
        bookRaw("\"" + room.getId() + "\"", "\"2\"").andExpect(status().isCreated()).andExpect(jsonPath("$.guests").value(2));
    }

    @Test
    void cancelling_with_zero_negative_or_huge_id_is_404_or_400() throws Exception {
        for (String id : new String[]{"0", "-1", "999999999"}) {
            mvc.perform(patch("/api/bookings/" + id + "/cancel").header("Authorization", "Bearer " + token))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(patch("/api/bookings/99999999999999999999/cancel").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }
}
