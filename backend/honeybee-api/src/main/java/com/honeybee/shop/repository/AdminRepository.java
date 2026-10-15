package com.honeybee.shop.repository;

import com.honeybee.shop.entity.Admin;
import org.springframework.data.jpa.repository.*;

public interface AdminRepository extends JpaRepository<Admin, Long> {
  java.util.Optional<Admin> findByUsernameIgnoreCaseOrEmailIgnoreCase(
      String username, String email);

  boolean existsByUsernameIgnoreCase(String username);

  boolean existsByEmailIgnoreCase(String email);

  boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);

  boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Admin a order by a.id")
  java.util.List<Admin> findAllForUpdate();

  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Admin a where a.id = :id")
  java.util.Optional<Admin> findForUpdateById(
      @org.springframework.data.repository.query.Param("id") Long id);
}
