package com.quickstay.ai.model;

/**
 * Kết quả thực thi công cụ trả về cho Model hoặc người dùng.
 */
public record ToolCallResult(
        String toolCallId,
        String toolName,
        boolean success,
        Object data,
        String errorMessage
) {
    public static ToolCallResult ok(String toolCallId, String toolName, Object data) {
        return new ToolCallResult(toolCallId, toolName, true, data, null);
    }

    public static ToolCallResult error(String toolCallId, String toolName, String error) {
        return new ToolCallResult(toolCallId, toolName, false, null, error);
    }
}
