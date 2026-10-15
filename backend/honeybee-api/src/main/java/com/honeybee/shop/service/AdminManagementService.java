package com.honeybee.shop.service;

import com.honeybee.shop.dto.request.*;
import com.honeybee.shop.dto.response.AdminResponse;
import com.honeybee.shop.entity.Admin;
import com.honeybee.shop.exception.ApiException;
import com.honeybee.shop.repository.AdminRepository;
import java.nio.charset.StandardCharsets;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.session.jdbc.JdbcIndexedSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!bootstrap")
@RequiredArgsConstructor
public class AdminManagementService {
  private final AdminRepository admins;
  private final PasswordEncoder passwords;
  private final JdbcIndexedSessionRepository sessions;

  @Transactional(readOnly = true)
  public List<AdminResponse> list() {
    return admins.findAll(Sort.by("id")).stream().map(AdminResponse::from).toList();
  }

  @Transactional
  public AdminResponse create(CreateAdminRequest request) {
    validatePassword(request.password());
    var email = request.email().trim().toLowerCase(Locale.ROOT);
    if (admins.existsByUsernameIgnoreCase(request.username()))
      throw new ApiException(HttpStatus.CONFLICT, "An admin with this username already exists");
    if (admins.existsByEmailIgnoreCase(email))
      throw new ApiException(HttpStatus.CONFLICT, "An admin with this email already exists");
    var admin = new Admin();
    admin.setUsername(request.username());
    admin.setEmail(email);
    admin.setPasswordHash(passwords.encode(request.password()));
    return AdminResponse.from(admins.saveAndFlush(admin));
  }

  @Transactional
  public UpdateResult update(
      Long id, UpdateAdminRequest request, String currentUsername, String currentSessionId) {
    if (request.password() != null) validatePassword(request.password());
    var admin = admins.findForUpdateById(id).orElseThrow(this::missing);
    var email = request.email().trim().toLowerCase(Locale.ROOT);
    if (admins.existsByUsernameIgnoreCaseAndIdNot(request.username(), id))
      throw new ApiException(HttpStatus.CONFLICT, "An admin with this username already exists");
    if (admins.existsByEmailIgnoreCaseAndIdNot(email, id))
      throw new ApiException(HttpStatus.CONFLICT, "An admin with this email already exists");
    var oldUsername = admin.getUsername();
    boolean currentAccount = oldUsername.equalsIgnoreCase(currentUsername);
    admin.setUsername(request.username());
    admin.setEmail(email);
    if (request.password() != null) admin.setPasswordHash(passwords.encode(request.password()));
    admins.saveAndFlush(admin);
    if (!oldUsername.equals(admin.getUsername()) || request.password() != null)
      revokeSessions(oldUsername, currentAccount ? currentSessionId : null);
    return new UpdateResult(AdminResponse.from(admin), currentAccount);
  }

  public record UpdateResult(AdminResponse admin, boolean currentAccount) {}

  @Transactional
  public void changePassword(Long id, AdminPasswordRequest request, String currentSessionId) {
    validatePassword(request.password());
    var admin = admins.findForUpdateById(id).orElseThrow(this::missing);
    admin.setPasswordHash(passwords.encode(request.password()));
    admins.saveAndFlush(admin);
    revokeSessions(admin.getUsername(), currentSessionId);
  }

  @Transactional
  public void delete(Long id, String currentUsername) {
    // Lock in a stable order so concurrent deletions cannot remove the final administrator.
    var all = admins.findAllForUpdate();
    var target =
        all.stream().filter(a -> a.getId().equals(id)).findFirst().orElseThrow(this::missing);
    if (all.size() <= 1)
      throw new ApiException(HttpStatus.CONFLICT, "The last admin cannot be deleted");
    if (target.getUsername().equalsIgnoreCase(currentUsername))
      throw new ApiException(HttpStatus.CONFLICT, "You cannot delete your own admin account");
    admins.delete(target);
    admins.flush();
    revokeSessions(target.getUsername(), null);
  }

  private void revokeSessions(String username, String keepSessionId) {
    sessions.findByPrincipalName(username).keySet().stream()
        .filter(id -> !id.equals(keepSessionId)).forEach(sessions::deleteById);
  }

  private void validatePassword(String password) {
    if (password.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
  }

  private ApiException missing() {
    return new ApiException(HttpStatus.NOT_FOUND, "Admin account not found");
  }
}
