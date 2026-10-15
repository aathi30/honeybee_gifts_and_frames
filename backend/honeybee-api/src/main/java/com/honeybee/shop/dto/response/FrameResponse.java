package com.honeybee.shop.dto.response;

import com.honeybee.shop.entity.Frame;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record FrameResponse(
    Long id,
    String name,
    String slug,
    String description,
    BigDecimal price,
    String size,
    boolean available,
    boolean featured,
    CategoryResponse category,
    List<ImageResponse> images,
    Instant createdAt) {
  public record ImageResponse(Long id, String imageUrl, int displayOrder) {}

  public static FrameResponse from(Frame f) {
    return new FrameResponse(
        f.getId(),
        f.getName(),
        f.getSlug(),
        f.getDescription(),
        f.getPrice(),
        f.getSize(),
        f.isAvailable(),
        f.isFeatured(),
        CategoryResponse.from(f.getCategory()),
        f.getImages().stream()
            .map(i -> new ImageResponse(i.getId(), i.getImageUrl(), i.getDisplayOrder()))
            .toList(),
        f.getCreatedAt());
  }
}
