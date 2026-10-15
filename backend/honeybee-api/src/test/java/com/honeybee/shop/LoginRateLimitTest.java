package com.honeybee.shop;

import static org.assertj.core.api.Assertions.*;

import com.honeybee.shop.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.*;
import org.springframework.mock.web.*;

class LoginRateLimitTest {
  @Test
  void persistentLimitsRejectEleventhAttemptAndAllowAfterExpiry() throws Exception {
    var db =
        new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .generateUniqueName(true)
            .build();
    try {
      var jdbc = new JdbcTemplate(db);
      jdbc.execute(
          "CREATE TABLE login_attempt_windows(ip_hash VARCHAR(64) PRIMARY KEY,attempts INTEGER NOT"
              + " NULL,expires_at BIGINT NOT NULL)");
      var service = new LoginAttemptService(jdbc);
      long now = System.currentTimeMillis();
      for (int i = 0; i < 10; i++) assertThat(service.acquire("127.0.0.1", now)).isTrue();
      assertThat(new LoginAttemptService(jdbc).acquire("127.0.0.1", now)).isFalse();
      var limiter = new LoginRateLimitFilter(service);
      var req = new MockHttpServletRequest("POST", "/api/auth/login");
      req.setServletPath("/api/auth/login");
      req.setRemoteAddr("127.0.0.1");
      var res = new MockHttpServletResponse();
      limiter.doFilter(req, res, new MockFilterChain());
      assertThat(res.getStatus()).isEqualTo(429);
      assertThat(service.acquire("127.0.0.1", now + 900001)).isTrue();
      assertThat(service.acquire("127.0.0.2", now)).isTrue();
    } finally {
      db.shutdown();
    }
  }
}
