package com.quickstay.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * Dong ho cua ung dung theo mui gio kinh doanh (mac dinh Asia/Ho_Chi_Minh), khong phu thuoc mui gio may chu.
 * Vd. Docker chay UTC: 6h sang 04/11 o Viet Nam van la 03/11 UTC, neu dung LocalDate.now() se cho dat ngay 03/11.
 * Code nghiep vu dung LocalDate.now(clock); test co the thay Clock co dinh.
 */
@Configuration
public class TimeConfig {

    @Bean
    Clock clock(@Value("${app.timezone}") ZoneId zone) {
        return Clock.system(zone);
    }
}
