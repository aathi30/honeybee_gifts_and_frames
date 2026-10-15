package com.honeybee.shop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "shop_settings")
public class ShopSettings {
  @Id private Long id = 1L;

  @Column(nullable = false, length = 120)
  private String shopName;

  @Column(nullable = false, length = 20)
  private String whatsappNumber = "";

  @Column(nullable = false, length = 40)
  private String phoneNumber = "";

  @Column(nullable = false, length = 1000)
  private String address = "";

  @Column(nullable = false, length = 500)
  private String openingHours = "";

  @Column(nullable = false, length = 500)
  private String facebookUrl = "";

  @Column(nullable = false, length = 500)
  private String instagramUrl = "";

  @Column(nullable = false, length = 500)
  private String mapsUrl = "";

  @Column(nullable = false, length = 200)
  private String heroTitle;

  @Column(nullable = false, length = 500)
  private String heroSubtitle;
}
