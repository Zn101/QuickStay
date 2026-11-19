package com.quickstay.ai.model;

/**
 * Cấu trúc đóng gói prompt gửi tới AI Client.
 */
public record AiPrompt(
        String feature,
        String systemInstruction,
        String userMessage,
        int maxTokens,
        double temperature,
        String language
) {
    public static AiPrompt simple(String feature, String system, String user) {
        return new AiPrompt(feature, system, user, 600, 0.3, "vi");
    }

    public static AiPrompt of(String feature, String system, String user, int maxTokens) {
        return new AiPrompt(feature, system, user, maxTokens, 0.3, "vi");
    }

    public static AiPrompt of(String feature, String system, String user, int maxTokens, String lang) {
        return new AiPrompt(feature, system, user, maxTokens, 0.3, lang != null ? lang : "vi");
    }
}
