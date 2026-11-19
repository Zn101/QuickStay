package com.quickstay;

import com.quickstay.config.ClientIp;
import com.quickstay.email.EmailLog;
import com.quickstay.email.EmailLogRepository;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Cau hinh mac dinh (REQUIRE_VERIFIED_EMAIL=true): chua xac thuc email thi khong dat phong duoc. */
@SpringBootTest(properties = "app.auth.require-verified-email=true")
class EmailVerificationRequiredTest extends ApiTestBase {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired EmailLogRepository emailLogs;

    @Test
    void booking_requires_verified_email() throws Exception {
        Hotel h = new Hotel();
        h.setName("Verify " + UUID.randomUUID());
        h.setCity("Hue");
        hotels.save(h);
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Standard");
        r.setPricePerNight(BigDecimal.TEN);
        r.setQuantity(2);
        rooms.save(r);

        String email = newCustomerEmail();
        String token = registerCustomer(email);
        Map<String, Object> body = Map.of("roomId", r.getId(),
                "checkIn", LocalDate.now().plusDays(3).toString(),
                "checkOut", LocalDate.now().plusDays(4).toString(),
                "guests", 1, "guestName", "K", "guestPhone", "09");
        mvc.perform(withBody(post("/api/bookings"), token, body)).andExpect(status().isForbidden());

        EmailLog log = emailLogs.findTop30ByRecipientOrderBySentAtDescIdDesc(email).get(0);
        var m = Pattern.compile("token=([0-9a-f-]{36})").matcher(log.getBodyHtml());
        m.find();
        mvc.perform(withBody(post("/api/auth/verify-email"), null, Map.of("token", m.group(1)))).andExpect(status().isOk());
        mvc.perform(withBody(post("/api/bookings"), token, body)).andExpect(status().isCreated());
    }

    @Test
    void client_ip_ignores_spoofed_headers_from_public_addresses() {
        MockHttpServletRequest direct = new MockHttpServletRequest();
        direct.setRemoteAddr("203.0.113.9");
        direct.addHeader("X-Forwarded-For", "1.2.3.4");
        direct.addHeader("X-Real-IP", "5.6.7.8");
        assertEquals("203.0.113.9", ClientIp.of(direct));

        MockHttpServletRequest viaProxy = new MockHttpServletRequest();
        viaProxy.setRemoteAddr("172.18.0.5");
        viaProxy.addHeader("X-Forwarded-For", "1.2.3.4, 198.51.100.7");
        assertEquals("198.51.100.7", ClientIp.of(viaProxy), "lay phan tu cuoi do nginx them, khong lay gia tri client tu dat");
    }
}
