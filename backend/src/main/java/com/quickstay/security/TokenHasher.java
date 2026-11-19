package com.quickstay.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Bam SHA-256 cho ma xac thuc email / ma khoi phuc mat khau truoc khi luu DB:
 * lo bang users cung khong dung duoc ma de chiem tai khoan. Ma goc chi nam trong email.
 */
public final class TokenHasher {

    private TokenHasher() {}

    public static String sha256(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 khong kha dung", e);
        }
    }
}
