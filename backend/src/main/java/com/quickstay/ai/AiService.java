package com.quickstay.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Goi Chat Model (Anthropic Messages API). Khi khong co khoa API hoac dich vu loi,
 * tra ve noi dung du phong dua tren du lieu trong CSDL de tinh nang van dung duoc.
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final NumberFormat VND = NumberFormat.getInstance(new Locale("vi", "VN"));

    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final String apiKey;
    private final String model;
    private final RestClient client;

    public AiService(HotelRepository hotels, RoomRepository rooms,
                     @Value("${app.ai.api-key:}") String apiKey,
                     @Value("${app.ai.model}") String model,
                     @Value("${app.ai.base-url:https://api.anthropic.com}") String baseUrl,
                     @Value("${app.ai.timeout-seconds:20}") int timeoutSeconds) {
        this.hotels = hotels;
        this.rooms = rooms;
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(timeoutSeconds * 1000);
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    // ---------- Sinh mo ta ----------

    public String describe(String type, String name, String city, String amenities, String roomType) {
        boolean isRoom = "room".equalsIgnoreCase(type);
        String subject = isRoom ? "phong " + (roomType == null || roomType.isBlank() ? name : roomType)
                + " tai khach san " + name : "khach san " + name;
        String prompt = "Viet mot doan mo ta tieng Viet chuan SEO (60-90 tu) cho " + subject
                + (city == null || city.isBlank() ? "" : ", thanh pho " + city)
                + (amenities == null || amenities.isBlank() ? "" : ". Tien nghi: " + amenities)
                + ". Giong van than thien, co tu khoa ve dia diem va tien nghi, khong dung markdown, "
                + "chi tra ve doan mo ta.";
        String out = complete("Ban la chuyen gia viet noi dung du lich va SEO.", prompt, 400);
        return out != null ? out : fallbackDescription(isRoom, subject, city, amenities);
    }

    private String fallbackDescription(boolean isRoom, String subject, String city, String amenities) {
        StringBuilder sb = new StringBuilder();
        String place = city == null || city.isBlank() ? "" : " tai " + city;
        sb.append(Character.toUpperCase(subject.charAt(0))).append(subject.substring(1)).append(place)
                .append(isRoom ? " mang den khong gian nghi ngoi thoai mai, sach se va tien loi."
                        : " la lua chon luu tru thoai mai, gia hop ly, phuc vu tan tinh.");
        if (amenities != null && !amenities.isBlank()) {
            sb.append(" Tien nghi noi bat: ").append(amenities).append('.');
        }
        sb.append(" Dat phong truc tuyen nhanh chong, thanh toan tai khach san.");
        return sb.toString();
    }

    // ---------- Chatbot ----------

    @Transactional(readOnly = true)
    public String chat(String message) {
        String context = buildContext();
        String system = "Ban la tro ly cua QuickStay, he thong dat phong khach san. Chi tra loi dua tren du lieu "
                + "duoi day (khach san, phong, gia theo dem, tien nghi). Neu khong co thong tin, noi ro la chua co "
                + "va goi y khach xem trang tim kiem. Tra loi ngan gon bang tieng Viet, khong dung markdown.\n\n"
                + "DU LIEU:\n" + context;
        String out = complete(system, message, 500);
        return out != null ? out : fallbackChat(message);
    }

    private String buildContext() {
        StringBuilder sb = new StringBuilder();
        for (Hotel h : hotels.findAll()) {
            sb.append("- ").append(h.getName()).append(" (").append(h.getCity()).append(')');
            if (h.getAmenities() != null) sb.append(", tien nghi: ").append(h.getAmenities());
            sb.append("\n");
            for (Room r : rooms.findByHotelId(h.getId())) {
                sb.append("    + ").append(r.getRoomType()).append(": ").append(VND.format(r.getPricePerNight()))
                        .append(" VND/dem, toi da ").append(r.getCapacity()).append(" khach\n");
            }
        }
        return sb.toString();
    }

    private String fallbackChat(String message) {
        String m = message == null ? "" : message.toLowerCase(Locale.ROOT);
        List<Hotel> all = hotels.findAll();
        List<Hotel> matched = all.stream()
                .filter(h -> m.contains(h.getName().toLowerCase(Locale.ROOT))
                        || m.contains(h.getCity().toLowerCase(Locale.ROOT)))
                .toList();
        if (matched.isEmpty()) {
            if (all.isEmpty()) return "Hien chua co khach san nao trong he thong.";
            return "Minh chua hieu ro cau hoi. Ban co the hoi theo ten khach san hoac thanh pho, hien co: "
                    + String.join(", ", all.stream().map(h -> h.getName() + " (" + h.getCity() + ")").toList()) + ".";
        }
        StringBuilder sb = new StringBuilder();
        for (Hotel h : matched) {
            sb.append(h.getName()).append(" (").append(h.getCity()).append(')');
            if (h.getAmenities() != null && !h.getAmenities().isBlank()) {
                sb.append(" - tien nghi: ").append(h.getAmenities());
            }
            sb.append(". Phong: ");
            sb.append(String.join("; ", rooms.findByHotelIdOrderByPricePerNight(h.getId()).stream()
                    .map(r -> r.getRoomType() + " " + VND.format(r.getPricePerNight()) + " VND/dem").toList()));
            sb.append(".\n");
        }
        return sb.toString().trim();
    }

    // ---------- Goi Chat Model ----------

    private String complete(String system, String user, int maxTokens) {
        if (!enabled()) return null;
        try {
            JsonNode res = client.post().uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .body(Map.of("model", model, "max_tokens", maxTokens, "system", system,
                            "messages", List.of(Map.of("role", "user", "content", user))))
                    .retrieve().body(JsonNode.class);
            if (res != null && res.path("content").isArray() && !res.path("content").isEmpty()) {
                String text = res.path("content").get(0).path("text").asText("").trim();
                if (!text.isEmpty()) return text;
            }
        } catch (Exception e) {
            log.warn("Goi dich vu AI that bai, dung noi dung du phong: {}", e.getMessage());
        }
        return null;
    }
}
