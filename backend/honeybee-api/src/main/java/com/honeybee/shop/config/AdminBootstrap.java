package com.honeybee.shop.config;

import com.honeybee.shop.entity.Admin;
import com.honeybee.shop.repository.AdminRepository;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Profile("bootstrap")
public class AdminBootstrap implements ApplicationRunner {
  private final ConfigurableApplicationContext context;
  private final AdminRepository admins;
  private final PasswordEncoder passwords;

  @Value("$" + "{app.bootstrap-admin}")
  private boolean enabled;

  @Value("$" + "{app.admin-username}")
  private String username;

  @Value("$" + "{app.admin-email}")
  private String email;

  @Value("$" + "{app.admin-password}")
  private String password;

  @Override
  public void run(ApplicationArguments args) {
    if (!enabled) return;
    if (admins.count() != 0)
      throw new IllegalStateException(
          "Bootstrap is only permitted on a database without administrators. Disable"
              + " BOOTSTRAP_ADMIN");
    if (!username.matches("[a-zA-Z0-9_.-]{3,100}")
        || !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")
        || email.length() > 254
        || password.length() < 8
        || password.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new IllegalStateException(
          "Provide a valid username, email and unique password of at least 8 characters and at"
              + " most 72 bytes");
    var admin = new Admin();
    admin.setUsername(username.trim());
    admin.setEmail(email.trim().toLowerCase(java.util.Locale.ROOT));
    admin.setPasswordHash(passwords.encode(password));
    admins.save(admin);
    password = "";
    context.close();
  }
}
