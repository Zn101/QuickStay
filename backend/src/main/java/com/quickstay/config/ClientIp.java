package com.quickstay.config;

import jakarta.servlet.http.HttpServletRequest;

import java.net.InetAddress;

/**
 * IP that cua client de gioi han tan suat.
 * Chi tin header khi request den tu proxy noi bo (nginx trong mang Docker / loopback); nginx dat
 * X-Real-IP = $remote_addr nen client khong gia mao duoc. KHONG doc phan tu dau cua X-Forwarded-For:
 * nginx noi them vao gia tri client gui len, nen phan tu dau do client tu dat.
 */
public final class ClientIp {

    private ClientIp() {}

    public static String of(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (isPrivateOrLoopback(remote)) {
            String real = request.getHeader("X-Real-IP");
            if (real != null && !real.isBlank()) {
                return real.trim();
            }
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String[] parts = xff.split(",");
                return parts[parts.length - 1].trim(); // phan tu cuoi do proxy noi bo them vao
            }
        }
        return remote;
    }

    static boolean isPrivateOrLoopback(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        try {
            // Chi phan tich IP dang so (khong tra DNS)
            if (!ip.matches("[0-9a-fA-F:.]+")) {
                return false;
            }
            InetAddress a = InetAddress.getByName(ip);
            return a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }
}
