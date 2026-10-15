package com.honeybee.shop.controller;

import com.honeybee.shop.dto.request.*;
import com.honeybee.shop.dto.response.AdminResponse;
import com.honeybee.shop.service.AdminManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("!bootstrap")
@RequestMapping("/api/admin/admins")
@RequiredArgsConstructor
public class AdminManagementController {
  private final AdminManagementService management;
  private final SecurityContextRepository contexts;

  @GetMapping
  public List<AdminResponse> list() {
    return management.list();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AdminResponse create(@Valid @RequestBody CreateAdminRequest request) {
    return management.create(request);
  }

  @PutMapping("/{id}")
  public AdminResponse update(
      @PathVariable Long id,
      @Valid @RequestBody UpdateAdminRequest body,
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    var session = request.getSession(false);
    var result = management.update(
        id, body, authentication.getName(), session == null ? null : session.getId());
    if (result.currentAccount()) {
      var principal = User.withUsername(result.admin().username())
          .password("").authorities(authentication.getAuthorities()).build();
      var context = SecurityContextHolder.createEmptyContext();
      context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
          principal, null, authentication.getAuthorities()));
      SecurityContextHolder.setContext(context);
      contexts.saveContext(context, request, response);
    }
    return result.admin();
  }

  @PutMapping("/{id}/password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changePassword(
      @PathVariable Long id,
      @Valid @RequestBody AdminPasswordRequest body,
      HttpServletRequest request) {
    var session = request.getSession(false);
    management.changePassword(id, body, session == null ? null : session.getId());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id, Authentication authentication) {
    management.delete(id, authentication.getName());
  }
}
