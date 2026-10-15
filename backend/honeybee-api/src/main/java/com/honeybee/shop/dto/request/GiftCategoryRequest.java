package com.honeybee.shop.dto.request;

import jakarta.validation.constraints.*;

public record GiftCategoryRequest(
    @NotBlank @Size(max = 120) String name, @NotNull @Size(max = 5000) String description) {}
