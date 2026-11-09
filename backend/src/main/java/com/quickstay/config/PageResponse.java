package com.quickstay.config;

import org.springframework.data.domain.Page;

import java.util.List;

/** Ket qua phan trang (T165). Dung kieu rieng thay vi Page cua Spring de dang JSON on dinh cho Frontend. */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public static <T> PageResponse<T> of(Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }
}
