package com.quickstay.ai;

import com.quickstay.ai.cache.AiCacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service ghi log kiểm toán AI (Audit Logging).
 * Chạy trong transaction ghi độc lập (REQUIRES_NEW) để đảm bảo không bị ảnh hưởng
 * bởi transaction gọi ngoài (kể cả readOnly = true hay lỗi rollback).
 */
@Service
public class AiAuditService {

    private static final Logger log = LoggerFactory.getLogger(AiAuditService.class);

    private final AiLogRepository aiLogRepo;

    public AiAuditService(AiLogRepository aiLogRepo) {
        this.aiLogRepo = aiLogRepo;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLog(String feature, String promptSnippet, String userEmail, String clientIp,
                          long latencyMs, int promptTokens, int completionTokens, boolean fallbackUsed, String error) {
        try {
            String hash = AiCacheService.sha256(promptSnippet);
            AiLog logEntry = new AiLog(feature, hash, userEmail, clientIp, latencyMs, promptTokens, completionTokens, fallbackUsed, error);
            aiLogRepo.save(logEntry);
        } catch (Exception e) {
            log.error("Không thể ghi log AI: {}", e.getMessage());
        }
    }
}
