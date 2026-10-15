package com.honeybee.shop.dto.request;

import jakarta.validation.constraints.*;

public record AdminPasswordRequest(
    @NotBlank
        @Size(min = 8, max = 72, message = "Use at least 8 characters and at most 72 UTF-8 bytes")
        String password) {}
