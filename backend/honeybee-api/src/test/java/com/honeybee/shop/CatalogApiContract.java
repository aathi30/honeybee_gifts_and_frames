package com.honeybee.shop;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.honeybee.shop.entity.*;
import com.honeybee.shop.repository.*;
import com.honeybee.shop.service.ImageService;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class CatalogApiContract {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired FrameRepository frames;
  @Autowired CategoryRepository categories;
  @Autowired AdminRepository admins;
  @Autowired ShopSettingsRepository settings;
  @Autowired ImageCleanupJobRepository jobs;
  @Autowired PasswordEncoder encoder;
  @MockitoBean ImageService images;
  byte[] png;

  @BeforeEach
  void setup() throws Exception {
    frames.deleteAll();
    categories.deleteAll();
    jobs.deleteAll();
    admins.deleteAll();
    var s = new ShopSettings();
    s.setShopName("Honeybee Frame Shop");
    s.setHeroTitle("Make memories feel at home.");
    s.setHeroSubtitle("Your moments, beautifully framed.");
    settings.save(s);
    var out = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", out);
    png = out.toByteArray();
    when(images.validate(any()))
        .thenAnswer(a -> new ImageService("", "", "").validate(a.getArgument(0)));
    when(images.upload(any()))
        .thenAnswer(
            a ->
                new ImageService.UploadedImage(
                    "https://res.cloudinary.com/test/image/upload/test.png",
                    "honeybee/" + UUID.randomUUID()));
  }

  MockMultipartFile part(String name, Object body) throws Exception {
    return new MockMultipartFile(name, "", "application/json", json.writeValueAsBytes(body));
  }

  MockMultipartFile image() {
    return new MockMultipartFile("images", "test.png", "image/png", png);
  }

  Map<String, Object> frameBody(long categoryId) {
    return new LinkedHashMap<>(
        Map.of(
            "name",
            "Oak & Gold",
            "description",
            "A natural wooden frame",
            "categoryId",
            categoryId,
            "price",
            "2500.00",
            "size",
            "8 x 12 inches, 10 x 12 inches",
            "available",
            true,
            "featured",
            true));
  }

  long addCategory(String name) throws Exception {
    var r =
        mvc.perform(
                multipart("/api/admin/categories")
                    .file(part("category", Map.of("name", name, "description", "Beautiful frames")))
                    .with(user("admin").roles("ADMIN"))
                    .with(csrf()))
            .andExpect(status().isCreated())
            .andReturn();
    return json.readTree(r.getResponse().getContentAsString()).get("id").asLong();
  }

  long addFrame(long categoryId) throws Exception {
    var r =
        mvc.perform(
                multipart("/api/admin/frames")
                    .file(part("frame", frameBody(categoryId)))
                    .file(image())
                    .with(user("admin").roles("ADMIN"))
                    .with(csrf()))
            .andExpect(status().isCreated())
            .andReturn();
    return json.readTree(r.getResponse().getContentAsString()).get("id").asLong();
  }

  @Test
  void publicCatalogStartsEmptyAndDoesNotExposeAdminData() throws Exception {
    mvc.perform(get("/api/frames"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isEmpty());
    mvc.perform(get("/api/categories")).andExpect(status().isOk()).andExpect(content().json("[]"));
    mvc.perform(get("/api/settings/public"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.shopName").value("Honeybee Frame Shop"))
        .andExpect(jsonPath("$.passwordHash").doesNotExist());
  }

  @Test
  void unauthorizedAndWrongRoleCannotModifyCatalog() throws Exception {
    mvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
    mvc.perform(delete("/api/admin/frames/1").with(csrf())).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/admin/dashboard").with(user("visitor").roles("USER")))
        .andExpect(status().isForbidden());
    mvc.perform(delete("/api/admin/frames/1").with(user("admin").roles("ADMIN")))
        .andExpect(status().isForbidden());
  }

  @Test
  void categoryCrudRejectsDuplicatesAndNonEmptyDeletion() throws Exception {
    long id = addCategory("Wooden");
    mvc.perform(
            multipart("/api/admin/categories")
                .file(part("category", Map.of("name", "wooden", "description", "")))
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isConflict());
    mvc.perform(
            multipart("/api/admin/categories/" + id)
                .file(
                    part(
                        "category",
                        Map.of("name", "Modern Wooden", "description", "Warm finishes")))
                .with(
                    r -> {
                      r.setMethod("PUT");
                      return r;
                    })
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Modern Wooden"));
    long f = addFrame(id);
    mvc.perform(
            delete("/api/admin/categories/" + id).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isConflict());
    mvc.perform(delete("/api/admin/frames/" + f).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(
            delete("/api/admin/categories/" + id).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNoContent());
    assertThat(categories.count()).isZero();
  }

  @Test
  void frameCrudPersistsPricesAvailabilityAndQueuesImageDeletion() throws Exception {
    long c = addCategory("Wooden");
    long id = addFrame(c);
    mvc.perform(get("/api/frames/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.price").value(2500))
        .andExpect(jsonPath("$.category.id").value(c))
        .andExpect(jsonPath("$.images.length()").value(1))
        .andExpect(jsonPath("$.images[0].cloudinaryPublicId").doesNotExist());
    var body = frameBody(c);
    body.put("price", "3200.50");
    body.put("available", false);
    mvc.perform(
            put("/api/admin/frames/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(body))
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.price").value(3200.5))
        .andExpect(jsonPath("$.available").value(false));
    mvc.perform(delete("/api/admin/frames/" + id).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNoContent());
    assertThat(frames.count()).isZero();
    assertThat(jobs.count()).isEqualTo(1);
  }

  @Test
  void validationRejectsMissingCategoryNonPositivePriceAndMissingImages() throws Exception {
    long c = addCategory("Wooden");
    var body = frameBody(c);
    body.put("price", "-1");
    body.put("name", "");
    mvc.perform(
            multipart("/api/admin/frames")
                .file(part("frame", body))
                .file(image())
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.price").exists())
        .andExpect(jsonPath("$.errors.name").exists());
    mvc.perform(
            multipart("/api/admin/frames")
                .file(part("frame", frameBody(c)))
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isBadRequest());
    mvc.perform(
            multipart("/api/admin/frames")
                .file(part("frame", frameBody(99999)))
                .file(image())
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isNotFound());
    assertThat(frames.count()).isZero();
  }

  @Test
  void imagesCanBeAddedAndRemovedButLastImageIsProtected() throws Exception {
    long id = addFrame(addCategory("Wooden"));
    var current =
        json.readTree(
            mvc.perform(get("/api/frames/" + id)).andReturn().getResponse().getContentAsString());
    long first = current.at("/images/0/id").asLong();
    mvc.perform(
            delete("/api/admin/frames/" + id + "/images/" + first)
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isConflict());
    mvc.perform(
            multipart("/api/admin/frames/" + id + "/images")
                .file(image())
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.images.length()").value(2));
    mvc.perform(
            delete("/api/admin/frames/" + id + "/images/" + first)
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/frames/" + id)).andExpect(jsonPath("$.images.length()").value(1));
  }

  @Test
  void failedUploadDoesNotCreateFrameAndQueuesCompletedUploads() throws Exception {
    long c = addCategory("Wooden");
    when(images.upload(any()))
        .thenReturn(new ImageService.UploadedImage("https://example.test/one.png", "honeybee/one"))
        .thenThrow(com.honeybee.shop.exception.ApiException.badRequest("Upload failed"));
    mvc.perform(
            multipart("/api/admin/frames")
                .file(part("frame", frameBody(c)))
                .file(image())
                .file(image())
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isBadRequest());
    assertThat(frames.count()).isZero();
    assertThat(jobs.count()).isEqualTo(1);
  }

  @Test
  void searchPaginationSortFeaturedAndCategoryRoutes() throws Exception {
    long c = addCategory("Wooden");
    long f = addFrame(c);
    long second = addFrame(c);
    var body = frameBody(c);
    body.put("name", "Walnut");
    body.put("price", "1200.00");
    mvc.perform(
            put("/api/admin/frames/" + second)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(body))
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isOk());
    mvc.perform(get("/api/frames").param("sort", "price-asc").param("size", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].id").value(second))
        .andExpect(jsonPath("$.totalPages").value(2));
    mvc.perform(get("/api/frames/search").param("keyword", "oak"))
        .andExpect(jsonPath("$.totalElements").value(1));
    mvc.perform(get("/api/frames/search").param("keyword", "%"))
        .andExpect(jsonPath("$.totalElements").value(0));
    mvc.perform(get("/api/frames/featured")).andExpect(jsonPath("$.totalElements").value(2));
    var slug = categories.findById(c).orElseThrow().getSlug();
    mvc.perform(get("/api/categories/" + slug + "/frames"))
        .andExpect(jsonPath("$.totalElements").value(2));
    mvc.perform(get("/api/frames").param("size", "1000")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/frames").param("sort", "passwordHash"))
        .andExpect(status().isBadRequest());
  }

  @ParameterizedTest
  @ValueSource(strings = {"http://localhost:5173", "http://127.0.0.1:5173"})
  void loginUsesCsrfSessionCookieAndLogoutInvalidatesAccess(String origin) throws Exception {
    var a = new Admin();
    a.setUsername("contract-admin");
    a.setEmail("contract@example.test");
    a.setPasswordHash(encoder.encode("test-only-long-password"));
    admins.save(a);
    String credentials =
        json.writeValueAsString(
            Map.of("username", "contract-admin", "password", "test-only-long-password"));
    mvc.perform(
            post("/api/auth/login")
                .header("Origin", origin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/auth/login")
                .header("Origin", origin)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsBytes(
                        Map.of("username", "contract-admin", "password", "wrong"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("Invalid username or password"));
    var initial =
        mvc.perform(get("/api/auth/csrf").header("Origin", origin))
            .andExpect(status().isOk())
            .andReturn();
    var initialCookie = initial.getResponse().getCookie("SESSION");
    assertThat(initialCookie).isNotNull();
    String token = json.readTree(initial.getResponse().getContentAsString()).get("token").asText();
    var authenticated =
        mvc.perform(
                post("/api/auth/login")
                    .header("Origin", origin)
                    .cookie(initialCookie)
                    .header("X-CSRF-TOKEN", token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(credentials))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", origin))
            .andExpect(jsonPath("$.username").value("contract-admin"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn();
    var cookie = authenticated.getResponse().getCookie("SESSION");
    assertThat(cookie).isNotNull();
    assertThat(cookie.isHttpOnly()).isTrue();
    assertThat(cookie.getValue()).isNotEqualTo(initialCookie.getValue());
    mvc.perform(get("/api/admin/dashboard").cookie(cookie)).andExpect(status().isOk());
    mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(status().isOk());
    mvc.perform(get("/api/admin/dashboard").cookie(initialCookie))
        .andExpect(status().isUnauthorized());
    var renewed = mvc.perform(get("/api/auth/csrf").cookie(cookie)).andReturn();
    String nextToken =
        json.readTree(renewed.getResponse().getContentAsString()).get("token").asText();
    mvc.perform(
            post("/api/auth/logout")
                .header("Origin", origin)
                .cookie(cookie)
                .header("X-CSRF-TOKEN", nextToken))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/admin/dashboard").cookie(cookie)).andExpect(status().isUnauthorized());
  }

  @Test
  void settingsValidateNumbersAndHttpsLinks() throws Exception {
    var body =
        new LinkedHashMap<String, Object>(
            Map.of(
                "shopName",
                "Honeybee Frame Shop",
                "whatsappNumber",
                "+94 77",
                "phoneNumber",
                "",
                "address",
                "",
                "openingHours",
                "",
                "facebookUrl",
                "javascript:alert(1)",
                "instagramUrl",
                "",
                "mapsUrl",
                "",
                "heroTitle",
                "A home for memories",
                "heroSubtitle",
                "Your story"));
    mvc.perform(
            put("/api/admin/settings")
                .with(user("admin").roles("ADMIN"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.whatsappNumber").exists())
        .andExpect(jsonPath("$.errors.facebookUrl").exists());
    body.put("whatsappNumber", "94770000000");
    body.put("facebookUrl", "https://facebook.com/example");
    mvc.perform(
            put("/api/admin/settings")
                .with(user("admin").roles("ADMIN"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(body)))
        .andExpect(status().isOk());
    mvc.perform(get("/api/settings/public"))
        .andExpect(jsonPath("$.whatsappNumber").value("94770000000"));
  }

  @Test
  void invalidParametersMethodsAndMediaTypesUseAppropriateStatuses() throws Exception {
    mvc.perform(get("/api/frames/search")).andExpect(status().isBadRequest());
    mvc.perform(
            patch("/api/admin/settings")
                .with(user("admin").roles("ADMIN"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isMethodNotAllowed())
        .andExpect(header().string("Allow", org.hamcrest.Matchers.containsString("PUT")));
    mvc.perform(
            multipart("/api/admin/categories")
                .file(new MockMultipartFile("category", "", "text/plain", "{}".getBytes()))
                .with(user("admin").roles("ADMIN"))
                .with(csrf()))
        .andExpect(status().isUnsupportedMediaType());
    mvc.perform(get("/api/frames").header("Origin", "https://untrusted.example"))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/frames").header("Origin", "http://localhost:5173"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
  }
}
