package com.honeybee.shop.repository;

import com.honeybee.shop.entity.Gift;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;

public interface GiftRepository
    extends JpaRepository<Gift, Long>, JpaSpecificationExecutor<Gift> {
  boolean existsByCategoryId(Long categoryId);

  long countByAvailable(boolean available);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select f from Gift f where f.id = :id")
  java.util.Optional<Gift> findForUpdate(Long id);
}
