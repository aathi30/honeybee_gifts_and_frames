package com.honeybee.shop.security;

import com.honeybee.shop.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDetailsService implements UserDetailsService {
  private final AdminRepository admins;

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String login) {
    var admin =
        admins
            .findByUsernameIgnoreCaseOrEmailIgnoreCase(login.trim(), login.trim())
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    return User.withUsername(admin.getUsername())
        .password(admin.getPasswordHash())
        .roles(admin.getRole())
        .build();
  }
}
