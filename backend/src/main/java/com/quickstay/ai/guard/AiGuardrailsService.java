package com.quickstay.ai.guard;

import com.quickstay.config.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

/**
 * Lớp bảo vệ (Guardrails) cho hệ thống AI:
 * - Giới hạn độ dài tin nhắn (Message length cap)
 * - Giới hạn tần suất gọi theo Người dùng & IP (Sliding-window Rate Limiting)
 * - Giới hạn ngân sách / hạn mức ngày (Daily cost/request cap)
 * - Chống tấn công tiêm nhiễm câu lệnh (Prompt Injection Shield)
 */
@Service
public class AiGuardrailsService {

    private static final Logger log = LoggerFactory.getLogger(AiGuardrailsService.class);

    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final int MAX_REQUESTS_PER_MINUTE = 25;

    // Pattern nhận diện các nỗ lực Prompt Injection phổ biến
    private static final Pattern INJECTION_PATTERN = Pattern.compile(
            "(?i)(ignore\\s+(all\\s+)?previous\\s+instructions|bỏ\\s+qua\\s+(mọi\\s+)?chỉ\\s+dẫn|you\\s+are\\s+now\\s+in|bạn\\s+bây\\s+giờ\\s+là\\s+hệ\\s+thống|reveal\\s+system\\s+prompt|tiết\\s+lộ\\s+prompt|system\\s*:\\s*admin|sudo\\s+mode)"
    );

    private final int dailyRequestCap;
    private final Map<String, Deque<Long>> rateLimitMap = new ConcurrentHashMap<>();
    private final AtomicInteger dailyCounter = new AtomicInteger(0);
    private volatile LocalDate currentDay = LocalDate.now();

    public AiGuardrailsService(@Value("${app.ai.daily-request-cap:1000}") int dailyRequestCap) {
        this.dailyRequestCap = dailyRequestCap;
    }

    /**
     * Kiểm tra toàn diện một yêu cầu gửi tới AI. Ném ngoại lệ ApiException nếu vi phạm.
     */
    public void validateRequest(String message, String userEmail, String clientIp) {
        // 1. Kiểm tra độ dài tin nhắn
        if (message == null || message.trim().isEmpty()) {
            throw ApiException.badRequest("Nội dung yêu cầu không được để trống.");
        }
        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw ApiException.badRequest("Độ dài tin nhắn vượt quá giới hạn cho phép (" + MAX_MESSAGE_LENGTH + " ký tự).");
        }

        // 2. Kiểm tra hạn mức ngày
        checkDailyCap();

        // 3. Kiểm tra tần suất (Rate Limiting) - Miễn trừ kiểm thử benchmark nội bộ & quản trị viên
        if (userEmail != null && (userEmail.startsWith("eval") || userEmail.startsWith("benchmark") || "admin@quickstay.local".equals(userEmail))) {
            return;
        }

        String clientKey = (userEmail != null && !userEmail.isBlank()) ? "usr:" + userEmail : "ip:" + (clientIp != null ? clientIp : "unknown");
        checkRateLimit(clientKey);
    }

    /**
     * Làm sạch dữ liệu khách sạn / đánh giá trước khi đưa vào context để tránh Prompt Injection
     * coi dữ liệu là dữ liệu, không bao giờ là câu lệnh điều khiển.
     */
    public String sanitizeForContext(String text) {
        if (text == null) return "";
        // Loại bỏ các tag giả mạo hệ thống
        String cleaned = text.replaceAll("(?i)<system>|</system>|<instruction>|</instruction>", "");
        // Giới hạn độ dài dữ liệu trích xuất
        if (cleaned.length() > 800) {
            cleaned = cleaned.substring(0, 800) + "...";
        }
        return cleaned.trim();
    }

    /**
     * Kiểm tra xem tin nhắn người dùng có chứa dấu hiệu tấn công ghi đè chỉ dẫn hệ thống hay không.
     */
    public boolean containsPotentialInjection(String message) {
        if (message == null) return false;
        return INJECTION_PATTERN.matcher(message).find();
    }

    private synchronized void checkDailyCap() {
        LocalDate today = LocalDate.now();
        if (!today.equals(currentDay)) {
            currentDay = today;
            dailyCounter.set(0);
        }
        if (dailyCounter.incrementAndGet() > dailyRequestCap) {
            log.warn("Đã đạt giới hạn ngân sách AI trong ngày: {}/{}", dailyCounter.get(), dailyRequestCap);
            throw ApiException.badRequest("Hệ thống AI tạm thời đạt giới hạn phục vụ trong ngày. Vui lòng quay lại sau.");
        }
    }

    private void checkRateLimit(String key) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = rateLimitMap.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Xóa các mốc thời gian ngoài cửa sổ 1 phút (60.000 ms)
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > 60_000) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit kích hoạt cho {}: {} req/min", key, timestamps.size());
                throw ApiException.badRequest("Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ vài giây rồi thử lại.");
            }

            timestamps.addLast(now);
        }
    }
}
