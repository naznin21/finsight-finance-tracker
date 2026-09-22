package com.finance.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    private Key getKey() {
        byte[] keyBytes = secret.getBytes();
        if (keyBytes.length < 32) {
            log.warn("JWT secret key is less than 32 bytes. Please use a longer secret.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email) {
        try {
            String token = Jwts.builder()
                    .setSubject(email)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + expiration))
                    .signWith(getKey(), SignatureAlgorithm.HS256)
                    .compact();
            log.debug("JWT token generated for: {}", email);
            return token;
        } catch (Exception e) {
            log.error("Failed to generate JWT token: {}", e.getMessage());
            throw new RuntimeException("Failed to generate authentication token");
        }
    }

    public String extractEmail(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            log.error("Failed to extract email from token: {}", e.getMessage());
            throw new RuntimeException("Invalid token");
        }
    }

    public boolean isValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired");
            return false;
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token");
            return false;
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token");
            return false;
        } catch (SecurityException e) {
            log.warn("Invalid JWT signature");
            return false;
        } catch (IllegalArgumentException e) {
            log.warn("Empty JWT token");
            return false;
        }
    }
}