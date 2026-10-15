package com.honeybee.shop.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "image_cleanup_jobs")
public class ImageCleanupJob {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String publicId;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();
}
