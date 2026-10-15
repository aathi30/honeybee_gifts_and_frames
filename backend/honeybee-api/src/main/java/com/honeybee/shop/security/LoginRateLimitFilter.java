package com.honeybee.shop.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class LoginRateLimitFilter extends OncePerRequestFilter {
  private final LoginAttemptService attempts;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    if (request.getMethod().equals("POST")
        && request.getServletPath().equals("/api/auth/login")
        && !attempts.acquire(request.getRemoteAddr(), System.currentTimeMillis())) {
      response.setStatus(429);
      response.setHeader("Retry-After", "900");
      response.setContentType("application/json");
      response
          .getWriter()
          .write(
              "{\"message\":\"Too many login attempts. Try again in 15 minutes\",\"errors\":{}}");
      return;
    }
    chain.doFilter(request, response);
  }
}
