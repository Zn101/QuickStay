package com.quickstay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class ApiTestBase {

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;

    protected static final String ADMIN_EMAIL = "admin@quickstay.local";
    protected static final String ADMIN_PASSWORD = "Admin@123";

    protected static LocalDate in(int days) {
        return LocalDate.now().plusDays(days);
    }

    protected MockHttpServletRequestBuilder withBody(MockHttpServletRequestBuilder b, String token, Object body)
            throws Exception {
        b.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        return token == null ? b : b.header("Authorization", "Bearer " + token);
    }

    protected MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder b, String token) {
        return token == null ? b : b.header("Authorization", "Bearer " + token);
    }

    protected JsonNode read(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    protected String adminToken() throws Exception {
        MvcResult r = mvc.perform(withBody(post("/api/auth/login"), null,
                Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD))).andReturn();
        return read(r).get("token").asText();
    }

    protected String newCustomerEmail() {
        return "user-" + UUID.randomUUID() + "@test.com";
    }

    protected String registerCustomer(String email) throws Exception {
        MvcResult r = mvc.perform(withBody(post("/api/auth/register"), null,
                Map.of("email", email, "password", "secret123", "fullName", "Khach Test", "phone", "0900000000")))
                .andReturn();
        return read(r).get("token").asText();
    }

    /** Tao khach san + mot loai phong moi (rieng cho tung test) va tra ve id phong. */
    protected long newRoom(String adminToken, int quantity, int capacity, int price) throws Exception {
        MvcResult h = mvc.perform(withBody(post("/api/admin/hotels"), adminToken,
                Map.of("name", "Hotel " + UUID.randomUUID(), "city", "Test City"))).andReturn();
        long hotelId = read(h).get("id").asLong();
        MvcResult r = mvc.perform(withBody(post("/api/admin/rooms"), adminToken,
                Map.of("hotelId", hotelId, "roomType", "Standard", "pricePerNight", price,
                        "capacity", capacity, "quantity", quantity))).andReturn();
        return read(r).get("id").asLong();
    }

    protected Map<String, Object> bookingBody(long roomId, LocalDate checkIn, LocalDate checkOut, int guests) {
        return Map.of("roomId", roomId, "checkIn", checkIn.toString(), "checkOut", checkOut.toString(),
                "guests", guests, "guestName", "Nguyen Van A", "guestPhone", "0911222333", "note", "Tang cao");
    }
}
