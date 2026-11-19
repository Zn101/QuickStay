package com.quickstay.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.ApiTestBase;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PartnerApiTest extends ApiTestBase {

    @Autowired UserRepository users;
    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired BookingRepository bookings;

    private String adminToken() throws Exception {
        var r = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)))
                .andReturn();
        return read(r).get("token").asText();
    }

    private String partnerToken(String email, String password) throws Exception {
        var r = mvc.perform(withBody(post("/api/auth/login"), null,
                        Map.of("email", email, "password", password)))
                .andReturn();
        return read(r).get("token").asText();
    }

    @Test
    void TC_PARTNER_01_admin_can_create_list_and_manage_partner_accounts() throws Exception {
        String admin = adminToken();

        // Tao 1 hotel moi
        Hotel h = new Hotel();
        h.setName("Homestay Test " + UUID.randomUUID());
        h.setCity("Hoi An");
        hotels.save(h);

        String partnerEmail = "host-" + UUID.randomUUID() + "@quickstay.test";
        Map<String, Object> req = Map.of(
                "email", partnerEmail,
                "password", "Host@123",
                "fullName", "Chu Homestay A",
                "phone", "0901234567",
                "hotelId", h.getId()
        );

        // 1. Admin tao tai khoan doi tac
        mvc.perform(withBody(post("/api/admin/partners"), admin, req))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(partnerEmail))
                .andExpect(jsonPath("$.fullName").value("Chu Homestay A"))
                .andExpect(jsonPath("$.role").value("HOTEL_MANAGER"))
                .andExpect(jsonPath("$.hotelId").value(h.getId()))
                .andExpect(jsonPath("$.hotelName").value(h.getName()));

        // 2. Admin xem danh sach doi tac
        mvc.perform(withBody(get("/api/admin/partners"), admin, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", hasItem(partnerEmail)));

        // 3. Khach hang khong duoc truy cap /api/admin/partners
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(get("/api/admin/partners"), customer, null))
                .andExpect(status().isForbidden());
    }

    @Test
    void TC_PARTNER_02_partner_can_view_and_confirm_bookings_for_own_hotel() throws Exception {
        String admin = adminToken();

        // 1. Tao 2 khach san: Hotel A (cua partner) va Hotel B (khac)
        Hotel hotelA = new Hotel();
        hotelA.setName("Partner Hotel A " + UUID.randomUUID());
        hotelA.setCity("Da Nang");
        hotels.save(hotelA);

        Room roomA = new Room();
        roomA.setHotel(hotelA);
        roomA.setRoomType("Deluxe A");
        roomA.setPricePerNight(BigDecimal.valueOf(600_000));
        roomA.setCapacity(2);
        roomA.setQuantity(5);
        rooms.save(roomA);

        Hotel hotelB = new Hotel();
        hotelB.setName("Other Hotel B " + UUID.randomUUID());
        hotelB.setCity("Ha Noi");
        hotels.save(hotelB);

        Room roomB = new Room();
        roomB.setHotel(hotelB);
        roomB.setRoomType("Standard B");
        roomB.setPricePerNight(BigDecimal.valueOf(500_000));
        roomB.setCapacity(2);
        roomB.setQuantity(5);
        rooms.save(roomB);

        // 2. Tao partner account gan voi Hotel A
        String partnerEmail = "partner-" + UUID.randomUUID() + "@quickstay.test";
        mvc.perform(withBody(post("/api/admin/partners"), admin, Map.of(
                "email", partnerEmail,
                "password", "Host@123",
                "fullName", "Quan Ly Hotel A",
                "hotelId", hotelA.getId()
        ))).andExpect(status().isCreated());

        String partnerJwt = partnerToken(partnerEmail, "Host@123");

        // 3. Khach hang dat 1 phong o Hotel A va 1 phong o Hotel B
        String cust = registerCustomer(newCustomerEmail());
        var resA = mvc.perform(withBody(post("/api/bookings"), cust, Map.of(
                "roomId", roomA.getId(),
                "checkIn", LocalDate.now().plusDays(2).toString(),
                "checkOut", LocalDate.now().plusDays(4).toString(),
                "guests", 2,
                "guestName", "Khach A",
                "guestPhone", "0912345678"
        ))).andExpect(status().isCreated()).andReturn();
        long bookingAId = read(resA).get("id").asLong();

        var resB = mvc.perform(withBody(post("/api/bookings"), cust, Map.of(
                "roomId", roomB.getId(),
                "checkIn", LocalDate.now().plusDays(3).toString(),
                "checkOut", LocalDate.now().plusDays(5).toString(),
                "guests", 2,
                "guestName", "Khach B",
                "guestPhone", "0912345679"
        ))).andExpect(status().isCreated()).andReturn();
        long bookingBId = read(resB).get("id").asLong();

        // 4. Partner chi nhin thay bookingA (thuoc Hotel A), KHONG thay bookingB
        var listRes = mvc.perform(withBody(get("/api/partner/bookings"), partnerJwt, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem((int) bookingAId)))
                .andExpect(jsonPath("$[*].id", not(hasItem((int) bookingBId))))
                .andReturn();

        // 5. Partner xac nhan don A (PENDING -> CONFIRMED)
        mvc.perform(withBody(patch("/api/partner/bookings/" + bookingAId + "/status"), partnerJwt,
                        Map.of("status", "CONFIRMED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // 6. Partner thu xac nhan don B (thuoc Hotel B khac) -> BI TU CHOI 403 Forbidden!
        mvc.perform(withBody(patch("/api/partner/bookings/" + bookingBId + "/status"), partnerJwt,
                        Map.of("status", "CONFIRMED")))
                .andExpect(status().isForbidden());
    }
}
