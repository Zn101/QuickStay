package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.email.EmailLog;
import com.quickstay.email.EmailLogRepository;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests cho thanh toan gia lap, email giao dich, xac thuc email va khoi phuc mat khau.
 */
class PaymentEmailRecoveryApiTest extends ApiTestBase {

    @Autowired UserRepository users;
    @Autowired EmailLogRepository emailLogs;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;

    private MockHttpServletRequestBuilder bearer(MockHttpServletRequestBuilder b, String token) {
        return b.header("Authorization", "Bearer " + token);
    }

    private String adminToken() throws Exception {
        MvcResult r = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        return read(r).get("token").asText();
    }

    private long createSampleRoom() {
        Hotel h = new Hotel();
        h.setName("PayTest Hotel " + UUID.randomUUID());
        h.setCity("Da Nang");
        hotels.save(h);
        Room r = new Room();
        r.setHotel(h);
        r.setRoomType("Deluxe");
        r.setPricePerNight(BigDecimal.valueOf(500_000));
        r.setCapacity(2);
        r.setQuantity(2);
        rooms.save(r);
        return r.getId();
    }

    @Test
    void register_sends_verification_email_and_verify_endpoint_marks_verified() throws Exception {
        String email = newCustomerEmail();
        mvc.perform(withBody(post("/api/auth/register"), null,
                        Map.of("email", email, "password", "secret123", "fullName", "Minh Thu", "phone", "0901234567")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.emailVerified").value(false));

        User saved = users.findByEmail(email).orElseThrow();
        String token = saved.getVerificationToken();
        assertNotNull(token);

        List<EmailLog> logs = emailLogs.findTop30ByRecipientOrderBySentAtDescIdDesc(email);
        assertFalse(logs.isEmpty());
        assertEquals("EMAIL_VERIFICATION", logs.get(0).getEmailType());
        assertTrue(logs.get(0).getBodyHtml().contains(token));

        mvc.perform(withBody(post("/api/auth/verify-email"), null, Map.of("token", token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(true));

        // Token chi dung duoc mot lan
        mvc.perform(withBody(post("/api/auth/verify-email"), null, Map.of("token", token)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgot_and_reset_password_flow_works_for_customer_and_protects_admin() throws Exception {
        String email = newCustomerEmail();
        registerCustomer(email);

        mvc.perform(withBody(post("/api/auth/forgot-password"), null, Map.of("email", email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demoMode").value(true))
                .andExpect(jsonPath("$.demoEmail").doesNotExist());

        String resetToken = users.findByEmail(email).orElseThrow().getResetToken();
        assertNotNull(resetToken);

        // Khong bao gio lo token qua API forgot-password cho ca admin va customer
        mvc.perform(withBody(post("/api/auth/forgot-password"), null, Map.of("email", ADMIN_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demoEmail").doesNotExist());

        // Dat lai mat khau moi
        mvc.perform(withBody(post("/api/auth/reset-password"), null,
                        Map.of("token", resetToken, "newPassword", "newpass456")))
                .andExpect(status().isOk());

        // Mat khau cu that bai, mat khau moi dang nhap thanh cong
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "secret123")))
                .andExpect(status().isUnauthorized());
        mvc.perform(withBody(post("/api/auth/login"), null, Map.of("email", email, "password", "newpass456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.emailVerified").value(true));
    }

    @Test
    void placebo_payment_and_refund_on_cancel_update_status_and_send_emails() throws Exception {
        String admin = adminToken();
        long room = createSampleRoom();
        String customerEmail = newCustomerEmail();
        String customerToken = registerCustomer(customerEmail);
        String otherToken = registerCustomer(newCustomerEmail());

        Map<String, Object> bookingReq = Map.of(
                "roomId", room,
                "checkIn", LocalDate.now().plusDays(5).toString(),
                "checkOut", LocalDate.now().plusDays(7).toString(),
                "guests", 2,
                "guestName", "Nguyen Van A",
                "guestPhone", "0912345678",
                "note", "Phong tang cao"
        );

        MvcResult created = mvc.perform(withBody(post("/api/bookings"), customerToken, bookingReq))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").value("PAY_AT_HOTEL"))
                .andExpect(jsonPath("$.paymentStatus").value("UNPAID"))
                .andReturn();
        long bookingId = read(created).get("id").asLong();

        // Nguoi khac khong duoc thanh toan ho
        mvc.perform(withBody(post("/api/bookings/" + bookingId + "/pay"), otherToken,
                        Map.of("paymentMethod", "BANK_TRANSFER")))
                .andExpect(status().isForbidden());

        // Khong the goi /pay voi PAY_AT_HOTEL
        mvc.perform(withBody(post("/api/bookings/" + bookingId + "/pay"), customerToken,
                        Map.of("paymentMethod", "PAY_AT_HOTEL")))
                .andExpect(status().isBadRequest());

        // Thanh toan online mo phong thanh cong
        mvc.perform(withBody(post("/api/bookings/" + bookingId + "/pay"), customerToken,
                        Map.of("paymentMethod", "CREDIT_CARD", "accountLabel", "Visa **** 4242")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentMethod").value("CREDIT_CARD"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.paymentRef", startsWith("QS-PAY-")))
                .andExpect(jsonPath("$.paidAt").isNotEmpty());

        // Thanh toan lan hai bi tu choi (409)
        mvc.perform(withBody(post("/api/bookings/" + bookingId + "/pay"), customerToken,
                        Map.of("paymentMethod", "E_WALLET")))
                .andExpect(status().isConflict());

        // Huy don da thanh toan -> tu dong REFUNDED
        mvc.perform(bearer(patch("/api/bookings/" + bookingId + "/cancel"), customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"));

        // Kiem tra hop thu cua khach hang va admin
        mvc.perform(bearer(get("/api/emails/me"), customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].emailType", hasItems("EMAIL_VERIFICATION", "BOOKING_CONFIRMATION", "PAYMENT_RECEIPT", "BOOKING_STATUS")));

        mvc.perform(bearer(get("/api/admin/emails"), customerToken)).andExpect(status().isForbidden());
        mvc.perform(bearer(get("/api/admin/emails"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
    }
}
