package com.honeybee.shop.dto.response;

import com.honeybee.shop.entity.ShopSettings;

public record SettingsResponse(
    String shopName,
    String whatsappNumber,
    String phoneNumber,
    String address,
    String openingHours,
    String facebookUrl,
    String instagramUrl,
    String mapsUrl,
    String heroTitle,
    String heroSubtitle) {
  public static SettingsResponse from(ShopSettings s) {
    return new SettingsResponse(
        s.getShopName(),
        s.getWhatsappNumber(),
        s.getPhoneNumber(),
        s.getAddress(),
        s.getOpeningHours(),
        s.getFacebookUrl(),
        s.getInstagramUrl(),
        s.getMapsUrl(),
        s.getHeroTitle(),
        s.getHeroSubtitle());
  }
}
