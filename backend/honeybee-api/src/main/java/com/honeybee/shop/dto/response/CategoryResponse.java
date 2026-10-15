package com.honeybee.shop.dto.response;

import com.honeybee.shop.entity.Category;

public record CategoryResponse(
    Long id, String name, String slug, String description, String imageUrl) {
  public static CategoryResponse from(Category c) {
    return new CategoryResponse(
        c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getImageUrl());
  }
}
