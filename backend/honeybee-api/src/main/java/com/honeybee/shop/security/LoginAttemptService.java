package com.honeybee.shop.security;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {
  private final JdbcTemplate jdbc;

  private String hash(String ip) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(ip.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public boolean acquire(String ip, long now) {
    String key = hash(ip);
    jdbc.update(
        "UPDATE login_attempt_windows SET attempts=0, expires_at=? WHERE ip_hash=? AND"
            + " expires_at<=?",
        now + 900000,
        key,
        now);
    try {
      jdbc.update(
          "INSERT INTO login_attempt_windows(ip_hash,attempts,expires_at) VALUES (?,0,?)",
          key,
          now + 900000);
    } catch (DuplicateKeyException ignored) {
    }
    return jdbc.update(
            "UPDATE login_attempt_windows SET attempts=attempts+1 WHERE ip_hash=? AND attempts<10"
                + " AND expires_at>?",
            key,
            now)
        == 1;
  }

  @Scheduled(fixedDelay = 900000, initialDelay = 900000)
  public void purge() {
    jdbc.update(
        "DELETE FROM login_attempt_windows WHERE expires_at<?",
        System.currentTimeMillis() - 900000);
  }
}
