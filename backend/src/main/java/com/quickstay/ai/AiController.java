package com.quickstay.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    public record DescribeRequest(String type, @NotBlank String name, String city, String amenities,
                                  String roomType) {}

    public record DescribeResponse(String description) {}

    public record ChatRequest(@NotBlank @Size(max = 1000) String message) {}

    public record ChatResponse(String reply) {}

    private final AiService ai;

    public AiController(AiService ai) {
        this.ai = ai;
    }

    @PostMapping("/describe")
    public DescribeResponse describe(@Valid @RequestBody DescribeRequest req) {
        return new DescribeResponse(ai.describe(req.type(), req.name(), req.city(), req.amenities(), req.roomType()));
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest req) {
        return new ChatResponse(ai.chat(req.message()));
    }
}
