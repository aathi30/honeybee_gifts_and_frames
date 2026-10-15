package com.honeybee.shop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "admins")
public class Admin extends AuditedEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 100)
  private String username;

  @Column(nullable = false, unique = true, length = 254)
  private String email;

  @Column(nullable = false, length = 100)
  private String passwordHash;

  @Column(nullable = false, length = 30)
  private String role = "ADMIN";
}
