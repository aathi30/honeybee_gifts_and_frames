package com.honeybee.shop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "gifts")
public class Gift extends AuditedEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 180)
  private String name;

  @Column(nullable = false, unique = true, length = 240)
  private String slug;

  @Column(nullable = false, columnDefinition = "text")
  private String description = "";

  @Column(nullable = false, precision = 12, scale = 2)
  private java.math.BigDecimal price;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id")
  private GiftCategory category;

  @Column(nullable = false)
  private boolean available = true;

  @Column(nullable = false)
  private boolean featured;

  @OneToMany(mappedBy = "gift", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("displayOrder ASC, id ASC")
  private java.util.List<GiftImage> images = new java.util.ArrayList<>();
}
