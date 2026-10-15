package com.honeybee.shop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "frames")
public class Frame extends AuditedEntity {
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

  @Column(nullable = false, length = 200)
  private String size;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id")
  private Category category;

  @Column(nullable = false)
  private boolean available = true;

  @Column(nullable = false)
  private boolean featured;

  @OneToMany(mappedBy = "frame", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("displayOrder ASC, id ASC")
  private java.util.List<FrameImage> images = new java.util.ArrayList<>();
}
