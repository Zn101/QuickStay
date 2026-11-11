package com.quickstay.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * Tham so phan trang tuy chon ?page=&size= (T165). Khong gui ca hai thi API tra mang day du nhu truoc,
 * nen cac man hinh chua lam phan trang van chay.
 *
 * @param page trang can lay, tinh tu 0 (mac dinh 0)
 * @param size so phan tu moi trang, 1-100 (mac dinh 10)
 */
public record PageQuery(@Min(0) Integer page, @Min(1) @Max(100) Integer size) {

    private static final int DEFAULT_SIZE = 10;

    public boolean requested() {
        return page != null || size != null;
    }

    public Pageable toPageable() {
        return PageRequest.of(page == null ? 0 : page, size == null ? DEFAULT_SIZE : size);
    }
}
