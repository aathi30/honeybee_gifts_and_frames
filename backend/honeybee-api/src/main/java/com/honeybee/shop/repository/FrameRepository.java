package com.honeybee.shop.repository;

import com.honeybee.shop.entity.Frame;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;

public interface FrameRepository
    extends JpaRepository<Frame, Long>, JpaSpecificationExecutor<Frame> {
  boolean existsByCategoryId(Long categoryId);

  long countByAvailable(boolean available);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select f from Frame f where f.id = :id")
  java.util.Optional<Frame> findForUpdate(Long id);
}
