package com.honeybee.shop.dto.response;

import com.honeybee.shop.entity.Gift;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record GiftResponse(
    Long id,
    String name,
    String slug,
    String description,
    BigDecimal price,
    boolean available,
    boolean featured,
    GiftCategoryResponse category,
    List<ImageResponse> images,
    Instant createdAt) {
  public record ImageResponse(Long id, String imageUrl, int displayOrder) {}

  public static GiftResponse from(Gift f) {
    return new GiftResponse(
        f.getId(),
        f.getName(),
        f.getSlug(),
        f.getDescription(),
        f.getPrice(),
        f.isAvailable(),
        f.isFeatured(),
        GiftCategoryResponse.from(f.getCategory()),
        f.getImages().stream()
            .map(i -> new ImageResponse(i.getId(), i.getImageUrl(), i.getDisplayOrder()))
            .toList(),
        f.getCreatedAt());
  }
}
