package com.quickstay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class QuickStayApplication {
    public static void main(String[] args) {
        SpringApplication.run(QuickStayApplication.class, args);
    }
}
