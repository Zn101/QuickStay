package com.quickstay.ai.model;

import java.util.Map;

/**
 * Định nghĩa công cụ (Tool Definition) theo chuẩn Tool Calling / Function Calling.
 */
public record ToolDefinition(
        String name,
        String description,
        Map<String, Object> inputSchema
) {
    public static ToolDefinition of(String name, String description, Map<String, Object> schema) {
        return new ToolDefinition(name, description, schema);
    }
}
