package com.honeybee.shop;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.honeybee.shop.entity.Admin;
import com.honeybee.shop.repository.AdminRepository;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminManagementIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired AdminRepository admins;
  @Autowired PasswordEncoder passwords;
  @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
  Admin owner;

  @BeforeEach
  void setup() {
    admins.deleteAll();
    jdbc.update("DELETE FROM login_attempt_windows");
    owner = seed("owner");
  }

  private Admin seed(String username) {
    var admin = new Admin();
    admin.setUsername(username);
    admin.setEmail(username + "@example.test");
    admin.setPasswordHash(passwords.encode("original-test-password"));
    return admins.saveAndFlush(admin);
  }

  private Cookie login(String username, String password) throws Exception {
    var initial = mvc.perform(get("/api/auth/csrf")).andReturn();
    var cookie = initial.getResponse().getCookie("SESSION");
    var token = json.readTree(initial.getResponse().getContentAsString()).get("token").asText();
    return mvc.perform(post("/api/auth/login").cookie(cookie).header("X-CSRF-TOKEN", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(Map.of("username", username, "password", password))))
        .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
  }

  @Test
  void adminEndpointsRequireAdminRoleAndCsrf() throws Exception {
    mvc.perform(get("/api/admin/admins")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/admin/admins").with(user("visitor").roles("USER")))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/admin/admins").with(user("owner").roles("ADMIN"))
        .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(put("/api/admin/admins/{id}/password", owner.getId())
        .with(user("visitor").roles("USER")).with(csrf())
        .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"password-new\"}"))
        .andExpect(status().isForbidden());
    mvc.perform(delete("/api/admin/admins/{id}", owner.getId()).with(csrf()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void createsListsAndAuthenticatesNewAdminsWithoutExposingPasswords() throws Exception {
    var result = mvc.perform(post("/api/admin/admins").with(user("owner").roles("ADMIN")).with(csrf())
        .contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsBytes(Map.of("username", "new-admin", "email", "New@Example.test", "password", "new-test-password"))))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("ADMIN"))
        .andExpect(jsonPath("$.email").value("new@example.test"))
        .andExpect(jsonPath("$.password").doesNotExist())
        .andExpect(jsonPath("$.passwordHash").doesNotExist()).andReturn();
    var id = json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    var stored = admins.findById(id).orElseThrow();
    assertThat(passwords.matches("new-test-password", stored.getPasswordHash())).isTrue();
    mvc.perform(get("/api/admin/admins").with(user("owner").roles("ADMIN")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[*].passwordHash").isEmpty());
    login("NEW@example.test", "new-test-password");
  }

  @Test
  void rejectsDuplicatesAndInvalidCredentials() throws Exception {
    for (var body : new Map[] {
        Map.of("username", "OWNER", "email", "other@example.test", "password", "valid-password"),
        Map.of("username", "different", "email", "OWNER@EXAMPLE.TEST", "password", "valid-password")}) {
      mvc.perform(post("/api/admin/admins").with(user("owner").roles("ADMIN")).with(csrf())
          .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(body)))
          .andExpect(status().isConflict());
    }
    for (var body : new Map[] {
        Map.of("username", "bad name", "email", "valid@example.test", "password", "valid-password"),
        Map.of("username", "valid", "email", "invalid", "password", "valid-password"),
        Map.of("username", "valid", "email", "valid@example.test", "password", "short"),
        Map.of("username", "valid", "email", "valid@example.test", "password", "é".repeat(40))}) {
      mvc.perform(post("/api/admin/admins").with(user("owner").roles("ADMIN")).with(csrf())
          .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(body)))
          .andExpect(status().isBadRequest());
    }
    assertThat(admins.count()).isEqualTo(1);
  }

  @Test
  void changingOwnPasswordKeepsCurrentSessionAndRevokesOtherSessions() throws Exception {
    var current = login("owner", "original-test-password");
    var other = login("owner", "original-test-password");
    mvc.perform(put("/api/admin/admins/{id}/password", owner.getId()).cookie(current).with(csrf())
        .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"replacement-test-password\"}"))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/admin/admins").cookie(current)).andExpect(status().isOk());
    mvc.perform(get("/api/admin/admins").cookie(other)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"owner\",\"password\":\"original-test-password\"}"))
        .andExpect(status().isUnauthorized());
    login("owner", "replacement-test-password");
  }

  @Test
  void changingAnotherAdminsPasswordRevokesTheirSession() throws Exception {
    var target = seed("colleague");
    var session = login("colleague", "original-test-password");
    mvc.perform(put("/api/admin/admins/{id}/password", target.getId())
        .with(user("owner").roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"password\":\"replacement-test-password\"}"))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/admin/admins").cookie(session)).andExpect(status().isUnauthorized());
    login("colleague", "replacement-test-password");
  }

  @Test
  void editsDetailsWithoutChangingPasswordAndRejectsConflictingNames() throws Exception {
    var target = seed("colleague");
    mvc.perform(put("/api/admin/admins/{id}", target.getId())
        .with(user("owner").roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"updated-admin\",\"email\":\"Updated@Example.test\"}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("updated-admin"))
        .andExpect(jsonPath("$.email").value("updated@example.test"))
        .andExpect(jsonPath("$.passwordHash").doesNotExist());
    assertThat(passwords.matches("original-test-password", admins.findById(target.getId()).orElseThrow().getPasswordHash())).isTrue();
    mvc.perform(put("/api/admin/admins/{id}", target.getId())
        .with(user("owner").roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"OWNER\",\"email\":\"updated@example.test\"}"))
        .andExpect(status().isConflict());
    mvc.perform(put("/api/admin/admins/{id}", target.getId())
        .with(user("owner").roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"updated-admin\",\"email\":\"OWNER@EXAMPLE.TEST\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void editingOwnUsernameUpdatesCurrentSessionAndRevokesOtherSessions() throws Exception {
    var current = login("owner", "original-test-password");
    var other = login("owner", "original-test-password");
    mvc.perform(put("/api/admin/admins/{id}", owner.getId()).cookie(current).with(csrf())
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"renamed-owner\",\"email\":\"renamed@example.test\",\"password\":\"replacement-test-password\"}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/auth/me").cookie(current)).andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("renamed-owner"));
    mvc.perform(get("/api/admin/admins").cookie(other)).andExpect(status().isUnauthorized());
    login("renamed-owner", "replacement-test-password");
  }

  @Test
  void deletionProtectsSelfAndLastAdminAndRevokesDeletedAdminsAccess() throws Exception {
    mvc.perform(delete("/api/admin/admins/{id}", owner.getId()).with(user("owner").roles("ADMIN")).with(csrf()))
        .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("The last admin cannot be deleted"));
    var target = seed("colleague");
    mvc.perform(delete("/api/admin/admins/{id}", owner.getId()).with(user("owner").roles("ADMIN")).with(csrf()))
        .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("You cannot delete your own admin account"));
    var session = login("colleague", "original-test-password");
    mvc.perform(delete("/api/admin/admins/{id}", target.getId()).with(user("owner").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNoContent());
    assertThat(admins.findById(target.getId())).isEmpty();
    mvc.perform(get("/api/admin/admins").cookie(session)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"colleague\",\"password\":\"original-test-password\"}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(delete("/api/admin/admins/{id}", target.getId()).with(user("owner").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNotFound());
  }
}
