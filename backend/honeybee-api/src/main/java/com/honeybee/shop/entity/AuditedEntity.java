package com.honeybee.shop.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class AuditedEntity {
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  @PrePersist
  void onCreate() {
    createdAt = Instant.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
