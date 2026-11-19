package com.quickstay.security;

import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Xac thuc JWT. Khong tin role trong token: doc tai khoan tu DB moi request de
 * - tai khoan bi xoa / doi email thi token cu het tac dung ngay,
 * - doi role co hieu luc ngay,
 * - token phat hanh truoc tokensValidAfter (doi / dat lai mat khau) bi tu choi.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtService.parse(header.substring(7))
                    .flatMap(claims -> users.findByEmail(claims.getSubject()).filter(u -> stillValid(u, claims)))
                    .ifPresent(u -> {
                        var auth = new UsernamePasswordAuthenticationToken(
                                u.getEmail(), null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
        }
        chain.doFilter(request, response);
    }

    /** iat (do giay) phai khong truoc tokensValidAfter (da cat ve giay khi dat). */
    static boolean stillValid(User u, Claims claims) {
        Instant validAfter = u.getTokensValidAfter();
        if (validAfter == null) {
            return true;
        }
        if (claims.getIssuedAt() == null) {
            return false;
        }
        return !claims.getIssuedAt().toInstant().isBefore(validAfter);
    }
}
