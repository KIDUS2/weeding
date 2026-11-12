package com.kidus.wedding;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class WeddingApplication {
    public static void main(String[] args) {
        SpringApplication.run(WeddingApplication.class, args);
    }
}
