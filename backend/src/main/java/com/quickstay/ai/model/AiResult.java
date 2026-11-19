package com.quickstay.ai.model;

import java.util.List;

/**
 * Kết quả trả về thống nhất từ AI Provider (Anthropic hoặc Deterministic Fallback).
 */
public record AiResult(
        String content,
        List<ToolCallRequest> toolCalls,
        int promptTokens,
        int completionTokens,
        long latencyMs,
        boolean fallbackUsed,
        String errorMessage
) {
    public static AiResult text(String content, int promptTokens, int completionTokens, long latencyMs) {
        return new AiResult(content, List.of(), promptTokens, completionTokens, latencyMs, false, null);
    }

    public static AiResult withTools(String content, List<ToolCallRequest> toolCalls, int promptTokens, int completionTokens, long latencyMs) {
        return new AiResult(content, toolCalls, promptTokens, completionTokens, latencyMs, false, null);
    }

    public static AiResult fallback(String content, List<ToolCallRequest> toolCalls, long latencyMs, String reason) {
        return new AiResult(content, toolCalls != null ? toolCalls : List.of(), 0, 0, latencyMs, true, reason);
    }
}
