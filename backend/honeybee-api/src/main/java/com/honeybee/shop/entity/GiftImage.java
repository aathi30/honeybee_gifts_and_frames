package com.honeybee.shop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "gift_images")
public class GiftImage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "gift_id")
  private Gift gift;

  @Column(nullable = false, columnDefinition = "text")
  private String imageUrl;

  @Column(nullable = false, unique = true, length = 255)
  private String cloudinaryPublicId;

  @Column(nullable = false)
  private int displayOrder;
}
