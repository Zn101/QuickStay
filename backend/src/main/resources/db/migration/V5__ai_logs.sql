-- Migration V5: Bang luu nhat ky hoat dong AI (AI Observability & Audit Log)
CREATE TABLE ai_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feature VARCHAR(50) NOT NULL,
    prompt_hash VARCHAR(64),
    user_email VARCHAR(255),
    client_ip VARCHAR(50),
    latency_ms BIGINT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    error_message VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_logs_feature (feature),
    INDEX idx_ai_logs_created_at (created_at),
    INDEX idx_ai_logs_fallback (fallback_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
