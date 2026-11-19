package com.quickstay.ai.tool;

import com.quickstay.ai.model.ToolCallResult;
import com.quickstay.ai.model.ToolDefinition;

import java.util.Map;

/**
 * Interface đại diện cho một Tool có thể được Model gọi (Function / Tool Calling).
 * Tuân thủ nguyên tắc: Read-only by default (chỉ truy vấn, không thay đổi trạng thái giao dịch).
 */
public interface AiTool {

    ToolDefinition getDefinition();

    ToolCallResult execute(String toolCallId, Map<String, Object> arguments);
}
