package com.honeybee.shop.config;

import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {
  @Bean
  PasswordEncoder passwords() {
    return new BCryptPasswordEncoder(12);
  }
}
