package com.honeybee.shop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "categories")
public class Category extends AuditedEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 120)
  private String name;

  @Column(nullable = false, unique = true, length = 180)
  private String slug;

  @Column(nullable = false, columnDefinition = "text")
  private String description = "";

  @Column(columnDefinition = "text")
  private String imageUrl;

  @Column(length = 255)
  private String imagePublicId;
}
