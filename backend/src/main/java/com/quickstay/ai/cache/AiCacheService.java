package com.quickstay.ai.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Optional;

/**
 * Bộ nhớ đệm thông minh cho các kết quả AI (Caching Layer):
 * - Hash đầu vào bằng SHA-256
 * - Lưu cache các mô tả phòng/khách sạn và các câu hỏi thường gặp (FAQ)
 * - Tối ưu tốc độ phản hồi (< 1ms) và tiết kiệm chi phí token
 */
@Service
public class AiCacheService {

    private final Cache<String, String> cache;

    public AiCacheService() {
        this.cache = Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofHours(3))
                .build();
    }

    public static String sha256(String input) {
        if (input == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(input.hashCode());
        }
    }

    public Optional<String> get(String namespace, String input) {
        String key = namespace + ":" + sha256(input);
        return Optional.ofNullable(cache.getIfPresent(key));
    }

    public void put(String namespace, String input, String value) {
        if (input == null || value == null) return;
        String key = namespace + ":" + sha256(input);
        cache.put(key, value);
    }

    public void clear() {
        cache.invalidateAll();
    }
}
