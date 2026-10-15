package com.honeybee.shop.dto.response;

import com.honeybee.shop.entity.Admin;
import java.time.Instant;

public record AdminResponse(Long id, String username, String email, String role, Instant createdAt) {
  public static AdminResponse from(Admin admin) {
    return new AdminResponse(
        admin.getId(), admin.getUsername(), admin.getEmail(), admin.getRole(), admin.getCreatedAt());
  }
}
