package com.quickstay.ai;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_logs")
public class AiLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String feature;

    @Column(name = "prompt_hash", length = 64)
    private String promptHash;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "client_ip", length = 50)
    private String clientIp;

    @Column(name = "latency_ms", nullable = false)
    private Long latencyMs;

    @Column(name = "prompt_tokens")
    private Integer promptTokens = 0;

    @Column(name = "completion_tokens")
    private Integer completionTokens = 0;

    @Column(name = "fallback_used", nullable = false)
    private Boolean fallbackUsed = false;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AiLog() {}

    public AiLog(String feature, String promptHash, String userEmail, String clientIp,
                 Long latencyMs, Integer promptTokens, Integer completionTokens,
                 Boolean fallbackUsed, String errorMessage) {
        this.feature = feature;
        this.promptHash = promptHash;
        this.userEmail = userEmail;
        this.clientIp = clientIp;
        this.latencyMs = latencyMs;
        this.promptTokens = promptTokens != null ? promptTokens : 0;
        this.completionTokens = completionTokens != null ? completionTokens : 0;
        this.fallbackUsed = fallbackUsed != null && fallbackUsed;
        this.errorMessage = errorMessage;
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFeature() { return feature; }
    public void setFeature(String feature) { this.feature = feature; }

    public String getPromptHash() { return promptHash; }
    public void setPromptHash(String promptHash) { this.promptHash = promptHash; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }

    public Integer getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Integer promptTokens) { this.promptTokens = promptTokens; }

    public Integer getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(Integer completionTokens) { this.completionTokens = completionTokens; }

    public Boolean getFallbackUsed() { return fallbackUsed; }
    public void setFallbackUsed(Boolean fallbackUsed) { this.fallbackUsed = fallbackUsed; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
