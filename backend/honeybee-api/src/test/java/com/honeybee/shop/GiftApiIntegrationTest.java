package com.honeybee.shop;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.honeybee.shop.repository.*;
import com.honeybee.shop.service.ImageService;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
class GiftApiIntegrationTest extends CatalogApiContract {
  @Autowired GiftRepository gifts;
  @Autowired GiftCategoryRepository giftCategories;

  @BeforeEach
  void clearGifts() {
    gifts.deleteAll();
    giftCategories.deleteAll();
  }

  long giftCategory(String name) throws Exception {
    var result = mvc.perform(multipart("/api/admin/gift-categories")
        .file(part("category", Map.of("name", name, "description", "Gift occasions")))
        .with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isCreated()).andReturn();
    return json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
  }

  Map<String, Object> giftBody(long category, String name, String price, boolean featured) {
    return Map.of("name", name, "description", "A thoughtful gift", "categoryId", category,
        "price", price, "available", true, "featured", featured);
  }

  long addGift(long category, String name, String price, boolean featured) throws Exception {
    var result = mvc.perform(multipart("/api/admin/gifts")
        .file(part("gift", giftBody(category, name, price, featured))).file(image())
        .with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.size").doesNotExist())
        .andExpect(jsonPath("$.images[0].imageUrl").exists()).andReturn();
    return json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
  }

  @Test
  void giftCrudPreservesFramesAndKeepsCategoriesSeparate() throws Exception {
    long frameCategory = addCategory("Birthday");
    long frame = addFrame(frameCategory);
    long category = giftCategory("Birthday");
    long gift = addGift(category, "Personalized Mug", "1500.00", true);
    mvc.perform(get("/api/gifts/{id}", gift)).andExpect(status().isOk())
        .andExpect(jsonPath("$.category.id").value(category));
    mvc.perform(get("/api/categories")).andExpect(jsonPath("$.length()").value(1));
    mvc.perform(get("/api/gift-categories")).andExpect(jsonPath("$.length()").value(1));
    mvc.perform(put("/api/admin/gifts/{id}", gift).with(user("admin").roles("ADMIN")).with(csrf())
        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(giftBody(category, "Updated Mug", "1700.00", false))))
        .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated Mug"));
    mvc.perform(delete("/api/admin/gift-categories/{id}", category).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isConflict());
    mvc.perform(delete("/api/admin/gifts/{id}", gift).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/gifts/{id}", gift)).andExpect(status().isNotFound());
    mvc.perform(delete("/api/admin/gift-categories/{id}", category).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/frames/{id}", frame)).andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Oak & Gold"));
    assertThat(frames.count()).isEqualTo(1);
    assertThat(categories.count()).isEqualTo(1);
    assertThat(jobs.count()).isEqualTo(1);
  }

