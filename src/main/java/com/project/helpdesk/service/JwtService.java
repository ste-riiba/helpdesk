package com.project.helpdesk.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.helpdesk.entity.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final byte[] secret;
    private final long expirationSeconds;

    public JwtService(
            @Value("${helpdesk.jwt.secret}") String secret,
            @Value("${helpdesk.jwt.expiration-seconds:86400}") long expirationSeconds
    ) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(String email, UserRole role) {
        Instant now = Instant.now();

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", email);
        payload.put("role", role.name());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());

        String unsignedToken = encodeJson(header) + "." + encodeJson(payload);

        return unsignedToken + "." + sign(unsignedToken);
    }

    public String extractEmail(String token) {
        return parsePayload(token).get("sub").toString();
    }

    public boolean isValid(String token) {
        try {
            String[] parts = token.split("\\.");

            if (parts.length != 3) {
                return false;
            }

            String unsignedToken = parts[0] + "." + parts[1];

            if (!constantTimeEquals(sign(unsignedToken), parts[2])) {
                return false;
            }

            Map<String, Object> payload = parsePayload(token);
            Number expiration = (Number) payload.get("exp");

            return expiration != null && expiration.longValue() > Instant.now().getEpochSecond();
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, Object> parsePayload(String token) {
        try {
            String[] parts = token.split("\\.");
            byte[] decodedPayload = Base64.getUrlDecoder().decode(parts[1]);

            return objectMapper.readValue(decodedPayload, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JWT token", e);
        }
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(value);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encode JWT", e);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));

            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to sign JWT", e);
        }
    }

    private boolean constantTimeEquals(String first, String second) {
        byte[] firstBytes = first.getBytes(StandardCharsets.UTF_8);
        byte[] secondBytes = second.getBytes(StandardCharsets.UTF_8);

        if (firstBytes.length != secondBytes.length) {
            return false;
        }

        int result = 0;

        for (int i = 0; i < firstBytes.length; i++) {
            result |= firstBytes[i] ^ secondBytes[i];
        }

        return result == 0;
    }
}
