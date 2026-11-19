package com.quickstay.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickstay.ai.model.*;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

/**
 * Triển khai Anthropic Messages API với Circuit Breaker (Resilience4j) & Retry.
 * Khi dịch vụ AI bên ngoài gặp sự cố hoặc vượt ngưỡng lỗi, mạch tự động ngắt (OPEN)
 * và chuyển hướng 100% sang DeterministicFallbackEngine.
 */
@Component
public class AnthropicAiClient implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicAiClient.class);

    private final String apiKey;
    private final String model;
    private final RestClient client;
    private final ObjectMapper mapper = new ObjectMapper();
    private final DeterministicFallbackEngine fallbackEngine;

    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public AnthropicAiClient(@Value("${app.ai.api-key:}") String apiKey,
                             @Value("${app.ai.model:claude-sonnet-4-20250514}") String model,
                             @Value("${app.ai.base-url:https://api.anthropic.com}") String baseUrl,
                             @Value("${app.ai.timeout-seconds:15}") int timeoutSeconds,
                             DeterministicFallbackEngine fallbackEngine) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model;
        this.fallbackEngine = fallbackEngine;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(timeoutSeconds * 1000);
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();

        CircuitBreakerConfig cbConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50.0f)
                .slidingWindowSize(6)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(2)
                .build();
        this.circuitBreaker = CircuitBreaker.of("anthropicAiClient", cbConfig);

        RetryConfig retryConfig = RetryConfig.custom()
                .maxAttempts(2)
                .waitDuration(Duration.ofMillis(800))
                // Loi 4xx (sai key, request khong hop le, het quota) goi lai cung khong khoi: khong retry
                .ignoreExceptions(org.springframework.web.client.HttpClientErrorException.class)
                .build();
        this.retry = Retry.of("anthropicAiClient", retryConfig);
    }

    @Override
    public boolean isAvailable() {
        return !apiKey.isBlank() && circuitBreaker.getState() != CircuitBreaker.State.OPEN;
    }

    @Override
    public AiResult complete(AiPrompt prompt) {
        return completeWithTools(prompt, List.of());
    }

    @Override
    public AiResult completeWithTools(AiPrompt prompt, List<ToolDefinition> tools) {
        if (!isAvailable()) {
            return fallbackEngine.execute(prompt);
        }

        long start = System.currentTimeMillis();
        try {
            return circuitBreaker.executeSupplier(() ->
                    retry.executeSupplier(() -> doRemoteCall(prompt, tools, start)));
        } catch (Exception e) {
            log.warn("Anthropic API call failed or circuit breaker tripped: {}. Falling back to deterministic engine.", e.getMessage());
            return fallbackEngine.execute(prompt);
        }
    }

    private AiResult doRemoteCall(AiPrompt prompt, List<ToolDefinition> tools, long start) {
        Map<String, Object> reqBody = new LinkedHashMap<>();
        reqBody.put("model", model);
        reqBody.put("max_tokens", prompt.maxTokens());
        reqBody.put("temperature", prompt.temperature());
        if (prompt.systemInstruction() != null && !prompt.systemInstruction().isBlank()) {
            reqBody.put("system", prompt.systemInstruction());
        }
        reqBody.put("messages", List.of(Map.of("role", "user", "content", prompt.userMessage())));

        if (tools != null && !tools.isEmpty()) {
            List<Map<String, Object>> anthropicTools = new ArrayList<>();
            for (ToolDefinition t : tools) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("name", t.name());
                item.put("description", t.description());
                item.put("input_schema", t.inputSchema());
                anthropicTools.add(item);
            }
            reqBody.put("tools", anthropicTools);
        }

        JsonNode res = client.post().uri("/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .body(reqBody)
                .retrieve()
                .body(JsonNode.class);

        long latency = System.currentTimeMillis() - start;
        if (res == null) {
            throw new RuntimeException("Empty response from Anthropic API");
        }

        int promptTokens = res.path("usage").path("input_tokens").asInt(0);
        int completionTokens = res.path("usage").path("output_tokens").asInt(0);

        StringBuilder textContent = new StringBuilder();
        List<ToolCallRequest> toolCalls = new ArrayList<>();

        JsonNode contentArr = res.path("content");
        if (contentArr.isArray()) {
            for (JsonNode node : contentArr) {
                String type = node.path("type").asText("");
                if ("text".equals(type)) {
                    textContent.append(node.path("text").asText(""));
                } else if ("tool_use".equals(type)) {
                    String id = node.path("id").asText(UUID.randomUUID().toString());
                    String name = node.path("name").asText("");
                    JsonNode inputNode = node.path("input");
                    Map<String, Object> args = mapper.convertValue(inputNode, Map.class);
                    toolCalls.add(new ToolCallRequest(id, name, args));
                }
            }
        }

        if (!toolCalls.isEmpty()) {
            return AiResult.withTools(textContent.toString().trim(), toolCalls, promptTokens, completionTokens, latency);
        }
        return AiResult.text(textContent.toString().trim(), promptTokens, completionTokens, latency);
    }
}
