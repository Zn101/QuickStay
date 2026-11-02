package com.quickstay;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminApiTest extends ApiTestBase {

    @Test
    void TC_ADMIN_01_customer_and_anonymous_cannot_use_admin_api() throws Exception {
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(auth(get("/api/admin/bookings"), customer)).andExpect(status().isForbidden());
        mvc.perform(auth(get("/api/admin/hotels"), customer)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/bookings")).andExpect(status().isUnauthorized());
    }

    @Test
    void TC_ADMIN_02_hotel_crud() throws Exception {
        String admin = adminToken();
        long id = read(mvc.perform(withBody(post("/api/admin/hotels"), admin,
                Map.of("name", "Khach san CRUD", "city", "Hue", "address", "1 Le Loi", "amenities", "Wifi"))
        ).andExpect(status().isCreated()).andReturn()).get("id").asLong();

        mvc.perform(withBody(put("/api/admin/hotels/" + id), admin,
                        Map.of("name", "Khach san CRUD v2", "city", "Hue")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Khach san CRUD v2"));
        mvc.perform(get("/api/hotels/" + id)).andExpect(jsonPath("$.name").value("Khach san CRUD v2"));
        mvc.perform(auth(delete("/api/admin/hotels/" + id), admin)).andExpect(status().isNoContent());
        mvc.perform(get("/api/hotels/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void TC_ADMIN_03_hotel_validation() throws Exception {
        mvc.perform(withBody(post("/api/admin/hotels"), adminToken(), Map.of("name", "", "city", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void TC_ADMIN_04_room_crud() throws Exception {
        String admin = adminToken();
        long hotelId = read(mvc.perform(withBody(post("/api/admin/hotels"), admin,
                Map.of("name", "Hotel phong", "city", "Hue"))).andReturn()).get("id").asLong();
        long roomId = read(mvc.perform(withBody(post("/api/admin/rooms"), admin,
                        Map.of("hotelId", hotelId, "roomType", "Deluxe", "pricePerNight", 900000,
                                "capacity", 3, "quantity", 2)))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(withBody(put("/api/admin/rooms/" + roomId), admin,
                        Map.of("hotelId", hotelId, "roomType", "Deluxe", "pricePerNight", 1000000,
                                "capacity", 3, "quantity", 5)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(5));
        mvc.perform(auth(delete("/api/admin/rooms/" + roomId), admin)).andExpect(status().isNoContent());
        mvc.perform(auth(delete("/api/admin/rooms/" + roomId), admin)).andExpect(status().isNotFound());
    }

    @Test
    void TC_ADMIN_05_cannot_delete_hotel_or_room_that_has_bookings() throws Exception {
        String admin = adminToken();
        long room = newRoom(admin, 1, 2, 500000);
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), customer, bookingBody(room, in(100), in(101), 1)))
                .andExpect(status().isCreated());
        mvc.perform(auth(delete("/api/admin/rooms/" + room), admin)).andExpect(status().isConflict());
    }

    @Test
    void TC_ADMIN_06_booking_status_follows_the_allowed_flow() throws Exception {
        String admin = adminToken();
        long room = newRoom(admin, 1, 2, 500000);
        String customer = registerCustomer(newCustomerEmail());
        long id = read(mvc.perform(withBody(post("/api/bookings"), customer, bookingBody(room, in(110), in(111), 1)))
                .andReturn()).get("id").asLong();
        for (String s : new String[]{"CONFIRMED", "CHECKED_IN", "COMPLETED"}) {
            mvc.perform(withBody(patch("/api/admin/bookings/" + id + "/status"), admin, Map.of("status", s)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value(s));
        }
    }

    @Test
    void TC_ADMIN_07_invalid_status_transition_is_rejected() throws Exception {
        String admin = adminToken();
        long room = newRoom(admin, 1, 2, 500000);
        String customer = registerCustomer(newCustomerEmail());
        long id = read(mvc.perform(withBody(post("/api/bookings"), customer, bookingBody(room, in(120), in(121), 1)))
                .andReturn()).get("id").asLong();
        mvc.perform(withBody(patch("/api/admin/bookings/" + id + "/status"), admin, Map.of("status", "COMPLETED")))
                .andExpect(status().isConflict());
        mvc.perform(withBody(patch("/api/admin/bookings/" + id + "/status"), admin, Map.of("status", "CANCELLED")))
                .andExpect(status().isOk());
        mvc.perform(withBody(patch("/api/admin/bookings/" + id + "/status"), admin, Map.of("status", "CONFIRMED")))
                .andExpect(status().isConflict());
    }

    @Test
    void TC_ADMIN_08_admin_lists_all_bookings() throws Exception {
        String admin = adminToken();
        long room = newRoom(admin, 1, 2, 500000);
        String customer = registerCustomer(newCustomerEmail());
        mvc.perform(withBody(post("/api/bookings"), customer, bookingBody(room, in(130), in(131), 1)));
        mvc.perform(auth(get("/api/admin/bookings"), admin)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].hotelName").isNotEmpty())
                .andExpect(jsonPath("$[0].userEmail").isNotEmpty());
    }
}
