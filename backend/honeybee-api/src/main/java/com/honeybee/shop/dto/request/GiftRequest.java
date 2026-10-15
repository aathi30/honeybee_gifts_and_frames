package com.honeybee.shop.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record GiftRequest(
    @NotBlank @Size(max = 180) String name,
    @NotNull @Size(max = 10000) String description,
    @NotNull @Positive Long categoryId,
    @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
    boolean available,
    boolean featured) {}
