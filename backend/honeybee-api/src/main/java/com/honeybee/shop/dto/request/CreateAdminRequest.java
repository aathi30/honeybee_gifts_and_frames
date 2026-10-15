package com.honeybee.shop.dto.request;

import jakarta.validation.constraints.*;

public record CreateAdminRequest(
    @NotBlank
        @Pattern(
            regexp = "[a-zA-Z0-9_.-]{3,100}",
            message = "Use 3–100 letters, numbers, dots, underscores or hyphens")
        String username,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank
        @Size(min = 8, max = 72, message = "Use at least 8 characters and at most 72 UTF-8 bytes")
        String password) {}
