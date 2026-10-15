package com.honeybee.shop.repository;

import com.honeybee.shop.entity.ShopSettings;
import org.springframework.data.jpa.repository.*;

public interface ShopSettingsRepository extends JpaRepository<ShopSettings, Long> {}
