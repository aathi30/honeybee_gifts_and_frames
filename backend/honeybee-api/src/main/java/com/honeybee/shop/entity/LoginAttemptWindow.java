package com.honeybee.shop.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "login_attempt_windows")
public class LoginAttemptWindow {
  @Id
  @Column(length = 64)
  private String ipHash;

  @Column(nullable = false)
  private int attempts;

  @Column(nullable = false)
  private long expiresAt;
}
