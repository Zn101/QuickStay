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

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class ApiTestBase {

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;

    protected static final String ADMIN_EMAIL = "admin@quickstay.local";
    protected static final String ADMIN_PASSWORD = "Admin@123";

    protected MockHttpServletRequestBuilder withBody(MockHttpServletRequestBuilder b, String token, Object body)
            throws Exception {
        b.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        return token == null ? b : b.header("Authorization", "Bearer " + token);
    }

    protected JsonNode read(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
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
}
