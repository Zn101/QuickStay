package com.quickstay.ai.model;

import java.util.Map;

/**
 * Yêu cầu gọi công cụ được sinh ra từ Model.
 */
public record ToolCallRequest(
        String id,
        String toolName,
        Map<String, Object> arguments
) {}
