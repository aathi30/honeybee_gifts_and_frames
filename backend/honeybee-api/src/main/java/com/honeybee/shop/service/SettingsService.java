package com.honeybee.shop.service;

import com.honeybee.shop.dto.request.SettingsRequest;
import com.honeybee.shop.dto.response.SettingsResponse;
import com.honeybee.shop.exception.ApiException;
import com.honeybee.shop.repository.ShopSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {
  private final ShopSettingsRepository settings;

  @Transactional(readOnly = true)
  public SettingsResponse get() {
    return SettingsResponse.from(
        settings.findById(1L).orElseThrow(() -> ApiException.notFound("Shop settings")));
  }

  @Transactional
  public SettingsResponse update(SettingsRequest r) {
    var s = settings.findById(1L).orElseThrow(() -> ApiException.notFound("Shop settings"));
    s.setShopName(r.shopName().trim());
    s.setWhatsappNumber(r.whatsappNumber());
    s.setPhoneNumber(r.phoneNumber().trim());
    s.setAddress(r.address().trim());
    s.setOpeningHours(r.openingHours().trim());
    s.setFacebookUrl(r.facebookUrl());
    s.setInstagramUrl(r.instagramUrl());
    s.setMapsUrl(r.mapsUrl());
    s.setHeroTitle(r.heroTitle().trim());
    s.setHeroSubtitle(r.heroSubtitle().trim());
    return SettingsResponse.from(settings.save(s));
  }
}
