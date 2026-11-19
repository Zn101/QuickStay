package com.quickstay.ai.guard;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.quickstay.config.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import java.util.regex.Pattern;

/**
 * Lớp bảo vệ (Guardrails) cho hệ thống AI:
 * - Giới hạn độ dài tin nhắn (Message length cap)
 * - Giới hạn tần suất theo Người dùng / IP: cửa sổ trượt 1 phút + hạn mức ngày cho từng client
 * - Trần ngân sách toàn hệ thống / ngày (bảo vệ chi phí API)
 * - Chống tấn công tiêm nhiễm câu lệnh (Prompt Injection Shield)
 *
 * Không miễn trừ theo email: chỉ mã nội bộ (bộ benchmark) được chạy qua {@link #runTrusted}.
 */
@Service
public class AiGuardrailsService {

    private static final Logger log = LoggerFactory.getLogger(AiGuardrailsService.class);

    private static final int MAX_MESSAGE_LENGTH = 1000;

    // Pattern nhận diện các nỗ lực Prompt Injection phổ biến
    private static final Pattern INJECTION_PATTERN = Pattern.compile(
            "(?i)(ignore\\s+(all\\s+)?previous\\s+instructions|bỏ\\s+qua\\s+(mọi\\s+)?chỉ\\s+dẫn|you\\s+are\\s+now\\s+in|bạn\\s+bây\\s+giờ\\s+là\\s+hệ\\s+thống|reveal\\s+system\\s+prompt|tiết\\s+lộ\\s+prompt|system\\s*:\\s*admin|sudo\\s+mode)"
    );

    /** Đánh dấu luồng đang chạy mã nội bộ tin cậy (benchmark) — không thể bật từ request HTTP. */
    private static final ThreadLocal<Boolean> TRUSTED = ThreadLocal.withInitial(() -> false);

    private final int ratePerMinute;
    private final int perClientDailyCap;
    private final int dailyRequestCap;

    // Tự dọn khóa không hoạt động: không phình bộ nhớ theo số IP
    private final Cache<String, Deque<Long>> minuteWindows = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(2))
            .maximumSize(100_000)
            .build();
    private final Cache<String, AtomicInteger> dailyPerClient = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofHours(24))
            .maximumSize(100_000)
            .build();

    private final AtomicInteger dailyCounter = new AtomicInteger(0);
    private volatile LocalDate currentDay = LocalDate.now();

    public AiGuardrailsService(@Value("${app.ai.rate-per-minute:25}") int ratePerMinute,
                               @Value("${app.ai.per-client-daily-cap:200}") int perClientDailyCap,
                               @Value("${app.ai.daily-request-cap:5000}") int dailyRequestCap) {
        this.ratePerMinute = ratePerMinute;
        this.perClientDailyCap = perClientDailyCap;
        this.dailyRequestCap = dailyRequestCap;
    }

    /** Chạy mã nội bộ tin cậy (benchmark) không bị giới hạn tần suất. */
    public <T> T runTrusted(Supplier<T> action) {
        boolean previous = TRUSTED.get();
        TRUSTED.set(true);
        try {
            return action.get();
        } finally {
            TRUSTED.set(previous);
        }
    }

    /**
     * Kiểm tra toàn diện một yêu cầu gửi tới AI. Ném ngoại lệ ApiException nếu vi phạm.
     */
    public void validateRequest(String message, String userEmail, String clientIp) {
        if (message == null || message.trim().isEmpty()) {
            throw ApiException.badRequest("Nội dung yêu cầu không được để trống.");
        }
        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw ApiException.badRequest("Độ dài tin nhắn vượt quá giới hạn cho phép (" + MAX_MESSAGE_LENGTH + " ký tự).");
        }
        checkQuota(userEmail, clientIp);
    }

    /** Chỉ kiểm tra hạn mức (cho endpoint AI không có tin nhắn tự do, vd. tóm tắt đánh giá, sinh mô tả). */
    public void checkQuota(String userEmail, String clientIp) {
        if (TRUSTED.get()) {
            return;
        }
        String clientKey = (userEmail != null && !userEmail.isBlank())
                ? "usr:" + userEmail
                : "ip:" + (clientIp != null ? clientIp : "unknown");
        // Kiểm tra theo client TRƯỚC trần toàn hệ thống: một người spam không làm cạn hạn mức của mọi người
        checkRateLimit(clientKey);
        checkClientDailyCap(clientKey);
        checkDailyCap();
    }

    /** Giới hạn tần suất chung (không qua AI), vd. đặt câu hỏi công khai. */
    public void checkRate(String key, int maxPerMinute) {
        checkWindow("generic:" + key, maxPerMinute);
    }

    /**
     * Làm sạch dữ liệu khách sạn / đánh giá trước khi đưa vào context để tránh Prompt Injection
     * coi dữ liệu là dữ liệu, không bao giờ là câu lệnh điều khiển.
     */
    public String sanitizeForContext(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("(?i)<system>|</system>|<instruction>|</instruction>", "");
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
            throw ApiException.tooManyRequests("Hệ thống AI tạm thời đạt giới hạn phục vụ trong ngày. Vui lòng quay lại sau.");
        }
    }

    private void checkClientDailyCap(String key) {
        String dayKey = LocalDate.now() + ":" + key;
        AtomicInteger counter = dailyPerClient.get(dayKey, k -> new AtomicInteger());
        if (counter.incrementAndGet() > perClientDailyCap) {
            log.warn("Client {} vượt hạn mức AI ngày ({})", key, perClientDailyCap);
            throw ApiException.tooManyRequests("Bạn đã dùng hết lượt trợ lý AI trong hôm nay. Vui lòng quay lại vào ngày mai.");
        }
    }

    private void checkRateLimit(String key) {
        checkWindow(key, ratePerMinute);
    }

    private void checkWindow(String key, int max) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = minuteWindows.get(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > 60_000) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= max) {
                log.warn("Rate limit kích hoạt cho {}: {} req/min", key, timestamps.size());
                throw ApiException.tooManyRequests("Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ vài giây rồi thử lại.");
            }
            timestamps.addLast(now);
        }
    }
}
