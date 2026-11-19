package com.quickstay.ai;

import com.quickstay.ai.eval.AiEvaluationBenchmark;
import com.quickstay.ai.guard.AiGuardrailsService;
import com.quickstay.config.ApiException;
import com.quickstay.config.ClientIp;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    public record DescribeRequest(String type, @NotBlank String name, String city, String amenities,
                                  String roomType) {}

    public record DescribeResponse(String description) {}

    public record DescribeAdvancedRequest(String type, @NotBlank String name, String city, String amenities,
                                          String roomType, String tone, String lang, Integer variantCount) {}

    public record DescribeAdvancedResponse(List<String> variants) {}

    public record ChatRequest(@NotBlank @Size(max = 1000) String message, String lang) {}

    public record ChatResponse(String reply) {}

    public record NlSearchRequest(@NotBlank @Size(max = 1000) String query) {}

    public record HotelQaRequest(@NotNull Long hotelId, @NotBlank @Size(max = 1000) String question, String lang) {}

    public record ReplyDraftRequest(String guestName, @NotBlank String guestMessage, String hotelName, String lang) {}

    public record InsightsRequest(String question, String query) {
        public String getEffectiveQuestion() {
            if (question != null && !question.isBlank()) return question.trim();
            if (query != null && !query.isBlank()) return query.trim();
            return "";
        }
    }

    private final AiService ai;
    private final AiEvaluationBenchmark benchmark;
    private final AiGuardrailsService guardrails;
    private final UserRepository users;

    public AiController(AiService ai, AiEvaluationBenchmark benchmark, AiGuardrailsService guardrails,
                        UserRepository users) {
        this.ai = ai;
        this.benchmark = benchmark;
        this.guardrails = guardrails;
        this.users = users;
    }

    /** HOTEL_MANAGER chi duoc xem du lieu co so cua minh; ADMIN xem moi co so. */
    private void requireHotelAccess(Authentication auth, Long hotelId) {
        User u = users.findByEmail(auth.getName())
                .orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        if (u.getRole() == Role.ADMIN) {
            return;
        }
        if (u.getHotelId() == null || !u.getHotelId().equals(hotelId)) {
            throw ApiException.forbidden("Ban chi co quyen xem du lieu co so luu tru duoc phan cong");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        return ClientIp.of(request);
    }

    private String getUserEmail(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }

    // ---------- 1. Chatbot Tư vấn ----------
    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest req, Authentication auth, HttpServletRequest servletReq) {
        String reply = ai.chat(req.message(), getUserEmail(auth), getClientIp(servletReq));
        return new ChatResponse(reply);
    }

    // ---------- 2. Tìm kiếm Bằng Ngôn ngữ Tự nhiên ----------
    @PostMapping("/nl-search")
    public Map<String, Object> nlSearch(@Valid @RequestBody NlSearchRequest req, Authentication auth, HttpServletRequest servletReq) {
        return ai.naturalLanguageSearch(req.query(), getUserEmail(auth), getClientIp(servletReq));
    }

    // ---------- 3. Hỏi đáp Khách sạn Bị chặn Ranh giới (Grounded Q&A) ----------
    @PostMapping("/hotel-qa")
    public Map<String, Object> hotelQa(@Valid @RequestBody HotelQaRequest req, Authentication auth, HttpServletRequest servletReq) {
        String answer = ai.hotelQa(req.hotelId(), req.question(), getUserEmail(auth), getClientIp(servletReq), req.lang());
        return Map.of("hotelId", req.hotelId(), "question", req.question(), "answer", answer);
    }

    // ---------- 4. Tóm tắt Đánh giá Khách sạn ----------
    @GetMapping("/reviews/{hotelId}/summary")
    public Map<String, Object> reviewSummary(@PathVariable Long hotelId, @RequestParam(required = false) String lang,
                                             Authentication auth, HttpServletRequest servletReq) {
        guardrails.checkQuota(getUserEmail(auth), getClientIp(servletReq));
        return ai.reviewSummary(hotelId, lang);
    }

    // ---------- 5. Sinh Mô tả (Cũ & Mới đa phong cách) ----------
    @PostMapping("/describe")
    public DescribeResponse describe(@Valid @RequestBody DescribeRequest req, Authentication auth, HttpServletRequest servletReq) {
        guardrails.checkQuota(getUserEmail(auth), getClientIp(servletReq));
        return new DescribeResponse(ai.describe(req.type(), req.name(), req.city(), req.amenities(), req.roomType()));
    }

    @PostMapping("/describe/advanced")
    public DescribeAdvancedResponse describeAdvanced(@Valid @RequestBody DescribeAdvancedRequest req, Authentication auth,
                                                     HttpServletRequest servletReq) {
        guardrails.checkQuota(getUserEmail(auth), getClientIp(servletReq));
        List<String> list = ai.describeAdvanced(req.type(), req.name(), req.city(), req.amenities(),
                req.roomType(), req.tone(), req.lang(), req.variantCount() != null ? req.variantCount() : 3);
        return new DescribeAdvancedResponse(list);
    }

    // ---------- 6. Soạn Bản thảo Trả lời cho Khách sạn / Homestay ----------
    @PostMapping("/reply-draft")
    public Map<String, Object> replyDraft(@Valid @RequestBody ReplyDraftRequest req, Authentication auth, HttpServletRequest servletReq) {
        guardrails.validateRequest(req.guestMessage(), getUserEmail(auth), getClientIp(servletReq));
        String draft = ai.replyDraft(req.guestName(), req.guestMessage(), req.hotelName(), req.lang());
        return Map.of("draftReply", draft);
    }

    // ---------- 7. Gợi ý Định giá & Công suất (Pricing Hints) ----------
    @GetMapping("/pricing-hints/{hotelId}")
    public Map<String, Object> pricingHints(@PathVariable Long hotelId, @RequestParam(required = false) String lang,
                                            Authentication auth, HttpServletRequest servletReq) {
        requireHotelAccess(auth, hotelId);
        guardrails.checkQuota(getUserEmail(auth), getClientIp(servletReq));
        return ai.pricingHints(hotelId, lang);
    }

    // ---------- 8. Quản trị viên: Insights Q&A (Báo cáo Cố định, không SQL thô) ----------
    @PostMapping("/admin/insights")
    public Map<String, Object> adminInsights(@Valid @RequestBody InsightsRequest req, Authentication auth, HttpServletRequest servletReq) {
        String q = req.getEffectiveQuestion();
        if (q.isBlank()) {
            throw com.quickstay.config.ApiException.badRequest("Câu hỏi không được để trống");
        }
        return ai.adminInsights(q, getUserEmail(auth), getClientIp(servletReq));
    }

    // ---------- 9. Quản trị viên: Thống kê & Nhật ký AI ----------
    @GetMapping("/admin/stats")
    public Map<String, Object> adminStats() {
        return ai.getAiStatistics();
    }

    @GetMapping("/admin/logs")
    public List<AiLog> adminLogs(@RequestParam(defaultValue = "50") int limit) {
        return ai.getRecentLogs(limit);
    }

    // ---------- 10. Quản trị viên: Chạy Bộ Đánh giá Kiểm chuẩn AI (Evaluation Benchmark) ----------
    @GetMapping("/admin/evaluation")
    public AiEvaluationBenchmark.BenchmarkReport runEvaluation() {
        return benchmark.runBenchmark();
    }
}
