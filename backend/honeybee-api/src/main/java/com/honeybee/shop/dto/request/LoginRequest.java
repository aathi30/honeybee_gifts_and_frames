package com.honeybee.shop.dto.request;

import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;

public record LoginRequest(
    @NotBlank @Size(max = 254) String username, @NotBlank @Size(max = 72) String password) {
  @AssertTrue(message = "Password must not exceed 72 UTF-8 bytes")
  public boolean isPasswordWithinLimit() {
    return password == null || password.getBytes(StandardCharsets.UTF_8).length <= 72;
  }

  @Override
  public String toString() {
    return "LoginRequest[credentials redacted]";
  }
}
