package com.honeybee.shop.repository;

import com.honeybee.shop.entity.GiftCategory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;

public interface GiftCategoryRepository extends JpaRepository<GiftCategory, Long> {
  java.util.Optional<GiftCategory> findBySlug(String slug);

  boolean existsByNameIgnoreCase(String name);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from GiftCategory c where c.id = :id")
  java.util.Optional<GiftCategory> findForUpdate(Long id);
}
