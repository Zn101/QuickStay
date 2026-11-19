package com.quickstay.content;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickstay.config.ApiException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

/**
 * Noi dung Tours / Restaurants / News do admin quan ly (truoc day chi nam trong state cua trinh duyet, tai lai trang la mat).
 * GET /api/content/{type}: cong khai; 404 khi admin chua luu lan nao (frontend dung du lieu mac dinh).
 * PUT /api/admin/content/{type}: chi ADMIN (SecurityConfig), ghi de toan bo danh sach.
 */
@RestController
public class SiteContentController {

    static final Set<String> TYPES = Set.of("tours", "restaurants", "news");
    private static final int MAX_ITEMS = 500;
    private static final int MAX_BYTES = 2_000_000;

    private final SiteContentRepository contents;
    private final ObjectMapper json;

    public SiteContentController(SiteContentRepository contents, ObjectMapper json) {
        this.contents = contents;
        this.json = json;
    }

    @GetMapping("/api/content/{type}")
    @Transactional(readOnly = true)
    public Map<String, Object> get(@PathVariable String type) throws JsonProcessingException {
        SiteContent c = contents.findById(checkType(type))
                .orElseThrow(() -> ApiException.notFound("Chua co noi dung"));
        return Map.of("type", c.getContentType(), "items", json.readTree(c.getDataJson()), "updatedAt", c.getUpdatedAt());
    }

    @PutMapping("/api/admin/content/{type}")
    @Transactional
    public Map<String, Object> put(@PathVariable String type, @RequestBody JsonNode items) throws JsonProcessingException {
        String t = checkType(type);
        if (items == null || !items.isArray()) {
            throw ApiException.badRequest("Noi dung phai la mang JSON");
        }
        if (items.size() > MAX_ITEMS) {
            throw ApiException.badRequest("Toi da " + MAX_ITEMS + " muc");
        }
        for (JsonNode n : items) {
            if (!n.isObject()) {
                throw ApiException.badRequest("Moi muc phai la object JSON");
            }
        }
        String raw = json.writeValueAsString(items);
        if (raw.length() > MAX_BYTES) {
            throw ApiException.badRequest("Noi dung qua lon");
        }
        SiteContent c = contents.findById(t).orElseGet(() -> {
            SiteContent n = new SiteContent();
            n.setContentType(t);
            return n;
        });
        c.setDataJson(raw);
        SiteContent saved = contents.saveAndFlush(c);
        return Map.of("type", t, "items", items, "updatedAt", saved.getUpdatedAt());
    }

    private static String checkType(String type) {
        String t = type == null ? "" : type.trim().toLowerCase();
        if (!TYPES.contains(t)) {
            throw ApiException.notFound("Loai noi dung khong ton tai");
        }
        return t;
    }
}
