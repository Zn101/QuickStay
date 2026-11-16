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

import java.math.BigDecimal;
import java.text.Normalizer;
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
                     @Value("${app.ai.model:claude-sonnet-4-20250514}") String model,
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
        String system = "Bạn là trợ lý ảo cao cấp của QuickStay - hệ thống đặt phòng khách sạn và dịch vụ du lịch hàng đầu Việt Nam. "
                + "Hãy trả lời một cách nhiệt tình, lịch thiệp, chu đáo bằng tiếng Việt. Sử dụng emoji sinh động (🏨, 📍, 💰, 🌟, ✈️, 🍽️) "
                + "và định dạng gạch đầu dòng rõ ràng, mạch lạc. Tư vấn chính xác về phòng, giá, tiện nghi, dịch vụ đưa đón, tour tham quan và nhà hàng ẩm thực.\n\n"
                + "DỮ LIỆU HIỆN CÓ:\n" + context;
        String out = complete(system, message, 600);
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

    private static String stripAccents(String s) {
        if (s == null) return "";
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
    }

    private String fallbackChat(String message) {
        String raw = message == null ? "" : message.trim();
        String stripped = stripAccents(raw);
        List<Hotel> all = hotels.findAll();

        // 1. Lời chào & Hỏi chung
        boolean isGreeting = stripped.isEmpty()
                || stripped.equals("xin chao") || stripped.startsWith("xin chao ")
                || stripped.equals("chao") || stripped.startsWith("chao ")
                || stripped.equals("hello") || stripped.startsWith("hello ")
                || stripped.equals("hi") || stripped.startsWith("hi ")
                || stripped.contains("tro giup") || stripped.contains("help");
        if (isGreeting) {
            return "Dạ xin chào quý khách! Em là trợ lý ảo QuickStay ✨\n"
                    + "Em luôn sẵn sàng hỗ trợ quý khách:\n"
                    + "🏨 Tra cứu khách sạn & resort tại Đà Nẵng, Phú Quốc, Nha Trang, Hà Nội, TP.HCM, Hội An, Huế, Đà Lạt\n"
                    + "💰 Báo giá phòng tốt nhất hôm nay & phòng trống tức thì\n"
                    + "✈️ Đặt xe đưa đón sân bay (Sedan 4 chỗ, SUV 7 chỗ, Limousine VIP)\n"
                    + "🍽️ Đặt bàn nhà hàng & tour tham quan các điểm du lịch nổi tiếng\n"
                    + "Quý khách đang có kế hoạch vi vu đến thành phố nào ạ?";
        }

        // 2. Hỏi về Tour du lịch / Điểm tham quan (Point of Interest)
        if (stripped.contains("tour") || stripped.contains("tham quan") || stripped.contains("diem den") || stripped.contains("cau vang") || stripped.contains("ba na") || stripped.contains("trang an")) {
            return "QuickStay hiện có các gói Tour tham quan điểm đến cực kỳ hấp dẫn:\n"
                    + "• Tour Bà Nà Hills & Check-in Cầu Vàng (Đà Nẵng): từ 850.000 ₫/khách\n"
                    + "• Tour Khám phá 4 đảo & Cáp treo Hòn Thơm (Phú Quốc): từ 1.050.000 ₫/khách\n"
                    + "• Tour Vịnh San Hô & Lặn ngắm biển Nha Trang: từ 750.000 ₫/khách\n"
                    + "• Tour Di sản Tràng An - Bái Đính từ Hà Nội: từ 950.000 ₫/khách\n"
                    + "• Tour Săn mây Đồi chè Cầu Đất (Đà Lạt): từ 520.000 ₫/khách\n"
                    + "👉 Quý khách có thể vào mục 'Tour & Điểm đến' trên thanh menu để chọn ngày và đặt xe riêng đón tận nơi nhé!";
        }

        // 3. Hỏi về Nhà hàng / Ẩm thực / Đặt bàn
        if (stripped.contains("nha hang") || stripped.contains("an uong") || stripped.contains("am thuc") || stripped.contains("dat ban") || stripped.contains("hai san") || stripped.contains("buffet")) {
            return "QuickStay kết nối chuỗi nhà hàng ẩm thực phong phú với dịch vụ giữ bàn ưu tiên:\n"
                    + "🍽️ Sunrise Bistro Seafood & Grill (Đà Nẵng): Hải sản tươi sống bên bờ biển Mỹ Khê\n"
                    + "🍽️ Emerald Bay Ocean Grill (Phú Quốc): Tiệc nướng BBQ ngắm hoàng hôn Bãi Khem\n"
                    + "🍽️ Horizon Sky Dining & Lounge (Nha Trang): Rooftop tầng 28 ngắm trọn vịnh biển\n"
                    + "🍽️ Old Quarter Gourmet (Hà Nội): Chả cá Lăng, bún chả que tre phố cổ\n"
                    + "👉 Quý khách có thể bấm vào 'Nhà hàng & Ẩm thực' trên menu để đặt bàn giữ chỗ miễn phí 100% ạ!";
        }

        // 4. Hỏi về Đưa đón sân bay
        if (stripped.contains("san bay") || stripped.contains("dua don") || stripped.contains("xe don")) {
            return "QuickStay hỗ trợ dịch vụ xe đưa đón sân bay tận nơi 24/7:\n"
                    + "🚗 Xe Sedan 4 chỗ (Vios/Mazda): 250.000 ₫ - Nhanh chóng & tiết kiệm\n"
                    + "🚙 Xe SUV 7 chỗ (Fortuner/Innova): 380.000 ₫ - Rộng rãi cho gia đình\n"
                    + "🚐 Limousine VIP DCar 9 chỗ: 650.000 ₫ - Đón bảng tên & ghế massage êm ái\n"
                    + "Quý khách có thể chọn đặt xe kèm ngay trong trang chi tiết của từng khách sạn.";
        }

        // 5. Hỏi về Chính sách / Hủy phòng / Hoàn tiền
        if (stripped.contains("chinh sach") || stripped.contains("huy phong") || stripped.contains("hoan tien") || stripped.contains("thanh toan") || stripped.contains("doi phong")) {
            return "Chính sách đặt phòng tại QuickStay:\n"
                    + "✓ Miễn phí hủy phòng trước 24 giờ so với giờ nhận phòng tiêu chuẩn\n"
                    + "✓ Đơn thanh toán trực tuyến hủy hợp lệ sẽ được tự động hoàn tiền 100%\n"
                    + "✓ Hỗ trợ nhận phòng sớm & giữ hành lý miễn phí tại quầy lễ tân\n"
                    + "✓ Chấp nhận thanh toán qua VietQR, thẻ Visa/Mastercard và ví điện tử MoMo/VNPay.\n"
                    + "Quý khách có thể bấm vào ảnh đại diện góc phải chọn 'Chính sách & Q&A' để xem chi tiết đầy đủ.";
        }

        // 6. Hỏi về Giá rẻ nhất / Tiết kiệm
        if (stripped.contains("re nhat") || stripped.contains("thap nhat") || stripped.contains("gia re") || stripped.contains("tiet kiem")) {
            if (all.isEmpty()) return "Dạ hiện tại hệ thống đang cập nhật danh sách khách sạn.";
            Hotel cheapest = null;
            BigDecimal lowest = null;
            for (Hotel h : all) {
                List<Room> rList = rooms.findByHotelIdOrderByPricePerNight(h.getId());
                if (!rList.isEmpty()) {
                    BigDecimal price = rList.get(0).getPricePerNight();
                    if (lowest == null || price.compareTo(lowest) < 0) {
                        lowest = price;
                        cheapest = h;
                    }
                }
            }
            if (cheapest == null || lowest == null) return "Dạ hiện chưa có thông tin giá phòng trong hệ thống.";
            return "Khách sạn có mức giá tiết kiệm nhất hiện tại là " + cheapest.getName() + " tại " + cheapest.getCity()
                    + " với mức giá ưu đãi chỉ từ " + VND.format(lowest) + " VND/đêm.\n"
                    + "Quý khách có thể xem chi tiết và đặt phòng ngay tại trang chủ QuickStay!";
        }

        // 7. Tìm kiếm theo tên khách sạn / thành phố / tiện nghi
        List<Hotel> matched = all.stream()
                .filter(h -> {
                    String hName = stripAccents(h.getName());
                    String hCity = stripAccents(h.getCity());
                    String hAmen = h.getAmenities() != null ? stripAccents(h.getAmenities()) : "";
                    return stripped.contains(hName) || stripped.contains(hCity)
                            || (!hCity.isEmpty() && stripped.contains(hCity))
                            || (!hAmen.isEmpty() && stripped.contains(hAmen));
                })
                .toList();

        if (!matched.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Dạ QuickStay gợi ý các khách sạn phù hợp với tìm kiếm của quý khách:\n\n");
            for (Hotel h : matched) {
                sb.append("🏨 ").append(h.getName()).append(" - 📍 ").append(h.getCity()).append('\n');
                if (h.getAmenities() != null && !h.getAmenities().isBlank()) {
                    sb.append("   ✨ Tiện nghi: ").append(h.getAmenities()).append('\n');
                }
                List<Room> rList = rooms.findByHotelIdOrderByPricePerNight(h.getId());
                if (!rList.isEmpty()) {
                    sb.append("   🛏️ Giá phòng: ");
                    List<String> roomStrs = rList.stream()
                            .map(r -> r.getRoomType() + " (" + VND.format(r.getPricePerNight()) + " VND/đêm)")
                            .toList();
                    sb.append(String.join(", ", roomStrs)).append('\n');
                }
                sb.append('\n');
            }
            sb.append("Quý khách hãy nhấp vào khách sạn mong muốn để chọn ngày nhận phòng và xem ảnh thực tế nhé!");
            return sb.toString().trim();
        }

        if (all.isEmpty()) return "Dạ hiện chưa có khách sạn nào trong hệ thống.";
        return "Dạ em chưa nắm rõ yêu cầu của quý khách. Quý khách có thể thử hỏi theo tên thành phố hoặc khách sạn, ví dụ:\n"
                + "• \"Khách sạn ở Đà Nẵng giá bao nhiêu?\"\n"
                + "• \"Khách sạn nào giá rẻ nhất hiện tại?\"\n"
                + "• \"Có tour tham quan Bà Nà Hills không?\"\n"
                + "• \"Dịch vụ xe đưa đón sân bay thế nào?\"\n"
                + "QuickStay luôn hân hạnh được đồng hành cùng quý khách! 😊";
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
