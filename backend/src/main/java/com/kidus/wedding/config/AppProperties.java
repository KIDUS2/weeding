package com.kidus.wedding.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Admin admin, Cors cors) {

    public record Jwt(String secret, long ttlHours) {
    }

    public record Admin(String username, String password) {
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
