package com.honeybee.shop;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.context.*;

@ActiveProfiles("postgres-test")
@EnabledIfEnvironmentVariable(named = "HONEYBEE_TEST_JDBC_URL", matches = ".+")
class LocalPostgresIntegrationTest extends CatalogApiContract {
  @DynamicPropertySource
  static void postgres(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", () -> System.getenv("HONEYBEE_TEST_JDBC_URL"));
    r.add("spring.datasource.username", () -> System.getenv("HONEYBEE_TEST_DB_USERNAME"));
    r.add("spring.datasource.password", () -> System.getenv("HONEYBEE_TEST_DB_PASSWORD"));
  }
}
