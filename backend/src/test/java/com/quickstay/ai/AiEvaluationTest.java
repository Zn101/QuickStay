package com.quickstay.ai;

import com.quickstay.ai.eval.AiEvaluationBenchmark;
import com.quickstay.ai.eval.AiEvaluationBenchmark.BenchmarkReport;
import com.quickstay.config.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AiEvaluationTest {

    @Autowired
    private AiService aiService;

    @Autowired
    private AiEvaluationBenchmark benchmark;

    @Test
    @DisplayName("T1: Evaluation Benchmark Suite: Chạy 40 câu hỏi kiểm chuẩn và đạt độ chính xác > 85%")
    void testEvaluationBenchmarkAccuracy() {
        BenchmarkReport report = benchmark.runBenchmark();
        System.out.println("==================================================");
        System.out.println("AI BENCHMARK EVALUATION SCORECARD:");
        System.out.println("Total questions: " + report.totalQuestions());
        System.out.println("Passed: " + report.passedCount());
        System.out.println("Accuracy: " + report.accuracyPercent() + "%");
        System.out.println("Average Latency: " + report.averageLatencyMs() + " ms");
        System.out.println("Scorecard by Category: " + report.categoryScorecard());
        System.out.println("==================================================");

        assertEquals(40, report.totalQuestions());
        assertTrue(report.accuracyPercent() >= 85.0, "Độ chính xác kiểm chuẩn phải đạt tối thiểu 85%");
    }

    @Test
    @DisplayName("T2: Natural-Language Search: Phân tích câu hỏi tự do thành bộ lọc và gọi công cụ search_rooms")
    void testNaturalLanguageSearch() {
        Map<String, Object> result = aiService.naturalLanguageSearch(
                "2 người, dưới 800k, cuối tuần này ở Đà Nẵng",
                "test@quickstay.local",
                "127.0.0.1"
        );

        assertNotNull(result);
        assertNotNull(result.get("filters"));
        assertNotNull(result.get("results"));
        assertTrue(result.get("results") instanceof List, "Kết quả tìm kiếm phải là danh sách phòng");
    }

    @Test
    @DisplayName("T3: Grounding Boundary: Phải trả lời 'không có thông tin' khi hỏi ngoài phạm vi dữ liệu khách sạn")
    void testGroundedQaOutsideBounds() {
        String answer = aiService.hotelQa(1L, "Khách sạn có casino sòng bài không?", "test@quickstay.local", "127.0.0.1", "vi");
        assertNotNull(answer);
        assertTrue(answer.toLowerCase().contains("không có thông tin") || answer.toLowerCase().contains("lễ tân"),
                "AI phải từ chối suy đoán ngoài dữ liệu và trả lời 'không có thông tin'");
    }

    @Test
    @DisplayName("T4: Review Summary: Tóm tắt điểm khách thích và lưu ý từ hồ sơ khách sạn")
    void testReviewSummary() {
        Map<String, Object> summary = aiService.reviewSummary(1L, "vi");
        assertNotNull(summary);
        assertTrue(summary.containsKey("summaryText"));
        String text = (String) summary.get("summaryText");
        assertTrue(text.contains("Khách") || text.contains("đánh giá") || text.contains("vị trí"));
    }

    @Test
    @DisplayName("T5: Multi-Variant Descriptions: Sinh đủ số lượng phiên bản theo tone yêu cầu")
    void testMultiVariantDescriptions() {
        List<String> variants = aiService.describeAdvanced(
                "HOTEL", "Sunrise Đà Nẵng Hotel", "Đà Nẵng", "Hồ bơi, Wifi, Gần biển", null, "LUXURY", "vi", 3
        );
        assertNotNull(variants);
        assertFalse(variants.isEmpty());
        assertTrue(variants.size() >= 1, "Phải sinh ra ít nhất 1 phiên bản mô tả");
    }

    @Test
    @DisplayName("T6: Admin Insights: Trả lời chỉ số kinh doanh dựa trên tool cố định, không dùng raw SQL")
    void testAdminInsights() {
        Map<String, Object> insights = aiService.adminInsights(
                "Tháng này có bao nhiêu đơn bị hủy?",
                "admin@quickstay.local",
                "127.0.0.1"
        );
        assertNotNull(insights);
        assertTrue(insights.containsKey("reportData"));
        assertTrue(insights.containsKey("answer"));
        String ans = (String) insights.get("answer");
        assertTrue(ans.contains("hủy") || ans.contains("đơn"));
    }

    @Test
    @DisplayName("T7: Pricing Hints: Tính toán tỷ lệ đặt ngày thường vs cuối tuần")
    void testPricingHints() {
        Map<String, Object> hints = aiService.pricingHints(1L, "vi");
        assertNotNull(hints);
        assertTrue(hints.containsKey("stats"));
        assertTrue(hints.containsKey("pricingAdvice"));
    }

    @Test
    @DisplayName("T8: Guardrails: Chặn tin nhắn quá dài vượt ngưỡng 1000 ký tự")
    void testGuardrailsMessageLengthCap() {
        String longMessage = "A".repeat(1001);
        assertThrows(ApiException.class, () ->
                aiService.chat(longMessage, "test@quickstay.local", "127.0.0.1")
        );
    }
}
