package com.quickstay.ai.client;

import com.quickstay.ai.model.AiPrompt;
import com.quickstay.ai.model.AiResult;
import com.quickstay.ai.model.ToolDefinition;

import java.util.List;

/**
 * Provider Abstraction: Giao diện trừu tượng hóa cho các mô hình AI.
 * Cho phép dễ dàng chuyển đổi nhà cung cấp (Anthropic, OpenAI, Local Ollama,...)
 * và đảm bảo cơ chế Circuit Breaker + Retry + Deterministic Fallback minh bạch.
 */
public interface AiClient {

    /**
     * Kiểm tra xem provider có được cấu hình khóa API hợp lệ và sẵn sàng hay không.
     */
    boolean isAvailable();

    /**
     * Hoàn tất văn bản đơn thuần (Text Completion).
     */
    AiResult complete(AiPrompt prompt);

    /**
     * Hoàn tất kết hợp với cơ chế gọi công cụ (Tool / Function Calling).
     */
    AiResult completeWithTools(AiPrompt prompt, List<ToolDefinition> tools);
}
