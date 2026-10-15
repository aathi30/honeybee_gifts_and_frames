package com.honeybee.shop.config;

import com.honeybee.shop.security.LoginAttemptService;
import com.honeybee.shop.security.LoginRateLimitFilter;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.*;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;
import org.springframework.web.cors.*;

@Configuration
@Profile("!bootstrap")
public class SecurityConfig {
  @Bean
  AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception {
    return c.getAuthenticationManager();
  }

  @Bean
  SecurityContextRepository contexts() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  CsrfTokenRepository csrfRepository() {
    return new HttpSessionCsrfTokenRepository();
  }

  @Bean
  SecurityFilterChain security(
      HttpSecurity http,
      SecurityContextRepository contexts,
      CsrfTokenRepository csrf,
      LoginAttemptService attempts,
      @org.springframework.beans.factory.annotation.Qualifier("corsConfigurationSource")
          CorsConfigurationSource cors)
      throws Exception {
    http.cors(c -> c.configurationSource(cors))
        .csrf(c -> c.csrfTokenRepository(csrf))
        .securityContext(c -> c.securityContextRepository(contexts))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        HttpMethod.GET,
                        "/api/frames",
                        "/api/frames/*",
                        "/api/categories",
                        "/api/categories/*/frames",
                        "/api/gifts",
                        "/api/gifts/*",
                        "/api/gift-categories",
                        "/api/gift-categories/*/gifts",
                        "/api/settings/public",
                        "/api/auth/csrf",
                        "/api/auth/me",
                        "/api/health")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login")
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/auth/logout")
                    .authenticated()
                    .anyRequest()
                    .denyAll())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (req, res, ex) -> {
                          res.setStatus(401);
                          res.setContentType("application/json");
                          res.getWriter().write("{\"message\":\"Please sign in\",\"errors\":{}}");
                        })
                    .accessDeniedHandler(
                        (req, res, ex) -> {
                          res.setStatus(403);
                          res.setContentType("application/json");
                          res.getWriter()
                              .write(
                                  "{\"message\":\"Access denied or expired security token. Refresh"
                                      + " and try again\",\"errors\":{}}");
                        }))
        .logout(
            l ->
                l.logoutUrl("/api/auth/logout")
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
                    .deleteCookies("SESSION", "JSESSIONID")
                    .logoutSuccessHandler((req, res, auth) -> res.setStatus(204)))
        .addFilterBefore(
            new LoginRateLimitFilter(attempts), UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(
      @Value("$" + "{app.allowed-origins}") String origins) {
    var c = new CorsConfiguration();
    var allowed =
        Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList();
    if (allowed.contains("*")) throw new IllegalArgumentException("Wildcard origins are forbidden");
    c.setAllowedOrigins(allowed);
    c.setAllowCredentials(true);
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    c.setAllowedHeaders(List.of("Content-Type", "X-CSRF-TOKEN"));
    c.setMaxAge(3600L);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", c);
    return source;
  }
}
