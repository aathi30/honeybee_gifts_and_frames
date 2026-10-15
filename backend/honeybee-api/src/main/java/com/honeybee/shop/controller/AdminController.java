package com.honeybee.shop.controller;

import com.honeybee.shop.dto.request.*;
import com.honeybee.shop.dto.response.*;
import com.honeybee.shop.service.*;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
  private final CatalogService catalog;
  private final SettingsService settings;
  private final GiftCatalogService gifts;

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    var result = new LinkedHashMap<>(catalog.statistics());
    var giftStats = gifts.statistics();
    result.put("totalGifts", giftStats.get("totalGifts"));
    result.put("totalGiftCategories", giftStats.get("totalCategories"));
    result.put("availableGifts", giftStats.get("availableGifts"));
    result.put("unavailableGifts", giftStats.get("unavailableGifts"));
    result.put("recentGifts", giftStats.get("recentGifts"));
    return result;
  }

  @PostMapping(value = "/frames", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public FrameResponse create(
      @Valid @RequestPart("frame") FrameRequest request,
      @RequestPart("images") List<MultipartFile> files) {
    return catalog.create(request, files);
  }

  @PutMapping("/frames/{id}")
  public FrameResponse update(@PathVariable Long id, @Valid @RequestBody FrameRequest request) {
    return catalog.update(id, request);
  }

  @DeleteMapping("/frames/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    catalog.delete(id);
  }

  @PostMapping(value = "/frames/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public FrameResponse upload(
      @PathVariable Long id, @RequestPart("images") List<MultipartFile> files) {
    return catalog.uploadImages(id, files);
  }

  @DeleteMapping("/frames/{id}/images/{imageId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeImage(@PathVariable Long id, @PathVariable Long imageId) {
    catalog.removeImage(id, imageId);
  }

  @PostMapping(value = "/categories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public CategoryResponse createCategory(
      @Valid @RequestPart("category") CategoryRequest request,
      @RequestPart(value = "image", required = false) MultipartFile image) {
    return catalog.saveCategory(null, request, image, false);
  }

  @PutMapping(value = "/categories/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public CategoryResponse updateCategory(
      @PathVariable Long id,
      @Valid @RequestPart("category") CategoryRequest request,
      @RequestPart(value = "image", required = false) MultipartFile image,
      @RequestParam(defaultValue = "false") boolean removeImage) {
    return catalog.saveCategory(id, request, image, removeImage);
  }

  @DeleteMapping("/categories/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCategory(@PathVariable Long id) {
    catalog.deleteCategory(id);
  }

  @GetMapping("/settings")
  public SettingsResponse settings() {
    return settings.get();
  }

  @PutMapping("/settings")
  public SettingsResponse updateSettings(@Valid @RequestBody SettingsRequest request) {
    return settings.update(request);
  }
}
