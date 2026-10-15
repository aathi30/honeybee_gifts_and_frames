package com.honeybee.shop.repository;

import com.honeybee.shop.entity.Category;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;

public interface CategoryRepository extends JpaRepository<Category, Long> {
  java.util.Optional<Category> findBySlug(String slug);

  boolean existsByNameIgnoreCase(String name);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from Category c where c.id = :id")
  java.util.Optional<Category> findForUpdate(Long id);
}
