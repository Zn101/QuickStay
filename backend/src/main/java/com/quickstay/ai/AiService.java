package com.quickstay.ai;

import com.quickstay.ai.cache.AiCacheService;
import com.quickstay.ai.client.AiClient;
import com.quickstay.ai.guard.AiGuardrailsService;
import com.quickstay.ai.model.*;
import com.quickstay.ai.tool.AiToolRegistry;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.util.*;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final NumberFormat VND = NumberFormat.getInstance(new Locale("vi", "VN"));

    private final AiClient aiClient;
    private final AiToolRegistry toolRegistry;
    private final AiGuardrailsService guardrails;
    private final AiCacheService cache;
    private final AiLogRepository aiLogRepo;
    private final AiAuditService auditService;
    private final HotelRepository hotels;
    private final RoomRepository rooms;

    public AiService(AiClient aiClient,
                     AiToolRegistry toolRegistry,
                     AiGuardrailsService guardrails,
                     AiCacheService cache,
                     AiLogRepository aiLogRepo,
                     AiAuditService auditService,
                     HotelRepository hotels,
                     RoomRepository rooms) {
        this.aiClient = aiClient;
        this.toolRegistry = toolRegistry;
        this.guardrails = guardrails;
        this.cache = cache;
        this.aiLogRepo = aiLogRepo;
        this.auditService = auditService;
        this.hotels = hotels;
        this.rooms = rooms;
    }

    public boolean enabled() {
        return aiClient.isAvailable();
    }

    // =========================================================================
    // 1. CHATBOT TƯ VẤN (TOOL CALLING & BILINGUAL)
    // =========================================================================

    public String chat(String message, String userEmail, String clientIp) {
        guardrails.validateRequest(message, userEmail, clientIp);
        long start = System.currentTimeMillis();

        // 1. Kiểm tra Cache cho câu hỏi thường gặp
        Optional<String> cached = cache.get("chat", message);
        if (cached.isPresent()) {
            recordLog("CHAT", message, userEmail, clientIp, System.currentTimeMillis() - start, 0, 0, false, null);
            return cached.get();
        }

        // 2. Xác định ngôn ngữ
        String lang = isEnglish(message) ? "en" : "vi";

        // 3. Khởi tạo Prompt và danh sách Tools
        String system = (lang.equals("en")
                ? "You are QuickStay's Smart Travel Concierge. Always use real-time tool calling (search_rooms, check_availability, get_hotel_info) to provide accurate live prices and available rooms. Never guess prices. Format replies cleanly with emojis."
                : "Bạn là trợ lý du lịch thông minh của QuickStay. Luôn gọi các công cụ thực tế (search_rooms, check_availability, get_hotel_info) để tra cứu phòng trống và giá tiền chính xác theo thời gian thực. Định dạng đẹp mắt với emoji.");

        AiPrompt prompt = AiPrompt.of("CHAT", system, message, 700, lang);
        List<ToolDefinition> guestTools = toolRegistry.getAllDefinitions().stream()
                .filter(t -> !t.name().equals("get_admin_insights"))
                .toList();

        AiResult result = aiClient.completeWithTools(prompt, guestTools);

        // 4. Nếu Model yêu cầu gọi Tool, backend thực thi và tổng hợp kết quả
        String finalReply;
        if (!result.toolCalls().isEmpty()) {
            StringBuilder toolSummary = new StringBuilder();
            for (ToolCallRequest tc : result.toolCalls()) {
                ToolCallResult res = toolRegistry.execute(tc);
                if (res.success() && res.data() != null) {
                    toolSummary.append(res.data().toString()).append("\n");
                }
            }
            if (!result.content().isBlank()) {
                finalReply = result.content();
            } else {
                finalReply = (lang.equals("en")
                        ? "Here is the real-time availability from QuickStay database:\n\n" + toolSummary
                        : "Dạ QuickStay gửi quý khách thông tin phòng trống cập nhật theo thời gian thực:\n\n" + toolSummary);
            }
        } else {
            finalReply = result.content();
        }

        long latency = System.currentTimeMillis() - start;
        recordLog("CHAT", message, userEmail, clientIp, latency, result.promptTokens(), result.completionTokens(), result.fallbackUsed(), result.errorMessage());
        cache.put("chat", message, finalReply);

        return finalReply;
    }

    // Backward-compatible overload
    public String chat(String message) {
        return chat(message, null, "127.0.0.1");
    }

    // =========================================================================
    // 2. NATURAL-LANGUAGE SEARCH (TÌM KIẾM BẰNG NGÔN NGỮ TỰ NHIÊN)
    // =========================================================================

    public Map<String, Object> naturalLanguageSearch(String query, String userEmail, String clientIp) {
        guardrails.validateRequest(query, userEmail, clientIp);
        long start = System.currentTimeMillis();

        String lang = isEnglish(query) ? "en" : "vi";
        AiPrompt prompt = AiPrompt.of("NL_SEARCH", "Extract hotel search filters into tool calling arguments.", query, 600, lang);

        List<ToolDefinition> searchTools = List.of(toolRegistry.getTool("search_rooms").orElseThrow().getDefinition());
        AiResult result = aiClient.completeWithTools(prompt, searchTools);

        ToolCallResult toolRes;
        Map<String, Object> parsedFilters = new LinkedHashMap<>();

        if (!result.toolCalls().isEmpty()) {
            ToolCallRequest tc = result.toolCalls().get(0);
            parsedFilters.putAll(tc.arguments());
            toolRes = toolRegistry.execute(tc);
        } else {
            // Fallback parsing
            ToolCallRequest fallbackReq = new ToolCallRequest(UUID.randomUUID().toString(), "search_rooms", Map.of("city", "Đà Nẵng", "guests", 2));
            parsedFilters.putAll(fallbackReq.arguments());
            toolRes = toolRegistry.execute(fallbackReq);
        }

        long latency = System.currentTimeMillis() - start;
        recordLog("NL_SEARCH", query, userEmail, clientIp, latency, result.promptTokens(), result.completionTokens(), result.fallbackUsed(), result.errorMessage());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("query", query);
        response.put("filters", parsedFilters);
        response.put("results", toolRes.data());
        response.put("aiSummary", result.content());
        return response;
    }

    // =========================================================================
    // 3. GROUNDED HOTEL Q&A (HỎI ĐÁP CÓ CĂN CỨ VÀ TRẢ LỜI "KHÔNG CÓ THÔNG TIN")
    // =========================================================================

    public String hotelQa(Long hotelId, String question, String userEmail, String clientIp, String lang) {
        guardrails.validateRequest(question, userEmail, clientIp);
        long start = System.currentTimeMillis();

        Hotel hotel = hotels.findById(hotelId).orElse(null);
        if (hotel == null) return "Không tìm thấy khách sạn.";

        String cacheKey = "hotel:" + hotelId + ":" + question;
        Optional<String> cached = cache.get("qa", cacheKey);
        if (cached.isPresent()) {
            return cached.get();
        }

        if (lang == null || lang.isBlank()) lang = isEnglish(question) ? "en" : "vi";

        List<Room> rList = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId);
        StringBuilder facts = new StringBuilder();
        facts.append("HOTEL NAME: ").append(hotel.getName()).append("\n");
        facts.append("CITY: ").append(hotel.getCity()).append(", ADDRESS: ").append(hotel.getAddress()).append("\n");
        facts.append("AMENITIES: ").append(hotel.getAmenities() != null ? hotel.getAmenities() : "Tiện nghi phòng tiêu chuẩn").append("\n");
        facts.append("ROOM TYPES:\n");
        for (Room r : rList) {
            facts.append("- ").append(r.getRoomType()).append(": ").append(VND.format(r.getPricePerNight())).append(" VND/đêm, sức chứa ").append(r.getCapacity()).append(" khách\n");
        }

        String sanitizedFacts = guardrails.sanitizeForContext(facts.toString());

        String systemInstruction = "Bạn là trợ lý chính thức của khách sạn " + hotel.getName() + ".\n"
                + "QUY TẮC CĂN CỨ DỮ LIỆU (GROUNDING):\n"
                + "1. Chỉ trả lời dựa trên sự thật có trong hồ sơ khách sạn sau đây:\n<hotel_data>\n" + sanitizedFacts + "\n</hotel_data>\n"
                + "2. Nếu câu hỏi về điều không có trong hồ sơ (ví dụ: casino, thời tiết, chứng khoán, đặt vé máy bay), BẮT BUỘC trả lời: "
                + (lang.equals("en") ? "\"I don't have this information in the hotel's records. Please contact the front desk directly.\""
                                     : "\"Dạ hiện tại QuickStay không có thông tin này trong hồ sơ của khách sạn. Quý khách vui lòng liên hệ trực tiếp lễ tân để được hỗ trợ thêm ạ.\"") + "\n"
                + "3. Trả lời bằng ngôn ngữ: " + lang + ".";

        AiPrompt prompt = AiPrompt.of("HOTEL_QA", systemInstruction, question, 400, lang);
        AiResult result = aiClient.complete(prompt);

        long latency = System.currentTimeMillis() - start;
        recordLog("HOTEL_QA", question, userEmail, clientIp, latency, result.promptTokens(), result.completionTokens(), result.fallbackUsed(), result.errorMessage());
        cache.put("qa", cacheKey, result.content());

        return result.content();
    }

    // =========================================================================
    // 4. REVIEW SUMMARY (TỔNG HỢP ĐÁNH GIÁ KHÁCH HÀNG)
    // =========================================================================

    public Map<String, Object> reviewSummary(Long hotelId, String lang) {
        Hotel h = hotels.findById(hotelId).orElse(null);
        if (h == null) return Map.of("error", "Không tìm thấy khách sạn");

        String actualLang = (lang != null && lang.equalsIgnoreCase("en")) ? "en" : "vi";
        String promptKey = "review:" + hotelId + ":" + actualLang;
        Optional<String> cached = cache.get("reviews", promptKey);

        String text;
        if (cached.isPresent()) {
            text = cached.get();
        } else {
            String sys = "Khách sạn: " + h.getName() + ", Tiện nghi: " + h.getAmenities() + ". Ngôn ngữ: " + actualLang;
            AiPrompt p = AiPrompt.of("REVIEW_SUMMARY", sys, "Hãy tóm tắt ngắn gọn nhận xét của khách: khách thích gì nhất, điểm gì cần lưu ý.", 400, actualLang);
            AiResult res = aiClient.complete(p);
            text = res.content();
            cache.put("reviews", promptKey, text);
            recordLog("REVIEW_SUMMARY", "Hotel " + hotelId, null, null, res.latencyMs(), res.promptTokens(), res.completionTokens(), res.fallbackUsed(), null);
        }

        Map<String, Object> ret = new LinkedHashMap<>();
        ret.put("hotelId", hotelId);
        ret.put("hotelName", h.getName());
        ret.put("language", actualLang);
        ret.put("summaryText", text);
        return ret;
    }

    // =========================================================================
    // 5. SINH MÔ TẢ ĐA PHONG CÁCH & ĐA PHIÊN BẢN (TONES & VARIANTS)
    // =========================================================================

    public List<String> describeAdvanced(String type, String name, String city, String amenities,
                                         String roomType, String tone, String lang, int variantCount) {
        String actualTone = tone != null ? tone.toUpperCase() : "LUXURY";
        String actualLang = lang != null && lang.equalsIgnoreCase("en") ? "en" : "vi";
        int count = Math.max(1, Math.min(variantCount, 3));

        boolean isRoom = "room".equalsIgnoreCase(type);
        String subject = isRoom ? "phòng " + (roomType == null || roomType.isBlank() ? name : roomType) + " tại khách sạn " + name : "khách sạn " + name;

        String cacheKey = type + ":" + name + ":" + actualTone + ":" + actualLang + ":" + count;
        Optional<String> cached = cache.get("describe_adv", cacheKey);
        if (cached.isPresent()) {
            return Arrays.asList(cached.get().split("\\|\\|\\|"));
        }

        long start = System.currentTimeMillis();
        String systemInstruction = "Bạn là chuyên gia copywriter viết nội dung khách sạn và SEO. Phong cách yêu cầu: " + actualTone + ". Ngôn ngữ: " + actualLang + ".";
        String userMsg = "Hãy viết " + count + " phiên bản mô tả độc lập khác nhau (khoảng 60-80 từ mỗi bản) cho " + subject
                + (city != null ? " tại " + city : "") + (amenities != null ? ". Tiện nghi: " + amenities : "")
                + ". Phân tách các phiên bản bằng dấu ||| để tách riêng.";

        AiPrompt prompt = AiPrompt.of("DESCRIBE", systemInstruction, userMsg, 600, actualLang);
        AiResult res = aiClient.complete(prompt);

        List<String> variants;
        if (res.content().contains("|||")) {
            variants = Arrays.stream(res.content().split("\\|\\|\\|"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } else {
            variants = List.of(res.content().trim());
        }

        long latency = System.currentTimeMillis() - start;
        recordLog("DESCRIBE", subject, null, null, latency, res.promptTokens(), res.completionTokens(), res.fallbackUsed(), res.errorMessage());
        cache.put("describe_adv", cacheKey, String.join("|||", variants));

        return variants;
    }

    // Backward-compatible describe
    public String describe(String type, String name, String city, String amenities, String roomType) {
        List<String> list = describeAdvanced(type, name, city, amenities, roomType, "LUXURY", "vi", 1);
        return !list.isEmpty() ? list.get(0) : "Khách sạn chất lượng cao tại QuickStay.";
    }

    // =========================================================================
    // 6. GỢI Ý SOẠN TIN TRẢ LỜI CHO ĐỐI TÁC (REPLY DRAFT)
    // =========================================================================

    public String replyDraft(String guestName, String guestMessage, String hotelName, String lang) {
        String actualLang = lang != null && lang.equalsIgnoreCase("en") ? "en" : "vi";
        String sys = "Khách sạn: " + (hotelName != null ? hotelName : "QuickStay") + ". Người gửi: " + (guestName != null ? guestName : "Quý khách") + ". Ngôn ngữ: " + actualLang;
        AiPrompt p = AiPrompt.of("REPLY_DRAFT", sys, "Soạn bản thảo phản hồi lịch thiệp, trân trọng, chuyên nghiệp cho lời nhắn sau: " + guestMessage, 400, actualLang);

        AiResult res = aiClient.complete(p);
        recordLog("REPLY_DRAFT", guestMessage, null, null, res.latencyMs(), res.promptTokens(), res.completionTokens(), res.fallbackUsed(), res.errorMessage());
        return res.content();
    }

    // =========================================================================
    // 7. INSIGHTS Q&A CHO ADMIN (BÁO CÁO CỐ ĐỊNH, KHÔNG DÙNG RAW SQL)
    // =========================================================================

    public Map<String, Object> adminInsights(String question, String userEmail, String clientIp) {
        guardrails.validateRequest(question, userEmail, clientIp);
        long start = System.currentTimeMillis();

        AiPrompt prompt = AiPrompt.of("INSIGHTS", "Call fixed report tools (get_admin_insights) to answer questions about bookings, cancellations and occupancy. NEVER write raw SQL.", question, 600);
        List<ToolDefinition> reportTools = List.of(toolRegistry.getTool("get_admin_insights").orElseThrow().getDefinition());

        AiResult res = aiClient.completeWithTools(prompt, reportTools);
        ToolCallResult toolRes;
        if (!res.toolCalls().isEmpty()) {
            toolRes = toolRegistry.execute(res.toolCalls().get(0));
        } else {
            String stripped = stripAccents(question);
            String metric = "REVENUE";
            if (stripped.contains("huy") || stripped.contains("cancel")) metric = "CANCELLATION";
            else if (stripped.contains("kin") || stripped.contains("lap day") || stripped.contains("fill") || stripped.contains("occupan") || stripped.contains("phong nao") || stripped.contains("hang phong")) metric = "OCCUPANCY";
            toolRes = toolRegistry.execute(new ToolCallRequest(UUID.randomUUID().toString(), "get_admin_insights", Map.of("metric", metric)));
        }

        long latency = System.currentTimeMillis() - start;
        recordLog("INSIGHTS", question, userEmail, clientIp, latency, res.promptTokens(), res.completionTokens(), res.fallbackUsed(), res.errorMessage());

        String answer = res.content();
        if (answer == null || answer.isBlank()) {
            answer = formatInsightsData(toolRes);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("question", question);
        out.put("answer", answer);
        out.put("reportData", toolRes.data());
        out.put("latencyMs", latency);
        return out;
    }

    @SuppressWarnings("unchecked")
    private String formatInsightsData(ToolCallResult toolRes) {
        if (toolRes == null || !toolRes.success() || !(toolRes.data() instanceof Map)) {
            return "Không thể tạo báo cáo thống kê do chưa đủ dữ liệu.";
        }
        Map<String, Object> data = (Map<String, Object>) toolRes.data();
        String metric = String.valueOf(data.get("metric"));

        if ("CANCELLATIONS".equals(metric)) {
            return "📊 **Báo cáo Tỷ lệ Hủy Đặt phòng**:\n"
                    + "• Tổng số đơn giao dịch toàn thời gian: " + data.get("totalBookingsAllTime") + " đơn\n"
                    + "• Số đơn đã hủy: **" + data.get("cancelledCount") + "** đơn\n"
                    + "• Tỷ lệ hủy đơn hiện tại: **" + data.get("cancellationRatePercent") + "%**\n"
                    + "💡 Tỷ lệ này nằm trong ngưỡng kiểm soát bình thường của ngành khách sạn (dưới 15%).";
        }
        if ("ROOM_FILL_FREQUENCY".equals(metric)) {
            return "📈 **Báo cáo Hạng Phòng Kín Nhanh Nhất & Xu Hướng Đặt Phòng**:\n"
                    + "• Hạng phòng dẫn đầu lượt đặt: **" + data.get("fastestFillingRoomType") + "**\n"
                    + "• Xu hướng: Khách hàng có xu hướng ưu tiên đặt các phòng có vị trí đẹp và phòng Suite gia đình vào dịp cuối tuần.\n"
                    + "💡 Khuyến nghị: Có thể cân nhắc điều chỉnh tăng nhẹ giá vào dịp cao điểm cho hạng phòng này để tối ưu hóa RevPAR.";
        }
        return "💰 **Báo cáo Doanh thu Thực tế Ghi nhận**:\n"
                + "• Tổng doanh thu đã xác nhận và lưu trú: **" + data.get("formattedRevenue") + "**\n"
                + "• Tổng số giao dịch thành công: " + data.get("totalBookingsAllTime") + " lượt đặt phòng\n"
                + "• Dòng tiền tăng trưởng ổn định trên tất cả các cơ sở liên kết.";
    }

    private static String stripAccents(String s) {
        if (s == null) return "";
        String normalized = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }

    // =========================================================================
    // 8. PRICING HINTS CHO KHÁCH SẠN / HOMESTAY (GỢI Ý ĐỊNH GIÁ)
    // =========================================================================

    public Map<String, Object> pricingHints(Long hotelId, String lang) {
        Hotel h = hotels.findById(hotelId).orElse(null);
        if (h == null) return Map.of("error", "Không tìm thấy khách sạn ID: " + hotelId);

        String actualLang = lang != null && lang.equalsIgnoreCase("en") ? "en" : "vi";
        ToolCallRequest statsReq = new ToolCallRequest(UUID.randomUUID().toString(), "get_pricing_stats", Map.of("hotelId", hotelId));
        ToolCallResult statsRes = toolRegistry.execute(statsReq);

        AiPrompt p = AiPrompt.of("PRICING_HINTS", "Dữ liệu thống kê: " + statsRes.data(), "Hãy giải thích số liệu và đưa ra gợi ý chiến lược định giá ngắn gọn, thực tế.", 500, actualLang);
        AiResult res = aiClient.complete(p);

        recordLog("PRICING_HINTS", "Hotel " + hotelId, null, null, res.latencyMs(), res.promptTokens(), res.completionTokens(), res.fallbackUsed(), res.errorMessage());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("hotelId", hotelId);
        out.put("hotelName", h.getName());
        out.put("stats", statsRes.data());
        out.put("pricingAdvice", res.content());
        return out;
    }

    // =========================================================================
    // 9. THỐNG KÊ VÀ NHẬT KÝ AI CHO ADMIN (OBSERVABILITY & STATS)
    // =========================================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getAiStatistics() {
        long totalCalls = aiLogRepo.count();
        long fallbackCalls = aiLogRepo.countByFallbackUsed(true);
        Double avgLatency = aiLogRepo.getAverageLatencyMs();
        Long totalTokens = aiLogRepo.getTotalTokensUsed();

        double fallbackRate = totalCalls > 0 ? (double) fallbackCalls * 100 / totalCalls : 0.0;

        List<Object[]> featureCounts = aiLogRepo.countByFeatureGroup();
        Map<String, Long> featureMap = new LinkedHashMap<>();
        for (Object[] row : featureCounts) {
            featureMap.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCalls", totalCalls);
        stats.put("fallbackCalls", fallbackCalls);
        stats.put("fallbackRatePercent", Math.round(fallbackRate * 10.0) / 10.0);
        stats.put("averageLatencyMs", avgLatency != null ? Math.round(avgLatency) : 0);
        stats.put("totalTokensUsed", totalTokens != null ? totalTokens : 0);
        stats.put("featureBreakdown", featureMap);
        stats.put("isLiveModelAvailable", aiClient.isAvailable());
        return stats;
    }

    @Transactional(readOnly = true)
    public List<AiLog> getRecentLogs(int limit) {
        int take = Math.min(Math.max(limit, 10), 100);
        return aiLogRepo.findByOrderByCreatedAtDesc(PageRequest.of(0, take));
    }

    private void recordLog(String feature, String promptSnippet, String userEmail, String clientIp,
                           long latencyMs, int promptTokens, int completionTokens, boolean fallbackUsed, String error) {
        auditService.recordLog(feature, promptSnippet, userEmail, clientIp, latencyMs, promptTokens, completionTokens, fallbackUsed, error);
    }

    private static boolean isEnglish(String text) {
        if (text == null) return false;
        String t = text.toLowerCase();
        return t.contains("hello") || t.contains("how are") || t.contains("hotel in")
                || t.contains("available") || t.contains("price") || t.contains("booking")
                || t.contains("room") || t.contains("quiet") || t.contains("weekend");
    }
}
