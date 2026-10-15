package com.honeybee.shop.dto.response;

import com.honeybee.shop.entity.GiftCategory;

public record GiftCategoryResponse(
    Long id, String name, String slug, String description, String imageUrl) {
  public static GiftCategoryResponse from(GiftCategory c) {
    return new GiftCategoryResponse(
        c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getImageUrl());
  }
}