  @Test
  void giftsSupportSearchCategorySortAndFeaturedWithoutMixingFrames() throws Exception {
    long birthday = giftCategory("Birthday Gifts");
    long anniversary = giftCategory("Anniversary Gifts");
    addGift(birthday, "Mug", "1500", true);
    addGift(birthday, "Mug & Card", "2000", false);
    addGift(anniversary, "Gift Box", "2500", true);
    mvc.perform(get("/api/gifts").param("categoryId", "" + birthday).param("keyword", "mug").param("sort", "price-desc"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
        .andExpect(jsonPath("$.content[0].name").value("Mug & Card"));
    mvc.perform(get("/api/gifts/featured")).andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(2));
    mvc.perform(get("/api/gifts").param("keyword", "%"))
        .andExpect(jsonPath("$.totalElements").value(0));
    var slug = giftCategories.findById(birthday).orElseThrow().getSlug();
    mvc.perform(get("/api/gift-categories/{slug}/gifts", slug))
        .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
    mvc.perform(get("/api/admin/dashboard").with(user("admin").roles("ADMIN")))
        .andExpect(jsonPath("$.totalGifts").value(3)).andExpect(jsonPath("$.totalGiftCategories").value(2));
    mvc.perform(get("/api/gifts").param("sort", "passwordHash")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/gifts").param("size", "1000")).andExpect(status().isBadRequest());
  }

  @Test
  void giftImagesUploadRemoveAndKeepLastImageProtected() throws Exception {
    long gift = addGift(giftCategory("Mugs"), "Mug", "1500", false);
    var uploaded = mvc.perform(multipart("/api/admin/gifts/{id}/images", gift).file(image())
        .with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.images.length()").value(2)).andReturn();
    var first = json.readTree(uploaded.getResponse().getContentAsString()).get("images").get(0).get("id").asLong();
    var second = json.readTree(uploaded.getResponse().getContentAsString()).get("images").get(1).get("id").asLong();
    mvc.perform(delete("/api/admin/gifts/{id}/images/{imageId}", gift, first)
        .with(user("admin").roles("ADMIN")).with(csrf())).andExpect(status().isNoContent());
    mvc.perform(delete("/api/admin/gifts/{id}/images/{imageId}", gift, second)
        .with(user("admin").roles("ADMIN")).with(csrf())).andExpect(status().isConflict());
    verify(images, times(2)).upload(any());
    assertThat(jobs.count()).isEqualTo(1);
  }

  @Test
  void giftCategoryEditingValidatesDuplicatesAndSupportsImages() throws Exception {
    long category = giftCategory("Mugs");
    mvc.perform(multipart("/api/admin/gift-categories").file(part("category", Map.of("name", "MUGS", "description", "")))
        .with(user("admin").roles("ADMIN")).with(csrf())).andExpect(status().isConflict());
    mvc.perform(multipart("/api/admin/gift-categories/{id}", category)
        .file(part("category", Map.of("name", "Personalized Gifts", "description", "Made for you")))
        .file(new MockMultipartFile("image", "category.png", "image/png", png))
        .with(request -> { request.setMethod("PUT"); return request; })
        .with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.imageUrl").exists());
  }

  @Test
  void giftWritesRequireAdminAndCsrfAndRejectInvalidInputs() throws Exception {
    long category = giftCategory("Mugs");
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(category, "Mug", "1500", false))).file(image()).with(csrf()))
        .andExpect(status().isUnauthorized());
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(category, "Mug", "1500", false))).file(image()).with(user("visitor").roles("USER")).with(csrf()))
        .andExpect(status().isForbidden());
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(category, "Mug", "1500", false))).file(image()).with(user("admin").roles("ADMIN")))
        .andExpect(status().isForbidden());
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(category, "Mug", "0", false))).file(image()).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isBadRequest());
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(category, "Mug", "1500", false))).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isBadRequest());
    long frameOnlyCategory = addCategory("Frame only");
    // Use a frame category ID that cannot also resolve to an existing gift category.
    while (giftCategories.existsById(frameOnlyCategory)) frameOnlyCategory = addCategory("Frame " + UUID.randomUUID());
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(frameOnlyCategory, "Mug", "1500", false))).file(image()).with(user("admin").roles("ADMIN")).with(csrf()))
        .andExpect(status().isNotFound());
    assertThat(gifts.count()).isZero();
  }

  @Test
  void failedGiftUploadCompensatesAlreadyUploadedImages() throws Exception {
    long category = giftCategory("Mugs");
    when(images.upload(any())).thenReturn(new ImageService.UploadedImage("https://example.test/one.png", "gift-first"))
        .thenThrow(new IllegalStateException("Test upload failure"));
    mvc.perform(multipart("/api/admin/gifts").file(part("gift", giftBody(category, "Mug", "1500", false))).file(image()).file(image())
        .with(user("admin").roles("ADMIN")).with(csrf())).andExpect(status().isInternalServerError());
    assertThat(gifts.count()).isZero();
    assertThat(jobs.findAll()).anyMatch(job -> job.getPublicId().equals("gift-first"));
  }
}
