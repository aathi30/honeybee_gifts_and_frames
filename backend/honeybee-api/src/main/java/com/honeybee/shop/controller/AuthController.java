package com.honeybee.shop.controller;

import com.honeybee.shop.dto.request.LoginRequest;
import com.honeybee.shop.exception.ApiException;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.*;
import org.springframework.security.core.context.*;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.bind.annotation.*;

@Profile("!bootstrap")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthenticationManager authenticationManager;
  private final SecurityContextRepository contexts;
  private final CsrfTokenRepository csrfRepository;

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @PostMapping("/login")
  public Map<String, String> login(
      @Valid @RequestBody LoginRequest login,
      HttpServletRequest request,
      HttpServletResponse response) {
    Authentication auth;
    try {
      auth =
          authenticationManager.authenticate(
              UsernamePasswordAuthenticationToken.unauthenticated(
                  login.username(), login.password()));
    } catch (AuthenticationException e) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }
    new ChangeSessionIdAuthenticationStrategy().onAuthentication(auth, request, response);
    new CsrfAuthenticationStrategy(csrfRepository).onAuthentication(auth, request, response);
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(auth);
    SecurityContextHolder.setContext(context);
    contexts.saveContext(context, request, response);
    return Map.of("username", auth.getName());
  }

  @GetMapping("/me")
  public Map<String, String> me(Authentication auth) {
    if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser"))
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in");
    return Map.of("username", auth.getName());
  }
}
