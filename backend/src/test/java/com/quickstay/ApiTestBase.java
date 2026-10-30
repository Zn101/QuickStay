
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class ApiTestBase {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    protected static final String ADMIN_EMAIL = "admin@quickstay.local";
    protected static final String ADMIN_PASSWORD = "Admin@123";

    // Gắn JSON body và JWT token vào request
    protected MockHttpServletRequestBuilder withBody(
            MockHttpServletRequestBuilder builder,
            String token,
            Object body
    ) throws Exception {
        builder.contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body));

        return token == null
                ? builder
                : builder.header("Authorization", "Bearer " + token);
    }

    // Đọc JSON response
    protected JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }

    // Tạo email ngẫu nhiên cho khách hàng
    protected String newCustomerEmail() {
        return "user-" + UUID.randomUUID() + "@test.com";
    }

    // Đăng ký khách hàng và lấy JWT
    protected String registerCustomer(String email) throws Exception {
        MvcResult result = mvc.perform(withBody(
                post("/api/auth/register"),
                null,
                Map.of(
                        "email", email,
                        "password", "secret123",
                        "fullName", "Khach Test",
                        "phone", "0900000000"
                )
        )).andReturn();

        return read(result).get("token").asText();
    }

    // Đăng nhập tài khoản ADMIN và lấy JWT
    protected String adminToken() throws Exception {
        MvcResult result = mvc.perform(withBody(
                post("/api/auth/login"),
                null,
                Map.of(
                        "email", ADMIN_EMAIL,
                        "password", ADMIN_PASSWORD
                )
        )).andReturn();

        if (result.getResponse().getStatus() != 200) {
            throw new IllegalStateException(
                    "Admin login failed: " + result.getResponse().getContentAsString()
            );
        }

        return read(result).get("token").asText();
    }

    // Gắn JWT vào request
    protected MockHttpServletRequestBuilder auth(
            MockHttpServletRequestBuilder builder,
            String token
    ) {
        return builder.header("Authorization", "Bearer " + token);
    }

    // Tạo ngày đặt phòng sau ngày hiện tại
    protected LocalDate in(int dayOffset) {
        return LocalDate.now().plusDays(dayOffset);
    }

    // Tạo khách sạn và phòng mẫu phục vụ kiểm thử
    protected long newRoom(
            String admin,
            int quantity,
            int capacity,
            long price
    ) throws Exception {

        // Tạo khách sạn
        MvcResult hotelResult = mvc.perform(withBody(
                post("/api/admin/hotels"),
                admin,
                Map.of(
                        "name", "Test Hotel " + UUID.randomUUID(),
                        "city", "Hue",
                        "address", "Test Address"
                )
        )).andReturn();

        if (hotelResult.getResponse().getStatus() != 201) {
            throw new IllegalStateException(
                    "Create hotel failed: " +
                            hotelResult.getResponse().getContentAsString()
            );
        }

        long hotelId = read(hotelResult).get("id").asLong();

        // Tạo loại phòng
        MvcResult roomResult = mvc.perform(withBody(
                post("/api/admin/rooms"),
                admin,
                Map.of(
                        "hotelId", hotelId,
                        "roomType", "Test Room",
                        "pricePerNight", BigDecimal.valueOf(price),
                        "capacity", capacity,
                        "quantity", quantity
                )
        )).andReturn();

        if (roomResult.getResponse().getStatus() != 201) {
            throw new IllegalStateException(
                    "Create room failed: " +
                            roomResult.getResponse().getContentAsString()
            );
        }

        return read(roomResult).get("id").asLong();
    }

    // Tạo dữ liệu JSON cho yêu cầu đặt phòng
    protected Map<String, Object> bookingBody(
            long roomId,
            LocalDate checkIn,
            LocalDate checkOut,
            int guests
    ) {
        return Map.of(
                "roomId", roomId,
                "checkIn", checkIn,
                "checkOut", checkOut,
                "guests", guests,
                "guestName", "Nguyen Van A",
                "guestPhone", "0900000000",
                "note", "Test booking"
        );
    }
}
